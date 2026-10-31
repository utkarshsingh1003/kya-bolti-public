import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
const base = (props: Props) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export function CategoryGlyph({ category, className = "h-5 w-5" }: { category: string; className?: string }) {
  switch (category) {
    case "water":
      return (
        <svg className={className} {...base({})}>
          <path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3Z" />
          <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
        </svg>
      );
    case "road":
    case "roads":
      return (
        <svg className={className} {...base({})}>
          <path d="M5 21 8 3M19 21 16 3M12 4v3M12 11v3M12 18v3" />
        </svg>
      );
    case "electricity":
      return (
        <svg className={className} {...base({})}>
          <path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z" />
        </svg>
      );
    case "sanitation":
      return (
        <svg className={className} {...base({})}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
        </svg>
      );
    case "streetlights":
      return (
        <svg className={className} {...base({})}>
          <path d="M8 21h8M12 21v-7M12 14H7a3 3 0 0 1 0-6h1M8 8h6M14 5l2 3-2 3" />
        </svg>
      );
    case "transport":
      return (
        <svg className={className} {...base({})}>
          <rect x="4" y="4" width="16" height="13" rx="2" />
          <path d="M4 11h16M8 21v-2M16 21v-2M8 8h.01M16 8h.01" />
        </svg>
      );
    case "education":
      return (
        <svg className={className} {...base({})}>
          <path d="m3 9 9-5 9 5-9 5-9-5Z" />
          <path d="M7 11.5V16c2.8 2 7.2 2 10 0v-4.5M21 9v6" />
        </svg>
      );
    case "health":
      return (
        <svg className={className} {...base({})}>
          <path d="M12 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.2-8 11-8 11Z" />
          <path d="M8 12h3l1-2 2 4 1-2h2" />
        </svg>
      );
    case "schemes":
      return (
        <svg className={className} {...base({})}>
          <path d="M4 10h16v10H4zM7 10V7a5 5 0 0 1 10 0v3M9 14h6" />
        </svg>
      );
    case "employment":
      return (
        <svg className={className} {...base({})}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
        </svg>
      );
    case "safety":
      return (
        <svg className={className} {...base({})}>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "drainage":
      return (
        <svg className={className} {...base({})}>
          <path d="M4 6h16M4 12h16M4 18h16M8 6v12M16 6v12" />
        </svg>
      );
    default:
      return (
        <svg className={className} {...base({})}>
          <path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" />
          <path d="M8 9h5M8 13h5M8 17h3" />
        </svg>
      );
  }
}
