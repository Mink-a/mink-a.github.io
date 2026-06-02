---
title: CoBudget
type: Personal Project · Expense Splitting
description: A mobile-first, offline-first PWA for splitting shared expenses among friends and roommates — flexible splits, a realtime feed, and a close-based ledger that settles up in the fewest transfers.
tech: ["TypeScript", "React", "Vite", "Supabase", "PostgreSQL", "TanStack Query", "TanStack Router", "Tailwind CSS", "PWA", "Vercel"]
demoUrl: https://co-budget-snowy.vercel.app
image: /assets/covers/co-budget-cover.webp
featured: true
order: 90
---

## Overview

CoBudget started with a real situation: a trip where everyone fronts different expenses and nobody wants to do spreadsheet math at the end. It's a small, mobile-first PWA where a group logs shared expenses, splits each one across whichever members it applies to, and settles up through a *close-based ledger* that computes the minimum set of transfers needed to make everyone even.

The actual money movement happens outside the app — cash, a bank transfer, Venmo, whatever — CoBudget just keeps the books and tells you the shortest way to square up. And because it's built to be lived in on a phone, you can install it to the home screen and keep using it on a weak connection: expenses created offline queue locally and sync the moment you reconnect.

## Architecture

CoBudget is a single-page PWA that talks **directly to Supabase from the browser** — there is no custom API tier. Authorization is enforced server-side by Postgres **Row Level Security (RLS)**, so the database itself is the trust boundary rather than a middle layer I'd have to write and secure.

```text
React 19 SPA (Vite)
  routes/      thin file-based routes — loaders + auth guards
  app/         screen views & feature widgets
  lib/queries · lib/mutations · lib/actions
  lib/supabase singleton client
        │  HTTPS + WebSocket (Realtime)
        ▼
Supabase — Postgres + RLS + Auth + Realtime
```

A few conventions keep that workable as the app grows:

