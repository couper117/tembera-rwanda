import Link from "next/link";
import { parseMarkdown, type Block, type Inline } from "@/lib/ai/markdown";

/**
 * Renders an assistant reply.
 *
 * Every node here is a React element built from parsed data — there is no
 * dangerouslySetInnerHTML anywhere in this path, because the text comes from a
 * language model and, through the catalogue block, indirectly from rows that
 * business owners can edit.
 */

function spans(list: Inline[], keyPrefix: string): React.ReactNode[] {
  return list.map((span, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (span.kind) {
      // Emphasis nests, so a bold link stays a link.
      case "bold":
        return <strong key={key}>{spans(span.spans, key)}</strong>;
      case "italic":
        return <em key={key}>{spans(span.spans, key)}</em>;
      case "code":
        return <code key={key}>{span.text}</code>;
      case "link":
        // External targets get noreferrer as well as noopener: the referrer
        // would otherwise leak which page of the app the reader was on.
        return span.external ? (
          <a key={key} href={span.href} target="_blank" rel="noopener noreferrer">
            {span.text}
          </a>
        ) : (
          <Link key={key} href={span.href}>
            {span.text}
          </Link>
        );
      default:
        return <span key={key}>{span.text}</span>;
    }
  });
}

function block(node: Block, key: string) {
  switch (node.kind) {
    case "heading":
      return node.level === 3 ? (
        <h3 key={key}>{spans(node.spans, key)}</h3>
      ) : (
        <h4 key={key}>{spans(node.spans, key)}</h4>
      );
    case "list": {
      const items = node.items.map((item, i) => (
        <li key={`${key}-${i}`}>{spans(item, `${key}-${i}`)}</li>
      ));
      return node.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>;
    }
    default:
      return <p key={key}>{spans(node.spans, key)}</p>;
  }
}

export default function Markdown({ text }: { text: string }) {
  return <>{parseMarkdown(text).map((node, i) => block(node, `b${i}`))}</>;
}
