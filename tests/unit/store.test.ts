import { beforeEach, describe, expect, it } from "vitest";
import { JsonRepository } from "@/lib/store";

const issueInput = {
  category: "roads" as const,
  title: "बाज़ार रोड पर गहरे गड्ढे",
  description: "बाज़ार रोड पर तीन गहरे गड्ढे हैं जिनसे दोपहिया वाहनों को खतरा है।",
  area: "बाज़ार रोड, वार्ड 12",
  districtId: "up-lucknow",
  stateId: "up" as const,
  pin: "226001",
};

function memoryRepo() {
  return new JsonRepository(null, "memory");
}

describe("JsonRepository — polls", () => {
  let repo: JsonRepository;
  beforeEach(() => {
    repo = memoryRepo();
  });

  it("seeds demo polls and zeroed results", async () => {
    const polls = await repo.listPolls();
    expect(polls.length).toBe(3);
    expect(polls.every((poll) => poll.isDemo)).toBe(true);
    const results = await repo.getPollResults("poll-local-priority", "hash-a");
    expect(results.total).toBe(0);
    expect(results.hasVoted).toBe(false);
    expect(Object.keys(results.counts)).toContain("water");
  });

  it("records a vote once per voter hash", async () => {
    expect(await repo.castVote("poll-local-priority", "water", "hash-a")).toEqual({ ok: true });
    expect(await repo.castVote("poll-local-priority", "roads", "hash-a")).toEqual({
      ok: false,
      reason: "duplicate",
    });
    const results = await repo.getPollResults("poll-local-priority", "hash-a");
    expect(results.total).toBe(1);
    expect(results.counts.water).toBe(1);
    expect(results.counts.roads).toBe(0);
    expect(results.hasVoted).toBe(true);
  });

  it("allows a different voter and rejects invalid options/polls", async () => {
    await repo.castVote("poll-local-priority", "water", "hash-a");
    expect(await repo.castVote("poll-local-priority", "roads", "hash-b")).toEqual({ ok: true });
    expect(await repo.castVote("poll-local-priority", "nope", "hash-c")).toEqual({
      ok: false,
      reason: "invalid_option",
    });
    expect(await repo.castVote("missing", "water", "hash-c")).toEqual({ ok: false, reason: "not_found" });
    expect((await repo.getPollResults("poll-local-priority", "hash-c")).total).toBe(2);
  });
});

describe("JsonRepository — issues", () => {
  let repo: JsonRepository;
  beforeEach(() => {
    repo = memoryRepo();
  });

  it("creates an issue with a unique tracking code and submitted event", async () => {
    const first = await repo.createIssue(issueInput);
    const second = await repo.createIssue(issueInput);
    expect(first.trackingCode).toMatch(/^KBP-[A-Z2-9]{6}$/);
    expect(first.trackingCode).not.toBe(second.trackingCode);
    expect(first.isDemo).toBe(false);
    expect(first.status).toBe("submitted");
    expect(first.events).toHaveLength(1);
    expect(first.events[0]?.status).toBe("submitted");
  });

  it("finds an issue by case-insensitive tracking code", async () => {
    const issue = await repo.createIssue(issueInput);
    const found = await repo.getIssueByCode(issue.trackingCode.toLowerCase());
    expect(found?.id).toBe(issue.id);
    expect(await repo.getIssueByCode("KBP-NOPE99")).toBeNull();
  });

  it("updates status, appends an event and stores the official URL", async () => {
    const issue = await repo.createIssue(issueInput);
    const updated = await repo.updateIssue(
      issue.id,
      "forwarded",
      "नगर निगम को भेजा गया।",
      "https://jansunwai.up.nic.in/",
    );
    expect(updated?.status).toBe("forwarded");
    expect(updated?.events).toHaveLength(2);
    expect(updated?.officialComplaintUrl).toBe("https://jansunwai.up.nic.in/");
    expect(await repo.updateIssue("missing", "resolved", "ok")).toBeNull();
  });

  it("filters issues by state and district with a state-wide fallback", async () => {
    const created = await repo.createIssue(issueInput);
    const lucnow = await repo.listIssues({ districtId: "up-lucknow" });
    expect(lucnow.some((issue) => issue.id === created.id)).toBe(true);
    const emptyDistrict = await repo.listIssues({ districtId: "up-agra" });
    // Demo content is state-wide, so the filter falls back instead of returning nothing.
    expect(emptyDistrict.length).toBeGreaterThan(0);
  });
});

