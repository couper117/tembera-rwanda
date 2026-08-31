// End-to-end check of the admin dashboard, driven through a real browser.
//
// Grows as the dashboard is rebuilt. Every check reloads after acting: an
// assertion made on the page that submitted a form can pass on the optimistic
// render, which is the failure mode worth guarding against.
//
// Start the app first, then:
//   npx tsx scripts/e2e-admin.ts [baseUrl]
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:4040";
const ADMIN = { email: "admin@tembera.rw", password: "TemberaAdmin!2026" };

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

async function signIn(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);
}

async function run(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signIn(page);
  check("admin lands on the dashboard", page.url().endsWith("/admin"), page.url());

  /* ----------------------------------------------------- reports queue ---- */
  {
    await page.goto(`${BASE}/admin/reports`, { waitUntil: "networkidle" });
    const rows = await page.locator("table.a-table tbody tr").count();
    check("reports queue lists real reports", rows > 0, `${rows} rows`);

    const firstRow = page.locator("table.a-table tbody tr").first();
    const before = (await firstRow.textContent()) ?? "";

    // Resolve the first report, then reload and confirm the server kept it.
    await firstRow.locator("select").selectOption("resolved");
    await firstRow.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "networkidle" });

    const body = (await page.textContent("table.a-table")) ?? "";
    check(
      "resolving a report persists",
      body.includes("resolved"),
      before.slice(0, 40).trim(),
    );
  }

  /* ----------------------------------------------------- review hiding --- */
  {
    await page.goto(`${BASE}/admin/reviews`, { waitUntil: "networkidle" });
    const rows = await page.locator("table.a-table tbody tr").count();
    check("reviews queue lists real reviews", rows > 0, `${rows} rows`);

    const placeLink = await page
      .locator("table.a-table tbody tr")
      .first()
      .locator("a")
      .getAttribute("href");

    await page.locator('button:has-text("Hide")').first().click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "networkidle" });
    const afterHide = (await page.textContent("table.a-table")) ?? "";
    check("hiding a review persists", afterHide.includes("Show"));

    // The point of hiding: it has to leave the public page too.
    if (placeLink) {
      await page.goto(`${BASE}${placeLink}`, { waitUntil: "networkidle" });
      const publicBody = (await page.textContent("body")) ?? "";
      check(
        "a hidden review is gone from the public place page",
        !publicBody.includes("Lovely rooftop"),
      );
    }

    // Put it back, so the suite can run twice.
    await page.goto(`${BASE}/admin/reviews`, { waitUntil: "networkidle" });
    await page.locator('button:has-text("Show")').first().click();
    await page.waitForTimeout(1500);
    await page.reload({ waitUntil: "networkidle" });
    const afterShow = (await page.textContent("table.a-table")) ?? "";
    check("unhiding a review persists", afterShow.includes("Hide"));
  }

  /* ----------------------------------------------------- audit trail ----- */
  {
    await page.goto(`${BASE}/admin/activity`, { waitUntil: "networkidle" });
    const body = (await page.textContent("body")) ?? "";
    check(
      "the audit trail records what just happened",
      body.includes("report.resolved") || body.includes("review.hide"),
      "activity screen",
    );
  }

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
