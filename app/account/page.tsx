import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "मेरा खाता",
  description: "लॉगिन, प्रोफ़ाइल और अपनी प्रविष्टियाँ।",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return (
    <>
      <PageHeader eyebrow="खाता" title="मेरा खाता" />
      <AccountPanel />
    </>
  );
}
