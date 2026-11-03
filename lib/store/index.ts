import { randomUUID, randomInt } from "crypto";
import fs from "fs";
import path from "path";
import type {
  AdInquiry,
  Announcement,
  BuzzPost,
  CivicIssue,
  ContactMessage,
  IssueStatus,
  LeaderboardEntry,
  Poll,
  PollRequest,
  PollRequestStatus,
  PublicUser,
  Question,
  QuizScore,
  Reply,
  Representative,
  Report,
  Review,
  SiteStats,
  Thread,
  User,
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


export type StoreMode = "postgres" | "file" | "memory" | "demo";

/** Only these modes survive across server instances. */
export function isPersistentMode(mode: StoreMode): boolean {
  return mode === "postgres" || mode === "file";
}

/**
 * Read-only demo mode for production serverless deployments without a database.
 * It serves seeded demo content from memory; all mutations are rejected by
 * `mutationGuard`, so demo data is never presented as persistent storage.
 * Set KBP_DEMO_MODE=0 to restore the previous hard failure behaviour.
 */
export function demoModeActive(): boolean {
  const flag = process.env.KBP_DEMO_MODE;
  if (flag === "0") return false;
  if (flag === "1") return true;
  if (process.env.DATABASE_URL) return false;
  if (process.env.KBP_FILE_STORE) return false;
  return Boolean(process.env.VERCEL) && process.env.NODE_ENV === "production";
}

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
  pollRequests: PollRequest[];
  announcements: Announcement[];
  buzzPosts: BuzzPost[];
  adInquiries: AdInquiry[];
  users: User[];
  quizScores: QuizScore[];
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
  createIssue(input: NewIssue, ownerId?: string | null): Promise<CivicIssue>;
  updateIssue(id: string, status: IssueStatus, note: string, url?: string): Promise<CivicIssue | null>;
  listReviews(filter?: ListFilter): Promise<Review[]>;
  createReview(input: NewReview, ownerId?: string | null): Promise<Review>;
  setReviewStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  listThreads(filter?: ListFilter): Promise<Thread[]>;
  getThread(id: string): Promise<{ thread: Thread; replies: Reply[] } | null>;
  createThread(input: ThreadInput, ownerId?: string | null): Promise<Thread>;
  addReply(threadId: string, body: string, authorAlias: string): Promise<Reply | null>;
  setReplyStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  setThreadStatus(id: string, status: "published" | "hidden"): Promise<boolean>;
  listQuestions(filter?: ListFilter): Promise<Question[]>;
  createQuestion(input: QuestionInput, ownerId?: string | null): Promise<Question>;
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

  listAllPolls(): Promise<Poll[]>;
  createPoll(input: PollCreateInput): Promise<Poll>;
  updatePollStatus(id: string, action: "publish" | "close" | "archive" | "feature" | "unfeature"): Promise<Poll | null>;

  createPollRequest(input: PollRequestInput): Promise<PollRequest>;
  listPollRequests(): Promise<PollRequest[]>;
  listPublicPollRequests(): Promise<PollRequest[]>;
  setPollRequestStatus(id: string, status: PollRequestStatus, note?: string | null, createdPollId?: string | null): Promise<PollRequest | null>;

  createAnnouncement(input: AnnouncementInput): Promise<Announcement>;
  updateAnnouncement(id: string, patch: Partial<AnnouncementInput>): Promise<Announcement | null>;
  listAnnouncements(publicOnly?: boolean): Promise<Announcement[]>;
  setAnnouncementStatus(id: string, status: Announcement["status"]): Promise<boolean>;
  deleteAnnouncement(id: string): Promise<boolean>;

  createBuzzPost(input: BuzzInput): Promise<BuzzPost>;
  updateBuzzPost(id: string, patch: Partial<BuzzInput>): Promise<BuzzPost | null>;
  listBuzzPosts(publicOnly?: boolean): Promise<BuzzPost[]>;
  setBuzzStatus(id: string, status: BuzzPost["status"]): Promise<boolean>;
  deleteBuzzPost(id: string): Promise<boolean>;

  createAdInquiry(input: AdInquiryInput): Promise<AdInquiry>;
  listAdInquiries(): Promise<AdInquiry[]>;
  updateAdInquiry(id: string, patch: { status?: AdInquiry["status"]; paymentStatus?: AdInquiry["paymentStatus"]; adminNote?: string | null }): Promise<AdInquiry | null>;
  listActiveAds(): Promise<AdInquiry[]>;

  createUser(input: { email: string; displayName: string; passwordHash: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<Pick<User, "displayName" | "stateId" | "districtId" | "pin" | "area">>): Promise<PublicUser | null>;
  listOwnSubmissions(userId: string): Promise<{
    issues: CivicIssue[];
    reviews: Review[];
    threads: Thread[];
    questions: Question[];
    pollRequests: PollRequest[];
    quizScores: QuizScore[];
  }>;

  upsertQuizScore(userId: string, quizSlug: string, score: number, total: number): Promise<QuizScore>;
  listLeaderboard(quizSlug?: string, limit?: number): Promise<LeaderboardEntry[]>;
  listQuizScores(userId: string): Promise<QuizScore[]>;
}

export type PollCreateInput = {
  question: { hi: string; en: string };
  description: { hi: string; en: string };
  category: string;
  closesAt: string;
  options: { hi: string; en: string }[];
  featured?: boolean;
  sponsored?: boolean;
  sponsorLabel?: { hi: string; en: string } | null;
};

export type PollRequestInput = {
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  category: string;
  purpose: string;
  contact?: string;
  stateId: string;
  districtId: string;
  ownerId?: string | null;
};

export type AnnouncementInput = {
  title: { hi: string; en: string };
  body: { hi: string; en: string };
  category: Announcement["category"];
  stateId?: string | null;
  districtId?: string | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  status: Announcement["status"];
  publishAt?: string | null;
};

export type BuzzInput = {
  title: { hi: string; en: string };
  summary: { hi: string; en: string };
  body: { hi: string; en: string };
  category: BuzzPost["category"];
  platform: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  status: BuzzPost["status"];
  origin?: BuzzPost["origin"];
  submittedBy?: string | null;
};

export type AdInquiryInput = {
  advertiserName: string;
  email: string;
  phone: string;
  objective: string;
  budgetRange: string;
  placement: string;
  destinationUrl: string;
  creativeUrl?: string;
  campaignStart?: string;
  campaignEnd?: string;
};

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
    pollRequests: [],
    announcements: [],
    buzzPosts: [],
    adInquiries: [],
    users: [],
    quizScores: [],
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
      if (process.env.NODE_ENV === "production") {
        // Never silently degrade to in-memory storage in production.
        throw new Error(
          "KBP storage error: unable to persist data to the configured file store in production. Set DATABASE_URL to a PostgreSQL database (for example Supabase) or configure KBP_FILE_STORE. Refusing to fall back to in-memory storage in production.",
        );
      }
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
    return this.db.polls
      .filter((poll) => poll.status !== "draft" && poll.status !== "archived")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((poll) => this.normalizePoll(poll));
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

  async createIssue(input: NewIssue, ownerId?: string | null): Promise<CivicIssue> {
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
      ownerId: ownerId ?? null,
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

  async createReview(input: NewReview, ownerId?: string | null): Promise<Review> {
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
      ownerId: ownerId ?? null,
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

  async createThread(input: ThreadInput, ownerId?: string | null): Promise<Thread> {
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
      ownerId: ownerId ?? null,
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

  async createQuestion(input: QuestionInput, ownerId?: string | null): Promise<Question> {
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
      ownerId: ownerId ?? null,
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

  private normalizePoll(poll: Poll): Poll {
    return {
      ...poll,
      status: poll.status ?? "published",
      featured: poll.featured ?? false,
      sponsored: poll.sponsored ?? false,
      sponsorLabel: poll.sponsorLabel ?? null,
    };
  }

  async listAllPolls(): Promise<Poll[]> {
    return [...this.db.polls]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((poll) => this.normalizePoll(poll));
  }

  async createPoll(input: PollCreateInput): Promise<Poll> {
    const poll: Poll = {
      id: randomUUID(),
      question: input.question,
      description: input.description,
      category: input.category,
      closesAt: input.closesAt,
      isDemo: false,
      createdAt: new Date().toISOString(),
      status: "published",
      featured: input.featured ?? false,
      sponsored: input.sponsored ?? false,
      sponsorLabel: input.sponsorLabel ?? null,
      options: input.options.map((option) => ({ id: randomUUID(), label: option })),
    };
    this.db.polls.push(poll);
    this.persist();
    return poll;
  }

  async updatePollStatus(id: string, action: "publish" | "close" | "archive" | "feature" | "unfeature") {
    const poll = this.db.polls.find((item) => item.id === id);
    if (!poll) return null;
    this.normalizePoll(poll);
    if (action === "publish") poll.status = "published";
    if (action === "close") poll.status = "closed";
    if (action === "archive") poll.status = "archived";
    if (action === "feature") poll.featured = true;
    if (action === "unfeature") poll.featured = false;
    this.persist();
    return poll;
  }

  async createPollRequest(input: PollRequestInput): Promise<PollRequest> {
    const now = new Date().toISOString();
    const request: PollRequest = {
      id: randomUUID(),
      questionHi: input.questionHi,
      questionEn: input.questionEn,
      optionsHi: input.optionsHi,
      optionsEn: input.optionsEn,
      category: input.category,
      purpose: input.purpose,
      contact: input.contact || null,
      stateId: input.stateId,
      districtId: input.districtId,
      status: "pending",
      adminNote: null,
      createdPollId: null,
      ownerId: input.ownerId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.pollRequests.push(request);
    this.persist();
    return request;
  }

  async listPollRequests(): Promise<PollRequest[]> {
    return sortNewest(this.db.pollRequests);
  }

  async listPublicPollRequests(): Promise<PollRequest[]> {
    return sortNewest(this.db.pollRequests.filter((request) => request.status === "approved" || request.status === "published"));
  }

  async setPollRequestStatus(
    id: string,
    status: PollRequestStatus,
    note?: string | null,
    createdPollId?: string | null,
  ): Promise<PollRequest | null> {
    const request = this.db.pollRequests.find((item) => item.id === id);
    if (!request) return null;
    request.status = status;
    request.adminNote = note ?? request.adminNote;
    request.createdPollId = createdPollId ?? request.createdPollId;
    request.updatedAt = new Date().toISOString();
    this.persist();
    return request;
  }

  async createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
    const now = new Date().toISOString();
    const announcement: Announcement = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      category: input.category,
      stateId: input.stateId ?? null,
      districtId: input.districtId ?? null,
      sourceLabel: input.sourceLabel ?? null,
      sourceUrl: input.sourceUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      status: input.status,
      publishAt: input.publishAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.announcements.push(announcement);
    this.persist();
    return announcement;
  }

  async updateAnnouncement(id: string, patch: Partial<AnnouncementInput>): Promise<Announcement | null> {
    const announcement = this.db.announcements.find((item) => item.id === id);
    if (!announcement) return null;
    Object.assign(announcement, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    return announcement;
  }

  async listAnnouncements(publicOnly = false): Promise<Announcement[]> {
    const now = Date.now();
    const items = publicOnly
      ? this.db.announcements.filter(
          (item) =>
            item.status === "published" &&
            (!item.publishAt || new Date(item.publishAt).getTime() <= now),
        )
      : this.db.announcements;
    return [...items].sort((a, b) => {
      const aTime = a.publishAt ?? a.createdAt;
      const bTime = b.publishAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    });
  }

  async setAnnouncementStatus(id: string, status: Announcement["status"]): Promise<boolean> {
    const announcement = this.db.announcements.find((item) => item.id === id);
    if (!announcement) return false;
    announcement.status = status;
    announcement.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const index = this.db.announcements.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.db.announcements.splice(index, 1);
    this.persist();
    return true;
  }

  private normalizeBuzz(post: BuzzPost): BuzzPost {
    return { ...post, origin: post.origin ?? "admin", submittedBy: post.submittedBy ?? null };
  }

  async createBuzzPost(input: BuzzInput): Promise<BuzzPost> {
    const now = new Date().toISOString();
    const post: BuzzPost = {
      id: randomUUID(),
      title: input.title,
      summary: input.summary,
      body: input.body,
      category: input.category,
      platform: input.platform,
      sourceUrl: input.sourceUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      status: input.status,
      origin: input.origin ?? "admin",
      submittedBy: input.submittedBy ?? null,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.status === "published" ? now : null,
    };
    this.db.buzzPosts.push(post);
    this.persist();
    return post;
  }

  async updateBuzzPost(id: string, patch: Partial<BuzzInput>): Promise<BuzzPost | null> {
    const post = this.db.buzzPosts.find((item) => item.id === id);
    if (!post) return null;
    Object.assign(post, patch, { updatedAt: new Date().toISOString() });
    if (patch.status === "published" && !post.publishedAt) post.publishedAt = new Date().toISOString();
    this.persist();
    return post;
  }

  async listBuzzPosts(publicOnly = false): Promise<BuzzPost[]> {
    const items = publicOnly ? this.db.buzzPosts.filter((item) => item.status === "published") : this.db.buzzPosts;
    return [...items]
      .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
      .map((post) => this.normalizeBuzz(post));
  }

  async setBuzzStatus(id: string, status: BuzzPost["status"]): Promise<boolean> {
    const post = this.db.buzzPosts.find((item) => item.id === id);
    if (!post) return false;
    post.status = status;
    post.updatedAt = new Date().toISOString();
    if (status === "published" && !post.publishedAt) post.publishedAt = post.updatedAt;
    this.persist();
    return true;
  }

  async deleteBuzzPost(id: string): Promise<boolean> {
    const index = this.db.buzzPosts.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.db.buzzPosts.splice(index, 1);
    this.persist();
    return true;
  }

  async createAdInquiry(input: AdInquiryInput): Promise<AdInquiry> {
    const now = new Date().toISOString();
    const inquiry: AdInquiry = {
      id: randomUUID(),
      advertiserName: input.advertiserName,
      email: input.email,
      phone: input.phone,
      objective: input.objective,
      budgetRange: input.budgetRange,
      placement: input.placement,
      destinationUrl: input.destinationUrl,
      creativeUrl: input.creativeUrl || null,
      campaignStart: input.campaignStart ?? null,
      campaignEnd: input.campaignEnd ?? null,
      status: "pending",
      paymentStatus: "unpaid",
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.adInquiries.push(inquiry);
    this.persist();
    return inquiry;
  }

  async listAdInquiries(): Promise<AdInquiry[]> {
    return sortNewest(this.db.adInquiries);
  }

  async updateAdInquiry(
    id: string,
    patch: { status?: AdInquiry["status"]; paymentStatus?: AdInquiry["paymentStatus"]; adminNote?: string | null },
  ): Promise<AdInquiry | null> {
    const inquiry = this.db.adInquiries.find((item) => item.id === id);
    if (!inquiry) return null;
    if (patch.status) inquiry.status = patch.status;
    if (patch.paymentStatus) inquiry.paymentStatus = patch.paymentStatus;
    if (patch.adminNote !== undefined) inquiry.adminNote = patch.adminNote;
    inquiry.updatedAt = new Date().toISOString();
    this.persist();
    return inquiry;
  }

  async listActiveAds(): Promise<AdInquiry[]> {
    const now = Date.now();
    return this.db.adInquiries.filter((ad) => {
      if (ad.status !== "active" || ad.paymentStatus !== "verified") return false;
      if (ad.campaignStart && new Date(ad.campaignStart).getTime() > now) return false;
      if (ad.campaignEnd && new Date(ad.campaignEnd).getTime() < now) return false;
      return true;
    });
  }

  async createUser(input: { email: string; displayName: string; passwordHash: string }): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      stateId: null,
      districtId: null,
      pin: null,
      area: null,
      createdAt: now,
      updatedAt: now,
    };
    this.db.users.push(user);
    this.persist();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.users.find((user) => user.id === id) ?? null;
  }

  async updateUser(
    id: string,
    patch: Partial<Pick<User, "displayName" | "stateId" | "districtId" | "pin" | "area">>,
  ): Promise<PublicUser | null> {
    const user = this.db.users.find((item) => item.id === id);
    if (!user) return null;
    Object.assign(user, patch, { updatedAt: new Date().toISOString() });
    this.persist();
    const safe: PublicUser = { ...user };
    return safe;
  }

  async listOwnSubmissions(userId: string) {
    return {
      issues: sortNewest(this.db.issues.filter((item) => item.ownerId === userId)),
      reviews: sortNewest(this.db.reviews.filter((item) => item.ownerId === userId)),
      threads: sortNewest(this.db.threads.filter((item) => item.ownerId === userId)),
      questions: sortNewest(this.db.questions.filter((item) => item.ownerId === userId)),
      pollRequests: sortNewest(this.db.pollRequests.filter((item) => item.ownerId === userId)),
      quizScores: sortNewest(this.db.quizScores.filter((item) => item.userId === userId)),
    };
  }

  async upsertQuizScore(userId: string, quizSlug: string, score: number, total: number): Promise<QuizScore> {
    const now = new Date().toISOString();
    const existing = this.db.quizScores.find((item) => item.userId === userId && item.quizSlug === quizSlug);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.total = total;
        existing.updatedAt = now;
        this.persist();
      }
      return existing;
    }
    const row: QuizScore = {
      id: randomUUID(),
      userId,
      quizSlug,
      score,
      total,
      createdAt: now,
      updatedAt: now,
    };
    this.db.quizScores.push(row);
    this.persist();
    return row;
  }

  async listLeaderboard(quizSlug?: string, limit = 25): Promise<LeaderboardEntry[]> {
    const rows = this.db.quizScores.filter((item) => !quizSlug || item.quizSlug === quizSlug);
    const best = new Map<string, QuizScore>();
    for (const row of rows) {
      const key = quizSlug ? row.userId : `${row.userId}:${row.quizSlug}`;
      const current = best.get(key);
      if (!current || row.score / row.total > current.score / current.total || (row.score / row.total === current.score / current.total && row.score > current.score)) {
        best.set(key, row);
      }
    }
    const entries = [...best.values()]
      .map((row) => {
        const user = this.db.users.find((item) => item.id === row.userId);
        return {
          rank: 0,
          displayName: user?.displayName ?? "Citizen",
          quizSlug: row.quizSlug,
          score: row.score,
          total: row.total,
          updatedAt: row.updatedAt,
        };
      })
      .sort((a, b) => b.score / b.total - a.score / a.total || b.score - a.score || a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, limit);
    return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  async listQuizScores(userId: string): Promise<QuizScore[]> {
    return sortNewest(this.db.quizScores.filter((item) => item.userId === userId));
  }
}

let repository: Repository | null = null;

function createJsonRepository(): JsonRepository {
  if (demoModeActive()) {
    // Read-only demo content. No database or filesystem writes, and writes are
    // rejected at the API layer so temporary storage is never shown as durable.
    return new JsonRepository(null, "demo");
  }
  const isServerless = Boolean(process.env.VERCEL) && !process.env.KBP_FILE_STORE;
  if (isServerless) {
    // In production, serverless deployments must not silently degrade to memory.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "KBP storage error: no persistent database is configured on this production deployment (DATABASE_URL is not set and KBP_FILE_STORE is not set). Set DATABASE_URL to a PostgreSQL database such as Supabase, or configure KBP_FILE_STORE. Refusing to silently use in-memory storage in production.",
      );
    }
    return new JsonRepository(null, "memory");
  }
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

export async function getUserById(id: string): Promise<User | null> {
  const repo = await getRepository();
  return repo.getUserById(id);
}

/** Test helper: reset the singleton between test suites. */
export function __resetRepository() {
  repository = null;
}

export { JsonRepository };
