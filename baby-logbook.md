# Baby Logbook — Project Documentation

> Baby tracker PWA for **Adam** (born May 5, 2026).  
> Built by David Gelashvili. Deployed on Vercel, auto-deploys from `main` branch.  
> Last updated: 2026-05-27 (commit `172075c`)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database (Supabase)](#database-supabase)
5. [Pages & Features](#pages--features)
6. [Data Layer — queries.ts](#data-layer--queriests)
7. [Supabase Client — supabase.ts](#supabase-client--supabasests)
8. [Translations — translations.ts](#translations--translationsts)
9. [Contexts](#contexts)
10. [Key Patterns & Conventions](#key-patterns--conventions)
11. [Bugs Fixed](#bugs-fixed)
12. [SQL Migrations Run](#sql-migrations-run)
13. [Changelog (Commits)](#changelog-commits)

---

## Overview

A multi-user family PWA for tracking a newborn's daily activities:
- **Feeding** — manual log or live timer (synced across devices via Supabase)
- **Sleep** — live timer with optional retroactive start time (synced across devices)
- **Diaper** — log pee/poop/both with type picker
- **Bath** — log bath time
- **Vitamin D** — reminder after bath/diaper at 18:00+, logs to DB so all users see it

Multiple family members can use the same app simultaneously. All timers and data are synced in real time through Supabase polling.

**Languages:** Hebrew (he) + Russian (ru), RTL-aware layout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 (inline `@theme` in CSS) |
| Routing | Wouter |
| Server state | TanStack React Query v5 |
| Backend / DB | Supabase (PostgreSQL + Edge Functions) |
| Auth | PIN → Supabase Edge Function → custom JWT |
| Icons | Lucide React |
| Date utils | date-fns |
| UI primitives | Radix UI (shadcn/ui style) |
| Charts | Recharts |
| Animation | Framer Motion |
| Font | `@fontsource/outfit` (self-hosted, no render-blocking) |
| Deployment | Vercel (auto-deploy from GitHub `main`) |

---

## Project Structure

```
Baby-Logbook/
├── src/
│   ├── App.tsx                    # Router setup, all routes
│   ├── main.tsx                   # Entry point, QueryClient provider
│   ├── index.css                  # Tailwind + theme variables
│   ├── components/
│   │   ├── auth-wrapper.tsx       # Redirects to /pin if not authenticated
│   │   ├── bottom-nav.tsx         # Bottom navigation bar (5 tabs)
│   │   ├── install-guide.tsx      # PWA install instructions
│   │   ├── live-clock.tsx         # Real-time clock display
│   │   ├── name-setup.tsx         # First-run name picker
│   │   ├── page-header.tsx        # Shared page header with back button
│   │   ├── push-prompt.tsx        # Push notification opt-in
│   │   └── theme-provider.tsx     # Dark/light/system theme
│   ├── contexts/
│   │   ├── language-context.tsx   # Lang (he/ru) + dir (rtl/ltr) state
│   │   └── person-context.tsx     # Logged-in person name state
│   ├── hooks/
│   │   ├── use-goals.ts           # Read/write custom feeding & sleep goals
│   │   ├── use-mobile.tsx         # Mobile breakpoint detection
│   │   ├── use-push-notifications.ts  # Web push registration
│   │   └── use-toast.ts           # Toast notification hook
│   ├── lib/
│   │   ├── queries.ts             # All React Query hooks + mutations
│   │   ├── supabase.ts            # Supabase client, types, toEvent mapper
│   │   ├── translations.ts        # All UI strings (Hebrew + Russian)
│   │   └── utils.ts               # cn() classname utility
│   └── pages/
│       ├── dashboard.tsx          # Home screen with status cards & banners
│       ├── feeding.tsx            # Feeding log / timer
│       ├── sleep.tsx              # Sleep log / live timer
│       ├── diaper.tsx             # Diaper log
│       ├── bath.tsx               # Bath log
│       ├── history.tsx            # Scrollable event history
│       ├── schedule.tsx           # Daily timeline + weekly grid
│       ├── pin.tsx                # PIN entry screen
│       └── not-found.tsx          # 404
├── SUPABASE_SCHEMA.sql            # Full DB schema + RLS policies
├── PROJECT.md                     # ← This file
└── package.json
```

---

## Database (Supabase)

### Table: `events`

```sql
create table if not exists events (
  id               serial primary key,
  type             text not null check (type in ('feeding', 'sleep', 'diaper', 'bath', 'vitamin_d')),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_minutes integer,
  amount_ml        integer,
  diaper_type      text check (diaper_type in ('pee', 'poop', 'both')),
  notes            text,
  is_active        boolean not null default false,
  created_at       timestamptz not null default now()
);
```

> **Note:** `logged_by` column may or may not exist depending on migration state.  
> All insert functions use `safeInsert()` which retries without `logged_by` if the column is missing (error code `42703`).

### Indexes

```sql
create index events_started_at_idx on events (started_at desc);
create index events_type_idx       on events (type);
create index events_is_active_idx  on events (is_active) where is_active = true;
```

### Row Level Security

```sql
alter table events enable row level security;
create policy "Allow all" on events for all using (true) with check (true);
```

Access is protected at the app level by the PIN → JWT flow, not at the DB level.

### `is_active` Flag

Used for live sessions:
- `sleep` with `is_active = true` → baby is currently sleeping (timer running)
- `feeding` with `is_active = true` → feeding timer is running

Only one active session per type is allowed. Starting a new one deactivates the previous.

---

## Pages & Features

### `/` — Dashboard (`dashboard.tsx`)

- Live clock
- Baby's age display
- **Active sleep banner** (teal) — shows live sleep duration, updates every second
- **Active feeding banner** (blue) — shows live feeding duration from DB; synced across devices
- **Vitamin D reminder banner** (amber) — appears after bath/diaper if "remind me later" was tapped; has "נתתי לו ✓" button that logs to DB and clears reminder
- Recent activity chips (feeding/sleep/diaper — minutes ago)
- Daily summary stats (feedings count + ml, sleep hours, diapers)
- 4 quick-action buttons: Feeding / Sleep / Diaper / Bath

Event icons & colors:
| Type | Icon | Color |
|---|---|---|
| feeding | 🍼 | blue |
| sleep | 😴 | indigo |
| diaper | 👶 | amber |
| bath | 🛁 | teal |
| vitamin_d | 💊 | purple |

---

### `/feeding` — Feeding (`feeding.tsx`)

Two modes:
1. **Timer mode** — tap "Start" → live timer stored in Supabase (`is_active=true`). All devices see the same timer. Tap "Stop" → fills in start/end time automatically. Save updates that DB record (`useUpdateEvent`).
2. **Manual mode** — enter start time, end time, amount (ml), notes. Saves a new record.

Features:
- **Retroactive start** — "האכלה מ-" time picker visible before pressing Start; if set, timer starts from that past time (same pattern as sleep)
- Midnight crossing handled: if end time < start time, adds 24h
- ✕ clear buttons on both time inputs
- Amount in ml input
- Cross-device sync via 10s polling (`refetchInterval: 10_000`)

---

### `/sleep` — Sleep (`sleep.tsx`)

Two modes:
1. **Live timer mode** — tap "Start Sleep" → `useStartSleep()` writes `is_active=true` to DB. All devices see the same timer. Tap "Stop" → fills times automatically.
2. **Manual mode** — enter start + end time, notes.

Extra feature — **retroactive start time**:
- Optional "ישן מ-" / "Спит с" time input before pressing Start
- If set, the DB row is written with `started_at = that time` (not now)
- All devices see the correct elapsed time from the past timestamp

Midnight crossing fix: `computeMinutes()` adds `24*60` if `diff < 0`.

---

### `/diaper` — Diaper (`diaper.tsx`)

- Time picker with ✕ clear button
- Type selector: Pee / Poop / Both (large tap targets)
- Notes field
- Vitamin D reminder overlay after 18:00 **only if not already given today**: 2 buttons
  - **"נתתי לו ✓"** — calls `useLogVitaminD()`, sets `vitamin-d-given = today`, removes remind flag, navigates home
  - **"תזכיר לי אח״כ"** — sets `localStorage.setItem("vitamin-d-remind", "true")`, navigates home

---

### `/bath` — Bath (`bath.tsx`)

- Time picker with ✕ clear button
- Notes field
- Visible error display (red box) if Supabase save fails
- Same Vitamin D reminder overlay as diaper (triggers after 18:00, skipped if already given today)

---

### `/history` — History (`history.tsx`)

- Reverse-chronological event list
- Event icons with type-specific colors (feeding=blue, sleep=indigo, diaper=amber, bath=teal, vitamin_d=purple)
- Shows duration, amount, diaper type, notes
- Delete button per event
- "Who logged" label

---

### `/schedule` — Schedule (`schedule.tsx`)

Two views (tab-switched):

**Daily Timeline:**
- 24-hour vertical timeline for a selected date
- Events rendered as colored blocks by hour
- Handles overlapping events
- Colors: feeding=blue, sleep=indigo, diaper=amber, bath=teal, vitamin_d=purple
- Labels for each event block

**Weekly Grid:**
- 7-day columns, time on y-axis
- Sticky header is inside the scroll container (fixes scrollbar misalignment bug)
- `TYPE_COLORS_WEEKLY`: feeding=`bg-blue-400/75`, sleep=`bg-indigo-400/75`, diaper=`bg-amber-400/75`, bath=`bg-teal-400/75`, vitamin_d=`bg-purple-400/75`

---

### `/guide` — Parent Guide (`guide.tsx`)

- In-app walkthrough for parents
- 8 sections: Feeding, Sleep, Diaper, Bath+VitD, History, Schedule, Multi-user, Tips
- Hebrew + Russian (uses current language setting)
- Accessible via the `?` (HelpCircle) icon in the dashboard header

---

### `/pin` — PIN Entry (`pin.tsx`)

- 4-digit PIN input
- Calls Supabase Edge Function `verify-pin`
- On success: stores JWT, sets authenticated state
- Rate-limited: shows lockout message on 429

---

## Data Layer — `queries.ts`

### Query Keys

```ts
getListEventsQueryKey(params?)           // ["events", date, limit]
getGetRecentActivityQueryKey()           // ["recent-activity"]
getGetDailySummaryQueryKey(params?)      // ["daily-summary", date?]
getGetActiveSleepQueryKey()              // ["active-sleep"]
getGetActiveFeedingQueryKey()            // ["active-feeding"]
getListEventsRangeQueryKey(params)       // ["events-range", startDate, endDate]
```

### Queries

| Hook | Description |
|---|---|
| `useGetAuthStatus()` | Returns `{ authenticated, babyName, babyBirthDate }` |
| `useListEvents(params)` | All events, optionally filtered by date + limit |
| `useGetRecentActivity()` | Minutes since last feeding/sleep/diaper |
| `useGetDailySummary(params)` | Counts + totals for a given date |
| `useGetActiveFeeding()` | Live feeding session from DB (polls every 10s) |
| `useGetActiveSleep()` | Live sleep session from DB (polls every 15s) |
| `useListEventsRange(params)` | Events between two dates (for weekly schedule) |

### Mutations

| Hook | Description |
|---|---|
| `useVerifyPin()` | POST to Edge Function, stores JWT on success |
| `useLogout()` | Clears JWT session |
| `useLogFeeding(options?)` | Insert manual feeding record |
| `useStartFeeding(options?)` | Stop any active feeding → insert new `is_active=true` |
| `useStopFeeding(options?)` | Find active feeding → update `is_active=false`, set duration |
| `useLogSleep(options?)` | Insert manual sleep record |
| `useStartSleep(options?)` | Stop any active sleep → insert new `is_active=true`; accepts optional `startedAt` for retroactive timer |
| `useStopSleep(options?)` | Find active sleep → update `is_active=false`, set duration |
| `useLogDiaper(options?)` | Insert diaper record |
| `useLogBath(options?)` | Insert bath record |
| `useLogVitaminD(options?)` | Insert `vitamin_d` event (type, started_at, is_active=false) |
| `useUpdateEvent(options?)` | Patch any event by ID |
| `useDeleteEvent(options?)` | Delete event by ID |

### `safeInsert(table, payload)`

All inserts go through this helper. If the DB returns error code `42703` (column `logged_by` doesn't exist), it retries without that field. This ensures backward compatibility if the column hasn't been added yet.

### Cache Invalidation

`invalidateEventCaches(queryClient)` clears:
- `["events"]`, `["events-range"]`, `["recent-activity"]`, `["daily-summary"]`

---

## Supabase Client — `supabase.ts`

### Types

```ts
type EventRow = {
  id: number;
  type: "feeding" | "sleep" | "diaper" | "bath" | "vitamin_d";
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  amount_ml: number | null;
  diaper_type: "pee" | "poop" | "both" | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

type Event = {
  id: number;
  type: "feeding" | "sleep" | "diaper" | "bath" | "vitamin_d";
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  amountMl: number | null;
  diaperType: "pee" | "poop" | "both" | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};
```

`toEvent(row: EventRow): Event` maps snake_case DB rows to camelCase app objects.

### Auth Flow

1. User enters PIN → `useVerifyPin()` calls Supabase Edge Function `verify-pin`
2. Edge function validates PIN against `JWT_SECRET`, returns a signed JWT
3. `initSupabaseWithJWT(token)` creates a new Supabase client with the JWT as the auth header
4. `hasValidSession()` checks if a JWT is stored and not expired
5. `clearSession()` removes the JWT (logout)

---

## Translations — `translations.ts`

All UI strings are defined here with `he` (Hebrew) and `ru` (Russian) variants.

Usage: `tr("keyName", lang)` where `lang` is `"he"` or `"ru"`.

Key additions:
```ts
vitamin_d:            { he: "ויטמין D 💊",         ru: "Витамин D 💊" }
sleepStartFrom:       { he: "ישן מ-",               ru: "Спит с" }
vitaminDGave:         { he: "נתתי לו ✓",            ru: "Дал(а) ✓" }
vitaminDRemindLater:  { he: "תזכיר לי אח״כ",        ru: "Напомни позже" }
vitaminDReminderBanner: { he: "⏰ תזכורת: ויטמין D לאדם", ru: "⏰ Напоминание: витамин D для Адама" }
vitaminDTitle:        { he: "נתת ויטמין D לאדם?",   ru: "Дал(а) витамин D Адаму?" }
vitaminDBody:         { he: "...",                   ru: "..." }
```

---

## Contexts

### `LanguageContext`

Provides `{ lang, setLang, dir }`:
- `lang`: `"he"` | `"ru"` (persisted in localStorage)
- `dir`: `"rtl"` (he) | `"ltr"` (ru)
- All page containers use `dir={dir}` for proper RTL/LTR layout

### `PersonContext`

Provides `{ name, setName }`:
- Name is set during first-run setup after PIN
- Stored in localStorage
- Passed as `loggedBy` to all insert mutations

---

## Key Patterns & Conventions

### Midnight Crossing

Sleep and feeding time calculations handle crossing midnight:

```ts
function computeMinutes(start: string, end: string): number | null {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh! * 60 + em!) - (sh! * 60 + sm!);
  if (diff < 0) diff += 24 * 60; // crosses midnight
  return diff > 0 ? diff : null;
}
```

When converting `HH:mm` to ISO for end times, if end < start, add 1 day:
```ts
function timeToISO(timeStr: string, baseDate: Date, refTimeStr?: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h!, m!, 0, 0);
  if (refTimeStr) {
    const [rh, rm] = refTimeStr.split(":").map(Number);
    if (h! * 60 + m! < rh! * 60 + rm!) d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}
```

### Cross-Device Timer Sync

Both feeding and sleep timers are synced via Supabase:
- Timer state is stored in DB (`is_active = true`, `started_at`)
- All devices poll the DB (`refetchInterval: 10_000` for feeding, `15_000` for sleep)
- Timer elapsed = `now - started_at` (calculated client-side from DB timestamp)
- **Not** localStorage — that would only work on the device that started it

### Vitamin D Reminder Flow

Two localStorage keys:
- `"vitamin-d-remind"` = `"true"` → "remind me later" was pressed; shows amber dashboard banner
- `"vitamin-d-given"` = `"yyyy-MM-dd"` → given today; suppresses all overlays and banner for the rest of the day

1. Bath or diaper saved after 18:00 **and** `vitamin-d-given ≠ today` → show overlay
2. **"נתתי לו ✓"** button (overlay or dashboard banner):
   - `useLogVitaminD.mutate({ loggedBy })` → inserts `vitamin_d` event in DB
   - `localStorage.setItem("vitamin-d-given", today)` — prevents re-prompt all day
   - `localStorage.removeItem("vitamin-d-remind")`
   - `window.dispatchEvent(new Event("vitamin-d-remind-change"))` (same-tab sync)
   - Navigate to `/`
3. **"תזכיר לי אח״כ"** button:
   - `localStorage.setItem("vitamin-d-remind", "true")`
   - `window.dispatchEvent(new Event("vitamin-d-remind-change"))`
   - Navigate to `/`
4. Dashboard listens to `"vitamin-d-remind-change"` event. Shows amber banner only if `remind=true` AND `given ≠ today`
5. Next day: `vitamin-d-given` holds yesterday's date → all prompts reset automatically

### Time Picker Clear Buttons

All time pickers have an ✕ button next to them (using `X` from Lucide):
```tsx
<button onClick={() => setTime(format(new Date(), "HH:mm"))}>
  <X className="w-4 h-4" />
</button>
```
This resets the time to the current time (not empty — a time input always needs a value).

---

## Bugs Fixed

| Bug | Root Cause | Fix |
|---|---|---|
| Bath save silently failing (400) | Supabase CHECK constraint only had `('feeding', 'sleep', 'diaper')` — `'bath'` was rejected | ALTER TABLE to add `'bath'` to constraint |
| Sleep duration wrong across midnight (22:15→01:35 showed ~22h) | `diff` was negative, returned null | Added `if (diff < 0) diff += 24 * 60` |
| Feeding timer not synced across devices | Timer used localStorage — per-device only | Replaced with Supabase `is_active=true` approach, polled every 10s |
| Vitamin D save failing (400) | `'vitamin_d'` not in Supabase CHECK constraint | ALTER TABLE to add `'vitamin_d'` |
| Weekly grid header misaligned with columns | Sticky header was outside scroll container; scrollbar shifted columns but not header | Moved sticky header inside the scroll container |
| Vitamin D reminder threshold was 19:00 | Off-by-one from original implementation | Changed `>= 19` → `>= 18` in both bath.tsx and diaper.tsx |
| Vitamin D overlay re-appears after every bath/diaper | No "given today" memory — only had a "remind me" flag, never "already gave" | Added `vitamin-d-given` localStorage key storing today's date; overlay skipped if given today; resets next day automatically |
| PIN page shows twice — must enter PIN twice | `AuthWrapper` used async React Query for auth check; stale cache briefly showed `authenticated: false` after login, triggering redirect back to `/pin` | Replaced with synchronous `isAuthenticated()` — reads in-memory JWT directly, no cache race |

---

## SQL Migrations Run

All migrations must be run in **Supabase → SQL Editor**.

### 1. Add `bath` to type constraint (run: 2026-05-xx)

```sql
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
  LOOP EXECUTE format('ALTER TABLE events DROP CONSTRAINT %I', r.conname); END LOOP;
END $$;

ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('feeding', 'sleep', 'diaper', 'bath'));
```

### 2. Add `vitamin_d` to type constraint (run: 2026-05-27)

```sql
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
  LOOP EXECUTE format('ALTER TABLE events DROP CONSTRAINT %I', r.conname); END LOOP;
END $$;

ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('feeding', 'sleep', 'diaper', 'bath', 'vitamin_d'));
```

> **Pattern for future type additions:** Same structure — drop the constraint by querying `pg_constraint`, then re-add with the new value included.

---

## Changelog (Commits)

| Commit | Description |
|---|---|
| `172075c` | Fix blank screen — remove broken manualChunks, AuthWrapper never returns null |
| `49b0ced` | Performance: self-host font, lazy pages + feeding retro-start + guide page |
| `11ad113` | Fix vitamin D re-prompt, PIN double-show, dashboard gave-it logging |
| `21f35b8` | Sleep retroactive timer, vitamin D logging, weekly grid fix |
| `648d424` | Fix sleep midnight crossing, feeding timer cross-device sync, clear buttons, vitamin D 2-button flow |
| `57c7a40` | Show error message on bath save failure |
| `1280b71` | Fix bath save and vitamin D reminder threshold |
| `2a3b92a` | Add feeding timer on home, bath, vitamin D reminder + layout fix |
| `2c97ff5` | Replace weekly bar chart with readable 7-day grid table |
| `f59662b` | Add weekly stats chart, custom goals in settings |
| `b5a583c` | No-scroll dashboard layout + larger bottom nav |
| `0d0c8cf` | Persist push prompt dismissal in localStorage |
| `0cda920` | Translate diaper types in schedule calendar |
| `72866c9` | Implement server-side PIN validation via Supabase Edge Function |
| `d548b05` | Live sleep button shared between all users |
| `ab57cc9` | Auto theme, name picker after PIN, language select, who logged, schedule overlap, security |

---

*This file is updated after every change session.*
