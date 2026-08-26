# Habit Tracker

A full-stack habit tracker where users define habits, check in once per
local calendar day, and see accurately computed current/longest streaks —
all timezone logic resolved on the server.

_Submitted for Product Engineering Intern — Full Stack review._
## Overview

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript + MongoDB/Mongoose
- **Auth:** JWT + bcrypt password hashing
- **Validation:** Zod
- **Tests:** Vitest (+ Supertest for API tests)

## Key Business Rule

> A streak is measured in the user's own **local calendar days**, not
> elapsed hours. Two check-ins 20 hours apart may or may not be
> consecutive days depending on timezone, and only one check-in per habit
> per local day ever counts.

Every part of the design flows from this one rule.

## Features

- Register/login with an IANA timezone (e.g. `Asia/Kolkata`).
- Create habits (name + optional description).
- Check in for today, or backfill a past date.
- Dashboard with current streak, longest streak, and "completed today"
  per habit — all computed server-side.
- Habit detail page with full check-in history and a backfill form.
- Clear, specific validation errors (future date, before-habit-creation,
  duplicate, ownership).

## Architecture

```
habit-tracker/
├── server/                 Express + TypeScript API
│   └── src/
│       ├── config/         env loading, DB connection
│       ├── models/         Mongoose schemas (User, Habit, CheckIn)
│       ├── services/
│       │   ├── localDay.service.ts   <- ALL timezone logic lives here
│       │   └── streak.service.ts     <- pure streak algorithm
│       ├── controllers/    thin HTTP handlers, call into services
│       ├── middleware/     auth, validation, error handling
│       ├── routes/
│       └── tests/          unit + API integration tests
└── client/                 React + TypeScript SPA
    └── src/
        ├── pages/           Login, Register, Dashboard, HabitDetail
        ├── components/      HabitCard, ErrorBanner, ProtectedRoute
        ├── hooks/useAuth    auth context (token in localStorage)
        ├── services/        axios API clients
        └── utils/date.ts    DISPLAY-only date helpers (see warning below)
```

Controllers stay thin: they authenticate, load data, delegate to
`localDay.service` / `streak.service`, and shape the HTTP response.
**No timezone or streak math happens inline in a controller.**

## Database Schema

**User**
```
email          (unique)
passwordHash   (bcrypt, never returned by the API)
timezone       (IANA string, e.g. "Asia/Kolkata")
```

**Habit**
```
userId
name
description (optional)
createdAt
```

**CheckIn**
```
userId
habitId
localDate     "YYYY-MM-DD" — the local calendar day this check-in counts for
checkedInAt   the actual UTC instant (real time for "today", local-noon
              anchor for backfilled dates — see below)
```

Unique compound index: **`{ habitId: 1, localDate: 1 }` is unique.**
This is the authoritative, race-safe guarantee that a habit can never
have two check-ins for the same local day, even under concurrent
requests — the application also does a friendly pre-check, but the
database index is the real backstop (a duplicate-key error is caught in
`errorHandler.ts` and turned into a normal `DUPLICATE_CHECK_IN` API
response).

## The Local-Day Model

