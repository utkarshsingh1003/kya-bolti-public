import type { MetadataRoute } from "next";
import { quizzes } from "@/data/quizzes";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kyaboltipublic.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/news",
    "/representatives",
    "/issues",
    "/issues/new",
    "/polls",
    "/reviews",
    "/discussions",
    "/qa",
    "/games",
    "/assistant",
    "/search",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/guidelines",
    "/corrections",
    "/sources",
  ];
  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "" || route === "/news" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : route === "/news" ? 0.9 : 0.7,
    })),
    ...quizzes.map((quiz) => ({
      url: `${siteUrl}/games/${quiz.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
