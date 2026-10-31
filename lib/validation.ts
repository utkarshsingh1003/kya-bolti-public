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
