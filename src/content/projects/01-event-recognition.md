---
title: Meeeetup
type: Event Platform · Meeeetup
description: An event & community-meetup platform for the Japanese market — discovery, Stripe ticketing, a multi-step Event Studio, QR check-in, and analytics — built on a shared, multi-tenant Next.js engine that also powers a coworking product.
tech: ["TypeScript", "Next.js", "React", "PostgreSQL", "Prisma", "NextAuth", "TanStack Query", "Zod", "Tailwind CSS", "Stripe", "Turborepo", "AWS"]
image: https://placehold.co/1280x720/0c0a09/fb923c?text=Meeeetup&font=inter
featured: true
order: 100
---

## Overview

Meeeetup is an event and community-meetup management platform for the Japanese market (ミートアップ・交流会) — organizers run events end to end while attendees discover, register, pay, and check in. What makes it worth showcasing isn't only the feature set; it's that Meeeetup is one of *two* production apps running on a single shared engine, re-skinned and re-routed into distinct products by configuration rather than by forking.

## Two products, one engine

The codebase is a Turborepo monorepo (Yarn workspaces). Two Next.js apps — `web` (Meeeetup) and `coworking` (Meeeetup Coworking) — sit on top of shared packages that hold essentially all of the logic:

```text
apps/
  web/           Meeeetup            (events & meetups)
  coworking/     Meeeetup Coworking  (booking + access control)
  sqs-processor/ shared AWS Lambda email worker
packages/
  features/         every route, service, server action, schema, hook
  ui/               framework-agnostic design system (shadcn/Radix)
  coworking-prisma/ the shared Prisma schema (Postgres)
  config / logger / utils / emails / ...
```

The apps themselves contain almost no code. Each `page.tsx` is a ~20-line wrapper that re-exports a shared component and overrides only SEO metadata:

```ts
// apps/coworking/app/space/page.tsx — a "space" IS an event under the hood
import Events from "@meeeetup/features/app-modules/app/events/page";
export default Events;
```

The product split is driven by configuration, not duplication:

- **`NEXT_PUBLIC_IS_COWORKING_DOMAIN`** flips client behavior — route prefixes (`/space` vs `/events`), dashboard tabs, creation flows.
- **`APP_ID`** scopes each deployment to an `App` row, so both products share one Postgres instance while staying logically isolated.
- **`next.config.js` rewrites** map `/space/*` onto the `/events/*` engine before the filesystem check.
- **Feature flags** gate ~18 behaviors per product, so a vertical can diverge without a redeploy.

Adding a third vertical is essentially a wrapper app plus an `App` row.

## What the platform does

- **Discovery (public):** event search with debounced typeahead, map and calendar views, SEO-optimized detail pages, generated sitemap/robots.
- **Attendee side:** registration, Stripe-backed ticket purchase, dynamic application forms (Zod-validated), QR check-in, favorites/networking, post-event surveys, and a profile with work/education history.
- **Host side:** a multi-step **Event Studio** wizard (basic info → tickets → application form → settings → custom email), participant management with tags and notes, attendance tracking, an analytics dashboard, mass/custom emails, and Stripe-backed paid ticketing.

## Architecture and type-safety

A few disciplines hold the shared engine together:

- **One data model.** A ~40-model Prisma schema on Postgres covers users (participant/host/admin roles), events, ticket types, payments, forms/surveys, and QR check-in records — plus the coworking superset (rooms, reservations, the email pipeline, Stripe Connect payouts).
- **Zod as the single source of truth.** The same schemas validate from the database through API routes, server actions, forms, and components — a shape is defined once and enforced everywhere.
- **Auth & roles.** NextAuth (Prisma adapter) with credentials, OAuth, magic-link, and OTP, plus role-based access with active-role switching.
- **Clean layering.** Strict UI → service → repository → DB boundaries, a framework-agnostic UI package, and React Server Components / Server Actions over client-side fetching.
- **Decoupled email.** Transactional and reminder email runs off the request path through SQS → a Lambda worker → SES, with per-recipient delivery tracking.

## Tech stack

- **Framework** — Next.js 16 (App Router, RSC, Server Actions), React 19, TypeScript 5.9 (strict, no `any`).
- **UI** — Tailwind (shared preset), shadcn/Radix wrapped in a custom design system, class-variance-authority, Lucide/Phosphor icons.
- **State** — Server Components first; `nuqs` for typed URL state; TanStack Query for interactive data.
- **Data & auth** — Prisma + PostgreSQL; NextAuth.
- **Payments** — Stripe + Stripe Connect (host payouts, manual capture, receipts).
- **AWS** — S3, SES, SNS, and SQS → a Lambda email worker.
- **i18n** — next-intl with type-safe message keys (Japanese / English).
- **Tooling** — Turborepo, Yarn 4 workspaces, Vitest + Testing Library, Playwright, Storybook; deployed on AWS Amplify (with Vercel configs) and AWS SAM for the Lambda.

## What I took away

The lesson of Meeeetup is how much leverage you get from treating two products as one parameterized system. Recognizing that the core primitives generalized — and pushing the differences into env vars, path rewrites, and feature flags instead of forks — meant a second product could ship on the same engine, the same database, and the same component library. The coworking sibling, with its room booking and facial reception, is built on exactly this backbone.
