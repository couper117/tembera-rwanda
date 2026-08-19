# Work Plan — Tembera

**Date:** 19 August 2026
**Branch:** `security-hardening` (or a new branch per item)
**Status:** jobs 1 and 3 in progress; 2, 4, 5, 6 not started

**Decisions made (19 August 2026)**
- **Languages:** French, Kinyarwanda, Swahili, Chinese (Simplified), German.
  Kinyarwanda is included deliberately — it is the one that opens the domestic
  market both analyses point at.
- **Starting with:** jobs 1 and 3 together.

Six pieces of work, in the order I suggest doing them. Each one says what is
wrong now, what I will do, how I will do it, roughly how long it takes, and
what could go wrong.

Order is by **risk first, size last**. The small legal fixes protect you
immediately. The big features come after.

---

## Summary

| # | Job | Size | Why this order |
|---|-----|------|----------------|
| 1 | Fix the legal basics | Small | Protects you now, takes hours not days |
| 2 | Check every photo | Medium | Must happen before the site is public |
| 3 | Fix how memorials are shown | Medium | Sensitive. Should never go live wrong |
| 4 | Add the Rwandan calendar | Medium | Makes your opening hours actually correct |
| 5 | Make it work without internet | Large | Big win, but needs the above settled first |
| 6 | Add other languages | Largest | Biggest job, and the least urgent |

---

## 1. Fix the legal basics

**Size:** small — about half a day

### What is wrong now

- Your privacy page tells people to email `privacy@tembera.rw`. That mailbox
  does not exist. I put it there as a placeholder because I would not invent a
  real-looking address. Right now, anyone who tries to contact you about their
  data gets nothing.
- If a business finds their listing is wrong, there is no way for them to tell
  you. The law expects you to be able to correct it. Right now they would have
  to find you somehow.
- There are no terms of use.

### What I will do

1. Move the privacy contact address out of the code and into a setting, so you
   can change it without touching code. You give me the real address, or you
   create the mailbox and we point at it.
2. Add a **"Report a problem with this listing"** button on every place page.
   It opens a short form: what is wrong, and how to contact you back. It saves
   a report the admin can see and act on.
3. Add a reports screen to the admin area, so you can see and clear them.
4. Add a simple terms of use page covering: the information is a guide not a
   guarantee, check with the place before you travel, and how to complain.

### How

- New `Report` table in the database (place, problem, reporter contact, status).
- New server action to save a report, rate limited so nobody can flood it.
- New admin page at `/admin/reports`, guarded like every other admin page.
- Privacy contact read from an environment setting with a clear fallback.

### What could go wrong

Very little. The report form is a new place where the public writes to your
database, so it gets the same rate limiting as your login. Low risk.

---

## 2. Check every photo

**Size:** medium — about one day

### What is wrong now

Your place photos are links to images sitting on other people's websites. They
come from six different sources. Those sources have different rules:

- Some are genuinely free to use.
- Some are free **but only if you name the photographer**. You do not name
  anyone right now.
- Some are almost certainly not allowed at all — a few links point at Google
  image results, which is not a licence to use the photo.

Today, with a private site, nobody notices. The day you go public and start
earning, this becomes a real complaint waiting to happen.

### What I will do

1. Write a script that lists every image in your database, grouped by where it
   comes from, so we can see the actual size of the problem instead of guessing.
2. Sort them into three piles: fine, needs credit, cannot use.
3. Add two new fields to a place: **who took the photo** and **what licence**.
4. Show the credit on the place page, small, under the image.
5. Replace or remove the photos in the "cannot use" pile. Where there is no
   replacement, the place falls back to the coloured icon it already uses when
   an image is missing — which already works and looks fine.
6. Add the credit fields to the admin form, so future photos are added properly.

### How

- `scripts/audit-images.ts` — reads the database, groups by host, writes a
  report. Read-only, changes nothing.
- Two new columns on `Place`: `imageCredit`, `imageLicense`.
- `PlaceImage` component shows the credit when there is one.

### What could go wrong

Some places will lose their photo and look plainer. That is the correct
outcome — a plain listing is better than a copyright complaint. I will tell you
how many are affected before removing anything, so you can decide.

