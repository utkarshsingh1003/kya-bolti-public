"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { useLocation } from "@/components/location-context";
import { FormStatus, LocationFields, SelectField, TextAreaField, TextField } from "@/components/form-controls";
import { Badge, DemoBadge, EmptyState, Stars, buttonClass, cn } from "@/components/ui";
import { IconPoll, IconStar } from "@/components/icons";
import { categoryLabel, formatDate, reviewServiceLabels } from "@/lib/labels";
import { reviewServices } from "@/lib/validation";
import type { Review } from "@/lib/types";

const ratingWords = [
  { hi: "बहुत खराब", en: "Very poor" },
  { hi: "खराब", en: "Poor" },
  { hi: "औसत", en: "Average" },
  { hi: "अच्छा", en: "Good" },
  { hi: "बहुत अच्छा", en: "Very good" },
];

export function ReviewsExplorer({ initialReviews }: { initialReviews: Review[] }) {
  const { locale } = useLocale();
  const { location, hydrated } = useLocation();
  const [reviews, setReviews] = useState(initialReviews);
  const [scope, setScope] = useState<"all" | "local">("all");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [service, setService] = useState<(typeof reviewServices)[number]>("sanitation");
  const [rating, setRating] = useState(3);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [area, setArea] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stateId, setStateId] = useState(hydrated ? location.stateId : "up");
  const [districtId, setDistrictId] = useState(hydrated ? location.districtId : "up-lucknow");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      reviews.filter((review) => {
        if (filter !== "all" && review.serviceCategory !== filter) return false;
        if (scope === "local" && review.districtId !== location.districtId) return false;
        return true;
      }),
    [reviews, filter, scope, location.districtId],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceCategory: service,
          rating,
          title,
          body,
          area,
          districtId,
          stateId,
          displayName: displayName || undefined,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; review?: Review; error?: string };
      if (!response.ok || !data.ok || !data.review) {
        setError(data.error ?? (locale === "hi" ? "समीक्षा भेजी नहीं जा सकी।" : "Could not submit the review."));
        setState("error");
        return;
      }
      setReviews((current) => [data.review as Review, ...current]);
      setTitle("");
      setBody("");
      setArea("");
      setDisplayName("");
      setRating(3);
      setState("success");
      setFormOpen(false);
    } catch {
      setError(locale === "hi" ? "नेटवर्क में दिक्कत आई।" : "Network error.");
      setState("error");
    }
  }

  return (
    <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-navy-200 bg-white p-1">
            {(["all", "local"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScope(item)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold",
                  scope === item ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50",
                )}
                aria-pressed={scope === item}
              >
                {item === "all" ? (locale === "hi" ? "सभी" : "All") : locale === "hi" ? "मेरा ज़िला" : "My district"}
              </button>
            ))}
          </div>
          <select
            aria-label={locale === "hi" ? "सेवा फ़िल्टर" : "Service filter"}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700"
          >
            <option value="all">{locale === "hi" ? "सभी सेवाएँ" : "All services"}</option>
            {reviewServices.map((item) => (
              <option key={item} value={item}>
                {reviewServiceLabels[item]?.[locale] ?? item}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setFormOpen((open) => !open)} className={buttonClass("primary", "sm", "ml-auto")}>
            <IconStar className="h-4 w-4" />
            {formOpen ? (locale === "hi" ? "फ़ॉर्म बंद करें" : "Close form") : locale === "hi" ? "अनुभव लिखें" : "Write a review"}
          </button>
        </div>

        {state === "success" ? (
          <FormStatus tone="success">
            {locale === "hi" ? "आपका अनुभव भेज दिया गया। धन्यवाद!" : "Your review was submitted. Thank you!"}
          </FormStatus>
        ) : null}

        {formOpen ? (
          <form onSubmit={submit} className="mb-6 rounded-2xl border border-navy-100 bg-white p-4 shadow-card sm:p-5">
            <h2 className="hindi mb-3 text-base font-extrabold text-navy-900">
              {locale === "hi" ? "अपना अनुभव साझा करें" : "Share your experience"}
            </h2>
            <div className="grid gap-3">
              <SelectField label={locale === "hi" ? "सेवा" : "Service"} value={service} onChange={(event) => setService(event.target.value as typeof service)}>
                {reviewServices.map((item) => (
                  <option key={item} value={item}>
                    {reviewServiceLabels[item]?.[locale] ?? item}
                  </option>
                ))}
              </SelectField>

              <fieldset>
                <legend className="mb-1.5 text-[0.82rem] font-bold text-navy-800">{locale === "hi" ? "रेटिंग" : "Rating"}</legend>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      className={cn(
                        "cursor-pointer rounded-lg border px-2.5 py-1.5 text-lg leading-none transition",
                        rating >= value ? "border-gold-400 bg-gold-100 text-amber-700" : "border-navy-200 bg-white text-navy-300",
                      )}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                      />
                      <span aria-hidden>★</span>
                      <span className="sr-only">
                        {value} {locale === "hi" ? "स्टार" : "stars"}
                      </span>
                    </label>
                  ))}
                  <span className="ml-1 text-[0.75rem] font-semibold text-navy-600">
                    {ratingWords[rating - 1]?.[locale]}
                  </span>
                </div>
              </fieldset>

              <TextField
                label={locale === "hi" ? "छोटा शीर्षक" : "Short headline"}
                required
                minLength={5}
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={locale === "hi" ? "जैसे: कचरा गाड़ी समय पर नहीं आती" : "e.g. Garbage truck is irregular"}
              />
              <TextAreaField
                label={locale === "hi" ? "अपना अनुभव" : "Your experience"}
                required
                minLength={20}
                maxLength={1500}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={locale === "hi" ? "क्या हुआ, कब हुआ और आपने क्या किया? कृपया अपमान या बिना प्रमाण आरोप न लिखें।" : "What happened, when, and what did you do? Avoid insults or unproven allegations."}
              />
              <TextField
                label={locale === "hi" ? "इलाका" : "Area"}
                required
                minLength={3}
                maxLength={80}
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder={locale === "hi" ? "जैसे: हज़रतगंज" : "e.g. Hazratganj"}
              />
              <LocationFields
                stateId={stateId}
                districtId={districtId}
                onStateChange={(nextState, nextDistrict) => {
                  setStateId(nextState);
                  setDistrictId(nextDistrict);
                }}
                onDistrictChange={setDistrictId}
              />
              <TextField
                label={locale === "hi" ? "नाम (वैकल्पिक)" : "Name (optional)"}
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={locale === "hi" ? "खाली छोड़ें तो अनाम" : "Leave blank to stay anonymous"}
              />
              {error ? <FormStatus tone="error">{error}</FormStatus> : null}
              <p className="text-[0.7rem] leading-relaxed text-navy-500">
                {locale === "hi"
                  ? "यह व्यक्तिगत अनुभव है, सत्यापित तथ्य नहीं। कृपया निजी जानकारी, धमकी या सांप्रदायिक भाषा न लिखें।"
                  : "This is a personal experience, not a verified fact. Do not include private data, threats or communal language."}
              </p>
              <button type="submit" disabled={state === "sending"} className={buttonClass("primary", "md", "justify-self-start")}>
                {state === "sending" ? (locale === "hi" ? "भेज रहे हैं…" : "Sending…") : locale === "hi" ? "अनुभव भेजें" : "Submit review"}
              </button>
            </div>
          </form>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            icon={<IconPoll className="h-7 w-7" />}
            title={locale === "hi" ? "इस फ़िल्टर में कोई समीक्षा नहीं" : "No reviews match this filter"}
            description={locale === "hi" ? "फ़िल्टर बदलें या पहला अनुभव लिखें।" : "Change the filter or write the first review."}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((review) => (
              <li key={review.id} className="flex flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-card">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="outline">{categoryLabel(reviewServiceLabels, review.serviceCategory, locale)}</Badge>
                  {review.isDemo ? <DemoBadge /> : null}
                  <span className="ml-auto">
                    <Stars rating={review.rating} label={`${review.rating}/5`} />
                  </span>
                </div>
                <h2 className="hindi text-[0.98rem] font-extrabold leading-snug text-navy-900">{review.title}</h2>
                <p className="mt-1.5 flex-1 text-[0.8rem] leading-relaxed text-navy-600">{review.body}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[0.68rem] text-navy-400">
                  <span>{review.area}</span>
                  <span aria-hidden>·</span>
                  <span>{review.displayName || (locale === "hi" ? "अनाम" : "Anonymous")}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(review.createdAt, locale)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="rounded-2xl border border-navy-100 bg-white p-4 shadow-card lg:sticky lg:top-24">
        <h2 className="text-sm font-extrabold text-navy-900">{locale === "hi" ? "समीक्षा लिखने से पहले" : "Before you write"}</h2>
        <ul className="prose-civic mt-2 space-y-2 text-[0.75rem] leading-relaxed text-navy-600">
          <li>{locale === "hi" ? "अपने अनुभव की तारीख और इलाका लिखें।" : "Include the date and area of your experience."}</li>
          <li>{locale === "hi" ? "किसी व्यक्ति का नाम, फ़ोन या पता न लिखें।" : "Do not name individuals or post phone numbers/addresses."}</li>
          <li>{locale === "hi" ? "अपमान, धमकी या सांप्रदायिक भाषा नहीं।" : "No insults, threats or communal language."}</li>
          <li>{locale === "hi" ? "समीक्षा सत्यापित तथ्य नहीं, नागरिक राय है।" : "Reviews are citizen opinion, not verified fact."}</li>
        </ul>
        <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-[0.68rem] leading-relaxed text-navy-500">
          {locale === "hi"
            ? "आपकी समीक्षा सार्वजनिक रूप से दिखेगी। मॉडरेशन टीम नियम तोड़ने वाली समीक्षाएँ छिपा सकती है।"
            : "Your review appears publicly. Moderators may hide reviews that break the rules."}
        </p>
      </aside>
    </div>
  );
}
