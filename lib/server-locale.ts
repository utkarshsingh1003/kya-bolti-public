import { cookies } from "next/headers";
import type { Locale } from "./types";

/** Locale chosen on the client, readable from server components. */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("kbp_locale")?.value === "en" ? "en" : "hi";
}

export function textFor(locale: Locale) {
  return (hi: string, en: string) => (locale === "hi" ? hi : en);
}
