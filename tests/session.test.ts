import { strict as assert } from "node:assert";
import { test } from "node:test";
import { SESSION_MARGIN_MS, retryTxRef, sessionUsable } from "../lib/business/session";

const NOW = Date.UTC(2026, 8, 1, 12, 0, 0);
const at = (ms: number) => new Date(NOW + ms);

test("a session with plenty of time is usable", () => {
  assert.equal(sessionUsable(at(25 * 60_000), NOW), true);
});

test("an expired session is not usable", () => {
  assert.equal(sessionUsable(at(-1), NOW), false);
  assert.equal(sessionUsable(at(-60 * 60_000), NOW), false);
});

test("a session inside the margin is treated as spent", () => {
  // The bug this guards: a link with under a minute left is technically alive
  // and useless to anybody who has to reach for their phone.
  assert.equal(sessionUsable(at(SESSION_MARGIN_MS - 1), NOW), false);
  assert.equal(sessionUsable(at(30_000), NOW), false);
  assert.equal(sessionUsable(at(SESSION_MARGIN_MS + 1), NOW), true);
});

test("no session at all is not usable", () => {
  assert.equal(sessionUsable(null, NOW), false);
  assert.equal(sessionUsable(undefined, NOW), false);
});

test("a retry tx_ref is unique but still names its sign-up", () => {
  const ref = "TB-FT3T-YWPQ";
  const a = retryTxRef(ref, NOW);
  const b = retryTxRef(ref, NOW + 60_000);
  assert.notEqual(a, b, "two retries must not collide — the gateway 409s on a reused tx_ref");
  for (const r of [a, b]) {
    assert.ok(r.startsWith(ref), "a human reconciling a statement has to see which sign-up it is");
    assert.notEqual(r, ref, "must differ from the original, which is already used");
  }
});
