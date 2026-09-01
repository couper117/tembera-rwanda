#!/usr/bin/env node
/**
 * Keep the build directory out of OneDrive's hands.
 *
 * This project lives under `C:\Users\<user>\OneDrive\...`, so OneDrive syncs
 * `.next` along with everything else — and when it decides the disk is better
 * used elsewhere it dehydrates files into cloud placeholders. A placeholder is
 * a reparse point, and Node's `readlink` on one returns EINVAL, so `next dev`
 * dies on startup with
 *
 *   EINVAL: invalid argument, readlink '...\.next\static\webpack\...hot-update.js'
 *
 * which names a webpack file and looks like a bundler bug. It is not. It is a
 * file the operating system has quietly replaced with a pointer.
 *
 * `attrib +P` is OneDrive's own "Always keep on this device" flag: pinned
 * content is never dehydrated, and new files inherit the pin from the folder.
 * Setting it on an empty directory before the dev server fills it is the
 * cheapest durable fix — no OneDrive settings to change, nothing to remember.
 *
 * A directory that already contains placeholders is removed rather than
 * rehydrated: pinning asks OneDrive to fetch them back, which is slow and
 * needs the network, and a build directory is disposable by definition.
 *
 * Silent and harmless everywhere else — off Windows this does nothing.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const DIRS = [process.env.NEXT_DIST_DIR || ".next"];

/** Windows sets this bit on a reparse point; a cloud placeholder is one. */
const FILE_ATTRIBUTE_REPARSE_POINT = 0x400;

function hasPlaceholders(dir, depth = 0) {
  if (depth > 4) return false;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Unreadable is itself a good enough reason to start again.
    return true;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    try {
      // Node exposes the raw Windows attributes; the reparse bit is the tell.
      const stats = statSync(full, { bigint: false });
      if (typeof stats.mode === "number" && entry.isSymbolicLink()) return true;
      const attrs = /** @type {{ attributes?: number }} */ (stats).attributes;
      if (typeof attrs === "number" && (attrs & FILE_ATTRIBUTE_REPARSE_POINT) !== 0) {
        return true;
      }
    } catch {
      return true;
    }
    if (entry.isDirectory() && hasPlaceholders(full, depth + 1)) return true;
  }
  return false;
}

if (process.platform === "win32") {
  for (const dir of DIRS) {
    try {
      if (existsSync(dir) && hasPlaceholders(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      // /s /d so the flag covers the directory and everything under it.
      execFileSync("attrib", ["+P", "/s", "/d", dir], { stdio: "ignore" });
    } catch {
      // Best effort. A failure here must never stop the dev server starting —
      // the worst case is the status quo.
    }
  }
}
