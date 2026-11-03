import { Pool, type PoolClient } from "pg";
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
import type { ContactInput, QuestionInput, ThreadInput } from "@/lib/validation";
import type {
  AdInquiryInput,
  AnnouncementInput,
  BuzzInput,
  IssueFilter,
  ListFilter,
  NewIssue,
  NewReview,
  PollCreateInput,
  PollRequestInput,
  Repository,
  VoteOutcome,
} from "./index";
import { trackingCode } from "./index";
import { postgresPoolOptions } from "@/lib/postgres-config";

type Row = Record<string, unknown>;

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());
const isoOrNull = (value: unknown): string | null => (value ? iso(value) : null);
const text = (value: unknown): string => String(value ?? "");

function mapPoll(row: Row, options: Row[]): Poll {
  return {
    id: text(row.id),
    question: { hi: text(row.question_hi), en: text(row.question_en) },
    description: { hi: text(row.description_hi), en: text(row.description_en) },
    category: text(row.category),
    closesAt: iso(row.closes_at),
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    options: options.map((option) => ({
      id: text(option.id),
      label: { hi: text(option.label_hi), en: text(option.label_en) },
    })),
    status: (text(row.status) || "published") as Poll["status"],
    featured: Boolean(row.featured),
    sponsored: Boolean(row.sponsored),
    sponsorLabel: row.sponsor_label_hi
      ? { hi: text(row.sponsor_label_hi), en: text(row.sponsor_label_en) }
      : null,
  };
}

