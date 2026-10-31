"use client";

import { useId, type ReactNode } from "react";
import { states } from "@/data/geo";
import { useLocale } from "@/components/locale-context";
import { cn } from "@/components/ui";

export const inputClass =
  "w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-navy-50";

export const textareaClass = cn(inputClass, "min-h-28 resize-y leading-relaxed");

export const selectClass = cn(inputClass, "appearance-none pr-9");

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-[0.82rem] font-bold text-navy-800">
        {label}
        {required ? (
          <span className="text-brand-700" aria-hidden>
            *
          </span>
        ) : null}
        {hint ? <span className="text-[0.68rem] font-normal text-navy-500">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[0.72rem] font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required} className={className}>
      <input id={id} className={inputClass} required={required} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required} className={className}>
      <textarea id={id} className={textareaClass} required={required} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required} className={className}>
      <select id={id} className={selectClass} required={required} aria-invalid={Boolean(error)} {...props}>
        {children}
      </select>
    </Field>
  );
}

const activeStates = states.filter((state) => state.active);

export function pickStateFromDistrict(districtId: string): string {
  return activeStates.find((state) => state.districts.some((district) => district.id === districtId))?.id ?? "up";
}

export function LocationFields({
  stateId,
  districtId,
  onStateChange,
  onDistrictChange,
  disabled,
}: {
  stateId: string;
  districtId: string;
  onStateChange: (stateId: string, districtId: string) => void;
  onDistrictChange: (districtId: string) => void;
  disabled?: boolean;
}) {
  const { locale } = useLocale();
  const state = activeStates.find((item) => item.id === stateId) ?? activeStates[0]!;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SelectField
        label={locale === "hi" ? "राज्य" : "State"}
        required
        value={state.id}
        disabled={disabled}
        onChange={(event) => {
          const next = activeStates.find((item) => item.id === event.target.value) ?? activeStates[0]!;
          onStateChange(next.id, next.districts[0]?.id ?? "");
        }}
      >
        {activeStates.map((item) => (
          <option key={item.id} value={item.id}>
            {locale === "hi" ? item.nameHi : item.nameEn}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={locale === "hi" ? "ज़िला" : "District"}
        required
        value={districtId}
        disabled={disabled}
        onChange={(event) => onDistrictChange(event.target.value)}
      >
        {state.districts.map((district) => (
          <option key={district.id} value={district.id}>
            {locale === "hi" ? district.nameHi : district.nameEn}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

export function FormStatus({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "border-teal-200 bg-teal-50 text-teal-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-navy-200 bg-navy-50 text-navy-800",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
