import { z } from "zod";

export const issueCategories = [
  "roads",
  "water",
  "drainage",
  "electricity",
  "sanitation",
  "transport",
  "streetlights",
  "other",
] as const;

export const reviewServices = [
  "sanitation",
  "water",
  "electricity",
  "roads",
  "transport",
  "health",
  "education",
  "municipal",
  "other",
] as const;

export const discussionCategories = [
  "civic",
  "sanitation",
  "water",
  "roads",
  "electricity",
  "streetlights",
  "transport",
  "voting",
  "schemes",
  "other",
] as const;

export const reportReasons = [
  "abuse",
  "threat",
  "hate",
  "spam",
  "misinformation",
  "privacy",
  "impersonation",
  "other",
] as const;

export const issueStatuses = ["submitted", "under_review", "verified", "forwarded", "resolved"] as const;

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: `Minimum ${min} characters` })
    .max(max, { message: `Maximum ${max} characters` })
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), {
      message: "Invalid control characters",
    });

const districtId = z
  .string()
  .trim()
  .regex(/^[a-z]+-[a-z-]+$/, { message: "Invalid district" })
  .max(60);

const pin = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, { message: "PIN code must be 6 digits" })
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

/** Only absolute http(s) links are accepted; `javascript:` and `data:` are rejected. */
const httpUrl = z
  .string()
  .trim()
  .url()
  .max(300)
  .refine((value) => /^https?:\/\//i.test(value), { message: "Only http(s) links are allowed" });

export const issueInputSchema = z.object({
  category: z.enum(issueCategories),
  title: cleanText(8, 140),
  description: cleanText(20, 2000),
  area: cleanText(3, 80),
  districtId,
  stateId: z.enum(["up", "bihar"]),
  pin,
  officialComplaintUrl: httpUrl.optional().or(z.literal("")),
});

export const reviewInputSchema = z.object({
  serviceCategory: z.enum(reviewServices),
  rating: z.coerce.number().int().min(1).max(5),
  title: cleanText(5, 100),
  body: cleanText(20, 1500),
  area: cleanText(3, 80),
  districtId,
  stateId: z.enum(["up", "bihar"]),
  displayName: z.string().trim().max(40).optional().or(z.literal("")),
});

export const threadInputSchema = z.object({
  title: cleanText(8, 120),
  body: cleanText(20, 2000),
  category: z.enum(discussionCategories),
  districtId,
  stateId: z.enum(["up", "bihar"]),
  authorAlias: cleanText(2, 30),
});

export const replyInputSchema = z.object({
  threadId: z.string().min(1).max(64),
  body: cleanText(2, 1000),
  authorAlias: cleanText(2, 30),
});

export const questionInputSchema = z.object({
  question: cleanText(10, 400),
  districtId: districtId.optional().or(z.literal("")),
  stateId: z.enum(["up", "bihar"]).optional(),
});

export const voteInputSchema = z.object({
  pollId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64),
});

export const reportInputSchema = z.object({
  targetType: z.enum(["thread", "reply", "review", "issue"]),
  targetId: z.string().min(1).max(64),
  reason: z.enum(reportReasons),
  details: z.string().trim().max(500).optional().or(z.literal("")),
});

export const trackQuerySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^KBP-[A-Z0-9]{6,10}$/, { message: "Invalid tracking code" }),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const contactInputSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(200).optional().or(z.literal("")),
  subject: cleanText(4, 120),
  message: cleanText(20, 2000),
  consent: z.boolean().refine((value) => value, {
    message: "Please confirm this message contains no private data.",
  }),
});

export const issueUpdateSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(issueStatuses),
  note: cleanText(3, 300),
  officialComplaintUrl: httpUrl.optional().or(z.literal("")),
});

