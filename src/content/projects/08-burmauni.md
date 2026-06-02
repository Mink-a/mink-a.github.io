---
title: BurmaUni
type: Admin Portal · Freelance
description: The internal admin & operations portal for an EdTech platform — ~30 modules (catalog, payments, instructors, students, promotions) behind a custom JWT-based RBAC system that enforces access at the route, component, and action levels.
tech: ["TypeScript", "React", "Vite", "React Router", "TanStack Query", "TanStack Table", "Zustand", "nuqs", "Zod", "Axios", "Tailwind CSS"]
image: /assets/covers/burmauni-cover.jpg
featured: true
order: 85
---

## Overview

BurmaUni's web portal is the internal **admin and operations control plane** for an online education platform — the back office staff use to run the whole business: course catalog, lessons and curriculum, instructors, students, payments, promotions, notifications, and feedback. It isn't a CRUD demo; it's a role-driven SaaS back office with around **30 feature modules** and **25 API service domains**, where what a given staff member can see and do is governed by a fine-grained permission system.

## Architecture

The codebase is **feature-sliced** — organized by domain rather than by file type — with Vite path aliases (`@apis`, `@components`, `@pages`, `@configs`, `@hooks`) keeping imports clean.

The separation worth calling out is in the data layer: `apis/services/` holds the raw HTTP functions, and `apis/queries/` wraps each one in a TanStack Query hook. **Pages never touch Axios directly** — they consume typed hooks like `useGetAllCourses()` / `useCreateCourse()`. Cache invalidation is precise rather than guesswork: per-domain **query-key factories** (`coursesKeys.all` / `.detail(id)` / `.filters(obj)`) replace scattered magic strings, so a mutation invalidates exactly the keys it should.

## Role-based access control

The standout subsystem is a self-contained RBAC module that enforces access at **three levels**:

- **Route** — `useRequirePermission(PERMISSIONS.accounts.read)` / a `<ProtectedRoute>` guard.
- **Component** — `<PermissionGate>` and `<Can resource="accounts" action="create">` to gate individual UI elements.
- **Imperative** — `usePermissions().can('accounts', 'delete')` for logic that isn't just rendering.

Permissions are encoded as `resource:action` strings (`courses:publish`, `purchases:refund`, `assignments:grade`), parsed out of the JWT payload at login and stored in a `Set<Permission>` for O(1) lookups. There are **6 roles** (SuperAdmin, Admin, Instructor, Analyst, CustomerSupport, MarketingStrategist) across **~35 resources**, each with create/read/update/delete plus domain-specific verbs. A `findFirstAccessibleRoute()` helper even derives each user's landing page from their permission set, so different roles open into different home screens.

## Silent JWT refresh

Auth uses short-lived JWTs with silent refresh, and the Axios interceptor handles the classic concurrency hazard correctly. When a `401` arrives and several requests are in flight, only the **first** triggers `POST /auth/refresh-token`; the rest are parked in a `failedQueue` and replayed with the new token once refresh resolves — so there's no thundering herd of refresh calls. The refresh request itself uses a bare Axios instance to avoid an interceptor loop, and on failure the interceptor clears cookies/storage and redirects to login.

## URL-driven, server-side tables

Every list page (~20 of them) is built on one generic hook, `use-data-table-params`, that makes the **URL the source of truth** for table state via nuqs + TanStack Table. Pagination, sorting, and filters all live in the query string, so every grid is deep-linkable, shareable, and refresh-safe. The hook handles the fiddly bits once, for everyone: 1-indexed URL pages ↔ 0-indexed table state, throttled filter writes, automatic page reset on filter/sort change, and a `sortByMap` that translates column ids into the backend's numeric sort enums. Tables paginate, sort, and filter **server-side**, so the portal stays fast no matter how large a dataset grows.

## Transactional client workflows

Some operations are multi-step, so the mutations compose several API calls with rollback. Creating a course, for instance, is: create the course → upload its thumbnail through a **presigned URL** → and if the upload fails, delete the just-created course — surfacing a single coherent result and toast rather than leaving an orphaned record behind.

## Tech stack

- **Core** — Vite 5, React 18, TypeScript 5.5 (strict).
- **Routing** — React Router v6 (`createBrowserRouter`), fully lazy-loaded with `React.lazy` + Suspense.
- **State** — TanStack Query v5 (server state), Zustand with persist + devtools (auth/session + UI prefs), nuqs v2 (URL state).
- **Tables & forms** — TanStack Table v8 (server-side), React Hook Form + Zod.
- **UI** — shadcn/ui on Radix, Tailwind CSS 3; Recharts for the analytics dashboard.
- **HTTP** — Axios with request/response interceptors (auth-header injection + the refresh queue).
- **Misc** — react-i18next (English / Burmese), date-fns + dayjs, XLSX export, Lottie, QR codes.
- **Testing & deploy** — Playwright E2E; DigitalOcean App Platform (static) behind Cloudflare, built and shipped by GitHub Actions.

## Deployment

Builds are environment-specific (`build:uat` / `build:prod`) so each bundle embeds the correct API host. The safeguard worth calling out lives in `deploy.sh`: it greps the built bundle and **fails the deploy if the wrong environment's API URL leaked into it** — a deliberate guardrail against the exact UAT/prod mixup that's easy to ship by accident.

## What I took away

BurmaUni was an exercise in building the boring-critical parts of a back office *well*. The permission system, the refresh-and-replay interceptor, and the single URL-state table hook reused across twenty pages are the kind of infrastructure that, done right, makes every feature built on top of them cheaper and safer — and done wrong, becomes a permanent tax. Investing in those primitives early is what let ~30 modules stay consistent instead of drifting apart.
