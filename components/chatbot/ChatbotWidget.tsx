"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hello! I can help you explore Rwanda, find places to visit, and explain Tembera features and business listings.",
  },
];

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active && typeof data?.enabled === "boolean") {
          setEnabled(data.enabled);
        }
      } catch {
        // Keep the widget in a safe state when the endpoint is unavailable.
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const node = panelRef.current;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [open, messages]);

  const quickPrompts = useMemo(
    () => [
      "Top places in Kigali",
      "For business info",
      "Rwanda calendar",
    ],
    [],
  );

  const sendMessage = async (draftText?: string) => {
    const value = (draftText ?? input).trim();
    if (!value || loading) return;

    const userMessage: ChatMessage = { role: "user", content: value };
    const history = messages;
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "Thinking..." }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();
      const reply =
        typeof data?.reply === "string" && data.reply.trim() ? data.reply : "I’m here to help with Rwanda travel and local discovery.";

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: reply };
        return copy;
      });
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "I hit a temporary issue. Please try again in a moment.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register") {
    return null;
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className="t-chatbot">
      {open && (
        <div className="t-chatbot__panel" role="dialog" aria-label="Tembera assistant">
          <div className="t-chatbot__header">
            <div className="t-chatbot__title-wrap">
              <span className="t-chatbot__badge">
                <Icon name="sparkle" size={14} />
              </span>
              <div>
                <div className="t-chatbot__title">Tembera AI</div>
                <div className="t-chatbot__subtitle">Travel guide for Rwanda</div>
              </div>
            </div>
            <button
              type="button"
              className="t-iconbtn t-chatbot__close"
              aria-label="Close chatbot"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="t-chatbot__body" ref={panelRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`t-chatbot__message t-chatbot__message--${message.role}`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="t-chatbot__quick">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" className="t-chatbot__chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="t-chatbot__composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about Rwanda, places, or business listings..."
              aria-label="Chat with Tembera AI"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
              <Icon name="arrowLeft" size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="t-chatbot__fab"
        aria-label="Open Tembera AI assistant"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="bot" size={22} />
      </button>
    </div>
  );
}
