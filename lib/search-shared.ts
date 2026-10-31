/** Client-safe search types and suggestions (no server/store imports). */

export type SearchResultType =
  | "news"
  | "page"
  | "representative"
  | "poll"
  | "quiz"
  | "issue"
  | "question";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  href: string;
  meta?: string;
  external?: boolean;
};

export const searchSuggestions = [
  { hi: "पानी की शिकायत", en: "water complaint", href: "/issues/new?category=water" },
  { hi: "मेरे विधायक", en: "my MLA", href: "/representatives" },
  { hi: "संविधान", en: "constitution", href: "/games/constitution" },
  { hi: "सरकारी योजनाएँ", en: "government schemes", href: "/games/schemes" },
  { hi: "स्ट्रीटलाइट", en: "streetlight", href: "/issues/new?category=streetlights" },
];
