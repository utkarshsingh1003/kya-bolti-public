import { randomUUID, randomInt } from "crypto";
import fs from "fs";
import path from "path";
import type {
  CivicIssue,
  ContactMessage,
  IssueStatus,
  Poll,
  Question,
  Reply,
  Representative,
  Report,
  Review,
  SiteStats,
  Thread,
} from "@/lib/types";
import {
  demoIssues,
  demoPolls,
  demoQuestions,
  demoReplies,
  demoReviews,
  demoThreads,
} from "@/data/seed";
import type {
  ContactInput,
  IssueInput,
  QuestionInput,
  ReviewInput,
  ThreadInput,
} from "@/lib/validation";

export type StoreMode = "postgres" | "file" | "memory";

type VoteRow = { pollId: string; optionId: string; voterHash: string; createdAt: string };

export type DbShape = {
  polls: Poll[];
  votes: VoteRow[];
  issues: CivicIssue[];
  reviews: Review[];
  threads: Thread[];
  replies: Reply[];
  questions: Question[];
  reports: Report[];
  representatives: Representative[];
  contactMessages: ContactMessage[];
};

export type ListFilter = { stateId?: string; districtId?: string; limit?: number };
export type IssueFilter = ListFilter & { status?: IssueStatus };

export type NewIssue = IssueInput & { stateId: string };
export type NewReview = ReviewInput & { stateId: string };

export type VoteOutcome =
  | { ok: true }
  | { ok: false; reason: "not_found" | "invalid_option" | "closed" | "duplicate" };

export interface Repository {
  mode: StoreMode;
  listPolls(): Promise<Poll[]>;
  getPoll(pollId: string): Promise<Poll | null>;
  getPollResults(pollId: string, voterHash: string): Promise<{
    counts: Record<string, number>;
    total: number;
    hasVoted: boolean;
  }>;
  castVote(pollId: string, optionId: string, voterHash: string): Promise<VoteOutcome>;
  listIssues(filter?: IssueFilter): Promise<CivicIssue[]>;
  getIssueByCode(code: string): Promise<CivicIssue | null>;
  createIssue(input: NewIssue): Promise<CivicIssue>;
  updateIssue(id: string, status: IssueStatus, note: string, url?: string): Promise<CivicIssue | null>;
  listReviews(filter?: ListFilter): Promise<Review[]>;
  createReview(input: NewReview): Promise<Review>;
  setReviewStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  listThreads(filter?: ListFilter): Promise<Thread[]>;
  getThread(id: string): Promise<{ thread: Thread; replies: Reply[] } | null>;
  createThread(input: ThreadInput): Promise<Thread>;
  addReply(threadId: string, body: string, authorAlias: string): Promise<Reply | null>;
  setReplyStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  setThreadStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  listQuestions(filter?: ListFilter): Promise<Question[]>;
  createQuestion(input: QuestionInput): Promise<Question>;
  answerQuestion(id: string, answer: string, sources: { label: string; url: string }[]): Promise<boolean>;
  createReport(input: {
    targetType: Report["targetType"];
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<Report>;
  listReports(): Promise<Report[]>;
  resolveReport(id: string): Promise<boolean>;
  createContactMessage(input: ContactInput): Promise<ContactMessage>;
  listContactMessages(): Promise<ContactMessage[]>;
  resolveContactMessage(id: string): Promise<boolean>;
  listRepresentatives(filter?: ListFilter): Promise<Representative[]>;
  importRepresentatives(rows: Representative[]): Promise<number>;
  getStats(): Promise<SiteStats>;
}

function newState(): DbShape {
  return {
    polls: structuredClone(demoPolls),
    votes: [],
    issues: structuredClone(demoIssues),
    reviews: structuredClone(demoReviews),
    threads: structuredClone(demoThreads),
    replies: structuredClone(demoReplies),
    questions: structuredClone(demoQuestions),
    reports: [],
    representatives: [],
    contactMessages: [],
  };
}

export function trackingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[randomInt(alphabet.length)];
  return `KBP-${code}`;
}

function sortNewest<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function applyFilter<T extends { stateId?: string | null; districtId?: string | null }>(
  items: T[],
  filter?: ListFilter,
): T[] {
  let result = items;
  if (filter?.stateId) result = result.filter((item) => item.stateId === filter.stateId);
  if (filter?.districtId) {
    const districtMatch = result.filter((item) => item.districtId === filter.districtId);
    // If the selected district has no content, fall back to state-wide content.
    result = districtMatch.length > 0 ? districtMatch : result;
  }
  if (filter?.limit) result = result.slice(0, filter.limit);
  return result;
}

class JsonRepository implements Repository {
  mode: StoreMode;
  private db: DbShape;
  private filePath: string | null;
  private persistTimer: NodeJS.Timeout | null = null;

  constructor(filePath: string | null, mode: StoreMode) {
    this.filePath = filePath;
    this.mode = mode;
    if (filePath && fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as DbShape;
        this.db = { ...newState(), ...parsed };
      } catch {
        this.db = newState();
      }
    } else {
      this.db = newState();
      this.persistNow();
    }
  }

