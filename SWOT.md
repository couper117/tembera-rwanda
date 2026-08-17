# SWOT Analysis — Tembera (Visit Rwanda)

**Subject:** Tembera, a tourism discovery platform and directory for Rwanda
**Stack:** Next.js 15.5.23 (App Router) · React 19 · TypeScript (strict) · Prisma · PostgreSQL
**Scale assessed:** ~114 source files + 5 test files, ~18,600 lines, 495 places, 16 categories, 30 districts
**Baseline:** `d2b3e92` on branch `security-hardening`, pushed to origin
**Date:** 17 August 2026 — third assessment (first two were 16 and 17 August)

> **Where this stands.** Eighteen findings have now been closed across two
> rounds. Round one: rate limiting, server-side session expiry, default
> passwords, the committed Maps key, the privacy gap, booking validation, the
> test suite, CI, and the documentation drift. Round two: the work is committed
> and pushed, sessions became revocable, and the auth code gained real test
> coverage (94 tests). Two findings from the first pass turned out to be
> already fixed and wrongly reported (the soft-404, the missing dark theme).
>
> **Nine weaknesses remain, all deliberately deferred**, and one threat is
> still live and still costs money: the old Maps key has not been revoked.
> That is now the only urgent item, and it cannot be closed from the codebase.

---

## Verified state

| Check | Result |
|---|---|
| Unit tests | 94 pass, 0 fail |
| Auth e2e (`npm run test:auth`) | 7 checks pass — revocation and rate limiting |
| Typecheck | clean |
| Lint | clean |
| Production build | succeeds, 59/59 pages |
| `npm audit` | 0 critical, 3 high (deferred by decision) |
| Version control | 2 commits on `security-hardening`, pushed, tree clean |

---

## Strengths

**S1 — Modern, coherent architecture.** Server components and server actions throughout, behind a strict TypeScript boundary. One `Place` shape that every screen renders, so a change to the domain model propagates through the type system instead of through grep.

**S2 — Nothing is hardcoded.** Catalog, taxonomy, geography and accounts are all database rows. The admin CMS is the single source of truth, and edits invalidate the cached data layer through tags.

**S3 — Authorization is applied consistently.** Every admin page and every admin server action calls `requireAdmin()`. There is no mutation path that relies on the UI hiding a button.

**S4 — Authentication is genuinely defended, not just correct.** On top of bcrypt, `timingSafeEqual` cookie verification and the dummy-hash compare that stops user enumeration, sign-in is rate limited per address **and** per account on both logins, and expiry is enforced server-side rather than trusting the browser to honour `maxAge`.

**S5 — Sessions are revocable despite being stateless.** *(new)* `User.tokenVersion` rides in the cookie payload; bumping the column invalidates every cookie already issued, with nothing to delete server-side. Changing a password bumps it and re-issues a cookie for the current browser — so the device that proved it knows the password stays in and a stolen session dies with the password it outlived. Settings also exposes an explicit "sign out on all devices". Verified end to end: a replayed pre-change cookie is refused.

**S6 — The security-critical code is now the tested code.** *(new)* The session token's format and cryptography live in `lib/session-token.ts`, pure and Next-free, so the tests cover what actually runs: payload forgery, a rotated secret, expiry, future-dated cookies, the pre-upgrade cookie format, and the `timingSafeEqual` length trap that would otherwise throw a 500 rather than reject. `npm run test:auth` makes the two browser-level checks repeatable instead of remembered.

**S7 — The pure domain layer is tested.** `engine.ts`, `search.ts` and `geo.ts` took their data as arguments all along; the unit tests now hold that behaviour in place, including the honesty rules — that an unrated place is excluded from "Top rated" rather than ranked last, that an empty subcategory reports zero instead of disappearing, and that sub-kilometre district distances are suppressed.

**S8 — The work is in version control with a pipeline behind it.** *(new)* Two commits on a branch, pushed, with CI running lint, typecheck, tests, a seeded build against real Postgres, an audit, and a scan for committed API keys.

**S9 — Honesty is engineered into the UI, and no longer contradicted.** Ratings render only where real; district coordinates are marked `~`; empty categories say "Coming soon". The About page's stale claim that "Tembera has no public accounts" — false since accounts became database-backed — has been corrected.

