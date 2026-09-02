import "server-only";

/**
 * The one place the app hands a message to the outside world.
 *
 * There is deliberately no SDK behind this. Resend's REST API is a single POST
 * with a JSON body, and adding a dependency to build that object would buy
 * nothing while making the provider harder to swap. Anything that can speak
 * HTTP can stand in here.
 *
 * **Delivery is not configured yet.** Without `RESEND_API_KEY` this logs the
 * message instead of sending it, and that fallback is load-bearing rather than
 * a placeholder: it lets the password-reset flow be written, exercised and
 * reviewed end to end before anybody owns a Resend account or a verified
 * sending domain. In development the reset link appears in the server console
 * and works when pasted into the browser.
 *
 * The fallback is scoped to development on purpose. In production a missing
 * key is a broken account-recovery path, and returning `ok` there would let it
 * fail silently — the caller would tell a locked-out user their email was on
 * its way to an inbox nothing was ever sent to.
 */

export interface Email {
  to: string;
  subject: string;
  /** Plain text. Required — it is the fallback every client can render. */
  text: string;
  /** Optional HTML alternative. */
  html?: string;
}

export type SendResult = { ok: true } | { ok: false; error: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Who the mail comes from. A verified domain is required by every provider. */
function sender(): string {
  return process.env.EMAIL_FROM?.trim() || "Tembera <onboarding@resend.dev>";
}

export async function sendEmail(message: Email): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      // Loud, and still not thrown: see the note on the password-reset action
      // about why a failure to send must not become a 500 on that screen.
      console.error(
        "[email] RESEND_API_KEY is not set. Nothing was sent to",
        message.to,
      );
      return { ok: false, error: "Email delivery is not configured." };
    }

    console.log(
      [
        "",
        "──────────── email (not sent — no RESEND_API_KEY) ────────────",
        `to:      ${message.to}`,
        `subject: ${message.subject}`,
        "",
        message.text,
        "──────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { ok: true };
  }

  try {
    // A hung request must not hold the server action open indefinitely; the
    // caller has already decided that a slow send should not block the reply.
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[email] Resend rejected the message", response.status, detail);
      return { ok: false, error: `Delivery failed (${response.status}).` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] Could not reach Resend", error);
    return { ok: false, error: "Could not reach the email provider." };
  }
}