export const moderationSchema = z.object({
  action: z.enum(["hide", "restore", "resolve"]),
  targetType: z.enum(["thread", "reply", "review", "issue", "report", "contact"]),
  targetId: z.string().min(1).max(64),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const answerSchema = z.object({
  id: z.string().min(1).max(64),
  answer: cleanText(20, 2000),
  sources: z
    .array(z.object({ label: cleanText(2, 80), url: httpUrl }))
    .min(1, { message: "At least one official source is required." })
    .max(5)
    .default([]),
});

const representativeInputSchema = z.object({
  id: z.string().min(1).max(64),
  name: cleanText(2, 120),
  role: z.enum([
    "mp",
    "mla",
    "mlc",
    "mayor",
    "chairperson",
    "councillor",
    "gram_pradhan",
    "district_magistrate",
  ]),
  constituency: cleanText(2, 120),
  districtId: districtId.nullable(),
  stateId: z.enum(["up", "bihar"]),
  party: z.string().trim().max(80).nullable().optional(),
  officialContact: z.string().trim().max(200).nullable().optional(),
  officialSourceUrl: httpUrl,
  lastVerifiedAt: z.string().datetime(),
});

export const representativeImportSchema = z.object({
  representatives: z.array(representativeInputSchema).min(1).max(500),
  sourceNote: z.string().trim().max(300),
});

export const pollStatuses = ["draft", "published", "closed", "archived"] as const;
export const pollRequestStatuses = ["pending", "approved", "rejected", "published"] as const;
export const announcementCategories = ["notice", "event", "scheme", "alert"] as const;
export const announcementStatuses = ["draft", "scheduled", "published", "archived"] as const;
export const buzzCategories = ["trending", "news", "entertainment", "sports", "memes", "public_issues"] as const;
export const buzzStatuses = ["pending", "draft", "published", "archived"] as const;
export const adStatuses = ["pending", "approved", "active", "paused", "rejected", "expired"] as const;
export const adPaymentStatuses = ["unpaid", "verified"] as const;

const localizedText = (min: number, max: number) =>
  z.object({ hi: cleanText(min, max), en: cleanText(min, max) });

const isoDate = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Enter a valid date." });

const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid date.",
  });

export const pollRequestInputSchema = z.object({
  questionHi: cleanText(10, 200),
  questionEn: cleanText(10, 200),
  optionsHi: z.array(cleanText(1, 90)).min(2).max(6),
  optionsEn: z.array(cleanText(1, 90)).min(2).max(6),
  category: z.enum(["civic", "awareness", "services", "local"]),
  purpose: cleanText(20, 600),
  contact: z.string().trim().email({ message: "Enter a valid email address" }).max(200).optional().or(z.literal("")),
  stateId: z.enum(["up", "bihar"]),
  districtId,
  consent: z.boolean().refine((value) => value, {
    message: "Please confirm this request contains no private information.",
  }),
}).refine((value) => value.optionsHi.length === value.optionsEn.length, {
  message: "Hindi and English options must have the same number of entries.",
  path: ["optionsEn"],
});

export const pollCreateSchema = z.object({
  question: localizedText(10, 200),
  description: localizedText(10, 600),
  category: z.enum(["civic", "awareness", "services", "local"]),
  closesAt: isoDate,
  options: z.array(localizedText(1, 90)).min(2).max(6),
  featured: z.boolean().optional(),
  sponsored: z.boolean().optional(),
  sponsorLabel: localizedText(2, 80).nullable().optional(),
});

export const pollManageSchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(["publish", "close", "archive", "feature", "unfeature"]),
});

export const pollRequestModerateSchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(["approve", "reject", "publish"]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  /** When publishing, optionally create the public poll from the request. */
  closesAt: isoDate.optional(),
});