**S10 — Real product depth.** Search, map, nearby-ranking, saved places, visit history, reviews, bookings and a full CMS, with per-account state syncing across devices and a localStorage fallback for guests.

**S11 — Data-protection posture is ahead of most products this size.** A privacy policy that states what is collected and why, one-click export of everything held about a user, and account deletion that unlinks bookings rather than destroying them — because those are commercial records. Most projects at this stage have none of it.

**S12 — Documentation is good and, as of now, accurate.** `HANDOFF.md` records not just what exists but what was tried and rejected, including the traps that cost real debugging time. The stale sections have been corrected.

---

## Weaknesses

> Four weaknesses from the second assessment are now closed: the work is
> committed and pushed (W1), CI has been triggered (W2), the auth code has real
> coverage (W3), and sessions are revocable (W5). The nine below remain, all
> deferred on purpose.

**W1 — The data is still demo-grade, and the product is the data.** *(now unambiguously the largest)* ~200 real Rwandan institutions with district-level coordinates only, no asserted phone numbers or opening hours, and several dead image URLs. Two rounds of hardening did not touch it, and it is what determines whether the product is worth using. Everything else on this list is smaller than this one.

**W2 — There is no email capability anywhere in the system.** No provider is configured, so there is no password reset (a user who forgets is locked out until someone runs a CLI script), no email verification (anyone can register against an address they do not own), and no booking confirmation. One decision — pick a provider — unblocks all three.

**W3 — There is still no deployment path.** CI stops at a successful build. No Dockerfile, no hosting configuration, no environment provisioning. Shipping remains a manual act that has never been rehearsed.

**W4 — The rate limiter's memory is per-process and its IP key is spoofable.** Counters reset on deploy, and behind more than one instance the effective limit multiplies by the instance count. The address is read from `x-forwarded-for`, which the client supplies. The per-account limit is the half that actually protects a specific password; the per-address half is a speed bump. All documented in `lib/rate-limit-core.ts`, but it is a real ceiling.

**W5 — Three high advisories remain, by decision.** `postcss` and `sharp`, both inside Next's own transitive tree, clearable only by upgrading to Next 16. The critical one was cleared by moving to 15.5.23. Exploitability here is low — the postcss issues are build-time and process only your own CSS, and the sharp ones need a malicious image through the optimizer, which is limited to six whitelisted CDN hosts. Deferred deliberately; CI gates on `critical` so it does not sit permanently red.

**W6 — Booking is still lead capture.** Validation is now sound — guest count capped, dates bounded, price derived server-side — but there is no payment, no availability check and no confirmation.

**W7 — Admins still cannot upload an image.** Photos are remote URLs from six whitelisted CDNs plus legacy `data:` URIs.

**W8 — Every query still loads the entire catalog.** `getPlace(id)` scans all 495 rows in memory to find one, so the declared database indexes go unused. Correct call at this size; a rewrite at 50,000.

**W9 — The local environment is still fragile.** The project sits in a OneDrive-synced folder, the documented cause of `prisma generate` failing with `EPERM`. Separately, three dev servers were found running simultaneously against one `.next` directory during this work — that, not any code change, caused a build failure that looked exactly like a code regression.

---

## Opportunities

**O1 — The market gap is real.** Tourism is a national priority and there is no dominant local digital directory. Coverage of Rwandan small businesses in the global mapping products is thin, especially outside Kigali.

**O2 — A data partnership is now materially more credible.** *(strengthened)* The Rwanda Development Board, district offices and hotel associations hold verified registers, and the admin CMS can ingest them. What changed is that an institution performing any diligence now finds a privacy policy, working data-subject rights, rate-limited authentication and a test suite — rather than `changeme123` and a committed API key.

**O3 — Monetisation is already scaffolded.** The `bookings` table supports commission; `featured` is a natural paid-placement surface; verified business claims are a subscription. None need architectural change — only a payment integration and a policy.

**O4 — Offline-first is a short hop.** The app shell, bottom navigation and mobile-first layout exist. Tourists roam on expensive or absent data; an installable directory that works offline is something the incumbent handles poorly.

**O5 — Localisation is a schema addition, not a rewrite.** Categories and cities are already rows; Kinyarwanda and French are columns and a locale switch.

