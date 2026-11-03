import Link from "next/link";

export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="क्या बोलती पब्लिक लोगो">
      <rect width="64" height="64" rx="16" fill="#0A1F3A" />
      <path
        d="M13 17.5A5.5 5.5 0 0 1 18.5 12h27a5.5 5.5 0 0 1 5.5 5.5v20a5.5 5.5 0 0 1-5.5 5.5H30.8L21 51v-8h-2.5A5.5 5.5 0 0 1 13 37.5v-20Z"
        fill="#F26A21"
      />
      <rect x="21" y="23" width="4.4" height="11" rx="2.2" fill="#0A1F3A" />
      <rect x="29.8" y="18.5" width="4.4" height="20" rx="2.2" fill="#0A1F3A" />
      <rect x="38.6" y="25.5" width="4.4" height="8" rx="2.2" fill="#0A1F3A" />
      <circle cx="47.5" cy="15.5" r="4.5" fill="#E9B949" />
    </svg>
  );
}

export function Logo({
  variant = "dark",
  showTagline = false,
  href = "/",
  compact = false,
}: {
  variant?: "dark" | "light";
  showTagline?: boolean;
  href?: string;
  compact?: boolean;
}) {
  const titleColor = variant === "dark" ? "text-navy-900" : "text-white";
  const taglineColor = variant === "dark" ? "text-navy-600" : "text-navy-200";
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="क्या बोलती पब्लिक — होम">
      <LogoMark className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <span className="flex flex-col leading-none">
        <span className={`hindi text-[1.15rem] font-extrabold tracking-tight sm:text-[1.28rem] ${titleColor}`}>
          क्या बोलती <span className="text-brand-600">PUBLIC</span>
        </span>
        <span
          className={`mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] ${taglineColor} ${
            showTagline ? "" : "hidden sm:block"
          }`}
        >
          क्या बोलती PUBLIC
        </span>
      </span>
    </Link>
  );
}
