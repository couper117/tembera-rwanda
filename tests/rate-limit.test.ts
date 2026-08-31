import { test, describe } from "node:test";
import assert from "node:assert/strict";

// lib/rate-limit.ts imports "server-only" and next/headers, neither of which
// loads under a plain node process. The limiter itself is pure, so the counting
// logic is tested here directly against the same algorithm; `clientIp` is the
// only part that needs a request and is covered by the e2e run instead.
import { rateLimit, clearRateLimit, formatRetryAfter } from "../lib/rate-limit-core";

describe("rateLimit", () => {
  test("allows attempts up to the limit", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      assert.equal(rateLimit(key, 5, 60_000).ok, true, `attempt ${i + 1}`);
    }
  });

  test("blocks the attempt after the limit", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    const blocked = rateLimit(key, 5, 60_000);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter > 0, "a blocked caller must be told when to retry");
  });

  test("keys are independent", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);
    assert.equal(rateLimit(a, 5, 60_000).ok, false);
    assert.equal(rateLimit(b, 5, 60_000).ok, true, "b must not inherit a's count");
  });

  test("the window reopens once it has elapsed", async () => {
    // The window must be comfortably longer than the burst that fills it.
    // At 1 ms the three calls below can straddle their own window on a loaded
    // machine, the limit resets early, and the test fails perhaps one run in
    // seven. 60 ms in, 150 ms out leaves room for that jitter.
    const key = `t-${Math.random()}`;
    const windowMs = 60;

    for (let i = 0; i < 3; i++) rateLimit(key, 3, windowMs);
    assert.equal(rateLimit(key, 3, windowMs).ok, false, "should block inside the window");

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(rateLimit(key, 3, windowMs).ok, true, "window should have reset");
  });

  test("clearRateLimit forgets the key", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    assert.equal(rateLimit(key, 5, 60_000).ok, false);

    clearRateLimit(key);
    assert.equal(rateLimit(key, 5, 60_000).ok, true);
  });

  test("a blocked caller stays blocked — retrying does not reset the window", () => {
    // A limiter that reset on each attempt would be worse than none at all.
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    for (let i = 0; i < 20; i++) {
      assert.equal(rateLimit(key, 5, 60_000).ok, false, `retry ${i + 1}`);
    }
  });
});

describe("formatRetryAfter", () => {
  test("uses seconds under a minute", () => {
    assert.equal(formatRetryAfter(45), "45 seconds");
    assert.equal(formatRetryAfter(1), "1 second");
  });

  test("uses minutes at or above a minute", () => {
    assert.equal(formatRetryAfter(60), "1 minute");
    assert.equal(formatRetryAfter(120), "2 minutes");
    assert.equal(formatRetryAfter(90), "2 minutes");
  });
});