function mapPollRequest(row: Row): PollRequest {
  return {
    id: text(row.id),
    questionHi: text(row.question_hi),
    questionEn: text(row.question_en),
    optionsHi: (row.options_hi as string[]) ?? [],
    optionsEn: (row.options_en as string[]) ?? [],
    category: text(row.category),
    purpose: text(row.purpose),
    contact: row.contact ? text(row.contact) : null,
    stateId: text(row.state_id),
    districtId: text(row.district_id),
    status: text(row.status) as PollRequestStatus,
    adminNote: row.admin_note ? text(row.admin_note) : null,
    createdPollId: row.created_poll_id ? text(row.created_poll_id) : null,
    ownerId: row.owner_id ? text(row.owner_id) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapAnnouncement(row: Row): Announcement {
  return {
    id: text(row.id),
    title: { hi: text(row.title_hi), en: text(row.title_en) },
    body: { hi: text(row.body_hi), en: text(row.body_en) },
    category: text(row.category) as Announcement["category"],
    stateId: row.state_id ? text(row.state_id) : null,
    districtId: row.district_id ? text(row.district_id) : null,
    sourceLabel: row.source_label ? text(row.source_label) : null,
    sourceUrl: row.source_url ? text(row.source_url) : null,
    imageUrl: row.image_url ? text(row.image_url) : null,
    status: text(row.status) as Announcement["status"],
    publishAt: isoOrNull(row.publish_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapBuzz(row: Row): BuzzPost {
  return {
    id: text(row.id),
    title: { hi: text(row.title_hi), en: text(row.title_en) },
    summary: { hi: text(row.summary_hi), en: text(row.summary_en) },
    body: { hi: text(row.body_hi), en: text(row.body_en) },
    category: text(row.category) as BuzzPost["category"],
    platform: text(row.platform),
    sourceUrl: row.source_url ? text(row.source_url) : null,
    imageUrl: row.image_url ? text(row.image_url) : null,
    status: text(row.status) as BuzzPost["status"],
    origin: (text(row.origin) || "admin") as BuzzPost["origin"],
    submittedBy: row.submitted_by ? text(row.submitted_by) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    publishedAt: isoOrNull(row.published_at),
  };
}

function mapAd(row: Row): AdInquiry {
  return {
    id: text(row.id),
    advertiserName: text(row.advertiser_name),
    email: text(row.email),
    phone: text(row.phone),
    objective: text(row.objective),
    budgetRange: text(row.budget_range),
    placement: text(row.placement),
    destinationUrl: text(row.destination_url),
    creativeUrl: row.creative_url ? text(row.creative_url) : null,
    campaignStart: isoOrNull(row.campaign_start),
    campaignEnd: isoOrNull(row.campaign_end),
    status: text(row.status) as AdInquiry["status"],
    paymentStatus: text(row.payment_status) as AdInquiry["paymentStatus"],
    adminNote: row.admin_note ? text(row.admin_note) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapUser(row: Row): User {
  return {
    id: text(row.id),
    email: text(row.email),
    displayName: text(row.display_name),
    passwordHash: text(row.password_hash),
    stateId: row.state_id ? text(row.state_id) : null,
    districtId: row.district_id ? text(row.district_id) : null,
    pin: row.pin ? text(row.pin) : null,
    area: row.area ? text(row.area) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapQuizScore(row: Row): QuizScore {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    quizSlug: text(row.quiz_slug),
    score: Number(row.score),
    total: Number(row.total),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapIssue(row: Row): CivicIssue {
  return {
    id: text(row.id),
    trackingCode: text(row.tracking_code),
    category: text(row.category),
    title: text(row.title),
    description: text(row.description),
    area: text(row.area),
    districtId: text(row.district_id),
    stateId: text(row.state_id),
    pin: row.pin ? text(row.pin) : null,
    status: text(row.status) as CivicIssue["status"],
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    officialComplaintUrl: row.official_complaint_url ? text(row.official_complaint_url) : null,
    events: (row.events as CivicIssue["events"]) ?? [],
    ownerId: row.owner_id ? text(row.owner_id) : null,
  };
}

function mapReview(row: Row): Review {
  return {
    id: text(row.id),
    serviceCategory: text(row.service_category),
    rating: Number(row.rating),
    title: text(row.title),
    body: text(row.body),
    area: text(row.area),
    districtId: text(row.district_id),
    stateId: text(row.state_id),
    displayName: row.display_name ? text(row.display_name) : null,
    status: text(row.status) as Review["status"],
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    ownerId: row.owner_id ? text(row.owner_id) : null,
  };
}

function mapThread(row: Row): Thread {
  return {
    id: text(row.id),
    title: text(row.title),
    body: text(row.body),
    category: text(row.category),
    districtId: text(row.district_id),
    stateId: text(row.state_id),
    authorAlias: text(row.author_alias),
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    replyCount: Number(row.reply_count),
    status: text(row.status) === "hidden" ? "hidden" : "published",
    ownerId: row.owner_id ? text(row.owner_id) : null,
  };
}

function mapReply(row: Row): Reply {
  return {
    id: text(row.id),
    threadId: text(row.thread_id),
    body: text(row.body),
    authorAlias: text(row.author_alias),
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    status: text(row.status) as Reply["status"],
  };
}

function mapQuestion(row: Row): Question {
  return {
    id: text(row.id),
    question: text(row.question),
    answer: row.answer ? text(row.answer) : null,
    answerStatus: text(row.answer_status) as Question["answerStatus"],
    sources: (row.sources as Question["sources"]) ?? [],
    districtId: row.district_id ? text(row.district_id) : null,
    stateId: row.state_id ? text(row.state_id) : null,
    isDemo: Boolean(row.is_demo),
    createdAt: iso(row.created_at),
    ownerId: row.owner_id ? text(row.owner_id) : null,
  };
}

class PostgresRepository implements Repository {
  mode = "postgres" as const;

  constructor(private pool: Pool) {}

  private async query(sql: string, params: unknown[] = []) {
    const result = await this.pool.query(sql, params);
    return result.rows as Row[];
  }

  async initialize() {
    await this.seed();
  }

  private async seed() {
    const existing = await this.query("select count(*)::int as count from polls");
    if (Number(existing[0]?.count ?? 0) > 0) return;
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      for (const poll of demoPolls) {
        await client.query(
          `insert into polls (id, question_hi, question_en, description_hi, description_en, category, closes_at, is_demo, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
          [
            poll.id,
            poll.question.hi,
            poll.question.en,
            poll.description.hi,
            poll.description.en,
            poll.category,
            poll.closesAt,
            poll.isDemo,
            poll.createdAt,
          ],
        );
        for (const [index, option] of poll.options.entries()) {
          await client.query(
            `insert into poll_options (id, poll_id, label_hi, label_en, sort_order)
             values ($1,$2,$3,$4,$5) on conflict (id) do nothing`,
            [option.id, poll.id, option.label.hi, option.label.en, index],
          );
        }
      }
      for (const issue of demoIssues) await this.insertIssueRow(client, issue);
      for (const review of demoReviews) await this.insertReviewRow(client, review);
      for (const thread of demoThreads) {
        await client.query(
          `insert into threads (id,title,body,category,district_id,state_id,author_alias,is_demo,created_at,reply_count,status)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published') on conflict (id) do nothing`,
          [thread.id, thread.title, thread.body, thread.category, thread.districtId, thread.stateId, thread.authorAlias, thread.isDemo, thread.createdAt, thread.replyCount],
        );
      }
      for (const reply of demoReplies) {
        await client.query(
          `insert into replies (id,thread_id,body,author_alias,is_demo,created_at,status)
           values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
          [reply.id, reply.threadId, reply.body, reply.authorAlias, reply.isDemo, reply.createdAt, reply.status],
        );
      }
      for (const question of demoQuestions) {
        await client.query(
          `insert into questions (id,question,answer,answer_status,sources,district_id,state_id,is_demo,created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
          [question.id, question.question, question.answer, question.answerStatus, JSON.stringify(question.sources), question.districtId, question.stateId, question.isDemo, question.createdAt],
        );
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertIssueRow(client: PoolClient, issue: CivicIssue) {
    await client.query(
      `insert into issues (id,tracking_code,category,title,description,area,district_id,state_id,pin,status,is_demo,created_at,updated_at,official_complaint_url,events)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) on conflict (id) do nothing`,
      [issue.id, issue.trackingCode, issue.category, issue.title, issue.description, issue.area, issue.districtId, issue.stateId, issue.pin, issue.status, issue.isDemo, issue.createdAt, issue.updatedAt, issue.officialComplaintUrl, JSON.stringify(issue.events)],
    );
  }

  private async insertReviewRow(client: PoolClient, review: Review) {
    await client.query(
      `insert into reviews (id,service_category,rating,title,body,area,district_id,state_id,display_name,status,is_demo,created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (id) do nothing`,
      [review.id, review.serviceCategory, review.rating, review.title, review.body, review.area, review.districtId, review.stateId, review.displayName, review.status, review.isDemo, review.createdAt],
    );
  }

  async listPolls(): Promise<Poll[]> {
    const polls = await this.query(
      "select * from polls where status is null or status not in ('draft','archived') order by created_at desc",
    );
    const options = await this.query("select * from poll_options order by sort_order asc");
    return polls.map((poll) =>
      mapPoll(poll, options.filter((option) => option.poll_id === poll.id)),
    );
  }

  async getPoll(pollId: string): Promise<Poll | null> {
    const polls = await this.query("select * from polls where id = $1", [pollId]);
    if (!polls[0]) return null;
    const options = await this.query(
      "select * from poll_options where poll_id = $1 order by sort_order asc",
      [pollId],
    );
    return mapPoll(polls[0], options);
  }

  async getPollResults(pollId: string, voterHash: string) {
    const poll = await this.getPoll(pollId);
    const counts: Record<string, number> = {};
    for (const option of poll?.options ?? []) counts[option.id] = 0;
    const rows = await this.query(
      "select option_id, count(*)::int as count from poll_votes where poll_id = $1 group by option_id",
      [pollId],
    );
    let total = 0;
    for (const row of rows) {
      const count = Number(row.count);
      counts[text(row.option_id)] = count;
      total += count;
    }
    const voted = voterHash
      ? await this.query("select 1 from poll_votes where poll_id = $1 and voter_hash = $2 limit 1", [pollId, voterHash])
      : [];
    return { counts, total, hasVoted: voted.length > 0 };
  }

  async castVote(pollId: string, optionId: string, voterHash: string): Promise<VoteOutcome> {
    const poll = await this.getPoll(pollId);
    if (!poll) return { ok: false, reason: "not_found" };
    if (!poll.options.some((option) => option.id === optionId)) return { ok: false, reason: "invalid_option" };
    if (new Date(poll.closesAt).getTime() < Date.now()) return { ok: false, reason: "closed" };
    try {
      await this.pool.query(
        "insert into poll_votes (poll_id, option_id, voter_hash) values ($1,$2,$3)",
        [pollId, optionId, voterHash],
      );
      return { ok: true };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "23505") return { ok: false, reason: "duplicate" };
      throw error;
    }
  }

  async listIssues(filter?: IssueFilter): Promise<CivicIssue[]> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (filter?.stateId) {
      params.push(filter.stateId);
      where.push(`state_id = $${params.length}`);
    }
    if (filter?.districtId) {
      params.push(filter.districtId);
      where.push(`(district_id = $${params.length} or not exists (select 1 from issues i2 where i2.district_id = $${params.length}))`);
    }
    if (filter?.status) {
      params.push(filter.status);
      where.push(`status = $${params.length}`);
    }
    params.push(filter?.limit ?? 50);
    const rows = await this.query(
      `select * from issues ${where.length ? `where ${where.join(" and ")}` : ""} order by created_at desc limit $${params.length}`,
      params,
    );
    return rows.map(mapIssue);
  }

  async getIssueByCode(code: string): Promise<CivicIssue | null> {
    const rows = await this.query("select * from issues where upper(tracking_code) = upper($1)", [code]);
    return rows[0] ? mapIssue(rows[0]) : null;
  }

  async createIssue(input: NewIssue, ownerId?: string | null): Promise<CivicIssue> {
    let code = trackingCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await this.query("select 1 from issues where tracking_code = $1", [code]);
      if (!existing[0]) break;
      code = trackingCode();
    }
    const now = new Date().toISOString();
    const events = [
      { status: "submitted", note: "समस्या दर्ज हुई। कृपया ट्रैकिंग कोड सहेजें।", createdAt: now },
    ];
    const rows = await this.query(
      `insert into issues (id,tracking_code,category,title,description,area,district_id,state_id,pin,status,is_demo,created_at,updated_at,official_complaint_url,events,owner_id)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,'submitted',false,$9,$9,$10,$11,$12) returning *`,
      [code, input.category, input.title, input.description, input.area, input.districtId, input.stateId, input.pin ?? null, now, input.officialComplaintUrl || null, JSON.stringify(events), ownerId ?? null],
    );
    return mapIssue(rows[0]);
  }

  async updateIssue(id: string, status: IssueStatus, note: string, url?: string) {
    const now = new Date().toISOString();
    const rows = await this.query(
      `update issues set status=$2, updated_at=$3,
        events = events || $4::jsonb,
        official_complaint_url = coalesce($5, official_complaint_url)
       where id=$1 returning *`,
      [id, status, now, JSON.stringify([{ status, note, createdAt: now }]), url || null],
    );
    return rows[0] ? mapIssue(rows[0]) : null;
  }

  async listReviews(filter?: ListFilter): Promise<Review[]> {
    const params: unknown[] = [];
    const where = ["status = 'published'"];
    if (filter?.stateId) {
      params.push(filter.stateId);
      where.push(`state_id = $${params.length}`);
    }
    if (filter?.districtId) {
      params.push(filter.districtId);
      where.push(`district_id = $${params.length}`);
    }
    params.push(filter?.limit ?? 50);
    const rows = await this.query(
      `select * from reviews where ${where.join(" and ")} order by created_at desc limit $${params.length}`,
      params,
    );
    return rows.map(mapReview);
  }

  async createReview(input: NewReview, ownerId?: string | null): Promise<Review> {
    const rows = await this.query(
      `insert into reviews (id,service_category,rating,title,body,area,district_id,state_id,display_name,status,is_demo,created_at,owner_id)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,'published',false,now(),$9) returning *`,
      [input.serviceCategory, input.rating, input.title, input.body, input.area, input.districtId, input.stateId, input.displayName || null, ownerId ?? null],
    );
    return mapReview(rows[0]);
  }

  async setReviewStatus(id: string, status: "published" | "hidden") {
    const rows = await this.query("update reviews set status=$2 where id=$1 returning id", [id, status]);
    return rows.length > 0;
  }

  async listThreads(filter?: ListFilter): Promise<Thread[]> {
    const params: unknown[] = [];
    const where: string[] = ["status = 'published'"];
    if (filter?.stateId) {
      params.push(filter.stateId);
      where.push(`state_id = $${params.length}`);
    }
    if (filter?.districtId) {
      params.push(filter.districtId);
      where.push(`district_id = $${params.length}`);
    }
    params.push(filter?.limit ?? 50);
    const rows = await this.query(
      `select * from threads where ${where.join(" and ")} order by created_at desc limit $${params.length}`,
      params,
    );
    return rows.map(mapThread);
  }

  async getThread(id: string) {
    const threads = await this.query("select * from threads where id=$1 and status='published'", [id]);
    if (!threads[0]) return null;
    const replies = await this.query(
      "select * from replies where thread_id=$1 and status='published' order by created_at asc",
      [id],
    );
    return { thread: mapThread(threads[0]), replies: replies.map(mapReply) };
  }

  async createThread(input: ThreadInput, ownerId?: string | null): Promise<Thread> {
    const rows = await this.query(
      `insert into threads (id,title,body,category,district_id,state_id,author_alias,is_demo,created_at,reply_count,status,owner_id)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,false,now(),0,'published',$7) returning *`,
      [input.title, input.body, input.category, input.districtId, input.stateId, input.authorAlias, ownerId ?? null],
    );
    return mapThread(rows[0]);
  }

  async addReply(threadId: string, body: string, authorAlias: string): Promise<Reply | null> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const thread = await client.query("select id from threads where id=$1 for update", [threadId]);
      if (thread.rows.length === 0) {
        await client.query("rollback");
        return null;
      }
      const inserted = await client.query(
        `insert into replies (id,thread_id,body,author_alias,is_demo,created_at,status)
         values (gen_random_uuid()::text,$1,$2,$3,false,now(),'published') returning *`,
        [threadId, body, authorAlias],
      );
      await client.query("update threads set reply_count = reply_count + 1 where id=$1", [threadId]);
      await client.query("commit");
      return mapReply(inserted.rows[0] as Row);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async setReplyStatus(id: string, status: "published" | "hidden") {
    const rows = await this.query("update replies set status=$2 where id=$1 returning id", [id, status]);
    return rows.length > 0;
  }

  async setThreadStatus(id: string, status: "published" | "hidden") {
    const rows = await this.query("update threads set status=$2 where id=$1 returning id", [id, status]);
    return rows.length > 0;
  }

  async listQuestions(filter?: ListFilter): Promise<Question[]> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (filter?.stateId) {
      params.push(filter.stateId);
      where.push(`state_id = $${params.length}`);
    }
    if (filter?.districtId) {
      params.push(filter.districtId);
      where.push(`district_id = $${params.length}`);
    }
    params.push(filter?.limit ?? 50);
    const rows = await this.query(
      `select * from questions ${where.length ? `where ${where.join(" and ")}` : ""} order by created_at desc limit $${params.length}`,
      params,
    );
    return rows.map(mapQuestion);
  }

  async createQuestion(input: QuestionInput, ownerId?: string | null): Promise<Question> {
    const rows = await this.query(
      `insert into questions (id,question,answer,answer_status,sources,district_id,state_id,is_demo,created_at,owner_id)
       values (gen_random_uuid()::text,$1,null,'pending','[]'::jsonb,$2,$3,false,now(),$4) returning *`,
      [input.question, input.districtId || null, input.stateId || null, ownerId ?? null],
    );
    return mapQuestion(rows[0]);
  }

  async answerQuestion(id: string, answer: string, sources: { label: string; url: string }[]) {
    const rows = await this.query(
      `update questions set answer=$2, answer_status='official_source', sources=$3::jsonb where id=$1 returning id`,
      [id, answer, JSON.stringify(sources)],
    );
    return rows.length > 0;
  }

  async createReport(input: {
    targetType: Report["targetType"];
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const rows = await this.query(
      `insert into reports (id,target_type,target_id,reason,details,status,created_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,'open',now()) returning *`,
      [input.targetType, input.targetId, input.reason, input.details || null],
    );
    const row = rows[0];
    return {
      id: text(row.id),
      targetType: text(row.target_type) as Report["targetType"],
      targetId: text(row.target_id),
      reason: text(row.reason),
      details: row.details ? text(row.details) : null,
      status: "open",
      createdAt: iso(row.created_at),
    };
  }

  async listReports(): Promise<Report[]> {
    const rows = await this.query("select * from reports order by created_at desc limit 200");
    return rows.map((row) => ({
      id: text(row.id),
      targetType: text(row.target_type) as Report["targetType"],
      targetId: text(row.target_id),
      reason: text(row.reason),
      details: row.details ? text(row.details) : null,
      status: text(row.status) as Report["status"],
      createdAt: iso(row.created_at),
    }));
  }

  async resolveReport(id: string) {
    const rows = await this.query("update reports set status='resolved' where id=$1 returning id", [id]);
    return rows.length > 0;
  }

  async createContactMessage(input: ContactInput): Promise<ContactMessage> {
    const rows = await this.query(
      `insert into contact_messages (id,name,email,subject,message,status,created_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,'open',now()) returning *`,
      [input.name || null, input.email || null, input.subject, input.message],
    );
    return this.mapContact(rows[0]!);
  }

  async listContactMessages(): Promise<ContactMessage[]> {
    const rows = await this.query("select * from contact_messages order by created_at desc limit 200");
    return rows.map((row) => this.mapContact(row));
  }

  async resolveContactMessage(id: string) {
    const rows = await this.query("update contact_messages set status='resolved' where id=$1 returning id", [id]);
    return rows.length > 0;
  }

  private mapContact(row: Row): ContactMessage {
    return {
      id: text(row.id),
      name: row.name ? text(row.name) : null,
      email: row.email ? text(row.email) : null,
      subject: text(row.subject),
      message: text(row.message),
      status: text(row.status) === "resolved" ? "resolved" : "open",
      createdAt: iso(row.created_at),
    };
  }

  async listRepresentatives(filter?: ListFilter): Promise<Representative[]> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (filter?.stateId) {
      params.push(filter.stateId);
      where.push(`state_id = $${params.length}`);
    }
    if (filter?.districtId) {
      params.push(filter.districtId);
      where.push(`(district_id = $${params.length} or district_id is null)`);
    }
    const rows = await this.query(
      `select * from representatives ${where.length ? `where ${where.join(" and ")}` : ""} order by role`,
      params,
    );
    return rows.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      role: text(row.role) as Representative["role"],
      constituency: text(row.constituency),
      districtId: row.district_id ? text(row.district_id) : null,
      stateId: text(row.state_id),
      party: row.party ? text(row.party) : null,
      officialContact: row.official_contact ? text(row.official_contact) : null,
      officialSourceUrl: text(row.official_source_url),
      verificationStatus: "verified",
      lastVerifiedAt: isoOrNull(row.last_verified_at),
    }));
  }

  async importRepresentatives(rows: Representative[]): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      for (const row of rows) {
        await client.query(
          `insert into representatives (id,name,role,constituency,district_id,state_id,party,official_contact,official_source_url,verification_status,last_verified_at,updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'verified',$10,now())
           on conflict (id) do update set name=excluded.name, role=excluded.role, constituency=excluded.constituency,
             district_id=excluded.district_id, state_id=excluded.state_id, party=excluded.party,
             official_contact=excluded.official_contact, official_source_url=excluded.official_source_url,
             verification_status='verified', last_verified_at=excluded.last_verified_at, updated_at=now()`,
          [row.id, row.name, row.role, row.constituency, row.districtId, row.stateId, row.party ?? null, row.officialContact ?? null, row.officialSourceUrl, row.lastVerifiedAt],
        );
      }
      await client.query("commit");
      return rows.length;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async listAllPolls(): Promise<Poll[]> {
    const polls = await this.query("select * from polls order by created_at desc");
    const options = await this.query("select * from poll_options order by sort_order asc");
    return polls.map((poll) => mapPoll(poll, options.filter((option) => option.poll_id === poll.id)));
  }

  async createPoll(input: PollCreateInput): Promise<Poll> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(
        `insert into polls (id,question_hi,question_en,description_hi,description_en,category,closes_at,is_demo,created_at,status,featured,sponsored,sponsor_label_hi,sponsor_label_en)
         values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,false,now(),'published',$7,$8,$9,$10) returning *`,
        [
          input.question.hi,
          input.question.en,
          input.description.hi,
          input.description.en,
          input.category,
          input.closesAt,
          input.featured ?? false,
          input.sponsored ?? false,
          input.sponsorLabel?.hi ?? null,
          input.sponsorLabel?.en ?? null,
        ],
      );
      const pollId = text((inserted.rows[0] as Row).id);
      for (const [index, option] of input.options.entries()) {
        await client.query(
          `insert into poll_options (id,poll_id,label_hi,label_en,sort_order)
           values (gen_random_uuid()::text,$1,$2,$3,$4)`,
          [pollId, option.hi, option.en, index],
        );
      }
      await client.query("commit");
      const poll = await this.getPoll(pollId);
      return poll!;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePollStatus(id: string, action: "publish" | "close" | "archive" | "feature" | "unfeature") {
    const assignments: Record<typeof action, string> = {
      publish: "status='published'",
      close: "status='closed'",
      archive: "status='archived'",
      feature: "featured=true",
      unfeature: "featured=false",
    };
    const rows = await this.query(`update polls set ${assignments[action]} where id=$1 returning *`, [id]);
    if (!rows[0]) return null;
    const options = await this.query("select * from poll_options where poll_id=$1 order by sort_order asc", [id]);
    return mapPoll(rows[0], options);
  }

  async createPollRequest(input: PollRequestInput): Promise<PollRequest> {
    const rows = await this.query(
      `insert into poll_requests (id,question_hi,question_en,options_hi,options_en,category,purpose,contact,state_id,district_id,status,owner_id,created_at,updated_at)
       values (gen_random_uuid()::text,$1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,'pending',$10,now(),now()) returning *`,
      [
        input.questionHi,
        input.questionEn,
        JSON.stringify(input.optionsHi),
        JSON.stringify(input.optionsEn),
        input.category,
        input.purpose,
        input.contact || null,
        input.stateId,
        input.districtId,
        input.ownerId ?? null,
      ],
    );
    return mapPollRequest(rows[0]!);
  }

  async listPollRequests(): Promise<PollRequest[]> {
    const rows = await this.query("select * from poll_requests order by created_at desc limit 200");
    return rows.map(mapPollRequest);
  }

  async listPublicPollRequests(): Promise<PollRequest[]> {
    const rows = await this.query(
      "select * from poll_requests where status in ('approved','published') order by created_at desc limit 50",
    );
    return rows.map(mapPollRequest);
  }

  async setPollRequestStatus(id: string, status: PollRequestStatus, note?: string | null, createdPollId?: string | null) {
    const rows = await this.query(
      `update poll_requests set status=$2, admin_note=coalesce($3,admin_note), created_poll_id=coalesce($4,created_poll_id), updated_at=now()
       where id=$1 returning *`,
      [id, status, note ?? null, createdPollId ?? null],
    );
    return rows[0] ? mapPollRequest(rows[0]) : null;
  }

  async createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
    const rows = await this.query(
      `insert into announcements (id,title_hi,title_en,body_hi,body_en,category,state_id,district_id,source_label,source_url,image_url,status,publish_at,created_at,updated_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now()) returning *`,
      [
        input.title.hi,
        input.title.en,
        input.body.hi,
        input.body.en,
        input.category,
        input.stateId ?? null,
        input.districtId ?? null,
        input.sourceLabel ?? null,
        input.sourceUrl ?? null,
        input.imageUrl ?? null,
        input.status,
        input.publishAt ?? null,
      ],
    );
    return mapAnnouncement(rows[0]!);
  }

  async updateAnnouncement(id: string, patch: Partial<AnnouncementInput>): Promise<Announcement | null> {
    const current = await this.query("select * from announcements where id=$1", [id]);
    if (!current[0]) return null;
    const existing = mapAnnouncement(current[0]);
    const merged = {
      title_hi: patch.title?.hi ?? existing.title.hi,
      title_en: patch.title?.en ?? existing.title.en,
      body_hi: patch.body?.hi ?? existing.body.hi,
      body_en: patch.body?.en ?? existing.body.en,
      category: patch.category ?? existing.category,
      state_id: patch.stateId !== undefined ? patch.stateId : existing.stateId,
      district_id: patch.districtId !== undefined ? patch.districtId : existing.districtId,
      source_label: patch.sourceLabel !== undefined ? patch.sourceLabel : existing.sourceLabel,
      source_url: patch.sourceUrl !== undefined ? patch.sourceUrl : existing.sourceUrl,
      image_url: patch.imageUrl !== undefined ? patch.imageUrl : existing.imageUrl,
      status: patch.status ?? existing.status,
      publish_at: patch.publishAt !== undefined ? patch.publishAt : existing.publishAt,
    };
    const rows = await this.query(
      `update announcements set title_hi=$2,title_en=$3,body_hi=$4,body_en=$5,category=$6,state_id=$7,district_id=$8,
         source_label=$9,source_url=$10,image_url=$11,status=$12,publish_at=$13,updated_at=now() where id=$1 returning *`,
      [
        id,
        merged.title_hi,
        merged.title_en,
        merged.body_hi,
        merged.body_en,
        merged.category,
        merged.state_id,
        merged.district_id,
        merged.source_label,
        merged.source_url,
        merged.image_url,
        merged.status,
        merged.publish_at,
      ],
    );
    return rows[0] ? mapAnnouncement(rows[0]) : null;
  }

  async listAnnouncements(publicOnly = false): Promise<Announcement[]> {
    const rows = await this.query(
      publicOnly
        ? "select * from announcements where status='published' and (publish_at is null or publish_at <= now()) order by coalesce(publish_at,created_at) desc limit 100"
        : "select * from announcements order by created_at desc limit 200",
    );
    return rows.map(mapAnnouncement);
  }

  async setAnnouncementStatus(id: string, status: Announcement["status"]) {
    const rows = await this.query("update announcements set status=$2, updated_at=now() where id=$1 returning id", [id, status]);
    return rows.length > 0;
  }

  async deleteAnnouncement(id: string) {
    const rows = await this.query("delete from announcements where id=$1 returning id", [id]);
    return rows.length > 0;
  }

  async createBuzzPost(input: BuzzInput): Promise<BuzzPost> {
    const rows = await this.query(
      `insert into buzz_posts (id,title_hi,title_en,summary_hi,summary_en,body_hi,body_en,category,platform,source_url,image_url,status,origin,submitted_by,created_at,updated_at,published_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now(),case when $11='published' then now() else null end) returning *`,
      [
        input.title.hi,
        input.title.en,
        input.summary.hi,
        input.summary.en,
        input.body.hi,
        input.body.en,
        input.category,
        input.platform,
        input.sourceUrl ?? null,
        input.imageUrl ?? null,
        input.status,
        input.origin ?? "admin",
        input.submittedBy ?? null,
      ],
    );
    return mapBuzz(rows[0]!);
  }

  async updateBuzzPost(id: string, patch: Partial<BuzzInput>): Promise<BuzzPost | null> {
    const current = await this.query("select * from buzz_posts where id=$1", [id]);
    if (!current[0]) return null;
    const existing = mapBuzz(current[0]);
    const status = patch.status ?? existing.status;
    const rows = await this.query(
      `update buzz_posts set title_hi=$2,title_en=$3,summary_hi=$4,summary_en=$5,body_hi=$6,body_en=$7,category=$8,platform=$9,
         source_url=$10,image_url=$11,status=$12,
         published_at=case when $12='published' and published_at is null then now() else published_at end,
         updated_at=now() where id=$1 returning *`,
      [
        id,
        patch.title?.hi ?? existing.title.hi,
        patch.title?.en ?? existing.title.en,
        patch.summary?.hi ?? existing.summary.hi,
        patch.summary?.en ?? existing.summary.en,
        patch.body?.hi ?? existing.body.hi,
        patch.body?.en ?? existing.body.en,
        patch.category ?? existing.category,
        patch.platform ?? existing.platform,
        patch.sourceUrl !== undefined ? patch.sourceUrl : existing.sourceUrl,
        patch.imageUrl !== undefined ? patch.imageUrl : existing.imageUrl,
        status,
      ],
    );
    return rows[0] ? mapBuzz(rows[0]) : null;
  }

  async listBuzzPosts(publicOnly = false): Promise<BuzzPost[]> {
    const rows = await this.query(
      publicOnly
        ? "select * from buzz_posts where status='published' order by coalesce(published_at,created_at) desc limit 100"
        : "select * from buzz_posts order by created_at desc limit 200",
    );
    return rows.map(mapBuzz);
  }

  async setBuzzStatus(id: string, status: BuzzPost["status"]) {
    const rows = await this.query(
      `update buzz_posts set status=$2, published_at=case when $2='published' and published_at is null then now() else published_at end, updated_at=now() where id=$1 returning id`,
      [id, status],
    );
    return rows.length > 0;
  }

  async deleteBuzzPost(id: string) {
    const rows = await this.query("delete from buzz_posts where id=$1 returning id", [id]);
    return rows.length > 0;
  }

  async createAdInquiry(input: AdInquiryInput): Promise<AdInquiry> {
    const rows = await this.query(
      `insert into ad_inquiries (id,advertiser_name,email,phone,objective,budget_range,placement,destination_url,creative_url,campaign_start,campaign_end,status,payment_status,created_at,updated_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending','unpaid',now(),now()) returning *`,
      [
        input.advertiserName,
        input.email,
        input.phone,
        input.objective,
        input.budgetRange,
        input.placement,
        input.destinationUrl,
        input.creativeUrl || null,
        input.campaignStart ?? null,
        input.campaignEnd ?? null,
      ],
    );
    return mapAd(rows[0]!);
  }

  async listAdInquiries(): Promise<AdInquiry[]> {
    const rows = await this.query("select * from ad_inquiries order by created_at desc limit 200");
    return rows.map(mapAd);
  }

  async updateAdInquiry(
    id: string,
    patch: { status?: AdInquiry["status"]; paymentStatus?: AdInquiry["paymentStatus"]; adminNote?: string | null },
  ): Promise<AdInquiry | null> {
    const rows = await this.query(
      `update ad_inquiries set status=coalesce($2,status), payment_status=coalesce($3,payment_status),
         admin_note=case when $4::text is null then admin_note else $4 end, updated_at=now() where id=$1 returning *`,
      [id, patch.status ?? null, patch.paymentStatus ?? null, patch.adminNote ?? null],
    );
    return rows[0] ? mapAd(rows[0]) : null;
  }

  async listActiveAds(): Promise<AdInquiry[]> {
    const rows = await this.query(
      `select * from ad_inquiries where status='active' and payment_status='verified'
       and (campaign_start is null or campaign_start <= now())
       and (campaign_end is null or campaign_end >= now()) order by created_at desc limit 10`,
    );
    return rows.map(mapAd);
  }

  async createUser(input: { email: string; displayName: string; passwordHash: string }): Promise<User> {
    const rows = await this.query(
      `insert into users (id,email,display_name,password_hash,created_at,updated_at)
       values (gen_random_uuid()::text,$1,$2,$3,now(),now()) returning *`,
      [input.email.toLowerCase(), input.displayName, input.passwordHash],
    );
    return mapUser(rows[0]!);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.query("select * from users where email=$1", [email.toLowerCase()]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const rows = await this.query("select * from users where id=$1", [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async updateUser(
    id: string,
    patch: Partial<Pick<User, "displayName" | "stateId" | "districtId" | "pin" | "area">>,
  ): Promise<PublicUser | null> {
    const rows = await this.query(
      `update users set display_name=coalesce($2,display_name), state_id=coalesce($3,state_id), district_id=coalesce($4,district_id),
         pin=coalesce($5,pin), area=coalesce($6,area), updated_at=now() where id=$1 returning *`,
      [id, patch.displayName ?? null, patch.stateId ?? null, patch.districtId ?? null, patch.pin ?? null, patch.area ?? null],
    );
    if (!rows[0]) return null;
    const user = mapUser(rows[0]);
    const safe: PublicUser = { ...user };
    return safe;
  }

  async listOwnSubmissions(userId: string) {
    const [issues, reviews, threads, questions, pollRequests, quizScores] = await Promise.all([
      this.query("select * from issues where owner_id=$1 order by created_at desc limit 50", [userId]),
      this.query("select * from reviews where owner_id=$1 order by created_at desc limit 50", [userId]),
      this.query("select * from threads where owner_id=$1 order by created_at desc limit 50", [userId]),
      this.query("select * from questions where owner_id=$1 order by created_at desc limit 50", [userId]),
      this.query("select * from poll_requests where owner_id=$1 order by created_at desc limit 50", [userId]),
      this.query("select * from quiz_scores where user_id=$1 order by updated_at desc limit 50", [userId]),
    ]);
    return {
      issues: issues.map(mapIssue),
      reviews: reviews.map(mapReview),
      threads: threads.map(mapThread),
      questions: questions.map(mapQuestion),
      pollRequests: pollRequests.map(mapPollRequest),
      quizScores: quizScores.map(mapQuizScore),
    };
  }

  async upsertQuizScore(userId: string, quizSlug: string, score: number, total: number): Promise<QuizScore> {
    const rows = await this.query(
      `insert into quiz_scores (id,user_id,quiz_slug,score,total,created_at,updated_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,now(),now())
       on conflict (user_id,quiz_slug) do update set
         score=greatest(quiz_scores.score, excluded.score),
         total=case when excluded.score > quiz_scores.score then excluded.total else quiz_scores.total end,
         updated_at=case when excluded.score > quiz_scores.score then now() else quiz_scores.updated_at end
       returning *`,
      [userId, quizSlug, score, total],
    );
    return mapQuizScore(rows[0]!);
  }

  async listLeaderboard(quizSlug?: string, limit = 25): Promise<LeaderboardEntry[]> {
    const params: unknown[] = [];
    let sql =
      "select q.*, u.display_name from quiz_scores q join users u on u.id=q.user_id";
    if (quizSlug) {
      params.push(quizSlug);
      sql += ` where q.quiz_slug=$1`;
    }
    sql += " order by q.updated_at desc limit 1000";
    const rows = await this.query(sql, params);
    const best = new Map<string, Row>();
    for (const row of rows) {
      const key = quizSlug ? text(row.user_id) : `${text(row.user_id)}:${text(row.quiz_slug)}`;
      const current = best.get(key);
      if (!current) {
        best.set(key, row);
        continue;
      }
      const ratio = Number(row.score) / Number(row.total);
      const currentRatio = Number(current.score) / Number(current.total);
      if (ratio > currentRatio || (ratio === currentRatio && Number(row.score) > Number(current.score))) {
        best.set(key, row);
      }
    }
    return [...best.values()]
      .sort(
        (a, b) =>
          Number(b.score) / Number(b.total) - Number(a.score) / Number(a.total) ||
          Number(b.score) - Number(a.score),
      )
      .slice(0, limit)
      .map((row, index) => ({
        rank: index + 1,
        displayName: text(row.display_name) || "Citizen",
        quizSlug: text(row.quiz_slug),
        score: Number(row.score),
        total: Number(row.total),
        updatedAt: iso(row.updated_at),
      }));
  }

  async listQuizScores(userId: string): Promise<QuizScore[]> {
    const rows = await this.query("select * from quiz_scores where user_id=$1 order by updated_at desc", [userId]);
    return rows.map(mapQuizScore);
  }

  async getStats(): Promise<SiteStats> {
    const rows = await this.query(
      `select
        (select count(*)::int from polls) as polls,
        (select count(*)::int from issues) as issues,
        (select count(*)::int from reviews where status='published') as reviews,
        (select count(*)::int from threads) as discussions,
        (select count(*)::int from questions) as questions`,
    );
    const row = rows[0] ?? {};
    return {
      polls: Number(row.polls ?? 0),
      issues: Number(row.issues ?? 0),
      reviews: Number(row.reviews ?? 0),
      discussions: Number(row.discussions ?? 0),
      questions: Number(row.questions ?? 0),
    };
  }
}

export async function createPostgresRepository(connectionString: string): Promise<Repository> {
  const pool = new Pool(
    postgresPoolOptions(connectionString, {
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    }),
  );
  const repo = new PostgresRepository(pool);
  await repo.initialize();
  return repo;
}
