"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { detectIntent, replyForIntent } from "@/lib/assistant-intents";
import { Badge, buttonClass, cn } from "@/components/ui";
import { IconExternal, IconMic, IconSpark, IconVolume, IconVolumeOff } from "@/components/icons";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  links?: { label: string; href: string; external?: boolean }[];
};

let counter = 0;

export function AssistantPage() {
  const { locale, t } = useLocale();
  const { label } = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((current) =>
      current.length === 0
        ? [
            {
              id: "welcome",
              role: "assistant",
              text:
                locale === "hi"
                  ? `नमस्कार! मैं Public Saathi हूँ। अभी आपका इलाका: ${label}। खबरें, जनप्रतिनिधि, शिकायत, योजनाएँ, मतदाता पंजीकरण या क्विज़ के बारे में पूछिए।`
                  : `Hello! I am Public Saathi. Your area: ${label}. Ask about news, representatives, complaints, schemes, voter registration or quizzes.`,
            },
          ]
        : current,
    );
  }, [locale, label]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const suggestions =
    locale === "hi"
      ? ["आज की स्थानीय खबरें बताओ", "मेरे विधायक की जानकारी दो", "पानी की शिकायत कहाँ करें?", "सरकारी योजनाओं की जानकारी", "मतदाता सूची में नाम कैसे जोड़ें?", "एक क्विज़ खिलाओ"]
      : ["Today's local news", "Who is my MLA?", "Where do I complain about water?", "Tell me about government schemes", "How do I add my name to the voter roll?", "Start a quiz"];

  function answer(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const intent = detectIntent(trimmed);
    const reply = replyForIntent(intent, locale);
    setMessages((current) => [
      ...current,
      { id: `u-${counter++}`, role: "user", text: trimmed },
      { id: `a-${counter++}`, role: "assistant", text: reply.text, links: reply.links },
    ]);
    setInput("");
  }

  function listen() {
    const scope = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNote(locale === "hi" ? "इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप लिखकर पूछ सकते हैं।" : "Voice recognition is not available in this browser. Please type your question.");
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) answer(transcript);
      };
      recognition.onerror = (event) => {
        setVoiceNote(
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? locale === "hi" ? "माइक्रोफ़ोन की अनुमति नहीं मिली। आप लिखकर पूछ सकते हैं।" : "Microphone permission denied. You can type instead."
            : locale === "hi" ? "आवाज़ नहीं पकड़ पाए। फिर कोशिश करें।" : "Could not capture voice. Try again.",
        );
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setVoiceNote(null);
    } catch {
      setVoiceNote(locale === "hi" ? "माइक्रोफ़ोन शुरू नहीं हो सका।" : "Could not start the microphone.");
      setListening(false);
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceNote(locale === "hi" ? "इस ब्राउज़र में आवाज़ सुनाना उपलब्ध नहीं है।" : "Speech playback is not available in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setMuted(false);
  }

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
      <div className="flex min-h-[32rem] flex-col rounded-2xl border border-navy-100 bg-white shadow-card">
        <div className="border-b border-navy-100 bg-navy-50 px-4 py-2.5">
          <p className="text-[0.68rem] leading-relaxed text-navy-600" role="note">
            {t.assistant.disclaimer}
          </p>
        </div>
        <div className="flex items-center gap-2 border-b border-navy-100 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <IconSpark className="h-5 w-5" />
          </span>
          <div>
            <p className="hindi text-sm font-extrabold text-navy-900">{locale === "hi" ? "Public Saathi" : "Public Saathi"}</p>
            <p className="text-[0.66rem] text-navy-500">
              {locale === "hi" ? "सीमित इरादे • केवल जानकारी, कानूनी सलाह नहीं" : "Limited intents • information only, not legal advice"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (muted) setMuted(false);
              else {
                if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                setMuted(true);
              }
            }}
            className="ml-auto rounded-lg border border-navy-200 p-2 text-navy-600 hover:bg-navy-50"
            aria-label={muted ? (locale === "hi" ? "आवाज़ चालू करें" : "Enable voice") : locale === "hi" ? "आवाज़ बंद करें" : "Mute voice"}
          >
            {muted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolume className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed",
                  message.role === "user" ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-800",
                )}
              >
                <p className="hindi">{message.text}</p>
                {message.links?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.links.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-bold text-brand-700 shadow-sm"
                        >
                          {link.label} <IconExternal className="h-3 w-3" />
                        </a>
                      ) : (
                        <Link key={link.href} href={link.href} className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-bold text-brand-700 shadow-sm">
                          {link.label}
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
                {message.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => speak(message.text)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[0.64rem] font-bold text-navy-500 hover:text-navy-800"
                  >
                    <IconVolume className="h-3 w-3" /> {locale === "hi" ? "सुनें" : "Listen"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-navy-100 px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => answer(suggestion)}
                className="rounded-full border border-navy-200 px-2.5 py-1 text-[0.68rem] font-semibold text-navy-600 hover:bg-navy-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              answer(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={locale === "hi" ? "अपना सवाल लिखें…" : "Type your question…"}
              aria-label={locale === "hi" ? "अपना सवाल" : "Your question"}
              className="min-w-0 flex-1 rounded-xl border border-navy-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="button"
              onClick={listen}
              className={buttonClass(listening ? "danger" : "outline", "md")}
              aria-label={locale === "hi" ? "बोलकर पूछें" : "Ask by voice"}
            >
              <IconMic className="h-4 w-4" />
            </button>
            <button type="submit" className={buttonClass("primary", "md")}>
              {locale === "hi" ? "भेजें" : "Send"}
            </button>
          </form>
          {listening ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold text-brand-700" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" /> {locale === "hi" ? "सुन रहे हैं…" : "Listening…"}
            </p>
          ) : null}
          {voiceNote ? <p className="mt-1.5 text-[0.68rem] text-amber-800" role="status">{voiceNote}</p> : null}
          <p className="mt-2 text-[0.62rem] text-navy-400">
            {locale === "hi" ? "आवाज़ अपने आप नहीं चलती। सुनने के लिए ‘सुनें’ दबाएँ।" : "Audio does not autoplay. Press ‘Listen’ to hear a reply."}
          </p>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
          <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "क्या पूछ सकते हैं?" : "What you can ask"}</h2>
          <ul className="mt-2 space-y-1.5 text-[0.72rem] leading-relaxed text-navy-600">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button type="button" onClick={() => answer(suggestion)} className="text-left hover:text-brand-700 hover:underline">
                  “{suggestion}”
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-extrabold text-amber-950">{locale === "hi" ? "सीमाएँ" : "Limits"}</h2>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-amber-900">
            {locale === "hi"
              ? "Public Saathi केवल सीमित विषय समझता है और सत्यापित/लेबल किए गए डेटा से लिंक देता है। यह आपातकालीन सेवा या कानूनी सलाह नहीं है। आपात स्थिति में 112 पर कॉल करें।"
              : "Public Saathi understands limited topics and links to verified/labelled data. It is not an emergency service or legal advice. In an emergency call 112."}
          </p>
        </div>
        <div className="rounded-2xl border border-navy-100 bg-white p-4">
          <Badge tone="brand">{locale === "hi" ? "आपका इलाका" : "Your area"}</Badge>
          <p className="hindi mt-2 text-sm font-bold text-navy-900">{label}</p>
          <p className="mt-1 text-[0.68rem] text-navy-500">
            {locale === "hi" ? "लोकेशन केवल इलाका बदलने के लिए है; सटीक निर्देशांक नहीं सहेजे जाते।" : "Location is used only to pick your area; exact coordinates are not stored."}
          </p>
        </div>
      </aside>
    </div>
  );
}
