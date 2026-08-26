/* Authentication end-to-end checks: the behaviours that cannot be unit tested
   because they need a real request, a real cookie jar and a real database.
   Covers login rate limiting and session revocation.

   Run: npm run test:auth   (dev server must be up on :3000)

   Leaves the demo account exactly as it found it. Requires the demo user, so
   seed with SEED_DEMO_USER=true. */
const { chromium } = require("playwright-core");
const fs = require("fs");

const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((p) => p && fs.existsSync(p))[0];

if (!CHROME) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to your browser.");
  process.exit(1);
}

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "demo@tembera.rw";
const OLD_PW = "demo12345";
const NEW_PW = "temporary-verify-pw";

let failures = 0;
function check(cond, label) {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

async function signIn(context, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  return page;
}

/* ------------------------------------------------------- rate limiting */

async function checkRateLimiting(browser) {
  console.log("\nRate limiting");

  // A fresh context each run; the limiter keys on address and account, and the
  // account key is what this exercises.
  const context = await browser.newContext();
  const page = await context.newPage();

  let blockedAt = null;
  const ATTEMPTS = 8; // admin limit is 5 per account per 15 minutes

  for (let i = 1; i <= ATTEMPTS; i++) {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "admin@tembera.rw");
    await page.fill('input[name="password"]', `wrong-guess-${i}`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);

    const body = await page.textContent("body");
    if (/Too many attempts/.test(body) && blockedAt === null) blockedAt = i;
  }

  check(blockedAt !== null, "repeated bad admin logins are eventually blocked");
  check(
    blockedAt !== null && blockedAt <= 6,
    `blocked by the 6th attempt (was ${blockedAt ?? "never"})`,
  );

  await context.close();
}

/* --------------------------------------------------- session revocation */

async function checkRevocation(browser) {
  console.log("\nSession revocation");

  // Device A stands in for a second phone — or a stolen cookie.
  const deviceA = await browser.newContext();
  const pageA = await signIn(deviceA, OLD_PW);
  const session = (await deviceA.cookies()).find((c) => c.name === "tembera_session");
  check(!!session, "device A signed in and holds a session cookie");

  if (!session) return;

  // Device B changes the password.
  const deviceB = await browser.newContext();
  const pageB = await signIn(deviceB, OLD_PW);
  await pageB.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await pageB.waitForTimeout(1200);

  await pageB.fill('input[name="current"]', OLD_PW);
  await pageB.fill('input[name="next"]', NEW_PW);
  await pageB.click('button:has-text("Change password")');
  await pageB.waitForTimeout(3000);
  check(/Password changed/.test(await pageB.textContent("body")), "password changed");

  // Replay device A's original cookie. This is the actual test: a well-signed,
  // unexpired cookie must still be refused because its tokenVersion is stale.
  const replay = await browser.newContext();
  await replay.addCookies([session]);
  const pageC = await replay.newPage();
  await pageC.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await pageC.waitForTimeout(1500);

  const signedOut =
    /\/login/.test(pageC.url()) ||
    /Sign in|Create account/.test(await pageC.textContent("body"));
  check(signedOut, "the old cookie no longer grants a session");

  // The person who proved they know the password must not be logged out by
  // their own change.
  await pageB.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await pageB.waitForTimeout(1200);
  check(
    /Sign out on all devices/.test(await pageB.textContent("body")),
    "the device that changed the password stays signed in",
  );

  // Put the demo account back as we found it.
  await pageB.fill('input[name="current"]', NEW_PW);
  await pageB.fill('input[name="next"]', OLD_PW);
  await pageB.click('button:has-text("Change password")');
  await pageB.waitForTimeout(3000);
  check(
    /Password changed/.test(await pageB.textContent("body")),
    "demo password restored",
  );

  await deviceA.close();
  await deviceB.close();
  await replay.close();
}

/* ------------------------------------------------------------------ run */

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  // Revocation first: rate limiting leaves the admin account throttled for 15
  // minutes, and a throttled login would break any sign-in that follows it.
  await checkRevocation(browser);
  await checkRateLimiting(browser);

  await browser.close();

  console.log("");
  console.log(failures === 0 ? "  ALL CHECKS PASSED" : `  ${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
