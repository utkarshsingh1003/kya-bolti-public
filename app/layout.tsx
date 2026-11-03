import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Locale } from "@/lib/types";
import { demoModeActive } from "@/lib/store";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kyaboltipublic.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "क्या बोलती PUBLIC — जनता की बात, सबकी आवाज़",
    template: "%s · क्या बोलती PUBLIC",
  },
  description:
    "स्थानीय खबरें, जनप्रतिनिधि, नागरिक पोल, सरकारी योजनाएँ और सामुदायिक चर्चा — उत्तर प्रदेश और बिहार के लिए हिंदी-पहले नागरिक मंच।",
  applicationName: "Kya Bolti Public",
  keywords: [
    "नागरिक जागरूकता",
    "स्थानीय खबरें",
    "जनप्रतिनिधि",
    "उत्तर प्रदेश",
    "बिहार",
    "civic engagement India",
  ],
  authors: [{ name: "Kya Bolti Public" }],
  creator: "Kya Bolti Public",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    url: siteUrl,
    siteName: "क्या बोलती PUBLIC",
    title: "क्या बोलती PUBLIC — जनता की बात, सबकी आवाज़",
    description:
      "स्थानीय खबरें, जनप्रतिनिधि, नागरिक पोल और सरकारी योजनाओं की सरल जानकारी — एक स्वतंत्र नागरिक मंच।",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "क्या बोलती PUBLIC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "क्या बोलती PUBLIC",
    description: "जनता की बात, सबकी आवाज़ — हिंदी-पहले नागरिक मंच।",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1F3A",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get("kbp_locale")?.value === "en" ? "en" : "hi";
  const demo = demoModeActive();
  const dataMode = process.env.DATABASE_URL
    ? "PostgreSQL"
    : process.env.KBP_FILE_STORE
      ? "Temporary file (not persistent)"
      : process.env.VERCEL
        ? "Demo · read-only, not persistent"
        : "Local file";

  return (
    <html lang={locale} dir="ltr">
      <head>
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="/fonts/noto-devanagari.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-dvh antialiased">
        {demo ? (
          <div role="status" className="bg-amber-100 px-4 py-2 text-center text-[0.78rem] leading-relaxed text-amber-950">
            डेमो मोड: पढ़ना उपलब्ध है। खाते, वोटिंग, सबमिशन और एडमिन डेटाबेस चालू होने तक उपलब्ध नहीं हैं। / Demo mode: browsing is
            available. Accounts, voting, submissions and admin are unavailable until the database is enabled.
          </div>
        ) : null}
        <Providers initialLocale={locale}>
          <SiteHeader />
          <main id="main-content" className="min-h-[60vh] pb-24 lg:pb-0">
            {children}
          </main>
          <SiteFooter dataMode={dataMode} />
        </Providers>
        <noscript>
          <div className="fixed inset-x-0 bottom-0 z-[90] bg-amber-100 px-4 py-3 text-center text-sm text-amber-950">
            कृपया बेहतर अनुभव के लिए JavaScript चालू करें। / Please enable JavaScript for interactive features.
          </div>
        </noscript>
      </body>
    </html>
  );
}
