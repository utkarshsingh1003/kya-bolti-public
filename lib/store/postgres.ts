import { Pool, type PoolClient } from "pg";
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
import type { ContactInput, QuestionInput, ThreadInput } from "@/lib/validation";
import type {
  IssueFilter,
  ListFilter,
  NewIssue,
  NewReview,
  Repository,
  VoteOutcome,
} from "./index";
import { trackingCode } from "./index";

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
    const polls = await this.query("select * from polls order by created_at desc");
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

  async createIssue(input: NewIssue): Promise<CivicIssue> {
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
      `insert into issues (id,tracking_code,category,title,description,area,district_id,state_id,pin,status,is_demo,created_at,updated_at,official_complaint_url,events)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,'submitted',false,$9,$9,$10,$11) returning *`,
      [code, input.category, input.title, input.description, input.area, input.districtId, input.stateId, input.pin ?? null, now, input.officialComplaintUrl || null, JSON.stringify(events)],
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

  async createReview(input: NewReview): Promise<Review> {
    const rows = await this.query(
      `insert into reviews (id,service_category,rating,title,body,area,district_id,state_id,display_name,status,is_demo,created_at)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,'published',false,now()) returning *`,
      [input.serviceCategory, input.rating, input.title, input.body, input.area, input.districtId, input.stateId, input.displayName || null],
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

  async createThread(input: ThreadInput): Promise<Thread> {
    const rows = await this.query(
      `insert into threads (id,title,body,category,district_id,state_id,author_alias,is_demo,created_at,reply_count,status)
       values (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,false,now(),0,'published') returning *`,
      [input.title, input.body, input.category, input.districtId, input.stateId, input.authorAlias],
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

  async createQuestion(input: QuestionInput): Promise<Question> {
    const rows = await this.query(
      `insert into questions (id,question,answer,answer_status,sources,district_id,state_id,is_demo,created_at)
       values (gen_random_uuid()::text,$1,null,'pending','[]'::jsonb,$2,$3,false,now()) returning *`,
      [input.question, input.districtId || null, input.stateId || null],
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
  const pool = new Pool({
    connectionString,
    max: 3,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  const repo = new PostgresRepository(pool);
  await repo.initialize();
  return repo;
}
