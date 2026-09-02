import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { parseInline, parseMarkdown, safeHref, type Inline } from "../lib/ai/markdown";

/** The text a reader would see, with the markup applied rather than printed. */
function visibleText(spans: Inline[]): string {
  return spans
    .map((span) => {
      if (span.kind === "bold" || span.kind === "italic") return visibleText(span.spans);
      return span.text;
    })
    .join("");
}

describe("safeHref", () => {
  test("accepts in-app paths", () => {
    assert.deepEqual(safeHref("/place/dining-question-coffee"), {
      href: "/place/dining-question-coffee",
      external: false,
    });
  });

  test("accepts http and https, marking them external", () => {
    assert.equal(safeHref("https://visitrwanda.com")?.external, true);
    assert.equal(safeHref("http://example.com")?.external, true);
  });

  test("rejects javascript: however it is dressed up", () => {
    // The reply is model output, and the model can be asked to repeat a string.
    assert.equal(safeHref("javascript:alert(1)"), null);
    assert.equal(safeHref("JavaScript:alert(1)"), null);
    assert.equal(safeHref("  javascript:alert(1)  "), null);
  });

  test("rejects data:, vbscript: and protocol-relative URLs", () => {
    assert.equal(safeHref("data:text/html;base64,PHNjcmlwdD4="), null);
    assert.equal(safeHref("vbscript:msgbox"), null);
    // "//evil.example" would inherit the page's scheme and leave the site.
    assert.equal(safeHref("//evil.example/steal"), null);
  });

  test("rejects an empty target", () => {
    assert.equal(safeHref(""), null);
    assert.equal(safeHref("   "), null);
  });
});

describe("parseInline", () => {
  test("splits bold, italic and code out of surrounding text", () => {
    assert.deepEqual(parseInline("try **this** or *that* or `code`"), [
      { kind: "text", text: "try " },
      { kind: "bold", spans: [{ kind: "text", text: "this" }] },
      { kind: "text", text: " or " },
      { kind: "italic", spans: [{ kind: "text", text: "that" }] },
      { kind: "text", text: " or " },
      { kind: "code", text: "code" },
    ]);
  });

  test("turns a place link into a link span", () => {
    assert.deepEqual(parseInline("Visit [Repub Lounge](/place/repub)"), [
      { kind: "text", text: "Visit " },
      { kind: "link", text: "Repub Lounge", href: "/place/repub", external: false },
    ]);
  });

  test("keeps the label when the target is unusable", () => {
    // The sentence must still read, rather than losing a word to a bad href.
    const spans = parseInline("Click [here](javascript:void) now");
    assert.equal(spans.every((s) => s.kind === "text"), true);
    assert.equal(visibleText(spans), "Click here now");
  });

  test("produces no link for a javascript: target, however the parens fall", () => {
    // An unescaped ")" ends the token early, so the href is a truncated
    // "javascript:alert(1" — still rejected. The stray bracket is cosmetic;
    // what matters is that nothing here becomes an anchor.
    const spans = parseInline("Click [here](javascript:alert(1)) now");
    assert.equal(spans.some((s) => s.kind === "link"), false);
  });

  test("a bold link stays a link", () => {
    // The model writes "**[Repub Lounge](/place/repub)**" constantly. Flat
    // bold swallowed the whole thing and printed the brackets and the URL.
    const spans = parseInline("**[Repub Lounge](/place/repub)**");
    assert.equal(spans.length, 1);
    assert.equal(spans[0].kind, "bold");
    if (spans[0].kind === "bold") {
      assert.deepEqual(spans[0].spans, [
        { kind: "link", text: "Repub Lounge", href: "/place/repub", external: false },
      ]);
    }
  });

  test("a bold list entry keeps both the link and the trailing prose", () => {
    const spans = parseInline("**[Bisate Lodge](/place/stays-bisate)** — Lodges in Musanze");
    assert.equal(spans.some((s) => s.kind === "bold"), true);
    assert.equal(visibleText(spans), "Bisate Lodge — Lodges in Musanze");
    assert.ok(!visibleText(spans).includes("]("));
  });

  test("backticks suppress the markup inside them", () => {
    assert.deepEqual(parseInline("`**not bold**`"), [
      { kind: "code", text: "**not bold**" },
    ]);
  });

  test("leaves markup that is never closed as plain text", () => {
    assert.deepEqual(parseInline("2 ** 3 is not bold"), [
      { kind: "text", text: "2 ** 3 is not bold" },
    ]);
  });

  test("does not treat raw HTML as markup", () => {
    const spans = parseInline("<img src=x onerror=alert(1)>");
    assert.deepEqual(spans, [{ kind: "text", text: "<img src=x onerror=alert(1)>" }]);
  });
});

describe("parseMarkdown", () => {
  test("collapses every heading level into h3/h4", () => {
    const blocks = parseMarkdown("# One\n\n## Two\n\n#### Four");
    assert.deepEqual(
      blocks.map((b) => (b.kind === "heading" ? b.level : b.kind)),
      [3, 3, 4],
    );
  });

  test("groups consecutive bullets into one list", () => {
    const blocks = parseMarkdown("- one\n- two\n- three");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].kind, "list");
    if (blocks[0].kind === "list") {
      assert.equal(blocks[0].ordered, false);
      assert.equal(blocks[0].items.length, 3);
    }
  });

  test("starts a new list when the marker changes from bullet to number", () => {
    const blocks = parseMarkdown("- one\n1. two");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].kind === "list" && blocks[0].ordered, false);
    assert.equal(blocks[1].kind === "list" && blocks[1].ordered, true);
  });

  test("an indented line under a bullet continues that bullet", () => {
    // Catalogue entries are a name line plus an indented description. Treating
    // the description as a paragraph split one list into three.
    const blocks = parseMarkdown(
      [
        "- **[Bisate Lodge](/place/a)** — Lodges in Musanze",
        "  Luxury eco-lodge.",
        "- **[Sabyinyo](/place/b)** — Lodges in Musanze",
      ].join("\n"),
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].kind, "list");
    if (blocks[0].kind === "list") {
      assert.equal(blocks[0].items.length, 2);
      assert.match(visibleText(blocks[0].items[0]), /Luxury eco-lodge/);
    }
  });

  test("joins wrapped lines into one paragraph, and splits on a blank line", () => {
    const blocks = parseMarkdown("first line\ncontinued\n\nsecond para");
    assert.equal(blocks.length, 2);
    assert.equal(
      blocks[0].kind === "paragraph" && visibleText(blocks[0].spans),
      "first line continued",
    );
  });

  test("handles a realistic reply end to end", () => {
    const blocks = parseMarkdown(
      "### Where to eat\n\nTwo good options:\n\n- **[Repub Lounge](/place/repub)** — Rwandan, Kigali\n- **[Poivre Noir](/place/poivre)** — European\n\nBrowse more in [Explore](/explore).",
    );
    assert.deepEqual(blocks.map((b) => b.kind), [
      "heading",
      "paragraph",
      "list",
      "paragraph",
    ]);
  });

  test("returns no blocks for empty input rather than throwing", () => {
    assert.deepEqual(parseMarkdown(""), []);
    assert.deepEqual(parseMarkdown("   \n\n  "), []);
  });
});
