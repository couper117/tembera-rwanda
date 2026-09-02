"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "@/components/Icon";

/**
 * Brief, non-blocking messages.
 *
 * This exists for one specific class of bug: an optimistic update whose server
 * write then fails. Rolling the UI back is necessary but not sufficient — a
 * heart that quietly un-fills looks like a misclick. The rollback needs to say
 * why, and it cannot use a blocking dialog because the user did not ask for a
 * conversation, only for their save to work.
 *
 * Deliberately small: one line of text, one tone, auto-dismiss. Anything that
 * needs a title, an action or a stack belongs in the page, not a toast.
 */

type Tone = "error" | "info";

interface ToastMessage {
  id: number;
  text: string;
  tone: Tone;
}

interface ToastValue {
  /** Show a message. Returns nothing — a toast is never awaited. */
  toast: (text: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const VISIBLE_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((m) => m.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (text: string, tone: Tone = "error") => {
      const id = nextId.current++;
      setMessages((current) => [...current, { id, text, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), VISIBLE_MS),
      );
    },
    [dismiss],
  );

  // Clear pending timers if the provider unmounts mid-flight.
  const timersRef = timers.current;
  useEffect(() => () => timersRef.forEach((t) => clearTimeout(t)), [timersRef]);

  const value = useMemo<ToastValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        aria-live so a screen reader announces the failure. "polite" rather
        than "assertive": a failed save is worth saying, not worth interrupting
        whatever is being read.
      */}
      <div className="t-toasts" role="status" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`t-toast t-toast--${message.tone}`}>
            <span className="t-toast__icon">
              <Icon name={message.tone === "error" ? "alert" : "info"} size={16} />
            </span>
            <span className="t-toast__body">{message.text}</span>
            <button
              type="button"
              className="t-toast__close"
              onClick={() => dismiss(message.id)}
              aria-label="Dismiss"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Returns a `toast` function. Safe to call from anywhere under the provider;
 * outside it, this throws rather than silently swallowing the message — a
 * toast that never appears is exactly the failure it was added to prevent.
 */
export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return value;
}