  private persistNow() {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.db, null, 2), { mode: 0o600 });
    } catch {
      // Read-only filesystem (e.g. serverless): stay in memory for this instance.
      this.mode = "memory";
      this.filePath = null;
    }
  }

  private persist() {
    if (!this.filePath) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(), 50);
    if (typeof this.persistTimer.unref === "function") this.persistTimer.unref();
  }

  async listPolls(): Promise<Poll[]> {
    return [...this.db.polls].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPoll(pollId: string): Promise<Poll | null> {
    return this.db.polls.find((poll) => poll.id === pollId) ?? null;
  }

  async getPollResults(pollId: string, voterHash: string) {
    const poll = await this.getPoll(pollId);
    const counts: Record<string, number> = {};
    for (const option of poll?.options ?? []) counts[option.id] = 0;
    const votes = this.db.votes.filter((vote) => vote.pollId === pollId);
    for (const vote of votes) counts[vote.optionId] = (counts[vote.optionId] ?? 0) + 1;
    return {
      counts,
      total: votes.length,
      hasVoted: voterHash ? votes.some((vote) => vote.voterHash === voterHash) : false,
    };
  }

  async castVote(pollId: string, optionId: string, voterHash: string): Promise<VoteOutcome> {
    const poll = await this.getPoll(pollId);
    if (!poll) return { ok: false, reason: "not_found" };
    if (!poll.options.some((option) => option.id === optionId)) {
      return { ok: false, reason: "invalid_option" };
    }
    if (new Date(poll.closesAt).getTime() < Date.now()) return { ok: false, reason: "closed" };
    if (this.db.votes.some((vote) => vote.pollId === pollId && vote.voterHash === voterHash)) {
      return { ok: false, reason: "duplicate" };
    }
    this.db.votes.push({ pollId, optionId, voterHash, createdAt: new Date().toISOString() });
    this.persist();
    return { ok: true };
  }

  async listIssues(filter?: IssueFilter): Promise<CivicIssue[]> {
    let items = applyFilter(this.db.issues, filter);
    if (filter?.status) items = items.filter((issue) => issue.status === filter.status);
    return sortNewest(items).slice(0, filter?.limit ?? 50);
  }

  async getIssueByCode(code: string): Promise<CivicIssue | null> {
    return this.db.issues.find((issue) => issue.trackingCode.toUpperCase() === code.toUpperCase()) ?? null;
  }

  async createIssue(input: NewIssue): Promise<CivicIssue> {
    const now = new Date().toISOString();
    let code = trackingCode();
    while (this.db.issues.some((issue) => issue.trackingCode === code)) code = trackingCode();
    const issue: CivicIssue = {
      id: randomUUID(),
      trackingCode: code,
      category: input.category,
      title: input.title,
      description: input.description,
      area: input.area,
      districtId: input.districtId,
      stateId: input.stateId,
      pin: input.pin ?? null,
      status: "submitted",
      isDemo: false,
      createdAt: now,
      updatedAt: now,
      officialComplaintUrl: input.officialComplaintUrl || null,
      events: [
        {
          status: "submitted",
          note: "समस्या दर्ज हुई। कृपया ट्रैकिंग कोड सहेजें।",
          createdAt: now,
        },
      ],
    };
    this.db.issues.push(issue);
    this.persist();
    return issue;
  }

  async updateIssue(id: string, status: IssueStatus, note: string, url?: string) {
    const issue = this.db.issues.find((item) => item.id === id);
    if (!issue) return null;
    const now = new Date().toISOString();
    issue.status = status;
    issue.updatedAt = now;
    issue.events.push({ status, note, createdAt: now });
    if (url) issue.officialComplaintUrl = url;
    this.persist();
    return issue;
  }

  async listReviews(filter?: ListFilter): Promise<Review[]> {
    const visible = this.db.reviews.filter((review) => review.status === "published");
    return sortNewest(applyFilter(visible, filter)).slice(0, filter?.limit ?? 50);
  }

  async createReview(input: NewReview): Promise<Review> {
    const review: Review = {
      id: randomUUID(),
      serviceCategory: input.serviceCategory,
      rating: input.rating,
      title: input.title,
      body: input.body,
      area: input.area,
      districtId: input.districtId,
      stateId: input.stateId,
      displayName: input.displayName || null,
      status: "published",
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    this.db.reviews.push(review);
    this.persist();
    return review;
  }

  async setReviewStatus(id: string, status: "published" | "hidden") {
    const review = this.db.reviews.find((item) => item.id === id);
    if (!review) return false;
    review.status = status;
    this.persist();
    return true;
  }

  async listThreads(filter?: ListFilter): Promise<Thread[]> {
    const visible = this.db.threads.filter((thread) => thread.status !== "hidden");
    return sortNewest(applyFilter(visible, filter)).slice(0, filter?.limit ?? 50);
  }

  async getThread(id: string) {
    const thread = this.db.threads.find((item) => item.id === id && item.status !== "hidden");
    if (!thread) return null;
    const replies = this.db.replies
      .filter((reply) => reply.threadId === id && reply.status === "published")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { thread, replies };
  }

  async createThread(input: ThreadInput): Promise<Thread> {
    const thread: Thread = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      category: input.category,
      districtId: input.districtId,
      stateId: input.stateId,
      authorAlias: input.authorAlias,
      isDemo: false,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      status: "published",
    };
    this.db.threads.push(thread);
    this.persist();
    return thread;
  }

  async addReply(threadId: string, body: string, authorAlias: string): Promise<Reply | null> {
    const thread = this.db.threads.find((item) => item.id === threadId);
    if (!thread) return null;
    const reply: Reply = {
      id: randomUUID(),
      threadId,
      body,
      authorAlias,
      isDemo: false,
      createdAt: new Date().toISOString(),
      status: "published",
    };
    this.db.replies.push(reply);
    thread.replyCount += 1;
    this.persist();
    return reply;
  }

  async setReplyStatus(id: string, status: "published" | "hidden") {
    const reply = this.db.replies.find((item) => item.id === id);
    if (!reply) return false;
    reply.status = status;
    this.persist();
    return true;
  }

  async setThreadStatus(id: string, status: "published" | "hidden") {
    const thread = this.db.threads.find((item) => item.id === id);
    if (!thread) return false;
    thread.status = status;
    this.persist();
    return true;
  }

  async listQuestions(filter?: ListFilter): Promise<Question[]> {
    return sortNewest(applyFilter(this.db.questions, filter)).slice(0, filter?.limit ?? 50);
  }

  async createQuestion(input: QuestionInput): Promise<Question> {
    const question: Question = {
      id: randomUUID(),
      question: input.question,
      answer: null,
      answerStatus: "pending",
      sources: [],
      districtId: input.districtId || null,
      stateId: input.stateId || null,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    this.db.questions.push(question);
    this.persist();
    return question;
  }

  async answerQuestion(id: string, answer: string, sources: { label: string; url: string }[]) {
    const question = this.db.questions.find((item) => item.id === id);
    if (!question) return false;
    question.answer = answer;
    question.answerStatus = "official_source";
    question.sources = sources;
    this.persist();
    return true;
  }

  async createReport(input: {
    targetType: Report["targetType"];
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const report: Report = {
      id: randomUUID(),
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details || null,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.db.reports.push(report);
    this.persist();
    return report;
  }

  async listReports(): Promise<Report[]> {
    return sortNewest(this.db.reports);
  }

  async resolveReport(id: string): Promise<boolean> {
    const report = this.db.reports.find((item) => item.id === id);
    if (!report) return false;
    report.status = "resolved";
    this.persist();
    return true;
  }

  async createContactMessage(input: ContactInput): Promise<ContactMessage> {
    const message: ContactMessage = {
      id: randomUUID(),
      name: input.name || null,
      email: input.email || null,
      subject: input.subject,
      message: input.message,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.db.contactMessages.push(message);
    this.persist();
    return message;
  }

  async listContactMessages(): Promise<ContactMessage[]> {
    return sortNewest(this.db.contactMessages);
  }

  async resolveContactMessage(id: string): Promise<boolean> {
    const message = this.db.contactMessages.find((item) => item.id === id);
    if (!message) return false;
    message.status = "resolved";
    this.persist();
    return true;
  }

  async listRepresentatives(filter?: ListFilter): Promise<Representative[]> {
    let items = this.db.representatives;
    if (filter?.stateId) items = items.filter((item) => item.stateId === filter.stateId);
    if (filter?.districtId) items = items.filter((item) => item.districtId === filter.districtId);
    return items;
  }

  async importRepresentatives(rows: Representative[]): Promise<number> {
    let count = 0;
    for (const row of rows) {
      const index = this.db.representatives.findIndex((item) => item.id === row.id);
      if (index >= 0) this.db.representatives[index] = row;
      else this.db.representatives.push(row);
      count += 1;
    }
    this.persist();
    return count;
  }

  async getStats(): Promise<SiteStats> {
    return {
      polls: this.db.polls.length,
      issues: this.db.issues.length,
      reviews: this.db.reviews.length,
      discussions: this.db.threads.length,
      questions: this.db.questions.length,
    };
  }
}

let repository: Repository | null = null;

function createJsonRepository(): JsonRepository {
  const isServerless = Boolean(process.env.VERCEL) && !process.env.KBP_FILE_STORE;
  if (isServerless) return new JsonRepository(null, "memory");
  const file = path.join(process.env.KBP_DATA_DIR || ".data", "store.json");
  return new JsonRepository(path.resolve(process.cwd(), file), "file");
}

export async function getRepository(): Promise<Repository> {
  if (repository) return repository;
  if (process.env.DATABASE_URL) {
    const { createPostgresRepository } = await import("./postgres");
    repository = await createPostgresRepository(process.env.DATABASE_URL);
  } else {
    repository = createJsonRepository();
  }
  return repository;
}

/** Test helper: reset the singleton between test suites. */
export function __resetRepository() {
  repository = null;
}

export { JsonRepository };
