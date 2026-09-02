"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import Markdown from "./Markdown";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Muraho! I can help you find places to eat, stay and visit across Rwanda — and explain how Tembera works.",
};

const OPENING_PROMPTS = [
  "Where should I eat in Kigali?",
  "Plan a 3-day trip",
  "What is Umuganda?",
];

/**
 * Restored on mount so closing the panel — or following one of the assistant's
 * own links to a listing, which unmounts the whole app shell — does not throw
 * the conversation away. sessionStorage rather than localStorage: a chat is
 * part of one visit, and it can name places the reader may not want waiting
 * for them on a shared laptop tomorrow.
 */
const STORAGE_KEY = "tembera.chat.v1";

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [GREETING];
    return parsed.filter(
      (m): m is ChatMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    );
  } catch {
    // A private window, or storage disabled entirely. Not worth a message.
    return [GREETING];
  }
}

export default function ChatbotWidget() {
  const pathname = usePathname();
  const panelId = useId();

  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [suggestions, setSuggestions] = useState<string[]>(OPENING_PROMPTS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMessages(loadHistory()), []);

  useEffect(() => {
    if (messages.length <= 1) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Storage full or blocked; the conversation still works in memory.
    }
  }, [messages]);

  // The widget starts hidden and appears only once the server confirms it is
  // switched on, so an admin who disables it never gets a button that flashes
  // in and vanishes.
  useEffect(() => {
    let active = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && typeof data?.enabled === "boolean") setEnabled(data.enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Opening the panel moves focus into it, so a keyboard or screen-reader user
  // lands on the composer instead of continuing through the page behind it.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // A reasoning model takes 15-30s on a real question. Three bouncing dots for
  // half a minute reads as broken, so say what is happening instead.
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 9000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    const node = bodyRef.current;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [open, messages, loading]);

  const sendMessage = useCallback(
    async (draft?: string) => {
      const value = (draft ?? input).trim();
      if (!value || loading) return;

      const history = [...messages, { role: "user" as const, content: value }];
      setMessages(history);
      setInput("");
      setSuggestions([]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        const data = await res.json().catch(() => null);
        const reply =
          typeof data?.reply === "string" && data.reply.trim()
            ? data.reply
            : "I could not reach the assistant just then. Try again in a moment, or browse **[Explore](/explore)**.";

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setSuggestions(
          Array.isArray(data?.suggestions)
            ? data.suggestions.filter((s: unknown) => typeof s === "string").slice(0, 3)
            : [],
        );
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I could not reach the assistant just then — that is usually the connection. Try again in a moment.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages],
  );

  const reset = () => {
    setMessages([GREETING]);
    setSuggestions(OPENING_PROMPTS);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
    inputRef.current?.focus();
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/business/dashboard")) return null;
  if (pathname === "/login" || pathname === "/register") return null;
  if (!enabled) return null;

  return (
    <div className={`t-chatbot${open ? " t-chatbot--open" : ""}`}>
      {/* Only on small screens, where the panel covers the page. Tapping the
          backdrop is the gesture people expect from a sheet. */}
      {open && (
        <button
          type="button"
          className="t-chatbot__scrim"
          aria-label="Close assistant"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}

      <div className="t-chatbot__panel" id={panelId} role="dialog" aria-modal="false" aria-label="Tembera AI travel assistant" hidden={!open}>
        <header className="t-chatbot__header">
          <span className="t-chatbot__badge">
            <Icon name="sparkle" size={14} />
          </span>
          <div className="t-chatbot__titles">
            <div className="t-chatbot__title">Tembera AI</div>
            <div className="t-chatbot__subtitle">Travel guide for Rwanda</div>
          </div>
          <button
            type="button"
            className="t-iconbtn t-chatbot__action"
            aria-label="Start a new conversation"
            title="New conversation"
            onClick={reset}
          >
            <Icon name="refresh" size={15} />
          </button>
          <button
            type="button"
            className="t-iconbtn t-chatbot__action"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="t-chatbot__body" ref={bodyRef}>
          {/* Replies land here asynchronously, so the region announces itself.
              "polite" rather than "assertive": an answer is not an alert. */}
          <div className="t-chatbot__log" role="log" aria-live="polite" aria-atomic="false">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`t-chatbot__message t-chatbot__message--${message.role}`}
              >
                {message.role === "assistant" ? (
                  <Markdown text={message.content} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}

            {loading && (
              <div className="t-chatbot__message t-chatbot__message--assistant t-chatbot__typing">
                <span className="t-chatbot__dot" />
                <span className="t-chatbot__dot" />
                <span className="t-chatbot__dot" />
                {slow && <span className="t-chatbot__slow">still thinking…</span>}
                <span className="t-sr-only">Assistant is thinking</span>
              </div>
            )}
          </div>
        </div>

        {suggestions.length > 0 && !loading && (
          <div className="t-chatbot__quick">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="t-chatbot__chip"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form
          className="t-chatbot__composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about places, food, parks…"
            aria-label="Ask Tembera AI"
            enterKeyHint="send"
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
            <Icon name="navigate" size={16} />
          </button>
        </form>
      </div>

      <button
        ref={fabRef}
        type="button"
        className="t-chatbot__fab"
        aria-label={open ? "Close Tembera AI assistant" : "Open Tembera AI assistant"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name={open ? "close" : "bot"} size={22} />
      </button>
    </div>
  );
}
