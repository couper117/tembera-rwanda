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

  /* ----------------------------------------------------- places list ----- */
  {
    await page.goto(`${BASE}/admin/places`, { waitUntil: "networkidle" });
    const body = (await page.textContent("body")) ?? "";
    check("places list loads the catalogue", body.includes("listings in the catalogue"));

    await page.goto(`${BASE}/admin/places?gap=no-photo`, { waitUntil: "networkidle" });
    const filtered = (await page.textContent("body")) ?? "";
    check(
      "the missing-photo filter narrows the list",
      /\d+ of \d+ listings match/.test(filtered),
      filtered.match(/\d+ of \d+ listings match/)?.[0] ?? "",
    );
  }

  /* ----------------------------------------------------- archive/restore - */
  {
    const TARGET = "dining-inzora-rooftop";

    await page.goto(`${BASE}/admin/places?q=inzora`, { waitUntil: "networkidle" });
    // ConfirmButton arms on the first click, REPLACING itself with Sure?/Yes/No
    // — so the confirming click lands on Yes, not on the original button.
    await page.locator('button:has-text("Archive")').first().click();
    await page.locator('button:has-text("Yes")').first().click();
    await page.waitForTimeout(2000);

    const publicRes = await page.goto(`${BASE}/place/${TARGET}`, {
      waitUntil: "domcontentloaded",
    });
    check(
      "an archived place leaves the public catalogue",
      publicRes?.status() === 404,
      String(publicRes?.status()),
    );

    await page.goto(`${BASE}/admin/places?q=inzora`, { waitUntil: "networkidle" });
    const stillListed = (await page.textContent("table.a-table")) ?? "";
    check("an archived place is still listed in admin", stillListed.includes("Inzora"));
    // Read the badge inside the table, not the page: the status filter's own
    // <option value="archived"> would make a whole-page check pass whether or
    // not any row is actually archived.
    const badge = await page.locator("table.a-table .a-badge").first().textContent();
    check("...and shows as archived", badge?.trim() === "archived", badge ?? "none");

    await page.locator('button:has-text("Restore")').first().click();
    await page.waitForTimeout(1800);
    const restored = await page.goto(`${BASE}/place/${TARGET}`, {
      waitUntil: "domcontentloaded",
    });
    check(
      "restoring puts it back on the public site",
      restored?.status() === 200,
      String(restored?.status()),
    );
  }

  /* ----------------------------------------------------- editing a place - */
  {
    await page.goto(`${BASE}/admin/places/dining-inzora-rooftop`, {
      waitUntil: "networkidle",
    });

    // This suite edits a real listing, so put the copy back afterwards rather
    // than leaving test text in the catalogue.
    const original = await page.inputValue('textarea[name="description"]');

    const marker = `Verified by the e2e suite at ${new Date().toISOString()}`;
    await page.fill('textarea[name="description"]', marker);
    // Scoped to the form: the admin topbar carries its own search form, and a
    // bare button[type=submit] matches that one first and navigates away.
    await page.click('form.a-form button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.reload({ waitUntil: "networkidle" });
    const value = await page.inputValue('textarea[name="description"]');
    check("editing a place saves", value === marker, value.slice(0, 40));

    // Invalid input must be refused rather than silently stored.
    await page.fill('input[name="website"]', "this is not a web address");
    await page.click('form.a-form button[type="submit"]');
    await page.waitForTimeout(2000);
    const afterBad = (await page.textContent("body")) ?? "";
    check(
      "an invalid website is rejected with a message",
      afterBad.includes("valid web address"),
    );

    // Clear the bad value and restore the original copy.
    await page.fill('input[name="website"]', "");
    await page.fill('textarea[name="description"]', original);
    await page.click('form.a-form button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: "networkidle" });
    const restoredCopy = await page.inputValue('textarea[name="description"]');
    check("the listing is left as it was found", restoredCopy === original);
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
