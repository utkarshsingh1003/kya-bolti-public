import Link from "next/link";
import { useState, useEffect } from "react";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 active:bg-brand-800 shadow-[0_10px_24px_-14px_rgba(222,80,13,0.9)]",
  secondary: "bg-navy-900 text-white hover:bg-navy-800",
  outline: "border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50",
  ghost: "text-navy-800 hover:bg-navy-100/70",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  white: "bg-white text-navy-900 hover:bg-cream",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

const buttonSizes = {
  sm: "min-h-9 px-3.5 py-1.5 text-sm rounded-lg gap-1.5",
  md: "min-h-11 px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "min-h-13 px-6 py-3.5 text-base rounded-xl gap-2.5",
} as const;

export function buttonClass(
  variant: keyof typeof buttonVariants = "primary",
  size: keyof typeof buttonSizes = "md",
  extra?: string,
) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
    buttonVariants[variant],
    buttonSizes[size],
    extra,
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "navy" | "teal" | "gold" | "danger" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-navy-100 text-navy-700",
    brand: "bg-brand-100 text-brand-800",
    navy: "bg-navy-900 text-white",
    teal: "bg-teal-100 text-teal-700",
    gold: "bg-gold-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
    outline: "border border-navy-200 bg-white text-navy-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DemoBadge({ label = "डेमो / Demo" }: { label?: string }) {
  return <Badge tone="gold" className="uppercase tracking-[0.12em]">{label}</Badge>;
}

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end", className)}>
      <div className="max-w-2xl">
        {kicker ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{kicker}</p>
        ) : null}
        <h2 className="hindi text-balance text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[1.7rem]">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-navy-600 sm:text-[0.95rem]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-navy-400">{icon}</div> : null}
      <p className="hindi text-base font-bold text-navy-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-navy-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-navy-200 bg-navy-50 text-navy-800",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    success: "border-teal-200 bg-teal-50 text-teal-900",
    danger: "border-red-500 bg-red-100 text-red-800",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[tone], className)}>
      {title ? <p className="mb-1 font-bold">{title}</p> : null}
      {children}
    </div>
  );
}

export function NotificationToast({
  tone = "info",
  title,
  description,
  autoDismiss = true,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: string;
  description?: string;
  autoDismiss?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible && autoDismiss) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismiss]);
  if (!visible) return null;
  return (
    <Alert tone={tone}>
      <p className="mb-1">{title ?? ""}</p>
      {description ? <p>{description}</p> : null}
    </Alert>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-navy-100 bg-white">
      <div className="container-page py-8 sm:py-10">
        {eyebrow ? (
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
        ) : null}
        <h2 className="hindi text-balance text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[1.7rem]">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-navy-600 sm:text-[0.95rem]">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}

export function Stars({ rating, label }: { rating: number; label?: string }) {
  const filledStars = Math.round(rating);
  const emptyStars = 5 - filledStars;
  return (
    <span className="flex items-center gap-1 text-yellow-500">
      {[...Array(filledStars).keys()].map((_, i) => (
        <span key={i} aria-hidden="true">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.11-.87L12 2 9.11 8.37L5 9.24L1.83 21z"
            />
          </svg>
        </span>
      ))}
      {[...Array(emptyStars).keys()].map((_, i) => (
        <span key={i} aria-hidden="true">
          <svg
            className="h-4 w-4 opacity-30"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.11-.87L12 2 9.11 8.37L5 9.24L1.83 21z"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}