---

## 3. Fix how memorials are shown

**Size:** medium — about one day

### What is wrong now

Genocide memorial sites are in your database in the same shape as a restaurant.
That means the app can currently show them with:

- star ratings
- a "top rated" position in a list
- price information
- the same bright, cheerful card style as a bar

This is wrong and would cause real hurt. It is the kind of mistake that gets
screenshotted and shared.

### What I will do

Make "sensitive" a real property of a category, not something hardcoded, so you
control it from the admin area. When a category is marked sensitive:

1. **No star ratings.** Not hidden — not collected at all. Nobody rates a
   memorial out of five.
2. **No reviews.** The review box does not appear.
3. **No prices, no booking prompts, no "featured" badges.**
4. **Never appears in "Top rated" or "Featured" rows** on the home page.
5. **A calmer design.** Muted colours instead of the bright category colour,
   plainer type, more space. It should feel different the moment you land on it.
6. **Visiting information instead of selling information:** opening hours,
   whether there is a guide, what is expected of visitors — dress, silence,
   photography rules.
7. A short line of context at the top of the page rather than a marketing
   description.

I will also check the April commemoration period is handled properly, which
links to job 4 below.

### How

- New `sensitive` flag on the `Category` table, editable in the admin.
- `PlaceCard`, `PlaceRow` and the place page check the flag and render the
  restrained version.
- `topRated()` and `featured()` in the engine exclude sensitive categories.
- Unit tests to prove a sensitive place can never reach those rows — this is
  exactly the kind of rule that should be locked down by a test.

### What could go wrong

The risk is getting the tone wrong rather than the code wrong. I will build the
mechanism and show you the result before it goes anywhere near live. **You
should be the one who approves how these pages read.** I can make them
restrained; I should not be the one deciding the final wording alone.

---

## 4. Add the Rwandan calendar

**Size:** medium — one to two days

### What is wrong now

Your site publishes opening hours as plain text, and knows nothing about the
Rwandan calendar. So:

- On the last Saturday morning of every month, during **Umuganda**, much of the
  country closes. Your site will confidently say places are open.
- On public holidays, the same problem.
- During the **Kwibuka** commemoration period in April, many places close or
  change how they operate. Your site says nothing.

### What I will do

1. Build a small calendar module that knows Rwandan dates:
   - **Umuganda** — last Saturday of each month, calculated, not typed in.
   - **Fixed public holidays** — New Year, Heroes' Day, Genocide Memorial Day,
     Labour Day, Independence Day, Liberation Day, Umuganura, Assumption,
     Christmas, Boxing Day.
   - **Moving dates** — Eid and Easter change each year and cannot be
     calculated simply. These go in a small admin-managed table so you can set
     them each year. I will not guess these in code.
2. Show a clear notice on place pages and the home page when a closure day is
   today or coming: *"Umuganda this Saturday morning — many places closed until
   about 11am."*
3. Mark the commemoration period so the app is quieter and more careful during
   it — no promotional rows on the home page.
4. Add "best time to visit" information about the two rainy seasons.

### How

- `lib/rwanda/calendar.ts` — pure logic, no database, so it can be fully unit
  tested. This fits how the rest of your good code is written.
- Small `CalendarDate` table for the dates that move each year.
- A notice component used by the home page and place pages.

### What could go wrong

Very little technically. The main thing is accuracy: I will calculate Umuganda
and the fixed holidays, but **you should check the list** before it ships. You
know the calendar better than I do, and a directory that is confidently wrong
about a national day is worse than one that says nothing.

---

## 5. Make it work without internet

**Size:** large — three to four days

### What is wrong now

The app needs a connection for everything. That means it fails exactly where
tourists need it most: at a park gate, in a district with weak signal, or on a
foreign phone with no data plan.

### What I will do

Turn Tembera into an app the phone can keep. Realistically, this means:

**Works offline:**
- Browsing all 495 places, by category and by city
- Searching them
- Opening any place's details
- Your saved list and your visit history
- Distances, since those are calculated on the phone

