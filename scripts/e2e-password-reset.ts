// End-to-end check of the forgotten-password flow, driven through a real
// browser.
//
// Like the other e2e scripts, this cannot be done with curl: both forms are
// React server actions reached via useActionState, and hand-rolling that wire
// format would test the encoding rather than the product.
//
// The one thing a browser cannot do here is read the email. Rather than
// scraping the server's stdout for the link — which would make the test a
// hostage to log formatting — the script writes its own token row using the
// same hash the action does. That exercises the half that matters (a token
// arriving from outside, validated and spent) and keeps the test deterministic.
//
// It works on a throwaway account it creates and deletes, so it never disturbs
// the shared seeded logins.
//
// Start the app first, then:
//   npx tsx scripts/e2e-password-reset.ts [baseUrl]
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { chromium, type Browser, type Page } from "playwright-core";

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

const BASE = process.argv[2] ?? "http://localhost:3001";

const EMAIL = "e2e-reset@tembera.rw";
const OLD_PASSWORD = "OldResetPass!2026";
const NEW_PASSWORD = "FreshResetPass!2026";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const identifier = `reset:${EMAIL}`;

/** Put a known token in the table, exactly as requestResetAction would. */
async function issueToken(expires: Date): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashToken(token), expires },
  });
  return token;
}

async function requestReset(page: Page, email: string) {
  await page.goto(`${BASE}/forgot`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);
}

async function run(browser: Browser) {
  /* ------------------------------------------------- an unknown address ---- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await requestReset(page, "definitely-not-a-user@tembera.rw");

    const body = (await page.textContent("body")) ?? "";
    check(
      "an unknown address gets the same 'check your inbox' answer",
      body.includes("Check your inbox"),
      "no account enumeration",
    );
    check(
      "…and no token is written for it",
      (await prisma.verificationToken.count({
        where: { identifier: "reset:definitely-not-a-user@tembera.rw" },
      })) === 0,
    );
    await ctx.close();
  }

  /* ------------------------------------------------ a real address ---------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await requestReset(page, EMAIL);

    const body = (await page.textContent("body")) ?? "";
    check("a real address reaches the confirmation screen", body.includes("Check your inbox"));

    const row = await prisma.verificationToken.findFirst({ where: { identifier } });
    check("…and a token row is written", row !== null);
    check(
      "…stored hashed, never in the clear",
      row !== null && /^[0-9a-f]{64}$/.test(row.token),
      row ? `${row.token.slice(0, 12)}…` : "",
    );
    await ctx.close();
  }

  /* ------------------------------------------------ an expired token -------- */
  {
    const token = await issueToken(new Date(Date.now() - 60_000));
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/reset/${token}`, { waitUntil: "domcontentloaded" });

    const body = (await page.textContent("body")) ?? "";
    check("an expired link is refused", body.includes("This link has expired"));
    await ctx.close();
  }

  /* ------------------------------------------------ a garbage token --------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/reset/not-a-real-token`, { waitUntil: "domcontentloaded" });

    const body = (await page.textContent("body")) ?? "";
    check("a made-up link is refused", body.includes("This link has expired"));
    await ctx.close();
  }

  /* ------------------------------------------------ the happy path ---------- */
  let spentToken = "";
  {
    const token = await issueToken(new Date(Date.now() + 60 * 60 * 1000));
    spentToken = token;

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/reset/${token}`, { waitUntil: "domcontentloaded" });

    check(
      "a live link opens the form",
      (await page.locator('input[name="password"]').count()) === 1,
    );

    await page.fill('input[name="password"]', NEW_PASSWORD);
    await page.fill('input[name="confirm"]', NEW_PASSWORD);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.click('button[type="submit"]'),
    ]);

    const body = (await page.textContent("body")) ?? "";
    check("setting a new password succeeds", body.includes("Password changed"));

    const row = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { passwordHash: true, tokenVersion: true },
    });
    check(
      "…the new password is the one stored",
      row !== null && (await bcrypt.compare(NEW_PASSWORD, row.passwordHash)),
    );
    check(
      "…the old password no longer works",
      row !== null && !(await bcrypt.compare(OLD_PASSWORD, row.passwordHash)),
    );
    check(
      "…every other session is revoked (tokenVersion bumped)",
      row !== null && row.tokenVersion > 0,
      `tokenVersion=${row?.tokenVersion}`,
    );
    check(
      "…and the token is spent",
      (await prisma.verificationToken.count({ where: { identifier } })) === 0,
    );
    await ctx.close();
  }

  /* ------------------------------------------------ replay the same link ---- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/reset/${spentToken}`, { waitUntil: "domcontentloaded" });

    const body = (await page.textContent("body")) ?? "";
    check("a spent link cannot be used twice", body.includes("This link has expired"));
    await ctx.close();
  }

  /* ------------------------------------------------ sign in for real -------- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', NEW_PASSWORD);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      page.click('button[type="submit"]'),
    ]);

    check(
      "the reset password actually signs in",
      page.url().endsWith("/profile"),
      page.url(),
    );
    await ctx.close();
  }

  /* ------------------------------------------------ the link on /login ------ */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    check(
      "the login screen offers a way out",
      (await page.locator('a[href="/forgot"]').count()) === 1,
    );
    await ctx.close();
  }
}

async function setUp() {
  await tearDown();
  await prisma.user.create({
    data: {
      email: EMAIL,
      name: "Reset Test",
      handle: `e2ereset${Date.now().toString().slice(-6)}`,
      passwordHash: await bcrypt.hash(OLD_PASSWORD, 10),
      role: "USER",
    },
  });
}

async function tearDown() {
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

(async () => {
  await setUp();
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    await run(browser);
  } finally {
    await browser.close();
    await tearDown();
    await prisma.$disconnect();
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await tearDown().catch(() => {});
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
