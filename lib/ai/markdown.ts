/**
 * A very small markdown reader for assistant replies.
 *
 * The system prompt asks the model for markdown — headings, bold, and
 * `[Place](/place/id)` links onto real listings — and the widget was printing
 * it verbatim, so users read `### Recommended Places` and `**[Repub
 * Lounge](/place/…)**` as literal text with the links dead. This turns that
 * into a structure the widget renders as React elements.
 *
 * It returns data, never HTML: nothing here is fed to dangerouslySetInnerHTML,
 * so a model that emits `<img onerror=…>` produces the characters, not a tag.
 * That is the whole reason for hand-rolling instead of taking a dependency —
 * this is the one place where untrusted third-party text reaches the DOM.
 *
 * Deliberately not supported: images, tables, blockquotes, nested lists, HTML.
 * A chat bubble 320px wide has nowhere to put them.
 */

/**
 * Emphasis nests, because the model writes `**[Repub Lounge](/place/x)**` —
 * a bold link — constantly. Treating bold as a flat run of text swallowed the
 * link markup whole and printed the brackets and the URL on screen.
 */
export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; spans: Inline[] }
  | { kind: "italic"; spans: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; href: string; external: boolean };

export type Block =
  | { kind: "heading"; level: 3 | 4; spans: Inline[] }
  | { kind: "paragraph"; spans: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] };

/**
 * Which link targets are allowed to become anchors.
 *
 * In-app paths and plain http(s) only. Everything else — `javascript:`,
 * `data:`, `vbscript:`, a protocol-relative `//evil.example` — renders as text,
 * because a chat reply is attacker-influenced input: a user can ask the model
 * to repeat a string back, and some of what the model sees came from place
 * descriptions in the database.
 */
export function safeHref(raw: string): { href: string; external: boolean } | null {
  const href = raw.trim();
  if (!href) return null;

  // Site-relative, but not protocol-relative.
  if (href.startsWith("/") && !href.startsWith("//")) {
    return { href, external: false };
  }

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { href: url.toString(), external: true };
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Code first: backticks suppress everything inside them. Then links, then
// emphasis — so `**text**` around a link is recognised as bold wrapping a
// link rather than as bold wrapping a string of brackets.
const INLINE = /(`[^`\n]+`)|(\[[^\]\n]*\]\([^)\s]+\))|(\*\*[^\n]+?\*\*)|(\*[^*\n]+\*)|(_[^_\n]+_)/;

/** How deep emphasis may nest before we stop looking. Guards against `***`. */
const MAX_DEPTH = 4;

/** Split one line into text and its emphasis / code / link spans. */
export function parseInline(line: string, depth = 0): Inline[] {
  const spans: Inline[] = [];
  let rest = line;

  const pushText = (text: string) => {
    if (!text) return;
    const last = spans[spans.length - 1];
    if (last?.kind === "text") last.text += text;
    else spans.push({ kind: "text", text });
  };

  while (rest) {
    const match = depth < MAX_DEPTH ? INLINE.exec(rest) : null;
    if (!match || match.index === undefined) {
      pushText(rest);
      break;
    }

    pushText(rest.slice(0, match.index));
    const token = match[0];
    rest = rest.slice(match.index + token.length);

    if (token.startsWith("`")) {
      spans.push({ kind: "code", text: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const text = token.slice(1, split);
      const target = safeHref(token.slice(split + 2, -1));
      // An unusable target keeps its label, so the sentence still reads.
      if (target) spans.push({ kind: "link", text: text || target.href, ...target });
      else pushText(text);
    } else if (token.startsWith("**")) {
      const inner = parseInline(token.slice(2, -2), depth + 1);
      // Bold wrapping nothing but text collapses to plain text rather than an
      // empty <strong>.
      spans.push({ kind: "bold", spans: inner });
    } else {
      const inner = parseInline(token.slice(1, -1), depth + 1);
      spans.push({ kind: "italic", spans: inner });
    }
  }

  if (spans.length === 0) return [{ kind: "text", text: "" }];

  // A lone bold/italic wrapper with nothing but empty text inside is noise.
  return spans.filter(
    (span) => span.kind !== "text" || span.text !== "" || spans.length === 1,
  );
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/**
 * Every heading level collapses to h3/h4. The model reaches for `#` and `##`
 * freely, and a chat bubble that opens with 2rem type looks broken next to the
 * message above it.
 */
export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", spans: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
    list = null;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushAll();
      blocks.push({
        kind: "heading",
        level: heading[1].length <= 3 ? 3 : 4,
        spans: parseInline(heading[2].trim()),
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline((bullet?.[1] ?? numbered![1]).trim()));
      continue;
    }

    // An indented line directly under a bullet continues that bullet. Each
    // catalogue entry is written as a name line plus an indented description,
    // and treating the description as a new paragraph chopped one list into
    // three lists with loose prose between them.
    if (list && paragraph.length === 0 && /^\s+\S/.test(line)) {
      const item = list.items[list.items.length - 1];
      item.push({ kind: "text", text: " " }, ...parseInline(line.trim()));
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushAll();
  return blocks;
}
