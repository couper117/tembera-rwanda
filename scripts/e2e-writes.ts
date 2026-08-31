// End-to-end check of the public write paths, driven through a real browser.
//
// Saves, visits and reviews all go through server actions with optimistic
// client state, so the only honest way to test them is to click the thing and
// then reload to see whether the server actually kept it. An assertion made
// without the reload would pass on optimistic state alone — which is precisely
// the bug this suite exists to catch.
//
// Start the app first, then:
//   npx tsx scripts/e2e-writes.ts [baseUrl]
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:4030";
const VISITOR = { email: "visitor@tembera.rw", password: "NewVisitorPass!2026" };

// A normal listing, and a memorial. The second is the invariant: a place of
// remembrance must not be reviewable, from either direction.
const PLACE = "dining-inzora-rooftop";
const MEMORIAL = "memorials-belgian-peacekeepers-memorial";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

async function signIn(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', VISITOR.email);
  await page.fill('input[name="password"]', VISITOR.password);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click('button[type="submit"]'),
  ]);
}

async function run(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signIn(page);
  check("signed in as a visitor", page.url().endsWith("/profile"), page.url());

  /* ------------------------------------------------- saving persists ------ */
  {
    await page.goto(`${BASE}/place/${PLACE}`, { waitUntil: "networkidle" });
    const save = page.locator('button[aria-pressed]').first();
    const before = await save.getAttribute("aria-pressed");
    await save.click();
    await page.waitForTimeout(1200);

    // The reload is the point: optimistic state does not survive it, so this
    // only passes if the server kept the row.
    await page.reload({ waitUntil: "networkidle" });
    const after = await page.locator('button[aria-pressed]').first().getAttribute("aria-pressed");
    check("saving a place survives a reload", before !== after, `${before} -> ${after}`);

    await page.goto(`${BASE}/saved`, { waitUntil: "networkidle" });
    const onSavedScreen = (await page.textContent("body"))?.includes("Inzora");
    check("the saved place appears on /saved", Boolean(onSavedScreen));
  }

  /* ------------------------------------------------- unsaving persists ---- */
  {
    await page.goto(`${BASE}/place/${PLACE}`, { waitUntil: "networkidle" });
    await page.locator("button[aria-pressed]").first().click();
    await page.waitForTimeout(1200);

    // Assert on the place page after a reload rather than on /saved. Next's
    // client router caches RSC payloads for a short while, so navigating to
    // /saved can serve the pre-unsave render even though the row is already
    // gone — which reads as a failed write when nothing failed. A reload is
    // server-rendered and therefore authoritative.
    await page.reload({ waitUntil: "networkidle" });
    const pressed = await page
      .locator("button[aria-pressed]")
      .first()
      .getAttribute("aria-pressed");
    check("unsaving also persists", pressed === "false", `aria-pressed=${pressed}`);
  }

  /* ------------------------------------------------- visit history -------- */
  {
    await page.goto(`${BASE}/place/${PLACE}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    check("opening a place records a visit on the profile", Boolean(body?.includes("Inzora")));
  }

  /* ------------------------------------------------- reviews -------------- */
  {
    await page.goto(`${BASE}/place/${PLACE}`, { waitUntil: "networkidle" });
    const stars = page.locator('[role="group"][aria-label="Your rating"] button');
    const hasForm = (await stars.count()) > 0;
    check("a signed-in visitor gets the review form", hasForm);

    if (hasForm) {
      await stars.nth(4).click();
      await page.fill("textarea", "Lovely rooftop, good coffee and a real view over the city.");
      // "Post review" the first time, "Update review" once one exists — the
      // suite has to work on a database that already has state.
      await page.click(
        'button:has-text("Post review"), button:has-text("Update review")',
      );
      await page.waitForTimeout(1500);

      await page.reload({ waitUntil: "networkidle" });
      const body = await page.textContent("body");
      check("the review survives a reload", Boolean(body?.includes("Lovely rooftop")));
    }
  }

  /* ------------------------------------------------- the invariant -------- */
  {
    await page.goto(`${BASE}/place/${MEMORIAL}`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const stars = await page
      .locator('[role="group"][aria-label="Your rating"] button')
      .count();
    check("a memorial offers no review form", stars === 0, `${stars} stars`);
    check("a memorial shows no rating", !body?.includes("Ratings & reviews"));
  }

  /* ------------------------------------------------- reporting ------------ */
  {
    await page.goto(`${BASE}/place/${PLACE}`, { waitUntil: "networkidle" });
    const trigger = page.locator('button:has-text("Report a problem")').first();
    if (await trigger.count()) {
      await trigger.click();
      await page.fill('textarea[name="body"]', "The phone number rings out.");
      await page.click('button:has-text("Send report")');
      await page.waitForTimeout(1500);
      const body = await page.textContent("body");
      check(
        "a report is accepted",
        Boolean(body?.includes("Thank")) || Boolean(body?.includes("thank")),
      );
    } else {
      check("report control is present", false, "trigger not found");
    }
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
