import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isTransientDbError } from "../lib/db-retry";

test("recognises a dropped connection", () => {
  // The exact shape seen in the server log while sign-in was failing.
  assert.equal(isTransientDbError(new Error("read ECONNRESET")), true);
  assert.equal(isTransientDbError({ code: "ECONNRESET" }), true);
  assert.equal(isTransientDbError(new Error("socket hang up")), true);
  assert.equal(isTransientDbError(new Error("Connection terminated unexpectedly")), true);
  assert.equal(isTransientDbError(new Error("Server has closed the connection.")), true);
});

test("does not retry a real query failure", () => {
  // Retrying these cannot help, and retrying a write that may have partly
  // landed is worse than failing.
  assert.equal(isTransientDbError(new Error("Unique constraint failed on the fields: (`email`)")), false);
  assert.equal(isTransientDbError(new Error("Invalid `prisma.user.findUnique()` invocation")), false);
  assert.equal(isTransientDbError(null), false);
  assert.equal(isTransientDbError(undefined), false);
});
