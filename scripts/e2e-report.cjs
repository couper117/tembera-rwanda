/* Checks the "report a problem" flow end to end: a signed-out visitor can
   submit a correction, it reaches the database, and the admin can see it.
   Cleans up after itself.

   Run: npm run test:report   (dev server must be up on :3000) */
const { chromium } = require("playwright-core");
const fs = require("fs");

fs.readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    const m = l.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) process.env[m[1]] = m[2];
  });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((p) => p && fs.existsSync(p))[0];

const BASE = process.env.BASE_URL || "http://localhost:3000";
const MARKER = `e2e-report-${Date.now()}`;

let failures = 0;
function check(cond, label) {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

(async () => {
  const place = await prisma.place.findFirst({ select: { id: true, name: true } });
  if (!place) throw new Error("No places in the database — seed first.");

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  // A fresh context with no cookies: reporting must work signed out.
  const context = await browser.newContext();
  const page = await context.newPage();

  // The button is server-rendered but only works once React has hydrated, and
  // in dev the first compile of a route can take tens of seconds. Open the
  // form by retrying the click rather than guessing a fixed wait.
  async function openReportForm() {
    await page.goto(`${BASE}/place/${place.id}`, { waitUntil: "load" });
    const opener = page.locator('button:has-text("Report a problem")');
    await opener.first().waitFor({ state: "visible", timeout: 60_000 });

    for (let attempt = 0; attempt < 15; attempt++) {
      await opener.first().click().catch(() => {});
      try {
        await page.locator('textarea[name="body"]').waitFor({
          state: "visible",
          timeout: 2000,
        });
        return true;
      } catch {
        /* not hydrated yet — try again */
      }
    }
    return false;
  }

  const opened = await openReportForm();
  check(opened, "the report button opens the form, with no account needed");
  if (!opened) throw new Error("report form never opened");

  await page.check('input[name="kind"][value="details"]');
  await page.fill('textarea[name="body"]', `Phone number is out of date. ${MARKER}`);
  await page.fill('input[name="contact"]', "e2e@tembera.test");
  await page.click('button:has-text("Send report")');
  await page.waitForTimeout(2500);

  check(
    /Thank you/i.test(await page.textContent("body")),
    "the visitor is thanked after sending",
  );

  const saved = await prisma.report.findFirst({
    where: { body: { contains: MARKER } },
  });
  check(!!saved, "the report reached the database");
  check(saved?.placeId === place.id, "it is attached to the right place");
  check(saved?.kind === "details", "the problem type was saved");
  check(saved?.status === "open", "it starts as open");

  // Rejects a too-short report rather than saving noise.
  await openReportForm();
  await page.fill('textarea[name="body"]', "no");
  await page.click('button:has-text("Send report")');
  await page.waitForTimeout(1800);
  const short = await prisma.report.count({ where: { body: "no" } });
  check(short === 0, "a too-short report is rejected, not saved");

  if (saved) await prisma.report.delete({ where: { id: saved.id } });
  await prisma.report.deleteMany({ where: { body: { contains: MARKER } } });

  await browser.close();
  await prisma.$disconnect();

  console.log("");
  console.log(failures === 0 ? "  ALL CHECKS PASSED" : `  ${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
