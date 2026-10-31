export type Locale = "hi" | "en";

export type LocalizedText = { hi: string; en: string };

export type District = {
  id: string;
  nameHi: string;
  nameEn: string;
};

export type State = {
  id: string;
  nameHi: string;
  nameEn: string;
  districts: District[];
  active: boolean;
};

export type LocationSelection = {
  stateId: string;
  districtId: string;
  pin?: string;
  constituency?: string;
  city?: string;
  label?: string;
};

export type NewsCategory =
  | "local"
  | "state"
  | "national"
  | "schemes"
  | "education"
  | "roads"
  | "water"
  | "health"
  | "employment"
  | "municipal"
  | "safety";

export type NewsArticle = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  category: NewsCategory;
  stateId: string | null;
  districtId: string | null;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  language: "hi" | "en";
  isDemo: boolean;
  lastVerifiedAt: string | null;
};

export type RepresentativeRole =
  | "mp"
  | "mla"
  | "mlc"
  | "mayor"
  | "chairperson"
  | "councillor"
  | "gram_pradhan"
  | "district_magistrate";

export type Representative = {
  id: string;
  name: string | null;
  role: RepresentativeRole;
  constituency: string | null;
  districtId: string | null;
  stateId: string;
  party: string | null;
  officialContact: string | null;
  officialSourceUrl: string;
  verificationStatus: "verified" | "pending" | "demo";
  lastVerifiedAt: string | null;
  note?: LocalizedText;
};

export type Poll = {
  id: string;
  question: LocalizedText;
  description: LocalizedText;
  category: string;
  closesAt: string;
  isDemo: boolean;
  createdAt: string;
  options: { id: string; label: LocalizedText }[];
};

export type PollWithResults = {
  poll: Poll;
  counts: Record<string, number>;
  totalVotes: number;
  hasVoted: boolean;
};

export type IssueStatus = "submitted" | "under_review" | "verified" | "forwarded" | "resolved";

export type CivicIssue = {
  id: string;
  trackingCode: string;
  category: string;
  title: string;
  description: string;
  area: string;
  districtId: string;
  stateId: string;
  pin: string | null;
  status: IssueStatus;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  officialComplaintUrl: string | null;
  events: { status: IssueStatus; note: string; createdAt: string }[];
};

export type Review = {
  id: string;
  serviceCategory: string;
  rating: number;
  title: string;
  body: string;
  area: string;
  districtId: string;
  stateId: string;
  displayName: string | null;
  status: "published" | "hidden";
  isDemo: boolean;
  createdAt: string;
};

export type Thread = {
  id: string;
  title: string;
  body: string;
  category: string;
  districtId: string;
  stateId: string;
  authorAlias: string;
  isDemo: boolean;
  createdAt: string;
  replyCount: number;
  status: "published" | "hidden";
};

export type Reply = {
  id: string;
  threadId: string;
  body: string;
  authorAlias: string;
  isDemo: boolean;
  createdAt: string;
  status: "published" | "hidden";
};

export type Question = {
  id: string;
  question: string;
  answer: string | null;
  answerStatus: "official_source" | "community" | "pending";
  sources: { label: string; url: string }[];
  districtId: string | null;
  stateId: string | null;
  isDemo: boolean;
  createdAt: string;
};

export type Report = {
  id: string;
  targetType: "thread" | "reply" | "review" | "issue";
  targetId: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved";
  createdAt: string;
};

export type ContactMessage = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type NewsSource = {
  id: string;
  name: string;
  feedUrl: string;
  language: "hi" | "en";
  scope: "national" | "state" | "district";
  enabled: boolean;
  attribution: string;
  termsNote: string;
  lastFetchedAt: string | null;
};

export type SiteStats = {
  polls: number;
  issues: number;
  reviews: number;
  discussions: number;
  questions: number;
};

export type QuizQuestion = {
  id: string;
  prompt: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
  sources?: { label: string; url: string }[];
};

export type Quiz = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  color: string;
  questions: QuizQuestion[];
};
