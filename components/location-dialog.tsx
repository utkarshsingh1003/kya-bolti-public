"use client";

import { useEffect, useRef, useState } from "react";
import { states, getDistrict } from "@/data/geo";
import { useLocale } from "@/components/locale-context";
import { useLocation, type AreaType, type SavedLocation } from "@/components/location-context";
import { IconCheck, IconPin } from "@/components/icons";
import { Alert, buttonClass, cn } from "@/components/ui";

type DetectStatus = "idle" | "locating" | "denied" | "unsupported" | "notfound" | "error";

export function LocationDialog() {
  const { locale, t } = useLocale();
  const { isLocationOpen, closeLocation, location, setLocation } = useLocation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SavedLocation>(location);
  const [status, setStatus] = useState<DetectStatus>("idle");
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isLocationOpen && !dialog.open) {
      setDraft(location);
      setStatus("idle");
      setDetectedLabel(null);
      dialog.showModal();
    }
    if (!isLocationOpen && dialog.open) dialog.close();
  }, [isLocationOpen, location]);

  const selectedState = states.find((state) => state.id === draft.stateId) ?? states[0];
  const activeStates = states.filter((state) => state.active);
  const districts = selectedState.districts;

  function save() {
    if (!getDistrict(draft.districtId)) return;
    setLocation(draft);
    closeLocation();
  }

  function detect() {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: position.coords.latitude.toFixed(4),
            lon: position.coords.longitude.toFixed(4),
          });
          const response = await fetch(`/api/geocode?${params.toString()}`);
          const data = (await response.json()) as {
            stateId?: string;
            districtId?: string;
            districtName?: string;
          };
          if (data.stateId && data.districtId) {
            setDraft((current) => ({ ...current, stateId: data.stateId!, districtId: data.districtId! }));
            setDetectedLabel(data.districtName ?? null);
            setStatus("idle");
          } else {
            setStatus("notfound");
          }
        } catch {
          setStatus("error");
        }
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={closeLocation}
      aria-labelledby="location-title"
      className="m-auto w-[min(96vw,34rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-100 bg-white p-0 text-navy-900 shadow-float backdrop:bg-navy-950/60"
    >
      <div className="border-b border-navy-100 bg-cream px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-700">
              {t.common.state} · {t.common.district}
            </p>
            <h2 id="location-title" className="hindi mt-1 text-xl font-extrabold">
              {t.location.choose}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeLocation}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-navy-500 hover:bg-navy-100"
            aria-label={t.nav.close}
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">{t.location.detectHelp}</p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-600">
              {t.common.state}
            </span>
            <select
              className="min-h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium"
              value={draft.stateId}
              onChange={(event) => {
                const nextState = states.find((state) => state.id === event.target.value);
                setDraft((current) => ({
                  ...current,
                  stateId: event.target.value,
                  districtId: nextState?.districts[0]?.id ?? "",
                }));
                setDetectedLabel(null);
              }}
            >
              {activeStates.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.nameHi} / {state.nameEn}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-600">
              {t.common.district}
            </span>
            <select
              className="min-h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium"
              value={draft.districtId}
              onChange={(event) => {
                setDraft((current) => ({ ...current, districtId: event.target.value }));
                setDetectedLabel(null);
              }}
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.nameHi} / {district.nameEn}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-600">
              {t.common.pin} <span className="font-normal normal-case text-navy-400">({t.common.optional})</span>
            </span>
            <input
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              value={draft.pin ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pin: event.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
              placeholder="226001"
              className="min-h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium focus:border-brand-400"
              aria-describedby="pin-help"
            />
            <span id="pin-help" className="mt-1 block text-[0.72rem] leading-snug text-navy-500">
              {t.location.pinHelp}
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-600">
              {t.common.city} <span className="font-normal normal-case text-navy-400">({t.common.optional})</span>
            </span>
            <input
              value={draft.city ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value.slice(0, 60) }))}
              className="min-h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium focus:border-brand-400"
              placeholder="लखनऊ"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-600">
            {t.common.constituency} <span className="font-normal normal-case text-navy-400">({t.common.optional})</span>
          </span>
          <input
            value={draft.constituency ?? ""}
            onChange={(event) =>
              setDraft((current) => ({ ...current, constituency: event.target.value.slice(0, 80) }))
            }
            placeholder={locale === "hi" ? "जैसे: लखनऊ पूर्व" : "e.g. Lucknow East"}
            className="min-h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm font-medium focus:border-brand-400"
          />
          <span className="mt-1 block text-[0.72rem] leading-snug text-navy-500">
            {locale === "hi"
              ? "पिन कोड से क्षेत्र अपने आप तय नहीं होता। क्षेत्र की पुष्टि निर्वाचन आयोग के पोर्टल से करें।"
              : "A PIN code does not determine your constituency automatically. Confirm it on the Election Commission portal."}
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-600">
            {t.location.areaType}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["urban", t.location.urban],
                ["rural", t.location.rural],
                ["unknown", t.location.unknown],
              ] as [AreaType, string][]
            ).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-center text-xs font-semibold",
                  draft.areaType === value
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-navy-200 bg-white text-navy-600 hover:border-navy-300",
                )}
              >
                <input
                  type="radio"
                  name="areaType"
                  value={value}
                  checked={draft.areaType === value}
                  onChange={() => setDraft((current) => ({ ...current, areaType: value }))}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {status !== "idle" && status !== "locating" ? (
          <Alert tone={status === "denied" ? "warning" : "warning"}>
            {status === "denied" ? t.location.denied : status === "unsupported" ? t.location.unsupported : status === "notfound" ? t.location.notFound : t.common.error}
          </Alert>
        ) : null}

        {detectedLabel ? (
          <Alert tone="success" title={locale === "hi" ? "ज़िला मिला" : "District found"}>
            <span className="inline-flex items-center gap-1.5">
              <IconCheck className="h-4 w-4" /> {detectedLabel}
            </span>
          </Alert>
        ) : null}

        <div className="rounded-xl border border-navy-100 bg-navy-50 p-3">
          <button
            type="button"
            onClick={detect}
            disabled={status === "locating"}
            className={buttonClass("outline", "sm", "w-full")}
          >
            <IconPin className="h-4 w-4" />
            {status === "locating"
              ? locale === "hi"
                ? "लोकेशन देख रहे हैं…"
                : "Locating…"
              : t.location.detect}
          </button>
          <p className="mt-2 text-[0.72rem] leading-relaxed text-navy-600">
            {t.location.detectHelp}{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
              OpenStreetMap
            </a>
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={closeLocation} className={buttonClass("ghost", "md")}>
            {t.common.cancel}
          </button>
          <button type="button" onClick={save} className={buttonClass("primary", "md")}>
            <IconCheck className="h-4 w-4" />
            {t.location.save}
          </button>
        </div>
      </div>
    </dialog>
  );
}
