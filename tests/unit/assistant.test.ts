import { describe, expect, it } from "vitest";
import { detectIntent, replyForIntent, type AssistantIntent } from "@/lib/assistant-intents";

describe("detectIntent", () => {
  const cases: [string, AssistantIntent][] = [
    ["नमस्ते", "greeting"],
    ["Hello!", "greeting"],
    ["आज की खबरें बताओ", "news"],
    ["पानी की शिकायत कहाँ करें?", "water-complaint"],
    ["मेरे विधायक कौन हैं?", "representatives"],
    ["PM किसान योजना की जानकारी दो", "schemes"],
    ["आपात स्थिति में क्या करें?", "emergency"],
    ["voter registration कैसे करें?", "voter"],
    ["quiz खेलना है", "quiz"],
    ["सड़क पर गड्ढा है", "issues"],
  ];

  it.each(cases)("maps %j to %s", (query, expected) => {
    expect(detectIntent(query)).toBe(expected);
  });

  it("returns fallback for empty and unrelated text", () => {
    expect(detectIntent("   ")).toBe("fallback");
    expect(detectIntent("tomorrow weather forecast")).toBe("fallback");
  });
});

describe("replyForIntent", () => {
  it("returns bilingual text and useful links for every intent", () => {
    const intents: AssistantIntent[] = [
      "news",
      "representatives",
      "water-complaint",
      "issues",
      "schemes",
      "quiz",
      "emergency",
      "voter",
      "greeting",
      "fallback",
    ];
    for (const intent of intents) {
      for (const locale of ["hi", "en"] as const) {
        const reply = replyForIntent(intent, locale);
        expect(reply.text.length).toBeGreaterThan(10);
        expect(Array.isArray(reply.links)).toBe(true);
      }
    }
  });

  it("routes water complaints to the prefilled issue form", () => {
    const reply = replyForIntent("water-complaint", "hi");
    expect(reply.links.some((link) => link.href === "/issues/new?category=water")).toBe(true);
    expect(reply.links.some((link) => link.href === "https://jansunwai.up.nic.in/" && link.external)).toBe(true);
  });

  it("keeps emergency numbers official", () => {
    const reply = replyForIntent("emergency", "en");
    expect(reply.text).toContain("112");
    expect(reply.links[0]?.href).toBe("https://112.gov.in/");
  });
});