export const announcementInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  title: localizedText(4, 160),
  body: localizedText(20, 4000),
  category: z.enum(announcementCategories),
  stateId: z.enum(["up", "bihar"]).nullable().optional(),
  districtId: districtId.nullable().optional(),
  sourceLabel: z.string().trim().max(120).optional().or(z.literal("")),
  sourceUrl: httpUrl.optional().or(z.literal("")),
  imageUrl: httpUrl.optional().or(z.literal("")),
  status: z.enum(announcementStatuses),
  publishAt: optionalIsoDate,
});

export const announcementManageSchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(["publish", "unpublish", "archive", "delete"]),
});

export const buzzInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  title: localizedText(4, 160),
  summary: localizedText(10, 600),
  body: localizedText(0, 4000),
  category: z.enum(buzzCategories),
  platform: cleanText(2, 60),
  sourceUrl: httpUrl.optional().or(z.literal("")),
  imageUrl: httpUrl.optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export const buzzLinkSchema = z.object({
  title: cleanText(6, 160),
  sourceUrl: httpUrl,
  platform: cleanText(2, 60),
  category: z.enum(buzzCategories),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const buzzManageSchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(["publish", "unpublish", "delete"]),
});

export const adInquirySchema = z.object({
  advertiserName: cleanText(2, 120),
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\- ]{7,20}$/, { message: "Enter a valid phone number" }),
  objective: cleanText(20, 800),
  budgetRange: z.enum(["under_10k", "10k_50k", "50k_1l", "above_1l", "discuss"]),
  placement: z.enum(["homepage", "polls", "trending", "updates", "newsletter"]),
  destinationUrl: httpUrl,
  creativeUrl: httpUrl.optional().or(z.literal("")),
  campaignStart: optionalIsoDate,
  campaignEnd: optionalIsoDate,
  consent: z.boolean().refine((value) => value, {
    message: "Please confirm this inquiry contains no confidential information.",
  }),
});

export const adManageSchema = z.object({
  id: z.string().min(1).max(64),
  action: z.enum(["approve", "reject", "verify_payment", "activate", "pause", "resume", "expire", "delete"]),
  note: z.string().trim().max(400).optional().or(z.literal("")),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Enter a valid email address" }).max(200),
  displayName: cleanText(2, 60),
  password: z
    .string()
    .min(10, { message: "Password must be at least 10 characters." })
    .max(200)
    .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
      message: "Password must include a letter and a number.",
    }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Enter a valid email address" }).max(200),
  password: z.string().min(1).max(200),
});

export const profileSchema = z.object({
  displayName: cleanText(2, 60),
  stateId: z.enum(["up", "bihar"]).optional().or(z.literal("")),
  districtId: districtId.optional().or(z.literal("")),
  pin,
  area: z.string().trim().max(80).optional().or(z.literal("")),
});

export const quizScoreSchema = z.object({
  quizSlug: z.string().trim().min(2).max(60),
  answers: z.array(z.coerce.number().int().min(-1).max(20)).min(1).max(50),
});

export const dailyAnswerSchema = z.object({
  questionId: z.string().trim().min(1).max(80),
  optionIndex: z.coerce.number().int().min(0).max(20),
});

export type IssueInput = z.infer<typeof issueInputSchema>;
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type ThreadInput = z.infer<typeof threadInputSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;

const blockedPatterns = [
  /\b(?:kill|murder)\s+(?:you|him|her|them)\b/i,
  /\b(?:maar|jaan se)\s+(?:dalenge|daalenge|denge)\b/i,
  /मार\s*(?:डालेंगे|देंगे|डालूंगा)/,
  /जान\s*से\s*मार/,
  /\b(?:utterly|completely)\s+(?:useless|corrupt)\s+(?:community|religion|caste)\b/i,
];

export function looksLikeAbuse(text: string): boolean {
  return blockedPatterns.some((pattern) => pattern.test(text));
}

export function looksLikeSpam(text: string): boolean {
  const links = text.match(/https?:\/\//gi)?.length ?? 0;
  if (links > 2) return true;
  const repeated = /(.)\1{14,}/.test(text);
  return repeated;
}