**Does not work offline, and will say so clearly:**
- The live map (Google's map needs a connection)
- Signing in, reviews, bookings, admin
- Anything genuinely new from the server

The rule I will follow: **never pretend.** If something needs a connection, the
app says so plainly rather than spinning forever or showing an empty screen.

### How

1. Add a web app manifest and icons, so the site can be installed on a phone
   like an app.
2. Add a service worker — a small script the browser keeps — that stores the
   app's files and your catalogue on the device.
3. Ship the catalogue as one compact file. Your 495 places without descriptions
   is small, roughly the size of a photo, so this is realistic.
4. Store it on the device and refresh it in the background when there is signal.
5. Add a clear "you are offline" banner, and honest empty states for the parts
   that need a connection.
6. Make the map fall back to a list with distances when there is no signal.

### What could go wrong

This is the job with the most ways to go subtly wrong:

- **Stale content.** Cached data can get old. I will make the catalogue refresh
  in the background and show when it was last updated.
- **Stuck old version.** Badly configured service workers can trap users on an
  old version of a site. This is a well-known trap and I will handle updates
  explicitly rather than leaving it to chance.
- **Harder to debug.** Once a service worker is involved, "just refresh" stops
  being reliable. I will document how to clear it in your HANDOFF file.

I would do this one on its own branch and test it properly before merging.

---

## 6. Add other languages

**Size:** largest — four to six days for the first two languages, less for each one after

### What is wrong now

Every word in the app is written in English, in the code. There is no
mechanism for a second language at all.

### The honest split

There are two different problems here, and only one of them is code:

1. **The app's own words** — buttons, labels, headings, messages. About 400 to
   600 short pieces of text. This is the code job.
2. **Your content** — 495 place descriptions, category names, city names. This
   is a translation job, not a programming job. Even with the code ready,
   somebody has to actually translate the text, or you pay for it, or you
   accept machine translation with a note saying so.

I will build the mechanism and translate the app's own words. **The place
descriptions are a separate decision about money and time**, and I will not
quietly machine-translate 495 entries and let them look official.

### What I will do

1. Add a language setting to the site, remembered per user, with the language
   in the web address (`/fr/...`) so pages can be shared and found by search
   engines.
2. Pull every English word out of the code and into one file per language.
3. Translate the app's own words into the chosen languages.
4. Add a language switcher in the header and in Settings.
5. Make sure dates, distances and numbers follow the chosen language.
6. Add translated names for categories and cities — that is a small, finite
   list, unlike descriptions.

### Which languages

**This is your decision and I have asked you separately.** My recommendation,
given who actually visits Rwanda:

- **French** — official language here, and a large share of visitors
- **Kinyarwanda** — not "international", but it is the one that opens the
  domestic market the SWOT and PESTEL both point at
- **Swahili** — official here, and the region
- **Chinese (Simplified)** — a large and growing group of visitors
- **German** or **Spanish** — both are significant for African tourism

### How

- A `[locale]` segment in the routing, which Next.js supports directly.
- Dictionary files — one per language, plain and readable.
- I would rather write this small mechanism myself than add another dependency,
  given the project already has three security warnings coming from libraries.

### What could go wrong

- **Half-translated screens** look worse than English-only. I will make missing
  words fall back to English visibly during development so gaps get caught.
- **The text grows.** German and French are longer than English. Some buttons
  and cards will break. This needs checking at phone width in every language,
  not just English.
- **This is a lot of files changed.** It touches nearly every screen, so it
  should be its own branch, merged only when complete.

---

## What I need from you

| Job | What I need |
|-----|-------------|
| 1 | A real email address for the privacy page |
| 2 | A decision, once I show you how many photos are affected |
| 3 | **Your approval of how memorial pages read.** I will build it, you should approve the words |
| 4 | A check of the holiday list before it ships |
| 5 | Nothing |
| 6 | Which five languages |

## Also still outstanding

Not part of this plan, but not forgotten:

- **Revoke the old Google Maps key.** Still live, still billing to you, still
  readable in your project history. Only you can do this.
- Confirm the automatic checks passed on GitHub, then merge the security work.
