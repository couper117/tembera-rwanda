import { strict as assert } from "node:assert";
import { test } from "node:test";
import { toLocalPhone } from "../lib/business/phone";

test("accepts the international form the sign-up form asks for", () => {
  assert.equal(toLocalPhone("+250 788 123 456"), "0788123456");
  assert.equal(toLocalPhone("+250788123456"), "0788123456");
  assert.equal(toLocalPhone("250788123456"), "0788123456");
});

test("accepts the local form unchanged", () => {
  assert.equal(toLocalPhone("0788123456"), "0788123456");
  assert.equal(toLocalPhone("078 812 3456"), "0788123456");
});

test("accepts a bare subscriber number", () => {
  assert.equal(toLocalPhone("788123456"), "0788123456");
});

test("handles every Rwandan mobile prefix", () => {
  // MTN is 078/079, Airtel 072/073 — all nine digits beginning 7.
  for (const n of ["0788123456", "0791234567", "0721234567", "0731234567"]) {
    assert.equal(toLocalPhone(n), n);
  }
});

test("refuses anything that is not a Rwandan mobile", () => {
  // A landline, a foreign number, a truncated one, and junk. Guessing here
  // would open a checkout nobody can pay.
  assert.equal(toLocalPhone("0252123456"), null);
  assert.equal(toLocalPhone("+44 7700 900123"), null);
  assert.equal(toLocalPhone("07881234"), null);
  assert.equal(toLocalPhone("07881234567"), null);
  assert.equal(toLocalPhone(""), null);
  assert.equal(toLocalPhone("not a phone"), null);
});
