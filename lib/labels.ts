import type { Locale } from "@/lib/types";
import type { IssueStatus, RepresentativeRole } from "@/lib/types";

export const issueCategoryLabels: Record<string, { hi: string; en: string }> = {
  roads: { hi: "सड़क", en: "Roads" },
  water: { hi: "पानी", en: "Water" },
  drainage: { hi: "नाली / जलभराव", en: "Drainage" },
  electricity: { hi: "बिजली", en: "Electricity" },
  sanitation: { hi: "सफ़ाई / कचरा", en: "Sanitation" },
  transport: { hi: "सार्वजनिक परिवहन", en: "Public transport" },
  streetlights: { hi: "स्ट्रीटलाइट", en: "Streetlights" },
  other: { hi: "अन्य", en: "Other" },
};

export const reviewServiceLabels: Record<string, { hi: string; en: string }> = {
  sanitation: { hi: "सफ़ाई", en: "Sanitation" },
  water: { hi: "पेयजल", en: "Water supply" },
  electricity: { hi: "बिजली", en: "Electricity" },
  roads: { hi: "सड़कें", en: "Roads" },
  transport: { hi: "परिवहन", en: "Transport" },
  health: { hi: "स्वास्थ्य", en: "Health" },
  education: { hi: "शिक्षा", en: "Education" },
  municipal: { hi: "नगरपालिका", en: "Municipal services" },
  other: { hi: "अन्य", en: "Other" },
};

export const discussionCategoryLabels: Record<string, { hi: string; en: string }> = {
  civic: { hi: "नागरिक मुद्दे", en: "Civic issues" },
  sanitation: { hi: "सफ़ाई", en: "Sanitation" },
  water: { hi: "पानी", en: "Water" },
  roads: { hi: "सड़क", en: "Roads" },
  electricity: { hi: "बिजली", en: "Electricity" },
  streetlights: { hi: "स्ट्रीटलाइट", en: "Streetlights" },
  transport: { hi: "परिवहन", en: "Transport" },
  voting: { hi: "मतदान", en: "Voting" },
  schemes: { hi: "योजनाएँ", en: "Schemes" },
  other: { hi: "अन्य", en: "Other" },
};

export const issueStatusLabels: Record<IssueStatus, { hi: string; en: string; tone: "neutral" | "gold" | "teal" | "navy" | "success" }> = {
  submitted: { hi: "दर्ज", en: "Submitted", tone: "neutral" },
  under_review: { hi: "समीक्षा में", en: "Under review", tone: "gold" },
  verified: { hi: "सत्यापित", en: "Verified", tone: "teal" },
  forwarded: { hi: "अधिकारी तक भेजा", en: "Forwarded", tone: "navy" },
  resolved: { hi: "हल", en: "Resolved", tone: "success" },
};

export function categoryLabel(
  map: Record<string, { hi: string; en: string }>,
  id: string,
  locale: Locale,
): string {
  const found = map[id];
  return found ? (locale === "hi" ? found.hi : found.en) : id;
}

export function relativeTime(iso: string | null, locale: Locale): string {
  if (!iso) return locale === "hi" ? "समय उपलब्ध नहीं" : "Time unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return locale === "hi" ? "समय उपलब्ध नहीं" : "Time unavailable";
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const formatter = new Intl.RelativeTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { numeric: "auto" });
  const abs = Math.abs(minutes);
  if (abs < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return formatter.format(days, "day");
  return date.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const roleLabels: Record<RepresentativeRole, { hi: string; en: string }> = {
  mp: { hi: "सांसद", en: "MP" },
  mla: { hi: "विधायक", en: "MLA" },
  mlc: { hi: "विधान परिषद सदस्य", en: "MLC" },
  mayor: { hi: "महापौर", en: "Mayor" },
  chairperson: { hi: "नगर अध्यक्ष", en: "Chairperson" },
  councillor: { hi: "पार्षद", en: "Councillor" },
  gram_pradhan: { hi: "ग्राम प्रधान", en: "Gram Pradhan" },
  district_magistrate: { hi: "जिलाधिकारी", en: "District Magistrate" },
};