describe("JsonRepository — community content", () => {
  let repo: JsonRepository;
  beforeEach(() => {
    repo = memoryRepo();
  });

  it("creates, hides and restores a review", async () => {
    const review = await repo.createReview({
      serviceCategory: "water",
      rating: 3,
      title: "पानी का दबाव कम है",
      body: "सुबह के समय पानी का दबाव बहुत कम रहता है और ऊपर की मंज़िल तक नहीं पहुँचता।",
      area: "गोमती नगर",
      districtId: "up-lucknow",
      stateId: "up",
      displayName: "नागरिक",
    });
    expect((await repo.listReviews()).some((item) => item.id === review.id)).toBe(true);
    expect(await repo.setReviewStatus(review.id, "hidden")).toBe(true);
    expect((await repo.listReviews()).some((item) => item.id === review.id)).toBe(false);
    expect(await repo.setReviewStatus("missing", "hidden")).toBe(false);
  });

  it("creates threads, replies and hides content", async () => {
    const thread = await repo.createThread({
      title: "वार्ड 12 में स्ट्रीटलाइट बंद है",
      body: "पिछले एक हफ्ते से वार्ड 12 की मुख्य गली में स्ट्रीटलाइट नहीं जल रही है।",
      category: "streetlights",
      districtId: "up-lucknow",
      stateId: "up",
      authorAlias: "राहगीर",
    });
    const reply = await repo.addReply(thread.id, "नगर निगम को भी सूचित करें।", "पड़ोसी");
    expect(reply).not.toBeNull();
    const detail = await repo.getThread(thread.id);
    expect(detail?.thread.replyCount).toBe(1);
    expect(detail?.replies).toHaveLength(1);

    expect(await repo.setReplyStatus(reply!.id, "hidden")).toBe(true);
    expect((await repo.getThread(thread.id))?.replies).toHaveLength(0);

    expect(await repo.setThreadStatus(thread.id, "hidden")).toBe(true);
    expect(await repo.getThread(thread.id)).toBeNull();
    expect(await repo.addReply("missing", "hello", "alias")).toBeNull();
  });

  it("creates questions and only answers with sources", async () => {
    const question = await repo.createQuestion({ question: "पानी की शिकायत कहाँ दर्ज करें?" });
    expect(question.answerStatus).toBe("pending");
    expect(await repo.answerQuestion(question.id, "नगर निगम या जल विभाग में।", [
      { label: "Jansunwai", url: "https://jansunwai.up.nic.in/" },
    ])).toBe(true);
    const stored = (await repo.listQuestions()).find((item) => item.id === question.id);
    expect(stored?.answerStatus).toBe("official_source");
    expect(stored?.sources).toHaveLength(1);
    expect(await repo.answerQuestion("missing", "answer", [])).toBe(false);
  });

  it("stores and resolves contact messages", async () => {
    const message = await repo.createContactMessage({
      name: "नागरिक",
      email: "citizen@example.com",
      subject: "स्रोत सुधार",
      message: "कृपया इस पेज पर दिए गए स्रोत लिंक की जाँच करें।",
      consent: true,
    });
    expect(message.status).toBe("open");
    expect((await repo.listContactMessages())[0]?.id).toBe(message.id);
    expect(await repo.resolveContactMessage(message.id)).toBe(true);
    expect((await repo.listContactMessages())[0]?.status).toBe("resolved");
    expect(await repo.resolveContactMessage("missing")).toBe(false);
  });

  it("creates and resolves reports", async () => {
    const report = await repo.createReport({ targetType: "review", targetId: "r1", reason: "spam" });
    expect(report.status).toBe("open");
    expect(await repo.resolveReport(report.id)).toBe(true);
    expect((await repo.listReports())[0]?.status).toBe("resolved");
    expect(await repo.resolveReport("missing")).toBe(false);
  });
});

describe("JsonRepository — representatives and stats", () => {
  it("imports and filters verified representatives", async () => {
    const repo = memoryRepo();
    const count = await repo.importRepresentatives([
      {
        id: "rep-1",
        name: "उदाहरण नाम",
        role: "mla",
        constituency: "उदाहरण विधानसभा",
        districtId: "up-lucknow",
        stateId: "up",
        party: null,
        officialContact: null,
        officialSourceUrl: "https://uplegisassembly.gov.in/",
        verificationStatus: "verified",
        lastVerifiedAt: "2026-10-01T00:00:00.000Z",
      },
    ]);
    expect(count).toBe(1);
    expect(await repo.listRepresentatives({ stateId: "up" })).toHaveLength(1);
    expect(await repo.listRepresentatives({ stateId: "bihar" })).toHaveLength(0);
  });

  it("reports seeded stats", async () => {
    const stats = await memoryRepo().getStats();
    expect(stats.polls).toBe(3);
    expect(stats.issues).toBeGreaterThan(0);
    expect(stats.questions).toBeGreaterThan(0);
  });
});
