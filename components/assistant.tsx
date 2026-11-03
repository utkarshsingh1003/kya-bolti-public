"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAssistant } from "@/components/assistant-context";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { detectIntent, replyForIntent } from "@/lib/assistant-intents";
import { pick } from "@/lib/i18n";
import type { NewsArticle } from "@/lib/types";
import { IconClose, IconExternal, IconMic, IconSpark, IconVolume, IconVolumeOff } from "@/components/icons";
import { cn } from "@/components/ui";

type AssistantLink = { label: string; href: string; external?: boolean };
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  links?: AssistantLink[];
  demo?: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

let messageCounter = 0;
const nextId = () => `msg-${Date.now()}-${messageCounter++}`;

export function Assistant() {
  const { locale, t } = useLocale();
  const { location } = useLocation();
  const { isOpen, openAssistant, closeAssistant, seed, clearSeed } = useAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [muted, setMuted] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const suggestions =
    locale === "hi"
      ? ["आज की स्थानीय खबरें बताओ", "मेरे MLA की जानकारी दो", "पानी की शिकायत कहाँ करें?", "एक quiz खिलाओ"]
      : ["Today's local news", "Who is my MLA?", "Where do I complain about water?", "Start a quiz"];

  useEffect(() => {
    setMessages((current) => {
      if (current.length <= 1) {
        return [{ id: "greeting", role: "assistant", text: t.assistant.greeting }];
      }
      return current;
    });
  }, [t.assistant.greeting]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (seed) {
      setInput(seed);
      clearSeed();
    }
  }, [seed, clearSeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) closeAssistant();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAssistant]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceNote(t.assistant.unsupportedVoice);
      return;
    }
    if (muted) {
      setMuted(false);
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function toggleMute() {
    if (!muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMuted((current) => !current);
  }

  async function buildNewsReply(): Promise<{ text: string; links: AssistantLink[]; demo?: boolean }> {
    const params = new URLSearchParams({ limit: "3", districtId: location.districtId });
    const response = await fetch(`/api/news?${params.toString()}`);
    if (!response.ok) throw new Error("news fetch failed");
    const data = (await response.json()) as { articles: NewsArticle[]; isLive: boolean };
    if (!data.articles?.length) {
      return {
        text: locale === "hi" ? "अभी कोई खबर उपलब्ध नहीं है। खबरें पेज पर सभी स्रोत देखें।" : "No stories are available right now. See all sources on the news page.",
        links: [{ label: t.nav.news, href: "/news" }],
      };
    }
    const intro = data.isLive
      ? locale === "hi"
        ? "ये ताज़ा सार्वजनिक फ़ीड से हैं। मूल स्रोत पर पूरी खबर पढ़ें:"
        : "These are from a public live feed. Read the full story at the original source:"
      : locale === "hi"
        ? "लाइव फ़ीड उपलब्ध नहीं है, इसलिए ये स्पष्ट रूप से चिह्नित डेमो खबरें हैं:"
        : "No live feed is available, so these are clearly labelled demo stories:";
    return {
      text: intro,
      demo: !data.isLive,
      links: data.articles.slice(0, 3).map((article) => ({
        label: pick(article.title, locale),
        href: article.sourceUrl ?? "/news",
        external: Boolean(article.sourceUrl),
      })),
    };
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    setVoiceNote(null);
    setMessages((current) => [...current, { id: nextId(), role: "user", text }]);
    setTyping(true);
    const intent = detectIntent(text);
    try {
      let reply: { text: string; links: AssistantLink[]; demo?: boolean };
      if (intent === "news") {
        try {
          reply = await buildNewsReply();
        } catch {
          reply = replyForIntent(intent, locale);
        }
      } else {
        reply = replyForIntent(intent, locale);
      }
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", text: reply.text, links: reply.links, demo: reply.demo },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", text: t.assistant.error },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function startListening() {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNote(t.assistant.unsupportedVoice);
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        void send(transcript);
      };
      recognition.onerror = (event) => {
        setListening(false);
        setVoiceNote(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? t.assistant.permissionDenied
            : t.assistant.unsupportedVoice,
        );
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setVoiceNote(null);
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceNote(t.assistant.unsupportedVoice);
    }
  }

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => openAssistant()}
          className="fixed bottom-6 right-6 z-40 hidden items-center gap-2.5 rounded-full bg-navy-900 py-3 pl-4 pr-5 text-white shadow-float transition hover:-translate-y-0.5 hover:bg-navy-800 sm:flex"
          aria-label={t.assistant.title}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
            <IconSpark className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400" />
          </span>
          <span className="text-sm font-bold">{t.assistant.title}</span>
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-navy-950/40 p-0 backdrop-blur-[2px] sm:items-auto sm:justify-end sm:bg-transparent sm:p-6 sm:backdrop-blur-0">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
            className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-navy-100 bg-white shadow-float sm:h-[min(38rem,88vh)] sm:w-[26.5rem] sm:rounded-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500">
                  <IconSpark className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 id="assistant-title" className="hindi text-sm font-bold">
                    {t.assistant.title}
                  </h2>
                  <p className="text-[0.68rem] text-navy-200">{t.assistant.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-navy-100 hover:bg-white/10"
                  aria-label={muted ? t.assistant.unmute : t.assistant.mute}
                  aria-pressed={!muted}
                >
                  {muted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolume className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={closeAssistant}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-navy-100 hover:bg-white/10"
                  aria-label={t.nav.close}
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-cream px-3.5 py-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-br-md bg-navy-900 text-white"
                        : "rounded-bl-md border border-navy-100 bg-white text-navy-800 shadow-sm",
                    )}
                  >
                    <p className="hindi whitespace-pre-wrap">{message.text}</p>
                    {message.demo ? (
                      <p className="mt-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">
                        {t.common.demo} · {t.news.demoNotice.split(".")[0]}
                      </p>
                    ) : null}
                    {message.links?.length ? (
                      <div className="mt-2 flex flex-col gap-1 border-t border-navy-100 pt-2">
                        {message.links.map((link) =>
                          link.external ? (
                            <a
                              key={link.href + link.label}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="group flex items-start gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                            >
                              <IconExternal className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{link.label}</span>
                            </a>
                          ) : (
                            <Link
                              key={link.href + link.label}
                              href={link.href}
                              onClick={closeAssistant}
                              className="text-xs font-semibold text-brand-700 hover:underline"
                            >
                              {link.label} →
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}
                    {message.role === "assistant" ? (
                      <button
                        type="button"
                        onClick={() => speak(message.text)}
                        className="mt-2 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-navy-500 hover:text-navy-800"
                      >
                        <IconVolume className="h-3 w-3" /> {t.assistant.speak}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {typing ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-navy-100 bg-white px-3 py-2 text-xs text-navy-500">
                    <span className="animate-soft-pulse">Public Saathi सोच रहा है…</span>
                  </div>
                </div>
              ) : null}

              {messages.length <= 1 ? (
                <div className="pt-2">
                  <p className="mb-2 px-1 text-[0.68rem] font-bold uppercase tracking-wider text-navy-500">
                    {t.assistant.suggestions}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void send(suggestion)}
                        className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-left text-[0.72rem] font-medium text-navy-700 hover:border-brand-300 hover:bg-brand-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-navy-100 bg-white px-3 pb-3 pt-2.5">
              {voiceNote ? (
                <p role="status" className="mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.7rem] text-amber-900">
                  {voiceNote}
                </p>
              ) : null}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={startListening}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition",
                    listening
                      ? "animate-soft-pulse border-brand-500 bg-brand-500 text-white"
                      : "border-navy-200 text-navy-600 hover:border-navy-300 hover:bg-navy-50",
                  )}
                  aria-label={listening ? t.assistant.listening : t.assistant.listen}
                  aria-pressed={listening}
                >
                  <IconMic className="h-4.5 w-4.5" />
                </button>
                <label htmlFor="assistant-input" className="sr-only">
                  {t.assistant.placeholder}
                </label>
                <input
                  id="assistant-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={400}
                  placeholder={t.assistant.placeholder}
                  className="min-h-10 min-w-0 flex-1 rounded-full border border-navy-200 bg-cream px-3.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-50"
                  aria-label={t.assistant.send}
                >
                  ↑
                </button>
              </form>
              <p className="mt-1.5 text-center text-[0.62rem] leading-snug text-navy-400">
                {t.assistant.noAutoplay} · {t.assistant.demoNote}
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
