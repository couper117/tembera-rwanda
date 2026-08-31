// End-to-end check of the business side: signing up, proposing a listing,
// having it approved, and the boundaries around what a business may do.
//
// Start the app first, then:
//   npx tsx scripts/e2e-business.ts [baseUrl]
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:4130";
const ADMIN = { email: "admin@tembera.rw", password: "TemberaAdmin!2026" };
const VISITOR = { email: "visitor@tembera.rw", password: "NewVisitorPass!2026" };

const stamp = Date.now();
const BIZ = {
  name: `E2E Lodge ${stamp}`,
  contact: "Test Owner",
  email: `biz-${stamp}@tembera.test`,
  phone: "+250 788 123 456",
  city: "Musanze",
  password: "biz-password-123",
};
const LISTING = `E2E Lodge Listing ${stamp}`;

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);
}

async function run(browser: Browser) {
  /* ------------------------------------------------------------- signup --- */
  const bizCtx = await browser.newContext();
  const biz = await bizCtx.newPage();

  await biz.goto(`${BASE}/business/register`, { waitUntil: "networkidle" });
  await biz.fill('input[name="businessName"]', BIZ.name);
  await biz.fill('input[name="contactName"]', BIZ.contact);
  await biz.fill('input[name="phone"]', BIZ.phone);
  await biz.fill('input[name="email"]', BIZ.email);
  await biz.fill('input[name="city"]', BIZ.city);
  await biz.fill('input[name="password"]', BIZ.password);
  await biz.click('form.a-form button[type="submit"]');
  await biz.waitForURL("**/business/dashboard", { timeout: 20000 }).catch(() => {});

  check(
    "registering a business lands on its dashboard",
    biz.url().includes("/business/dashboard"),
    biz.url(),
  );

  await biz.waitForLoadState("networkidle");
  const dash = (await biz.textContent("body")) ?? "";
  check("a new account is told it is unverified", dash.includes("not verified yet"), dash.slice(0, 0));

  /* -------------------------------------------------- proposing a listing -- */
  await biz.goto(`${BASE}/business/dashboard/listings/new`, { waitUntil: "networkidle" });
  await biz.fill('input[name="name"]', LISTING);
  await biz.selectOption('select[name="categoryId"]', "stays");
  await biz.fill('input[name="subcategory"]', "Lodges");
  await biz.locator('[role="tab"]:has-text("Where")').click();
  await biz.fill('input[name="city"]', BIZ.city);
  await biz.locator('[role="tab"]:has-text("About")').click();
  await biz.fill('textarea[name="description"]', "A lodge created by the e2e suite.");
  await biz.click('form.a-form button[type="submit"]');
  await biz.waitForTimeout(2500);

  check(
    "a proposal is accepted and says it is under review",
    ((await biz.textContent("body")) ?? "").toLowerCase().includes("review"),
  );

  /* ------------------------------------------------ the admin decides ------ */
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await signIn(admin, ADMIN.email, ADMIN.password);

  await admin.goto(`${BASE}/admin/submissions`, { waitUntil: "networkidle" });
  const queue = (await admin.textContent("body")) ?? "";
  check("the submission reaches the admin queue", queue.includes(BIZ.name));

  await admin.locator(`tr:has-text("${BIZ.name}") a:has-text("Open")`).first().click();
  await admin.waitForLoadState("networkidle");
  check(
    "the proposal is shown for review",
    ((await admin.textContent("body")) ?? "").includes(LISTING),
  );

  await admin.click('button:has-text("Approve and publish")');
  await admin.waitForURL("**/admin/places/**", { timeout: 20000 }).catch(() => {});
  check(
    "approving opens the new listing in admin",
    admin.url().includes("/admin/places/stays-e2e-lodge-listing"),
    admin.url(),
  );

  // The whole point: it is live, and it belongs to the business.
  const placeId = admin.url().split("/admin/places/")[1] ?? "";
  const publicRes = await admin.goto(`${BASE}/place/${placeId}`, {
    waitUntil: "domcontentloaded",
  });
  check("the approved listing is public", publicRes?.status() === 200, String(publicRes?.status()));

  await biz.goto(`${BASE}/business/dashboard/listings`, { waitUntil: "networkidle" });
  check(
    "the business now owns the listing",
    ((await biz.textContent("body")) ?? "").includes(LISTING),
  );

  /* ------------------------------------------- what a business may not do -- */
  {
    // An unverified business editing its own listing must be staged, not live.
    await biz.goto(`${BASE}/business/dashboard/listings/${placeId}`, {
      waitUntil: "networkidle",
    });
    check(
      "the name is locked on an existing listing",
      await biz.locator('input[name="name"]').isEditable().then((v) => !v),
    );
    check(
      "there is no status control for a business",
      (await biz.locator('select[name="status"]').count()) === 0,
    );
    check(
      "there is no rating control for a business",
      (await biz.locator('input[name="rating"]').count()) === 0,
    );

    await biz.fill('textarea[name="description"]', "Edited by the e2e suite.");
    await biz.click('form.a-form button[type="submit"]');
    await biz.waitForTimeout(2500);
    check(
      "an unverified edit is queued rather than published",
      ((await biz.textContent("body")) ?? "").includes("review"),
    );
  }

  /* ------------------------------------------ another account cannot reach - */
  {
    const otherCtx = await browser.newContext();
    const other = await otherCtx.newPage();
    await signIn(other, VISITOR.email, VISITOR.password);
    await other.goto(`${BASE}/business/dashboard`, { waitUntil: "domcontentloaded" });
    check(
      "a visitor cannot reach the business dashboard",
      !other.url().includes("/business/dashboard"),
      other.url(),
    );
    await otherCtx.close();
  }

  /* ------------------------------------------------------ verification ----- */
  {
    await admin.goto(`${BASE}/admin/businesses`, { waitUntil: "networkidle" });
    check(
      "the business appears in admin",
      ((await admin.textContent("body")) ?? "").includes(BIZ.name),
    );

    const row = admin.locator(`tr:has-text("${BIZ.name}")`).first();
    await row.locator("select").selectOption("verified");
    await row.locator('button:has-text("Save")').click();
    await admin.waitForTimeout(3000);
    await admin.reload({ waitUntil: "networkidle" });
    check(
      "verifying the business persists",
      ((await admin.textContent(`tr:has-text("${BIZ.name}")`)) ?? "").includes("verified"),
    );

    // Verified now, so the same edit should publish directly.
    await biz.goto(`${BASE}/business/dashboard/listings/${placeId}`, {
      waitUntil: "networkidle",
    });
    const marker = `Verified edit ${Date.now()}`;
    await biz.fill('textarea[name="description"]', marker);
    await biz.click('form.a-form button[type="submit"]');
    await biz.waitForTimeout(3500);

    await biz.goto(`${BASE}/place/${placeId}`, { waitUntil: "networkidle" });
    check(
      "a verified business publishes without review",
      ((await biz.textContent("body")) ?? "").includes(marker),
    );
  }

  await bizCtx.close();
  await adminCtx.close();

  console.log(`\n      (created ${BIZ.email} and listing ${placeId} on the dev branch)`);
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
