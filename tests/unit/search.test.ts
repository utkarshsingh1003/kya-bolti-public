import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoNews } from "@/data/news";
import { __resetNewsCache, __setNewsCache } from "@/lib/news";
import { searchAll } from "@/lib/search";
import { __resetRepository } from "@/lib/store";

beforeEach(() => {
  __resetNewsCache();
  __setNewsCache(demoNews);
  __resetRepository();
  // Force the in-memory repository so tests never write to the workspace.
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("DATABASE_URL", "");
});

afterEach(() => {
  __resetRepository();
  __resetNewsCache();
});

describe("searchAll", () => {
  it("returns an empty result for queries shorter than two characters", async () => {
    const result = await searchAll("ग", "hi");
    expect(result.total).toBe(0);
    expect(Object.values(result.groups).every((group) => group.length === 0)).toBe(true);
  });

  it("finds static help pages in Hindi", async () => {
    const result = await searchAll("गोपनीयता", "hi");
    expect(result.total).toBeGreaterThan(0);
    expect(result.groups.page.some((item) => item.href === "/privacy")).toBe(true);
  });

  it("finds quizzes by their English title", async () => {
    const result = await searchAll("constitution", "en");
    const quiz = result.groups.quiz.find((item) => item.id === "constitution");
    expect(quiz?.href).toBe("/games/constitution");
    expect(quiz?.title).toBe("Know Your Constitution");
  });

  it("searches demo news, polls and seeded issues together", async () => {
    const water = await searchAll("पानी", "hi");
    expect(water.total).toBeGreaterThan(0);
    expect(water.groups.news.length + water.groups.poll.length + water.groups.issue.length).toBeGreaterThan(0);

    const priority = await searchAll("सबसे ज़रूरी", "hi");
    expect(priority.groups.poll.some((item) => item.id === "poll-local-priority")).toBe(true);
  });

  it("returns no representative rows when none have been verified/imported", async () => {
    const result = await searchAll("सांसद", "hi");
    expect(result.groups.representative).toHaveLength(0);
  });

  it("normalises whitespace and respects the locale for titles", async () => {
    const result = await searchAll("  privacy  ", "en");
    const page = result.groups.page.find((item) => item.href === "/privacy");
    expect(page?.title).toBe("Privacy policy");
  });
});