- **Thin routes.** Files in `src/routes/` ([TanStack Router](https://tanstack.com/router), file-based) only define the route, validate search params, kick off data loading with `queryClient.ensureQueryData(...)`, and render a view. A single `_auth` layout route guards every authenticated screen and renders the mobile tab bar or desktop sidebar.
- **Centralized data access.** Reads live in `lib/queries`, writes (with cache invalidation) in `lib/mutations`, and imperative helpers in `lib/actions` — all resolving to one shared Supabase client. Server state is owned by [TanStack Query](https://tanstack.com/query); I don't hand-roll caching.
- **RLS as the boundary.** Policies lean on a `get_my_group_ids()` SQL helper so a member can only ever read or write data for groups they belong to — and routing membership through that helper sidesteps the recursive-policy trap you hit when a table's policy needs to query the same table.
- **Pure settlement math.** All the money logic lives in `src/lib/ledger.ts` with no I/O, so it's trivial to unit-test and reason about in isolation.

## Key features

### Two modes and flexible splitting

Every group is either **Split** (tracks who owes whom and computes settlements) or **Track** (totals-only spending, no debts). Within a split group, each expense picks exactly which members share it, plus a note, date, and category — so a dinner four people attended doesn't get charged to the two who skipped it.

### A realtime shared feed

New expenses from other members appear instantly through **Supabase Realtime** — a Postgres change feed over a WebSocket — so the group's ledger stays live without anyone pulling to refresh.

### Sign-in that meets people where they are

Four entry paths: email one-time code (OTP), email + password, Google OAuth, and instant **anonymous guest** access. Guests can try the whole app and later upgrade to a real account without losing any data.

### Shareable invites

Groups are joined through multi-use, expiring invite links with optional member approval. A recipient can open the link and begin the join flow even before they have an account.

### Personalization and i18n

Six color themes, light/dark/system mode, configurable currency symbol and position, a "centless" mode that hides cents, optional haptics and sound, and selectable tab-bar animations. Everything ships in **English and Burmese** out of the box (i18next), and push notifications back configurable meal reminders (breakfast / lunch / dinner).

## How settlement works

The settlement engine is the heart of the app, and it's deliberately pure code in `src/lib/ledger.ts`:

1. **`calculateNetBalances`** walks every expense, credits the payer the full amount, and debits each split member an equal share (rounded to cents), producing a `net = totalPaid − totalOwed` for each person.
2. **`simplifySettlements`** greedily matches the largest creditor against the largest debtor, collapsing the web of "who owes whom" into the fewest possible transfers.

The classic example: if A owes B $10 and B owes C $10, the naive plan is two payments — but simplification produces a single transfer, **A pays C $10**.

Settlement is wrapped in a **close** workflow so a group can agree on the books for a period:

- A member starts a close; the period's expenses are **locked**, settlements are computed and stored, and every member is asked to confirm.
- All confirm → the close is **Settled**. Anyone disputes → **Disputed**. The initiator can undo → **Cancelled**.
- In Track mode there are no debts, so a close settles automatically with no acknowledgment step.

Because the math is pure and the close states are explicit, the UI is always just a render of where a close actually is — there's no hidden derived state to drift out of sync.

## Offline-first sync

A phone on a trip is exactly when connectivity is worst, so offline isn't an afterthought:

1. An expense created offline is written to an **IndexedDB queue** with a `pending` status and an amber treatment in the UI, so you can see what hasn't synced yet.
2. On reconnect, **Background Sync** (with a foreground sync manager as a fallback) flushes the queue to Supabase.
3. Each item resolves as synced, retryable-failed (up to a max), or flagged — and pending items can still be edited before they ever reach the server.

The [Serwist](https://serwist.pages.dev/) service worker also precaches the app shell and serves an `offline.html` fallback for navigations, so the app opens even with no network at all.

## Data model

Every table enforces RLS. The core of the schema:

- `groups` + `group_members` — a shared group (with its split/track mode) and its membership.
- `expenses` + `expense_members` — an expense and the subset of members it's split across; expenses publish to Realtime.
- `closes`, `close_settlements`, `close_acknowledgments` — a settlement period, its computed "who pays whom" transfers, and each member's confirm/dispute status.
- `group_invites` — multi-use, expiring join tokens with optional approval.
- `profiles`, `user_categories`, `notification_preferences`, `push_subscriptions` — per-user identity, custom categories, and notification wiring.

Alongside the tables, a few SQL functions do real work: `get_my_group_ids()` powers the RLS policies, and `is_expense_settled()` blocks edits to an expense once its period has been closed — enforcing the "locked books" rule in the database rather than trusting the client.

## Tech stack

- **Build & UI** — Vite 7, React 19, TypeScript.
- **Routing & data** — TanStack Router (file-based, code-split) and TanStack Query for all server state.
- **Backend** — Supabase: Postgres, Auth, Realtime, and Row Level Security — no bespoke API server.
- **Styling & components** — Tailwind CSS v4, shadcn/ui on Radix primitives, Framer Motion for animation, Vaul for drawers, Recharts for spending charts, Phosphor icons, Sonner toasts.
- **PWA** — Serwist for the service worker (precache, push, background sync); web-haptics for tactile feedback.
- **i18n** — i18next + react-i18next (English + Burmese).
- **Tooling** — Vitest + Testing Library for units, Playwright for E2E.

## Testing and deployment

The pure settlement logic is the highest-value unit target, so `src/lib/ledger.ts` is covered with **Vitest** in a jsdom environment. **Playwright** drives end-to-end flows — auth, group, expense, and ledger — against a Mobile Chrome (Pixel 5) profile, which matches how the app is actually used.

It deploys to **Vercel** as a Vite project: `/` serves a static marketing landing page, and every other non-asset path falls back to `index.html` for SPA routing. Only `VITE_`-prefixed env vars are exposed to the browser; the service-role key used for seeding stays server-side and out of the bundle.

## What I took away

CoBudget is the project where I leaned hardest on the database as the backend. Pushing authorization into RLS instead of a custom API removed a whole tier I'd otherwise own — but it demanded real discipline about policies (and taught me the recursive-policy lesson firsthand). Keeping the settlement math pure made the scariest part of a money app the easiest part to trust, and treating offline as a first-class state rather than an error case is what makes it genuinely pleasant to use on the road.
