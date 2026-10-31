"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { useAssistant } from "@/components/assistant-context";
import {
  IconChat,
  IconClose,
  IconGame,
  IconMenu,
  IconNews,
  IconPin,
  IconPoll,
  IconQa,
  IconSearch,
  IconSpark,
  IconTools,
  IconUsers,
} from "@/components/icons";
import { cn } from "@/components/ui";

const mainLinks = [
  { href: "/news", key: "news", icon: IconNews },
  { href: "/representatives", key: "representatives", icon: IconUsers },
  { href: "/issues", key: "issues", icon: IconTools },
  { href: "/polls", key: "polls", icon: IconPoll },
  { href: "/games", key: "games", icon: IconGame },
  { href: "/discussions", key: "community", icon: IconChat },
] as const;

const drawerLinks = [
  ...mainLinks,
  { href: "/qa", key: "qa", icon: IconQa },
  { href: "/reviews", key: "reviews", icon: IconPoll },
  { href: "/search", key: "search", icon: IconSearch },
] as const;

export function SiteHeader() {
  const { locale, setLocale, t } = useLocale();
  const { label, openLocation } = useLocation();
  const { openAssistant } = useAssistant();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
      >
        {locale === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}
      </a>

      <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/95 backdrop-blur-md">
        <div className="hidden bg-navy-900 text-navy-100 md:block">
          <div className="container-page flex h-8 items-center justify-between gap-4 text-[0.68rem] font-medium tracking-wide">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              {locale === "hi" ? "स्वतंत्र नागरिक मंच · किसी दल या सरकार से संबद्ध नहीं" : "Independent civic platform · No party or government affiliation"}
            </p>
            <p className="hidden items-center gap-4 lg:flex">
              <span>{locale === "hi" ? "स्रोत-आधारित जानकारी" : "Source-based information"}</span>
              <span className="text-navy-400">|</span>
              <Link href="/sources" className="hover:text-white">
                {t.footer.sources}
              </Link>
            </p>
          </div>
        </div>

        <div className="container-page flex h-[68px] items-center gap-3">
          <div className="shrink-0">
            <Logo compact />
          </div>

          <nav aria-label={locale === "hi" ? "मुख्य मेन्यू" : "Main menu"} className="ml-2 hidden items-center gap-0.5 lg:flex">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-2.5 py-2 text-[0.82rem] font-semibold transition-colors xl:px-3",
                  isActive(link.href) ? "text-brand-700" : "text-navy-700 hover:bg-navy-50 hover:text-navy-900",
                )}
              >
                {t.nav[link.key]}
                {isActive(link.href) ? (
                  <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-brand-500" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={openLocation}
              className="hidden min-h-10 items-center gap-1.5 rounded-full border border-navy-200 bg-white px-3 text-xs font-semibold text-navy-700 transition hover:border-brand-300 hover:bg-brand-50 md:flex"
            >
              <IconPin className="h-4 w-4 text-brand-600" />
              <span className="max-w-[11rem] truncate">{label}</span>
              <span className="text-[0.6rem] font-bold uppercase tracking-wider text-navy-400">{t.common.change}</span>
            </button>

            <Link
              href="/search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-navy-100"
              aria-label={t.search.title}
            >
              <IconSearch className="h-4.5 w-4.5" />
            </Link>

            <div
              className="flex items-center rounded-full border border-navy-200 bg-white p-0.5"
              role="group"
              aria-label={t.common.language}
            >
              {(["hi", "en"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLocale(item)}
                  aria-pressed={locale === item}
                  className={cn(
                    "min-h-8 rounded-full px-2.5 text-[0.68rem] font-bold uppercase tracking-wide transition",
                    locale === item ? "bg-navy-900 text-white" : "text-navy-500 hover:text-navy-900",
                  )}
                >
                  {item === "hi" ? "हिं" : "EN"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openAssistant()}
              className="hidden min-h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-xs font-bold text-white transition hover:bg-brand-700 lg:flex"
            >
              <IconSpark className="h-4 w-4" />
              {t.assistant.title}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100 lg:hidden"
              aria-label={t.nav.menu}
              aria-expanded={menuOpen}
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label={t.nav.close}
            tabIndex={-1}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col overflow-y-auto bg-white p-5 shadow-float"
          >
            <div className="mb-4 flex items-center justify-between">
              <Logo compact />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-navy-100"
                aria-label={t.nav.close}
                autoFocus
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openLocation();
              }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-navy-200 bg-cream px-3 py-3 text-left"
            >
              <IconPin className="h-5 w-5 shrink-0 text-brand-600" />
              <span className="min-w-0">
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-navy-500">
                  {t.location.label}
                </span>
                <span className="block truncate text-sm font-semibold text-navy-900">{label}</span>
              </span>
              <span className="ml-auto text-[0.65rem] font-bold uppercase text-brand-700">{t.common.change}</span>
            </button>

            <nav className="flex flex-col gap-1" aria-label={t.nav.menu}>
              {drawerLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
                      isActive(link.href) ? "bg-brand-50 text-brand-800" : "text-navy-800 hover:bg-navy-50",
                    )}
                  >
                    <Icon className="h-5 w-5 text-navy-400" />
                    {t.nav[link.key]}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openAssistant();
              }}
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white"
            >
              <IconSpark className="h-4 w-4" />
              {t.assistant.title}
            </button>

            <div className="mt-5 border-t border-navy-100 pt-4">
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-navy-500">{t.common.language}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLocale("hi")}
                  aria-pressed={locale === "hi"}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg text-sm font-semibold",
                    locale === "hi" ? "bg-navy-900 text-white" : "border border-navy-200 text-navy-700",
                  )}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  aria-pressed={locale === "en"}
                  className={cn(
                    "min-h-10 flex-1 rounded-lg text-sm font-semibold",
                    locale === "en" ? "bg-navy-900 text-white" : "border border-navy-200 text-navy-700",
                  )}
                >
                  English
                </button>
              </div>
            </div>

            <p className="mt-auto pt-6 text-[0.68rem] leading-relaxed text-navy-500">{t.footer.disclaimer}</p>
          </div>
        </div>
      ) : null}

      <nav
        aria-label={locale === "hi" ? "मोबाइल नेविगेशन" : "Mobile navigation"}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {[
            { href: "/", key: "home", icon: IconNews },
            { href: "/news", key: "news", icon: IconNews },
            { href: "/issues", key: "issues", icon: IconTools },
            { href: "/games", key: "games", icon: IconGame },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-bold",
                  isActive(item.href) ? "text-brand-700" : "text-navy-500",
                )}
              >
                <Icon className="h-5 w-5" />
                {t.nav[item.key as "home" | "news" | "issues" | "games"]}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => openAssistant()}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-bold text-navy-500"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
              <IconSpark className="h-3 w-3" />
            </span>
            {t.nav.assistant}
          </button>
        </div>
      </nav>
    </>
  );
}
