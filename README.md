# SparkNourish

A mobile-first nutrition, movement and hydration tracker. Log meals, watch your
macros, add movement back to your daily calorie budget, and review your trends —
all against goals computed from your body stats and fitness goal.

Built with **Next.js 16 (App Router)**, **PostgreSQL + Drizzle ORM** and
**Tailwind CSS v4**. A Sparkwell Creative product.

> See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the full feature audit and
> task log.

## Features

- **Diary / Home** — calorie ring with a movement-adjusted budget, protein/carb/fat
  goal bars, water and move tiles, per-meal summaries and a compact day picker
  (`?date=YYYY-MM-DD`) for logging into past or future days.
- **Food database & search** — unified search across **33,000+ USDA FoodData
  Central** items and your own **custom foods**, with serving-size multipliers and
  a multi-select staging cart that commits in one pass.
- **AI logging** — parse a free-form meal description into structured foods
  (`/api/ai/parse-meal`) and estimate nutrition for a named custom food
  (`/api/ai/estimate-food`) via [OpenRouter](https://openrouter.ai).
- **Water tracking** — one-tap 8 oz glasses with an undo, plus a detail modal.
- **Movement** — `/move` hub, activity logger, a live timer, a weekly goal and an
  optional "add exercise to calories" budget contribution.
- **Progress** — week / month / 3-month ranges, day streak, macro split and
  average water.
- **Guided onboarding** — post-signup wizard that collects your goal, stats and
  activity level and computes calorie/macro targets.
- **Timezone-aware** — day boundaries follow the user's IANA time zone (DST and
  half-hour offsets included) rather than UTC.
- **Verdant design system** — forest/coral/amber/lagoon/sand palette, Bricolage
  Grotesque + DM Sans, a persistent device-width bottom nav.

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, React 19 Server Components) |
| Database | PostgreSQL via Drizzle ORM (`drizzle-orm` / `drizzle-kit` / `postgres`) |
| Styling | Tailwind CSS v4 with the Verdant theme (`app/globals.css`) |
| Fonts | `next/font` — Bricolage Grotesque (display) + DM Sans (body) |
| Icons | `lucide-react` |
| Auth | Stateless HMAC-SHA256 session cookie (`app/_lib/session-token.ts`) |
| AI | OpenRouter chat completions |
| USDA importer | Streaming zip reader (`yauzl` + `csv-parse`) |

## Getting started

### Prerequisites

- **Node.js 20.9+** (required by Next.js 16)
- **PostgreSQL 14+** running locally (or a connection string to a hosted database)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
# PostgreSQL connection string (required)
DATABASE_URL=postgres://user:password@localhost:5432/sparknourish

# Random string of at least 32 characters used to sign session cookies (required)
SESSION_SECRET=replace-with-a-long-random-string

# Optional: server-wide OpenRouter key used when a user has not saved their own
OPENROUTER_API_KEY=
```

Generate a secret with e.g. `openssl rand -base64 32` (Windows: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).

### 3. Set up the database

```bash
npm run db:create    # create the database if it does not exist
npm run db:migrate   # apply the Drizzle migrations in ./drizzle
npm run db:seed      # optional: demo account + ~30 days of sample logs
```

`db:seed` creates a development account — **josh@joshmonson.com / password123**
(do not use seeded credentials in production).

### 4. (Optional) Import the USDA food catalog

Download a FoodData Central CSV zip, then point the importer at it (path argument
or the `USDA_ZIP_PATH` env var):

```bash
npm run db:import-usda -- "C:/path/to/FoodData_Central_csv_2026-04-30.zip"
```

The importer streams the archive directly — whole, foundation, survey (FNDDS) and
branded foods are loaded with fiber, sugar, sodium and cholesterol; no unzip step
is required.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app is designed for
mobile; use your browser's device toolbar for the full experience.

## Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:create` | Create the database named in `DATABASE_URL` if missing |
| `npm run db:generate` | Generate a new SQL migration from `db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed a demo user and sample logs |
| `npm run db:import-usda` | Stream a USDA FoodData Central CSV zip into the catalog |

## Project structure

```
app/
  page.tsx              Diary / Home
  add-food/             Food search, quick actions and staging cart
  food/[id]/            Food detail (serving stepper, macros/micros)
  meals/                All-meals list + per-meal editor
  move/                 Movement hub, logger, live timer, completion
  history/              Progress (ranges, streak, macro split, water)
  profile/              Settings (targets, movement, preferences, AI key)
  onboarding/           Guided post-signup wizard
  login/ signup/        Auth screens
  api/                  Route handlers (auth, food-log, movement, water, AI, ...)
  _components/          Shared UI (nav, rings, tiles, icons, timezone sync)
  _lib/                 Auth, calendar/timezone, nutrition, movement, session
db/
  schema.ts             Drizzle table definitions
  queries.ts            Data-access layer
  index.ts              Database client
  seed.ts               Demo data
drizzle/                Generated SQL migrations + snapshots
scripts/                ensure-db, import-usda
proxy.ts                Optimistic route protection (auth gate)
```

## How it works

- **Auth** — `proxy.ts` performs an optimistic cookie check on every non-asset
  request; pages and route handlers then verify the user against the database via
  `requireUser()` / `getSessionUser()`. Sessions are stateless
  `<userId>.<expiresAt>.<hmac>` cookies.
- **AI** — each user can store an OpenRouter key in Profile; the server falls back
  to `OPENROUTER_API_KEY` when none is set.
- **Time zones** — `users.timezone` holds the IANA zone, synced from the device on
  signup/login/load and editable in Profile. `app/_lib/calendar.ts` computes local
  day boundaries so logs, history and movement land on the correct day.

## Data model

`users` · `food_log_entries` · `movement_log_entries` · `water_log_entries` ·
`custom_foods` · `usda_foods` (see `db/schema.ts` for the full definitions).

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL`, `SESSION_SECRET` (and optionally
   `OPENROUTER_API_KEY`) in the hosting environment.
2. Apply migrations against the production database: `npm run db:migrate`.
3. Deploy — e.g. to Vercel, which detects the Next.js app automatically.

## Documentation

- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — implementation status, data model,
  API matrix and task log.
- [`AGENTS.md`](./AGENTS.md) — notes for contributors and coding agents.

---

A **Sparkwell Creative** product. Private project — all rights reserved.