**Why store both `checkedInAt` and `localDate`?**
`checkedInAt` is the objective instant something happened, in UTC — useful
for auditing/history/sorting. `localDate` is the *business-meaningful*
value: which of the user's calendar days this check-in counts toward. They
can diverge (a check-in made at 11pm might count for a day that, in UTC
terms, hasn't even started elsewhere), so we compute `localDate` once, at
write time, and treat it as the source of truth for every duplicate check
and every streak calculation. We never recompute "which day was this" from
`checkedInAt` later, and we never use `checkedInAt`'s UTC date for anything
business-related.

**How a UTC instant becomes a local date** (`server/src/services/localDay.service.ts`):

```
UTC instant → Intl/date-fns-tz conversion using the user's IANA timezone → "YYYY-MM-DD"
```

We deliberately never use `date.toISOString().split("T")[0]` — that's the
*UTC* date, which is simply wrong for anyone not in UTC+0. Instead we use
`date-fns-tz`'s `formatInTimeZone`, which goes through the real IANA
timezone database (so DST transitions are handled automatically, without
any manual offset math).

**"Today," server-side only.** The client never gets to declare what
"today" is — `getTodayLocalDate(timezone)` computes it fresh on the server
from `new Date()` and the user's stored timezone, and that value is what
future-date validation and streak calculation are anchored to.

**Backfilled dates and `checkedInAt`.** When a user checks in "for today,"
`checkedInAt` is simply the real current instant. When they backfill a
past date, there's no real "instant" to record, so we anchor `checkedInAt`
to local noon on that date (converted to UTC via `fromZonedTime`) — purely
so the field is a sensible, sortable timestamp. It is never used for
duplicate checks or streak math; `localDate` alone drives all business
logic.

## Streak Calculation

`server/src/services/streak.service.ts` is **pure** — it takes an array of
`localDate` strings and "today," and returns `{ currentStreak,
longestStreak }`. No DB or HTTP inside it, which is what makes it trivial
to unit test in isolation (see `src/tests/streak.service.test.ts`).

- **currentStreak**: consecutive local days ending *today*, or ending
  *yesterday* if today hasn't been logged yet. If neither today nor
  yesterday is logged, the streak is 0.
- **longestStreak**: the longest run of consecutive local dates anywhere
  in the history.
- **Backfilling**: rather than trying to incrementally patch a stored
  streak number (fragile, easy to get wrong), every check-in simply
  recomputes both streaks from the full set of `localDate`s for that
  habit. This is easy to reason about, easy to test, and habits have few
  enough check-ins that recomputation is cheap.

**Worked example** (from the assignment, `Asia/Kolkata`, UTC+05:30) is a
literal test case:

| Check-in | UTC instant            | Local day    |
|----------|-------------------------|--------------|
| A        | 2026-03-10T14:30Z      | 2026-03-10   |
| B        | 2026-03-11T10:30Z      | 2026-03-11   |
| C        | 2026-03-11T21:30Z      | 2026-03-12   |
| D        | 2026-03-12T17:30Z      | 2026-03-12 (dup of C) |

→ 3 distinct local days → `currentStreak = 3`, `longestStreak = 3`. See
`streak.service.test.ts` → `"assignment worked example"`.

**The frontend never computes streaks.** It only ever displays the
`currentStreak` / `longestStreak` / `completedToday` values the API
returns. `client/src/utils/date.ts` has a big comment explaining this —
its helpers are for *display* (e.g. showing "today" in the header, or
bounding the backfill date picker) and are never used to decide validity.

## API Endpoints

```
POST   /api/auth/register        { email, password, timezone }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              (auth required)

GET    /api/habits                       list habits + streaks (auth)
POST   /api/habits                       { name, description? } (auth)
GET    /api/habits/:id                   single habit + streaks (auth)
PATCH  /api/habits/:id                   { name?, description? } (auth)
DELETE /api/habits/:id                   (auth)

POST   /api/habits/:habitId/check-ins    { localDate } (auth)
GET    /api/habits/:habitId/check-ins    history, newest first (auth)
```

All responses use `{ success: true, data: ... }` or
`{ success: false, error: { code, message } }`.

## Validation Rules

Enforced server-side, in this order, on every check-in:

1. **Auth** — must be logged in.
2. **Ownership** — habit must belong to the caller (`HABIT_NOT_FOUND`,
   deliberately generic so we don't leak the existence of other users'
   habits).
3. **Future date** — `localDate` cannot be after the user's local "today"
   (`FUTURE_DATE`).
4. **Before habit creation** — `localDate` cannot be before the habit's
   `createdAt`, compared as local dates (`DATE_BEFORE_HABIT`).
5. **Duplicate local day** — checked at the application level first, then
   guaranteed by the DB unique index (`DUPLICATE_CHECK_IN`).

## Environment Variables

**server/.env** (see `server/.env.example`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

**client/.env** (see `client/.env.example`)
```
VITE_API_URL=http://localhost:5000/api
```

## Local Setup

**Prerequisites:** Node 20+, a running MongoDB (local install, Docker, or Atlas).

```bash
# 1. Backend
cd server
cp .env.example .env      # then edit JWT_SECRET, MONGODB_URI if needed
npm install
npm run dev                # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

**Or with Docker Compose** (Mongo + server + client, from repo root):
```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

## Running Tests

```bash
cd server
npm test
```

This runs:
- `localDay.service.test.ts` — timezone conversion + the assignment's
  worked example, verbatim.
- `streak.service.test.ts` — current/longest streak edge cases, including
  the worked example and backfill-joins-two-streaks.
- `api.test.ts` — full HTTP integration tests (register, login, habit
  CRUD, and all 5 check-in validations) using `mongodb-memory-server`,
  which downloads a real MongoDB binary on first run. **This requires
  outbound network access to `fastdl.mongodb.org`**; in network-restricted
  environments (like the one this was authored in) these tests are
  skipped/fail to start for that reason alone — the logic they exercise
  is unaffected, and the same assertions are effectively covered by
  running the app against a real MongoDB (e.g. via `docker compose up`)
  and hitting the endpoints manually or with the same Supertest file
  pointed at a live DB.

## Example Timezone Scenario

User in `Asia/Kolkata` (UTC+05:30) checks in near midnight:
- `2026-03-11T21:30:00Z` → local `2026-03-12 03:00` → counts for **March 12**
- `2026-03-12T17:30:00Z` (20 hours later) → local `2026-03-12 23:00` → also
  **March 12** → rejected as a duplicate, even though ~20 hours apart.

Meanwhile a user in `America/Los_Angeles` (UTC-08:00) at the very same
instant `2026-01-01T02:00:00Z` is still in **2025-12-31** local time —
identical UTC instant, different local day, because timezone (not
elapsed time) is what defines a "day" here.

## Edge Cases

- **Midnight boundary**: handled entirely by converting through the IANA
  timezone at write time — no special-casing needed.
- **DST transitions**: we never hardcode a fixed UTC offset; all
  conversions go through `date-fns-tz`, which uses the real tz database,
  so a spring-forward/fall-back day is still just "one calendar day" with
  23 or 25 hours in it — irrelevant to local-day logic.
- **Same local date, far-apart UTC timestamps**: rejected as duplicate
  (worked example C/D).
- **Different local dates, close UTC timestamps**: both count (worked
  example B/C, only ~11 hours apart).
- **Backfill joining two streak groups**: covered directly in
  `streak.service.test.ts`.

## Trade-offs

- **Streaks are recomputed from scratch on every check-in** rather than
  incrementally maintained. Simpler and safer to reason about; fine at
  the scale of a personal habit tracker. At very large check-in counts
  per habit this would need to become incremental or cached, but that's
  out of scope here.
- **MongoDB over PostgreSQL**: either would work well for this schema;
  Mongo's flexible schema and simple compound unique index made iteration
  fast. A relational DB would let the future-date/before-creation checks
  be expressed as DB constraints too, which is a reasonable alternative
  design.
- **Timezone is set once at signup and not editable** — per the
  assignment, this was left out to keep the local-day model simple and
  unambiguous; see "Future Improvements."

## Future Improvements

- Allow timezone updates post-signup, with an explicit decision on how
  historical check-ins are reinterpreted (likely: never — `localDate` is
  immutable once written, so a timezone change only affects *future*
  check-ins).
- Pagination on check-in history for habits with very long histories.
- A CI workflow running `npm test` on push.
- A real calendar-grid view instead of a flat history list.
