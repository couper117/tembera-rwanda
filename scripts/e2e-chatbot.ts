// End-to-end check of the travel assistant, driven through a real browser.
//
// The two things worth checking here cannot be seen from the API: whether the
// markdown in a reply renders as links and lists rather than as its own source
// text, and whether the panel fits on a phone. Both were broken.
//
// Start the app first, then:
//   npx tsx scripts/e2e-chatbot.ts [baseUrl]
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";

const PHONE = { width: 360, height: 640 };
const SMALL_PHONE = { width: 320, height: 568 };
const DESKTOP = { width: 1440, height: 900 };

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

async function openChat(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".t-chatbot__fab", { timeout: 15_000 });
  await page.click(".t-chatbot__fab");
  await page.waitForSelector(".t-chatbot__panel:not([hidden])", { timeout: 5_000 });
}

async function ask(page: Page, question: string) {
  await page.fill(".t-chatbot__composer input", question);
  await page.click(".t-chatbot__composer button[type=submit]");
  // The typing indicator appears, then the reply replaces it.
  await page.waitForFunction(
    () => document.querySelectorAll(".t-chatbot__message--assistant").length >= 2 &&
      !document.querySelector(".t-chatbot__typing"),
    undefined,
    { timeout: 30_000 },
  );
}

async function run(browser: Browser) {
  /* ------------------------------------------- the reply renders as markup */
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await openChat(page);
    await ask(page, "where can I find coffee in Kigali?");

    const last = page.locator(".t-chatbot__message--assistant").last();
    const text = (await last.innerText()).trim();

    check(
      "reply is not raw markdown source",
      !text.includes("**") && !text.includes("](/place/"),
      text.slice(0, 60),
    );

    const links = last.locator("a");
    const linkCount = await links.count();
    check("reply renders real links", linkCount > 0, `${linkCount} anchors`);

    if (linkCount > 0) {
      const hrefs = await links.evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
      check(
        "links point at real listing pages",
        hrefs.some((h) => h.startsWith("/place/")),
        hrefs.slice(0, 2).join(", "),
      );
      check(
        "no javascript: or data: target survived",
        !hrefs.some((h) => /^(javascript|data|vbscript):/i.test(h.trim())),
      );

      // The links must actually resolve — the whole point of grounding the
      // model in the catalogue is that it cannot invent an id.
      const target = hrefs.find((h) => h.startsWith("/place/"))!;
      const res = await page.request.get(`${BASE}${target}`);
      check(`${target} resolves`, res.status() === 200, `HTTP ${res.status()}`);
    }

    const bullets = await last.locator("li").count();
    check("list items render as list items", bullets > 0, `${bullets} <li>`);

    await ctx.close();
  }

  /* ------------------------------------------------ it fits a small phone */
  for (const viewport of [PHONE, SMALL_PHONE]) {
    const label = `${viewport.width}x${viewport.height}`;
    const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await openChat(page);

    const box = await page.locator(".t-chatbot__panel").boundingBox();
    check(`${label}: panel has a box`, !!box);
    if (!box) {
      await ctx.close();
      continue;
    }

    // The old panel was anchored above a container already lifted off the
    // bottom nav, so on a short screen its header sat off the top of the
    // window and the close button could not be reached.
    check(`${label}: panel top is on screen`, box.y >= 0, `y=${Math.round(box.y)}`);
    check(
      `${label}: panel bottom is on screen`,
      box.y + box.height <= viewport.height + 1,
      `bottom=${Math.round(box.y + box.height)}`,
    );
    check(
      `${label}: panel fits the width`,
      box.x >= -1 && box.x + box.width <= viewport.width + 1,
      `x=${Math.round(box.x)} w=${Math.round(box.width)}`,
    );

    for (const [name, selector] of [
      ["close button", ".t-chatbot__action[aria-label='Close assistant']"],
      ["composer", ".t-chatbot__composer input"],
      ["send button", ".t-chatbot__composer button[type=submit]"],
    ] as const) {
      const el = await page.locator(selector).boundingBox();
      const visible =
        !!el && el.y >= 0 && el.y + el.height <= viewport.height + 1 && el.width > 0;
      check(`${label}: ${name} is reachable`, visible, el ? `y=${Math.round(el.y)}` : "no box");
    }

    // A horizontal scrollbar on the page behind the sheet is the usual sign
    // that a fixed panel is wider than the window.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check(`${label}: page does not scroll sideways`, !overflows);

    // 16px or the browser zooms the page when the field takes focus.
    const fontSize = await page.evaluate(() => {
      const input = document.querySelector(".t-chatbot__composer input");
      return input ? parseFloat(getComputedStyle(input).fontSize) : 0;
    });
    check(`${label}: composer font is >= 16px`, fontSize >= 16, `${fontSize}px`);

    await ctx.close();
  }

  /* ------------------------------------------------------------- desktop */
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await openChat(page);

    const box = await page.locator(".t-chatbot__panel").boundingBox();
    check("desktop: panel is a card, not full width", !!box && box.width <= 420, `w=${Math.round(box?.width ?? 0)}`);
    check("desktop: panel is on screen", !!box && box.y >= 0 && box.y + box.height <= 900);

    // Escape closes, and focus goes back to the button that opened it.
    await page.keyboard.press("Escape");
    const hidden = await page.locator(".t-chatbot__panel").isHidden();
    check("desktop: Escape closes the panel", hidden);
    const focusReturned = await page.evaluate(() =>
      document.activeElement?.classList.contains("t-chatbot__fab"),
    );
    check("desktop: focus returns to the launcher", !!focusReturned);

    await ctx.close();
  }

  /* ------------------------------- the widget stays off the pages it should */
  //
  // Signed out, /admin redirects to /login. Both are places the assistant must
  // not appear: the sign-in screen because it is a form, /admin because it has
  // its own chrome. Asserting on a 404 would pass for the wrong reason, so the
  // status is checked too.
  for (const path of ["/login", "/register", "/admin"]) {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    check(`${path} is a real page`, (res?.status() ?? 0) < 400, `HTTP ${res?.status()}`);
    const fab = await page.locator(".t-chatbot__fab").count();
    check(`no assistant on ${path} (landed on ${new URL(page.url()).pathname})`, fab === 0);
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium
    .launch({ channel: "chrome" })
    .catch(() => chromium.launch());
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
  console.log(`
${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
