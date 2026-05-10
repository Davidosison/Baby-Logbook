# The Newborn Tracker

A mobile-first PWA for new parents to log and track their newborn baby's feedings, sleep sessions, and diaper changes — built for shared family access with a simple 4-digit PIN.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, exposed at /api)
- `pnpm --filter @workspace/newborn-tracker run dev` — run the frontend PWA
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — Session signing secret (already set)
- Optional env: `FAMILY_PIN` — 4-digit family PIN (default: `1234`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (PWA with manifest + service worker)
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/events.ts` — Events table schema
- `artifacts/api-server/src/routes/` — Backend route handlers (auth, events, summary)
- `artifacts/newborn-tracker/src/` — React PWA frontend
- `artifacts/newborn-tracker/public/manifest.json` — PWA manifest
- `artifacts/newborn-tracker/public/sw.js` — Service worker

## Architecture decisions

- Session-based auth with a shared Family PIN (not per-user accounts — this is a family tool)
- All event types (feeding, sleep, diaper) share a single `events` table with nullable typed columns
- Sleep sessions can be "active" (isActive=true) for the live timer; stopping them computes durationMinutes
- Frontend defaults to dark mode (stored in localStorage) — optimized for night feedings
- Hebrew labels displayed prominently with RTL text alongside English sublabels

## Product

- **PIN Screen** — Family PIN entry (default: `1234`) to access the tracker
- **Dashboard** — Live "time since last event" for each type, daily progress bars, today's timeline
- **Feeding log** — Log amount (ml) or duration (minutes) + optional notes
- **Sleep tracker** — Start/Stop toggle with live timer, or manual entry
- **Diaper log** — Tap Pee / Poop / Both (large tap targets for one-handed use)
- **History** — Full scrollable timeline with delete support

## User preferences

- Hebrew labels displayed prominently alongside English (RTL support)
- Dark mode is the primary mode (night feedings use case)
- Mobile-first, large tap targets for one-handed use
- Baby born May 5, 2026

## Gotchas

- The `FAMILY_PIN` env var defaults to `1234` if not set — set it to a custom PIN via Replit Secrets
- Sleep sessions: only one can be active at a time; starting a new one auto-stops the previous
- Session cookie is `sameSite: none` in production (required for cross-origin PWA installs)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
