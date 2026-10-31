import { describe, expect, it } from "vitest";
import {
  answerSchema,
  contactInputSchema,
  issueInputSchema,
  looksLikeAbuse,
  looksLikeSpam,
  questionInputSchema,
  reportInputSchema,
  trackQuerySchema,
  voteInputSchema,
} from "@/lib/validation";

const validIssue = {
  category: "roads" as const,
  title: "बाज़ार रोड पर गहरे गड्ढे",
  description: "बाज़ार रोड पर तीन गहरे गड्ढे हैं जिनसे दोपहिया वाहनों को खतरा है।",
  area: "बाज़ार रोड, वार्ड 12",
  districtId: "up-lucknow",
  stateId: "up" as const,
  pin: "226001",
};

describe("issueInputSchema", () => {
  it("accepts a complete, valid issue and trims text", () => {
    const parsed = issueInputSchema.parse({ ...validIssue, title: `  ${validIssue.title}  ` });
    expect(parsed.title).toBe(validIssue.title);
    expect(parsed.pin).toBe("226001");
  });

  it("rejects short titles and descriptions", () => {
    expect(issueInputSchema.safeParse({ ...validIssue, title: "short" }).success).toBe(false);
    expect(issueInputSchema.safeParse({ ...validIssue, description: "too short" }).success).toBe(false);
  });

  it("rejects an invalid district id and PIN code", () => {
    expect(issueInputSchema.safeParse({ ...validIssue, districtId: "Lucknow" }).success).toBe(false);
    expect(issueInputSchema.safeParse({ ...validIssue, pin: "012345" }).success).toBe(false);
  });

  it("treats an empty PIN as absent", () => {
    const parsed = issueInputSchema.parse({ ...validIssue, pin: "" });
    expect(parsed.pin).toBeUndefined();
  });

  it("rejects an official complaint URL that is not http(s)", () => {
    expect(
      issueInputSchema.safeParse({ ...validIssue, officialComplaintUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      issueInputSchema.safeParse({ ...validIssue, officialComplaintUrl: "https://jansunwai.up.nic.in/" }).success,
    ).toBe(true);
  });

  it("rejects control characters", () => {
    expect(issueInputSchema.safeParse({ ...validIssue, title: "गड्ढे\u0001 बाज़ार रोड" }).success).toBe(false);
  });
});

describe("contactInputSchema", () => {
  const base = {
    name: "",
    email: "",
    subject: "स्रोत में सुधार",
    message: "कृपया इस पेज पर दिए गए स्रोत लिंक की जाँच करें और सुधार करें।",
    consent: true,
  };

  it("accepts an optional name and email", () => {
    expect(contactInputSchema.safeParse(base).success).toBe(true);
  });

  it("requires explicit consent", () => {
    expect(contactInputSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });

  it("rejects malformed email addresses", () => {
    expect(contactInputSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a too-short subject", () => {
    expect(contactInputSchema.safeParse({ ...base, subject: "hi" }).success).toBe(false);
  });
});

describe("answerSchema", () => {
  it("requires at least one source", () => {
    const result = answerSchema.safeParse({ id: "q1", answer: "यह एक सत्यापित आधिकारिक जवाब है।" });
    expect(result.success).toBe(false);
  });

  it("accepts a source with a valid URL", () => {
    const result = answerSchema.safeParse({
      id: "q1",
      answer: "यह एक सत्यापित आधिकारिक जवाब है।",
      sources: [{ label: "ECI", url: "https://www.eci.gov.in/" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL source", () => {
    const result = answerSchema.safeParse({
      id: "q1",
      answer: "यह एक सत्यापित आधिकारिक जवाब है।",
      sources: [{ label: "ECI", url: "eci.gov.in" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("small input schemas", () => {
  it("normalises tracking codes to uppercase", () => {
    expect(trackQuerySchema.parse({ code: " kbp-abc123 " }).code).toBe("KBP-ABC123");
    expect(trackQuerySchema.safeParse({ code: "KBP-12" }).success).toBe(false);
  });

  it("rejects unknown report targets and reasons", () => {
    expect(reportInputSchema.safeParse({ targetType: "news", targetId: "x", reason: "spam" }).success).toBe(false);
    expect(reportInputSchema.safeParse({ targetType: "thread", targetId: "x", reason: "spam" }).success).toBe(true);
    expect(reportInputSchema.safeParse({ targetType: "thread", targetId: "x", reason: "dislike" }).success).toBe(false);
  });

  it("validates poll votes", () => {
    expect(voteInputSchema.safeParse({ pollId: "poll-local-priority", optionId: "water" }).success).toBe(true);
    expect(voteInputSchema.safeParse({ pollId: "", optionId: "water" }).success).toBe(false);
  });

  it("allows a question without a district", () => {
    expect(questionInputSchema.safeParse({ question: "पानी की शिकायत कहाँ दर्ज करें?" }).success).toBe(true);
  });
});

describe("abuse and spam heuristics", () => {
  it("flags direct threats in English and Hindi", () => {
    expect(looksLikeAbuse("I will kill you")).toBe(true);
    expect(looksLikeAbuse("जान से मार देंगे")).toBe(true);
    expect(looksLikeAbuse("सड़क पर गड्ढा है, कृपया मरम्मत कराएँ")).toBe(false);
  });

  it("flags link floods and long character runs", () => {
    expect(looksLikeSpam("https://a.example https://b.example https://c.example")).toBe(true);
    expect(looksLikeSpam("https://a.example https://b.example")).toBe(false);
    expect(looksLikeSpam(`ok ${"x".repeat(16)}`)).toBe(true);
    expect(looksLikeSpam("सामान्य सा संदेश")).toBe(false);
  });
});