**O6 — A user-generated content flywheel is half-built.** Reviews and visit history work per account. Opening photos, tips and corrections makes the catalog something a competitor cannot obtain by exporting a dataset — and distributes the maintenance burden that W7 and T5 describe.

**O7 — The engine is country-agnostic.** Nothing in `lib/places/` assumes Rwanda beyond the seed. A second market is a different seed.

**O8 — Going live is a same-day exercise.** Next.js plus managed Postgres deploys on commodity hosting with no infrastructure work.

**O9 — Showcase value is now considerably higher.** *(strengthened)* A legacy-PHP migration is common in a portfolio. A migration plus a documented security review, a test suite, CI, and a data-protection implementation against a named statute is not.

---

## Threats

**T1 — The un-revoked Google Maps key.** *(now the sharpest open threat)* It has been removed from the working tree, but it remains readable in git history, so removal is not containment — only revocation in the Google Cloud console closes it. Until then, anyone with repository access holds a working key that bills to your project. This is the one finding that carries a live cost and cannot be closed from the codebase.

**T2 — The incumbent is free and already installed.** Google Maps and Google Business own discovery by default. Curation and local depth is the only viable line of attack, which puts the weight on O2 and O6.

**T3 — Dependence on the Google Maps platform.** Costs scale with usage, the browser-side key is exposed by design and still needs referrer restriction, and the map uses the deprecated `google.maps.Marker` (migrating needs a Map ID).

**T4 — Content liability.** An unverified phone number or address can send a visitor to the wrong place. The About-screen disclaimer is the honest minimum; it does not remove the duty of care.

**T5 — Data-protection obligation is reduced, not discharged.** *(downgraded)* Law N° 058/2021 rights of access and erasure are now genuinely implemented. What remains is administrative: the policy's contact address is a placeholder (`privacy@tembera.rw`) pointing at no mailbox, and if the service is offered commercially, registration with the supervisory authority has not been checked. A policy nobody can reach is a policy that fails at the first complaint.

**T6 — Directories decay.** Businesses close and numbers change. 495 records with no update process will be measurably wrong within a year; the dead image URLs are the early symptom. Freshness is an operating cost.

**T7 — Single-maintainer concentration.** Deep context lives with one person. The documentation is unusually good, which mitigates it, but W1 makes it worse: knowledge and work both currently exist in one place, on one machine.

**T8 — Success is what breaks the architecture.** The in-memory catalog means memory and cold-start cost rise linearly with listings. Growth is the trigger for the rewrite.

---

## Strategic reading

| Cross-read | Action |
|---|---|
| **T1** — a live key in git history | Revoke it. No amount of code closes this one, it is billing to a real project today, and it is now the only urgent item on the board. |
| **W1 × T6** — unverified data, and data that decays | The same fix serves both: a partnership for the initial verification (O2), and user corrections for the ongoing drift (O6). This is now the centre of gravity of the whole project. |
| **S5 × S6 × O2** — revocable sessions, tested security, institutions holding data | The security work's real return is not the vulnerabilities closed; it is that a partnership conversation now survives diligence. Lead with it. |
| **W2 × T5** — no email, and a privacy contact nobody reads | Both are the same missing capability. An email provider gives you password reset, address verification, booking confirmation, and a reachable privacy contact. |
| **W3 × T7** — no deployment path, one maintainer | Rehearse a deploy before it is urgent. A first deploy performed under pressure, by the only person who knows the system, is how outages start. |

### Priority actions

1. **Today** — revoke the Maps key in the Google Cloud console and restrict the live one by referrer (T1, T3). Point the privacy contact at a real mailbox (T5). These are the last two items that only the owner can do.
2. **Before real users** — confirm the CI run passed, then merge the branch. Note that the session format change signs every existing user out once, by design.
3. **This month** — configure an email provider, then build password reset and email verification on it (W2). Move the project out of OneDrive (W9).
4. **This quarter** — the data verification partnership (O2, W1). The highest-value work remaining by a wide margin, and the only one that changes whether the product is genuinely useful to anyone.
5. **Watch, do not act** — the in-memory catalog; revisit at roughly 5,000 listings (W8, T8). Next 16; revisit after launch (W5).
