import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AccountPanel } from "@/components/account-panel";
import { getServerLocale, textFor } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "मेरा खाता",
  description: "लॉगिन, प्रोफ़ाइल और अपनी प्रविष्टियाँ।",
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const locale = await getServerLocale();
  const text = textFor(locale);
  return (
    <>
      <PageHeader eyebrow={text("खाता", "Account")} title={text("मेरा खाता", "My account")} />
      <AccountPanel />
    </>
  );
}
