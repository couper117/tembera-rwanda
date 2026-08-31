// End-to-end check of the sign-in paths, driven through a real browser.
//
// These flows cannot be exercised with curl: the login and register forms are
// React server actions reached via useActionState, whose wire format binds the
// previous state alongside the FormData. Hand-rolling that payload tests the
// encoding, not the product. A browser submits the real thing.
//
// Start the app first, then:
//   npx tsx scripts/e2e-auth.ts [baseUrl]
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:4020";

const ACCOUNTS = {
  admin: { email: "admin@tembera.rw", password: "TemberaAdmin!2026" },
  editor: { email: "editor@tembera.rw", password: "TemberaEditor!2026" },
  visitor: { email: "visitor@tembera.rw", password: "NewVisitorPass!2026" },
};

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

async function signIn(page: Page, email: string, password: string, path = "/login") {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);
}

async function run(browser: Browser) {
  /* ---------------- an ADMIN can sign in from the PUBLIC login page -------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

    const url = page.url();
    check("admin signs in at /login and leaves the login page", !url.includes("/login"), url);

    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    check(
      "admin reaches /admin using the session from /login",
      page.url().endsWith("/admin"),
      page.url(),
    );
    await ctx.close();
  }

  /* ---------------- an EDITOR can too, and is still not an admin ---------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, ACCOUNTS.editor.email, ACCOUNTS.editor.password);
    check("editor signs in at /login", !page.url().includes("/login"), page.url());

    await page.goto(`${BASE}/admin/places`, { waitUntil: "domcontentloaded" });
    check("editor reaches /admin/places", page.url().endsWith("/admin/places"));

    await page.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded" });
    check("editor is refused /admin/users", !page.url().endsWith("/admin/users"), page.url());
    await ctx.close();
  }

  /* ---------------- an ordinary visitor signs in but gets no admin -------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, ACCOUNTS.visitor.email, ACCOUNTS.visitor.password);
    check("visitor signs in at /login", !page.url().includes("/login"), page.url());

    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    check("visitor is refused /admin", page.url().includes("/admin/login"), page.url());
    await ctx.close();
  }

  /* ---------------- a wrong password is rejected, and says so ------------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signIn(page, ACCOUNTS.admin.email, "definitely-not-the-password");
    const body = await page.textContent("body");
    check("wrong password stays on /login", page.url().includes("/login"), page.url());
    check(
      "wrong password shows an error and does not reveal whether the account exists",
      Boolean(body?.includes("incorrect")) && !body?.includes("no account"),
    );
    await ctx.close();
  }

  /* ---------------- registration creates a working account --------------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = `e2e-${Date.now()}@tembera.test`;

    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="name"]', "E2E Test Person");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "e2e-password-123");
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.click('button[type="submit"]'),
    ]);
    check("registration leaves /register", !page.url().includes("/register"), page.url());

    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    check(
      "a newly registered account is NOT staff",
      page.url().includes("/admin/login"),
      page.url(),
    );
    await ctx.close();
    console.log(`      (registered ${email} — delete it if you are tidying the dev branch)`);
  }
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
