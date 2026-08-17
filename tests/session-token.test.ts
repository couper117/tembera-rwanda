import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  decodeSession,
  encodeSession,
  signToken,
  verifyToken,
} from "../lib/session-token";

const SECRET = "test-secret-not-used-anywhere-real";
const OTHER_SECRET = "a-different-secret";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, as in lib/auth.ts

describe("signToken / verifyToken", () => {
  test("a token we signed verifies back to its payload", () => {
    const signed = signToken("1:0:1700000000000", SECRET);
    assert.equal(verifyToken(signed, SECRET), "1:0:1700000000000");
  });

  test("a tampered payload is rejected", () => {
    // The whole point: escalating from user 1 to user 2 by editing the cookie
    // must not work, because the signature no longer matches.
    const signed = signToken("1:0:1700000000000", SECRET);
    const forged = signed.replace("1:0:", "2:0:");
    assert.equal(verifyToken(forged, SECRET), null);
  });

  test("a tampered signature is rejected", () => {
    const signed = signToken("1:0:1700000000000", SECRET);
    const [payload, mac] = [signed.slice(0, signed.lastIndexOf(".")), "0".repeat(64)];
    assert.equal(verifyToken(`${payload}.${mac}`, SECRET), null);
  });

  test("a token signed with a different secret is rejected", () => {
    // Rotating ADMIN_SESSION_SECRET must invalidate outstanding sessions.
    const signed = signToken("1:0:1700000000000", OTHER_SECRET);
    assert.equal(verifyToken(signed, SECRET), null);
  });

  test("a signature of the wrong length is rejected without throwing", () => {
    // timingSafeEqual throws on a length mismatch, so the length is compared
    // first. A short signature must be a rejection, not a 500.
    const signed = signToken("1:0:1700000000000", SECRET);
    const payload = signed.slice(0, signed.lastIndexOf("."));
    assert.doesNotThrow(() => verifyToken(`${payload}.abc`, SECRET));
    assert.equal(verifyToken(`${payload}.abc`, SECRET), null);
  });

  test("malformed and missing input is rejected", () => {
    assert.equal(verifyToken(undefined, SECRET), null);
    assert.equal(verifyToken("", SECRET), null);
    assert.equal(verifyToken("no-dot-at-all", SECRET), null);
  });

  test("the payload may contain dots without breaking the split", () => {
    // The signature is taken from the LAST dot, so a payload containing one
    // must still round-trip.
    const signed = signToken("1:0:1700000000000.5", SECRET);
    assert.equal(verifyToken(signed, SECRET), "1:0:1700000000000.5");
  });
});

describe("encodeSession / decodeSession", () => {
  const now = 1_700_000_000_000;

  test("round-trips a session", () => {
    const decoded = decodeSession(encodeSession(7, 3, now), MAX_AGE_MS, now);
    assert.deepEqual(decoded, { userId: 7, tokenVersion: 3, issuedAt: now });
  });

  test("accepts a session inside its lifetime", () => {
    const issued = now - MAX_AGE_MS + 60_000; // a minute short of expiry
    assert.ok(decodeSession(encodeSession(1, 0, issued), MAX_AGE_MS, now));
  });

  test("rejects a session past its lifetime", () => {
    // Expiry is enforced server-side precisely because a stolen cookie's
    // holder will not honour the browser's maxAge.
    const issued = now - MAX_AGE_MS - 1;
    assert.equal(decodeSession(encodeSession(1, 0, issued), MAX_AGE_MS, now), null);
  });

  test("rejects a session dated in the future", () => {
    // Forging a later issuedAt is how you would try to extend a cookie's life.
    const issued = now + 60_000;
    assert.equal(decodeSession(encodeSession(1, 0, issued), MAX_AGE_MS, now), null);
  });

  test("rejects the old two-part cookie format", () => {
    // Sessions issued before tokenVersion existed cannot be revoked, so they
    // must not be honoured after the upgrade.
    assert.equal(decodeSession(`1:${now}`, MAX_AGE_MS, now), null);
  });

  test("rejects malformed payloads", () => {
    for (const bad of [
      "",
      "1",
      "1:0:1:2",
      "abc:0:1700000000000",
      "1:abc:1700000000000",
      "1:0:abc",
      "0:0:1700000000000", // user ids start at 1
      "-1:0:1700000000000",
      "1:-1:1700000000000",
      "1.5:0:1700000000000",
    ]) {
      assert.equal(
        decodeSession(bad, MAX_AGE_MS, now),
        null,
        `expected ${JSON.stringify(bad)} to be rejected`,
      );
    }
  });

  test("a bumped tokenVersion produces a different token", () => {
    // This is the revocation mechanism: lib/auth.ts compares the version in
    // the cookie against the user's current one and signs out on a mismatch.
    const before = decodeSession(encodeSession(1, 0, now), MAX_AGE_MS, now);
    const after = decodeSession(encodeSession(1, 1, now), MAX_AGE_MS, now);
    assert.equal(before?.tokenVersion, 0);
    assert.equal(after?.tokenVersion, 1);
    assert.notEqual(before?.tokenVersion, after?.tokenVersion);
  });
});

describe("signing and decoding together", () => {
  test("a full round trip through both layers", () => {
    const now = Date.now();
    const signed = signToken(encodeSession(42, 2, now), SECRET);

    const payload = verifyToken(signed, SECRET);
    assert.ok(payload, "should verify");

    const session = decodeSession(payload, MAX_AGE_MS, now);
    assert.deepEqual(session, { userId: 42, tokenVersion: 2, issuedAt: now });
  });

  test("an attacker who edits the version cannot keep a revoked session alive", () => {
    // Bumping tokenVersion revokes the cookie. Editing the cookie back to the
    // old version breaks the signature, so there is no way round it.
    const now = Date.now();
    const signed = signToken(encodeSession(42, 5, now), SECRET);
    const forged = signed.replace("42:5:", "42:4:");
    assert.equal(verifyToken(forged, SECRET), null);
  });
});
