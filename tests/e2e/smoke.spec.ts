import { expect, test } from "@playwright/test";

test.describe("public shell", () => {
  test("homepage renders the Hindi-first brand, hero and demo labels", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/क्या बोलती PUBLIC/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("आपके इलाके की बात");
    await expect(page.getByText("डेमो", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "खबरें" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "जनप्रतिनिधि" }).first()).toBeVisible();
  });

  test("language switch updates copy and persists across reloads", async ({ page }) => {
    await page.goto("/");

    const english = page.getByRole("button", { name: "EN", exact: true });
    await english.click();
    await expect(english).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your neighbourhood's story");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your neighbourhood's story");

    await page.getByRole("button", { name: "हिं", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("आपके इलाके की बात");
  });

  test("primary routes render their own headings", async ({ page }) => {
    const routes: [string, RegExp][] = [
      ["/news", /खबरें और नागरिक जानकारी/],
      ["/representatives", /अपने जनप्रतिनिधि को जानें/],
      ["/polls", /क्या बोलती Public/],
      ["/issues", /नागरिक समस्याएँ/],
      ["/games", /नागरिक ज्ञान के खेल/],
      ["/discussions", /आपके इलाके की बातचीत/],
      ["/qa", /नागरिक सवाल-जवाब/],
      ["/reviews", /सार्वजनिक सेवाओं पर समीक्षा/],
      ["/about", /क्या बोलती PUBLIC क्या है/],
      ["/privacy", /गोपनीयता/],
      ["/sources", /हमारी जानकारी कहाँ से आती है/],
    ];

    for (const [route, heading] of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });

  test("search finds a static help page", async ({ page }) => {
    await page.goto("/search");

    const form = page.getByRole("search");
    const searchbox = form.getByRole("searchbox");
    await expect(searchbox).toBeVisible();
    await searchbox.fill("गोपनीयता");
    await form.getByRole("button").click();

    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
  });
});

test.describe("citizen actions", () => {
  test("issue form requires consent and returns a tracking code", async ({ page }) => {
    await page.goto("/issues/new");

    const submit = page.getByRole("button", { name: "समस्या भेजें" });
    await expect(submit).toBeDisabled();

    const form = page.locator("form").first();
    const titleInput = form.getByPlaceholder("जैसे: बाज़ार रोड पर गहरे गड्ढे");
    const areaInput = form.getByPlaceholder("जैसे: बाज़ार रोड, वार्ड 12");
    await expect(titleInput).toBeVisible();
    await titleInput.fill("बाज़ार रोड पर गहरे गड्ढे");
    await form.locator("textarea").fill("बाज़ार रोड पर तीन गहरे गड्ढे हैं जिनसे दोपहिया वाहनों को खतरा है।");
    await areaInput.fill("बाज़ार रोड, वार्ड 12");

    await expect(submit).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole("heading", { name: "समस्या दर्ज हो गई" })).toBeVisible();
    await expect(page.getByText(/^KBP-[A-Z0-9]{6}$/)).toBeVisible();
  });

  test("a community poll records one vote per account", async ({ page }) => {
    const email = `poll-voter-${Date.now()}@example.com`;
    const password = "vote-test-123";

    const registerResponse = await page.request.post("/api/auth/register", {
      data: { email, displayName: "Poll Voter", password },
    });
    expect(registerResponse.ok()).toBeTruthy();

    await page.goto("/polls");

    const firstPoll = page.locator("section").filter({ hasText: "आपके इलाके में सबसे ज़रूरी नागरिक मुद्दा" });
    await firstPoll.getByRole("group", { name: "पोल विकल्प" }).getByRole("button").first().click();
    await firstPoll.getByRole("button", { name: "वोट दें" }).click();

    await expect(firstPoll.getByRole("status")).toContainText("आपका वोट दर्ज हो गया");
    await expect(firstPoll.getByRole("button", { name: "नतीजे छिपाएँ" })).toBeVisible();

    // Same browser session on a fresh page load: voting controls stay closed.
    await page.reload();
    const reloadedPoll = page.locator("section").filter({ hasText: "आपके इलाके में सबसे ज़रूरी नागरिक मुद्दा" });
    await expect(reloadedPoll.getByRole("button", { name: "वोट दें" })).toHaveCount(0);
  });

  test("assistant answers a water complaint intent with official links", async ({ page }) => {
    await page.goto("/assistant");

    const input = page.getByLabel("अपना सवाल");
    await input.fill("पानी की शिकायत कहाँ करें?");
    await page.getByRole("button", { name: "भेजें" }).click();

    await expect(page.getByText(/पानी की शिकायत के लिए/)).toBeVisible();
    await expect(page.getByRole("link", { name: /समस्या दर्ज करें/ }).last()).toBeVisible();
  });

  test("quiz shows a score and review after answering", async ({ page }) => {
    await page.goto("/games/constitution");

    for (let index = 0; index < 5; index += 1) {
      const options = page.getByRole("group", { name: "विकल्प" });
      const answerButton = options.getByRole("button").first();
      await expect(answerButton).toBeVisible();
      await answerButton.click();
      const next = page.getByRole("button", { name: /अगला सवाल|नतीजा देखें/ });
      await expect(next).toBeVisible();
      await next.first().click();
    }

    await expect(page.getByText(/आपका स्कोर/)).toBeVisible();
    await expect(page.getByText(/जवाब दोबारा देखें/)).toBeVisible();
  });
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bottom navigation and drawer are usable on a phone", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const bottomNav = page.getByRole("navigation", { name: "मोबाइल नेविगेशन" });
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole("link", { name: "समस्याएँ" }).click();
    await expect(page).toHaveURL(/\/issues$/);

    await page.getByRole("button", { name: "मेन्यू" }).click();
    const drawer = page.getByRole("dialog", { name: "मेन्यू" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "हिंदी" })).toBeVisible();
  });
});
