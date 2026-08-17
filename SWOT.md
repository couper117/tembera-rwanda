# SWOT Analysis — Tembera (Visit Rwanda)

**Subject:** Tembera, a tourism discovery platform and directory for Rwanda
**Stack:** Next.js 15.5.23 (App Router) · React 19 · TypeScript (strict) · Prisma · PostgreSQL
**Scale assessed:** ~114 source files + 5 test files, ~18,600 lines, 495 places, 16 categories, 30 districts
**Baseline:** `f020607` "Tembera v2" plus uncommitted hardening work
**Date:** 17 August 2026 — second assessment (first was 16 August)

> **What changed since the first assessment.** Fourteen findings were closed:
> rate limiting, server-side session expiry, default passwords, the committed
> Maps key, the privacy gap, booking validation, the missing test suite, the
> missing CI, and the documentation drift. Two findings turned out to be
> already fixed and wrongly reported the first time (the soft-404 and the
> missing dark theme). Five new weaknesses surfaced — four of them created or
> revealed *by* the fix work, which is normal and worth naming rather than
> hiding.

---

## Strengths

**S1 — Modern, coherent architecture.** Server components and server actions throughout, behind a strict TypeScript boundary. One `Place` shape that every screen renders, so a change to the domain model propagates through the type system instead of through grep.

**S2 — Nothing is hardcoded.** Catalog, taxonomy, geography and accounts are all database rows. The admin CMS is the single source of truth, and edits invalidate the cached data layer through tags.

**S3 — Authorization is applied consistently.** Every admin page and every admin server action calls `requireAdmin()`. There is no mutation path that relies on the UI hiding a button.

**S4 — Authentication is now genuinely defended, not just correct.** *(strengthened)* On top of bcrypt, `timingSafeEqual` cookie verification and the dummy-hash compare that stops user enumeration, sign-in is now rate limited per address **and** per account, on both the public and admin logins — and expiry is enforced server-side from the timestamp in the cookie payload rather than trusting the browser to honour `maxAge`. The limiter was verified against the real admin login in a browser: blocked from the 6th attempt.

**S5 — The pure domain layer is now actually tested.** *(strengthened)* `engine.ts`, `search.ts` and `geo.ts` took their data as arguments all along; 78 unit tests now hold that behaviour in place, including the honesty rules — that an unrated place is excluded from "Top rated" rather than ranked last, that an empty subcategory reports zero instead of disappearing, and that sub-kilometre district distances are suppressed.

**S6 — Honesty is engineered into the UI, and no longer contradicted.** Ratings render only where real; district coordinates are marked `~`; empty categories say "Coming soon". The About page's stale claim that "Tembera has no public accounts" — false since accounts became database-backed — has been corrected.

**S7 — Real product depth.** Search, map, nearby-ranking, saved places, visit history, reviews, bookings and a full CMS, with per-account state syncing across devices and a localStorage fallback for guests.

**S8 — Data-protection posture is ahead of most products this size.** *(new)* A privacy policy that states what is collected and why, one-click export of everything held about a user, and account deletion that unlinks bookings rather than destroying them — because those are commercial records. Most projects at this stage have none of it.

**S9 — There is now a defined quality gate.** *(new)* A CI workflow runs lint, typecheck, unit tests, a seeded build against a real Postgres, an audit, and a scan for committed API keys — on every push and weekly, so dependency rot surfaces without anyone remembering to look.

**S10 — Documentation is good and, as of now, accurate.** `HANDOFF.md` records not just what exists but what was tried and rejected. The stale sections have been corrected.

---

## Weaknesses

**W1 — None of this work is committed.** *(new, most urgent)* Every change described above sits in the working tree of a repository whose last commit is still `f020607`. One careless `git checkout` or `git clean` destroys it. It is also why W2 exists.

**W2 — The CI pipeline has never actually run.** *(new)* The workflow is written and its steps have all been run by hand, but GitHub has never executed it. Until the branch is pushed, it is an untested script, not a safety net.

**W3 — Test coverage is narrow, and thinnest exactly where the new risk is.** *(new)* The 78 tests cover pure logic and the rate limiter's counting. Zero tests cover server actions: login, registration, the admin mutations, booking validation, or account deletion. The security wiring was verified once, manually, in a browser — that check is not repeatable and will not run in CI. A refactor that silently disconnects the limiter would pass every test.

