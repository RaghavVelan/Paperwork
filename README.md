# Paperwork

A quiet personal ledger. Track money in and out on this device, on a calendar.

Phone layout uses a bottom nav. Desktop uses a sidebar. Profile (avatar, top right) holds name, currency, timezone, and a monthly spend cap. Data stays in `localStorage` today (`paperwork.ledger.v1`) so login and sync can plug in later without rewriting the screens.

## Stack

- React 19 + TypeScript
- TanStack Start (file routes, SSR)
- Vite 8 + Tailwind v4
- Zustand for transactions + profile
- Recharts on Insights

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:3000`).

```bash
npm run typecheck
npm run build
```

## App map

| Path | Screen |
|---|---|
| `/` | Home — month balance, week strip, recent entries |
| `/calendar` | Month grid with daily spend |
| `/insights` | Daily bars, categories, save rate |
| `/profile` | Name, currency, timezone, budget |

Add / edit is a bottom sheet, not a route.

## Data

`src/lib/ledger/repository.ts` is the persistence boundary. Swap `getLedgerRepository()` for an API later; the Zustand store never talks to `localStorage` directly.
