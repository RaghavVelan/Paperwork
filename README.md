# Paperwork

A quiet personal ledger. Track money in and out on this device, on a calendar.

New devices start on a short setup (name, timezone, spend cap) and an empty ledger — no sample entries. Phone layout uses a bottom nav. Desktop uses a sidebar. The header holds a light / dark / system toggle and a profile avatar. Data stays in `localStorage` (`paperwork.ledger.v5`) so login and sync can plug in later without rewriting the screens.

Live: [https://paperwork-rv.vercel.app](https://paperwork-rv.vercel.app)

## Stack

- React 19 + TypeScript
- TanStack Start (file routes, SSR)
- Vite 8 + Tailwind v4
- Manrope
- Motion for micro-interactions (sheet uses CSS so it always fully closes)
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

Add / edit is a bottom sheet, not a route. Appearance is light, dark, or follow the system.

## Data

`src/lib/ledger/repository.ts` is the persistence boundary. Swap `getLedgerRepository()` for an API later; the Zustand store never talks to `localStorage` directly.
