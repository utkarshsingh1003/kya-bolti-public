import { expect, test } from "@playwright/test";

const adminPassword = process.env.ADMIN_PASSWORD;

test.describe("admin publishing", () => {
  test.skip(!adminPassword, "ADMIN_PASSWORD is not set for this run.");

  test("admin logs in and publishes an announcement and a buzz item", async ({ page }) => {
    const stamp = Date.now();
    const announcementHi = `स्वचालित परीक्षण घोषणा ${stamp}`;
    const announcementEn = `Automated test announcement ${stamp}`;
    const buzzHi = `स्वचालित परीक्षण बज़ ${stamp}`;
    const buzzEn = `Automated test buzz ${stamp}`;

    await page.goto("/admin/login");
    await page.getByLabel("एडमिन पासवर्ड").first().fill(adminPassword!);
    await page.getByRole("button", { name: "लॉगिन करें" }).click();

    await expect(page.getByRole("heading", { name: "मॉडरेशन डैशबोर्ड" })).toBeVisible();
    await expect(page.getByText("postgres", { exact: true })).toBeVisible();

    // Public updates: create, read back, delete.
    await page.getByRole("tab", { name: "अपडेट" }).click();
    await page.getByLabel("शीर्षक (हिंदी)").fill(announcementHi);
    await page.getByLabel("शरीर (हिंदी)").fill("यह स्वचालित परीक्षण प्रकाशन प्रवाह की जाँच करता है और बाद में हटा दिया जाता है।");
    await page.getByLabel("शीर्षक (अंग्रेज़ी)").fill(announcementEn);
    await page.getByLabel("शरीर (अंग्रेज़ी)").fill("This automated test verifies the publishing flow and is removed afterwards.");
    await page.getByRole("button", { name: "सहेजें" }).click();

    const announcementRow = page.locator("li").filter({ hasText: announcementHi }).first();
    await expect(announcementRow).toBeVisible();
    await announcementRow.getByRole("button", { name: "मिटाएँ" }).click();
    await expect(page.getByText(announcementHi)).toHaveCount(0);

    // Buzz: create, publish, delete.
    await page.getByRole("tab", { name: "बज़" }).click();
    await page.getByLabel("शीर्षक (हिंदी)").fill(buzzHi);
    await page.getByLabel("शीर्षक (अंग्रेज़ी)").fill(buzzEn);
    await page.getByLabel("संक्षेप (हिंदी)").fill("स्वचालित परीक्षण सारांश सामग्री जो प्रकाशन जाँचती है।");
    await page.getByLabel("संक्षेप (अंग्रेज़ी)").fill("Automated test summary content checking publishing.");
    await page.getByLabel("बॉडी (हिंदी)").fill("स्वचालित परीक्षण बॉडी सामग्री जो प्रकाशन प्रवाह को सत्यापित करती है।");
    await page.getByLabel("बॉडी (अंग्रेज़ी)").fill("Automated test body content verifying the publishing flow.");
    await page.getByLabel("स्थिति").last().selectOption("published");
    await page.getByRole("button", { name: "सहेजें" }).click();

    const buzzRow = page.locator("li").filter({ hasText: buzzHi }).first();
    await expect(buzzRow).toBeVisible();
    await expect(buzzRow.getByText("published", { exact: true })).toBeVisible();
    await buzzRow.getByRole("button", { name: "मिटाएँ" }).click();
    await expect(page.getByText(buzzHi)).toHaveCount(0);
  });

  test("admin API rejects anonymous reads and writes", async ({ request }) => {
    const read = await request.get("/api/admin/announcements");
    expect(read.status()).toBe(401);

    const write = await request.post("/api/admin/buzz", {
      data: {
        title: { hi: "अनधिकृत परीक्षण", en: "Unauthorized test" },
        summary: { hi: "अनधिकृत परीक्षण सारांश।", en: "Unauthorized test summary." },
        body: { hi: "अनधिकृत परीक्षण बॉडी सामग्री।", en: "Unauthorized test body content." },
        category: "trending",
        platform: "test",
        status: "draft",
      },
    });
    expect(write.status()).toBe(401);
  });
});

test.describe("deployment health", () => {
  test("health reports postgres storage and configured admin", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      storage: string;
      persistent: boolean;
      adminConfigured: boolean;
      cronConfigured: boolean;
      databaseError: string | null;
    };
    expect(body.ok).toBe(true);
    expect(body.storage).toBe("postgres");
    expect(body.persistent).toBe(true);
    expect(body.adminConfigured).toBe(true);
    expect(body.cronConfigured).toBe(true);
    expect(body.databaseError).toBeNull();
  });

  test("polls expose results after a signed-in vote", async ({ page }) => {
    const email = `deploy-voter-${Date.now()}@example.test`;
    const password = "VoteTest1234";

    const register = await page.request.post("/api/auth/register", {
      headers: { origin: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100" },
      data: { email, displayName: "Deploy Voter", password },
    });
    expect(register.ok()).toBeTruthy();

    await page.goto("/polls");
    const card = page.locator("section").filter({ hasText: "आपके इलाके में सबसे ज़रूरी नागरिक मुद्दा" }).first();
    await expect(card).toBeVisible();

    await card.getByRole("group", { name: "पोल विकल्प" }).getByRole("button").first().click();
    await card.getByRole("button", { name: "वोट दें" }).click();
    await expect(card.getByRole("status")).toContainText("आपका वोट दर्ज हो गया");
    await expect(card.getByRole("button", { name: "नतीजे छिपाएँ" })).toBeVisible();
    await expect(card.getByText(/%/).first()).toBeVisible();
  });

  test("mobile preview has no horizontal overflow and keeps navigation usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const bottomNav = page.getByRole("navigation", { name: "मोबाइल नेविगेशन" });
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole("link", { name: "समस्याएँ" }).click();
    await expect(page).toHaveURL(/\/issues$/);
  });
});