**W4 — There is no email capability anywhere in the system.** *(new)* No provider is configured, so there is no password reset (a user who forgets is locked out until someone runs a CLI script), no email verification (anyone can register against an address they do not own), and no booking confirmation. This now blocks more than it did, because accounts are real.

**W5 — Sessions cannot be revoked.** *(new)* Changing a password does not sign out other sessions, and there is no way to force a logout. The cookie is stateless and self-validating, so a stolen one stays valid for its full 30 days. Fixing this needs either a session table or a per-user token version column.

**W6 — The rate limiter's memory is per-process and its IP key is spoofable.** Counters reset on deploy, and behind more than one instance the effective limit multiplies by the instance count. The address is read from `x-forwarded-for`, which the client supplies. The per-account limit is the half that actually protects a specific password; the per-address half is a speed bump. All documented in `lib/rate-limit-core.ts`, but it is a real ceiling.

**W7 — The data is still demo-grade, and the product is the data.** *(unchanged — now the largest weakness)* ~200 real Rwandan institutions with district-level coordinates only, no asserted phone numbers or opening hours, and several dead image URLs. Nothing in the security work touched this, and it is what determines whether the product is worth using.

**W8 — Three high advisories remain, by decision.** `postcss` and `sharp`, both inside Next's own transitive tree, clearable only by upgrading to Next 16. The critical one was cleared by moving to 15.5.23. Exploitability here is low — the postcss issues are build-time and process only your own CSS, and the sharp ones need a malicious image through the optimizer, which is limited to six whitelisted CDN hosts. Deferred deliberately; CI gates on `critical` so it does not sit permanently red.

**W9 — Every query still loads the entire catalog.** `getPlace(id)` scans all 495 rows in memory to find one, so the declared database indexes go unused. Correct call at this size; a rewrite at 50,000.

**W10 — There is still no deployment path.** CI stops at a successful build. No Dockerfile, no hosting configuration, no environment provisioning. Shipping remains a manual act that has never been rehearsed.

**W11 — Booking is still lead capture.** Validation is now sound — guest count capped, dates bounded, price derived server-side — but there is no payment, no availability check and no confirmation.

**W12 — Admins still cannot upload an image.** Photos are remote URLs from six whitelisted CDNs plus legacy `data:` URIs.

**W13 — The local environment is still fragile.** The project sits in a OneDrive-synced folder, which is the documented cause of `prisma generate` failing with `EPERM`. Separately, three dev servers were found running simultaneously against one `.next` directory during this session — that, not any code change, was the cause of a mid-session build failure.

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
| **W1 × W2 × T7** — nothing committed, CI unproven, one maintainer | Commit and push today. It protects the work, proves the pipeline, and is the precondition for everything else on this list. Ten minutes. |
| **S4 × W3** — security implemented, security untested | The manual browser check that confirmed rate limiting must become a repeatable test. Right now the strongest new code has the weakest regression protection. |
| **S8 × O2** — real data rights, institutions holding real data | Lead the partnership conversation with the compliance posture. It is the difference between a student project and a system an institution can defend having chosen. |
| **W4 × W5** — no email, no revocation | Both resolve with one decision: add an email provider. It unlocks password reset, verification, and booking confirmation, and gives session revocation somewhere to send the notice. |
| **T1** — a live key in git history | Revoke it. No amount of code closes this one, and it is billing to a real project today. |
| **W7 × T6** — unverified data, and data that decays | The same fix serves both: a partnership for the initial verification (O2), and user corrections for the ongoing drift (O6). |

### Priority actions

1. **Today** — commit and push (W1, W2). Revoke the Maps key in the Google Cloud console and restrict the live one by referrer (T1, T3). Point the privacy contact at a real mailbox (T5).
2. **This week** — add tests around the auth server actions so the rate limiting and session expiry are protected by CI rather than by memory (W3). Move the project out of OneDrive (W13).
3. **This month** — configure an email provider, then build password reset and email verification on top of it (W4, W5).
4. **This quarter** — the data verification partnership (O2, W7). It is the highest-value work remaining and the only one that changes whether the product is genuinely useful.
5. **Watch, do not act** — the in-memory catalog; revisit at roughly 5,000 listings (W9, T8). Next 16; revisit after launch (W8).
