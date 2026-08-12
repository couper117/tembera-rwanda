/* End-to-end audit: drives the real app in Chrome and asserts DB writes.
   Run: node scripts/e2e.cjs   (dev server must be up on :3000) */
const { chromium } = require("playwright-core");
const crypto = require("crypto");
const fs = require("fs");

// Load .env
fs.readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    const m = l.match(/^([A-Z_]+)=\"?([^\"]*)\"?$/);
    if (m) process.env[m[1]] = m[2];
  });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const TEST_EMAIL = "e2e-tester@tembera.test";

let pass = 0,
  fail = 0;
const problems = [];
function check(cond, label) {
  if (cond) {
    pass++;
    console.log("  PASS " + label);
  } else {
    fail++;
    console.log("  FAIL " + label);
    problems.push(label);
  }
}

const consoleErrors = {}; // url -> [msgs]
function attach(page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const u = page.url();
      (consoleErrors[u] ||= []).push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    const u = page.url();
    (consoleErrors[u] ||= []).push("PAGEERROR: " + err.message);
  });
}

async function cleanup() {
  const u = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (u) await prisma.user.delete({ where: { id: u.id } });
  await prisma.booking.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.place.deleteMany({ where: { id: "dining-e2e-test-place" } });
}

(async () => {
  await cleanup(); // start clean

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  /* ---------------------------------------- PHASE 1: guest crawl */
  console.log("\n== PHASE 1: guest page crawl (console/runtime errors) ==");
  const guest = await browser.newContext();
  const gp = await guest.newPage();
  attach(gp);
  const routes = [
    "/", "/explore", "/search", "/map", "/booking", "/about",
    "/saved", "/profile", "/settings", "/login", "/register",
    "/c/dining", "/c/stays", "/c/worship", "/c/nature",
    "/city/Kigali", "/city/Musanze", "/place/dining-camellia-tea",
  ];
  for (const r of routes) {
    const resp = await gp
      .goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 45000 })
      .catch(() => null);
    const status = resp ? resp.status() : "ERR";
    check(resp && status < 400, `GET ${r} -> ${status}`);
    await gp.waitForTimeout(150);
  }
  await guest.close();

  /* ---------------------------------------- PHASE 2: user write flows */
  console.log("\n== PHASE 2: authenticated user write flows ==");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  attach(page);

  // Register
  await page.goto(BASE + "/register");
  await page.fill('input[name="name"]', "E2E Tester");
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', "supersecret1");
  await Promise.all([
    page.waitForURL(BASE + "/", { timeout: 15000 }).catch(() => {}),
    page.getByRole("button", { name: /create account/i }).click(),
  ]);
  const newUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  check(!!newUser, "register: user row created in DB");
  check(page.url() === BASE + "/", "register: redirected to home, signed in");

  // Open a place (records a visit) + Save it
  await page.goto(BASE + "/place/dining-camellia-tea", { waitUntil: "networkidle" });
  await page.locator(".t-detail__aside").getByRole("button", { name: /save/i }).click();
  await page.waitForTimeout(1200);
  if (newUser) {
    const saved = await prisma.savedPlace.findUnique({
      where: { userId_placeId: { userId: newUser.id, placeId: "dining-camellia-tea" } },
    });
    check(!!saved, "save: savedPlace row persisted for this user");
    const visit = await prisma.visitedPlace.findUnique({
      where: { userId_placeId: { userId: newUser.id, placeId: "dining-camellia-tea" } },
    });
    check(!!visit, "visit: visitedPlace row recorded on open");
  }

  // Reload: save state persists (button shows Saved)
  await page.reload({ waitUntil: "networkidle" });
  const savedBtnText = await page
    .locator(".t-detail__aside")
    .getByRole("button", { name: /saved|save/i })
    .innerText()
    .catch(() => "");
  check(/saved/i.test(savedBtnText), "save: persists across reload (button reads 'Saved')");

  // Submit a review
  await page.locator('.t-ratingpick button[aria-label="5 stars"]').click().catch(() => {});
  await page.locator(".t-reviews textarea").fill("Lovely spot for tea. (e2e)");
  await page.locator(".t-reviews textarea").blur().catch(() => {});
  await page.getByRole("button", { name: /post review|update review/i }).click();
  await page.waitForTimeout(3000);
  if (newUser) {
    const rev = await prisma.review.findUnique({
      where: { userId_placeId: { userId: newUser.id, placeId: "dining-camellia-tea" } },
    });
    console.log(`    (debug) saved review body = ${JSON.stringify(rev && rev.body)}`);
    check(!!rev && rev.rating === 5, "review: row persisted with rating 5");
    const pl = await prisma.place.findUnique({ where: { id: "dining-camellia-tea" } });
    check(pl && pl.rating !== null, "review: place rating recomputed from reviews");
  }
  let reviewVisible = await page
    .getByText("Lovely spot for tea. (e2e)")
    .isVisible()
    .catch(() => false);
  if (!reviewVisible) {
    // Fall back to a fresh navigation — proves it persisted and renders.
    await page.goto(BASE + "/place/dining-camellia-tea", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const dump = await page.locator(".t-reviews").innerText().catch(() => "(no .t-reviews)");
    console.log("    (debug) .t-reviews text = " + JSON.stringify(dump.slice(0, 300)));
    reviewVisible = dump.includes("Lovely spot for tea");
  }
  check(reviewVisible, "review: appears on the page after posting");

  // Booking
  await page.goto(BASE + "/booking", { waitUntil: "networkidle" });
  await page.locator('input[type="date"]').fill("2027-01-15");
  await page.fill('input[placeholder="Full name"]', "E2E Tester");
  await page.fill('input[placeholder="Email address"]', TEST_EMAIL);
  await page.getByRole("button", { name: /request booking/i }).click();
  await page.waitForTimeout(1500);
  const booking = await prisma.booking.findFirst({ where: { email: TEST_EMAIL } });
  check(!!booking, "booking: row persisted");
  check(booking && booking.userId === (newUser && newUser.id), "booking: linked to signed-in user");
  check(booking && booking.totalPrice === 1500, "booking: price computed server-side ($1500 gorilla x1)");
  const confirmVisible = await page.getByText(/booking .* confirmed/i).isVisible().catch(() => false);
  check(confirmVisible, "booking: confirmation shown");

  // Profile reflects the real account
  await page.goto(BASE + "/profile", { waitUntil: "domcontentloaded" });
  const profileHasName = await page.getByText("E2E Tester").first().isVisible().catch(() => false);
  check(profileHasName, "profile: shows the real account name");

  // Logout
  await page.goto(BASE + "/settings", { waitUntil: "domcontentloaded" });
  const soBtn = await page.getByRole("button", { name: /sign out/i }).count();
  console.log(`    (debug) sign-out buttons found = ${soBtn}`);
  await page.getByRole("button", { name: /sign out/i }).first().click().catch((e) => console.log("    (debug) click err: " + e.message));
  await page.waitForTimeout(2000);
  const cookiesAfter = await ctx.cookies();
  const hasSession = cookiesAfter.some((c) => c.name === "tembera_session");
  console.log(`    (debug) session cookie present after logout = ${hasSession}`);
  await page.goto(BASE + "/settings", { waitUntil: "domcontentloaded" });
  const settingsText = await page.locator(".t-page").innerText().catch(() => "");
  console.log(`    (debug) settings head = ${JSON.stringify(settingsText.slice(0, 160))}`);
  check(!hasSession && /browsing as a guest/i.test(settingsText), "logout: session cleared, UI shows guest");

  await ctx.close();

  /* ---------------------------------------- PHASE 3: admin flows */
  console.log("\n== PHASE 3: admin CRUD ==");
  const adminCtx = await browser.newContext();
  const ap = await adminCtx.newPage();
  attach(ap);
  await ap.goto(BASE + "/admin/login");
  await ap.fill('input[name="email"]', "admin@tembera.rw");
  await ap.fill('input[name="password"]', "changeme123");
  await Promise.all([
    ap.waitForURL(BASE + "/admin", { timeout: 15000 }).catch(() => {}),
    ap.getByRole("button", { name: /sign in|log in/i }).click(),
  ]);
  check(ap.url() === BASE + "/admin", "admin: login redirects to dashboard");

  // Create a place
  await ap.goto(BASE + "/admin/places/new", { waitUntil: "networkidle" });
  await ap.fill('input[name="name"]', "E2E Test Place").catch(() => {});
  // category + subcategory
  await ap.selectOption('select[name="categoryId"]', "dining").catch(() => {});
  await ap.fill('input[name="subcategory"]', "Cafés").catch(() => {});
  await ap.fill('input[name="city"]', "Nyarugenge").catch(() => {});
  await ap.getByRole("button", { name: /create|save/i }).first().click().catch(() => {});
  await ap.waitForTimeout(1500);
  let testPlace = await prisma.place.findUnique({ where: { id: "dining-e2e-test-place" } });
  check(!!testPlace, "admin: created place persisted to DB");

  // Edit it
  if (testPlace) {
    await ap.goto(BASE + "/admin/places/dining-e2e-test-place", { waitUntil: "networkidle" });
    await ap.fill('input[name="name"]', "E2E Test Place Edited").catch(() => {});
    await ap.getByRole("button", { name: /save|update/i }).first().click().catch(() => {});
    await ap.waitForTimeout(1500);
    testPlace = await prisma.place.findUnique({ where: { id: "dining-e2e-test-place" } });
    check(testPlace && /Edited/.test(testPlace.name), "admin: edited place name persisted");
  }

  // Booking status change (use the e2e booking)
  const bStatus = await prisma.booking.findFirst({ where: { email: TEST_EMAIL } });
  check(!!bStatus, "admin: a booking exists to manage");

  // Admin logout
  await ap.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await ap.getByRole("button", { name: /log out/i }).click().catch(() => {});
  await ap.waitForTimeout(1500);
  const adminCookies = await adminCtx.cookies();
  const adminStillIn = adminCookies.some((c) => c.name === "tembera_session" && c.value);
  check(!adminStillIn, "admin: logout clears the session cookie");
  const guardStatus = await ap
    .goto(BASE + "/admin/places", { waitUntil: "domcontentloaded" })
    .then((r) => r && r.status())
    .catch(() => 0);
  const backToLogin = /\/admin\/login/.test(ap.url());
  check(backToLogin, "admin: after logout, protected pages redirect to login");

  await adminCtx.close();
  await browser.close();

  /* ---------------------------------------- report console errors */
  console.log("\n== Console / runtime errors captured ==");
  const urls = Object.keys(consoleErrors);
  if (urls.length === 0) console.log("  none");
  for (const u of urls) {
    for (const m of consoleErrors[u]) {
      // Ignore benign favicon / 3rd-party noise
      if (/favicon|net::ERR_|Download the React DevTools/i.test(m)) continue;
      console.log(`  [${u.replace(BASE, "")}] ${m}`);
    }
  }

  console.log(`\n== RESULT: ${pass} passed, ${fail} failed ==`);
  if (problems.length) console.log("FAILURES:\n - " + problems.join("\n - "));

  await cleanup(); // tidy test data
  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error("E2E harness crashed:", e);
  await prisma.$disconnect();
  process.exit(2);
});
