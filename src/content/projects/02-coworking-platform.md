---
title: Meeeetup Coworking
type: AI-Powered SaaS · Meeeetup
description: Coworking-space reception automation and access control for the Japanese market — time-slotted room booking and touchless facial check-in (in-browser MediaPipe gating + AWS Rekognition) — built on the same engine as Meeeetup.
tech: ["TypeScript", "Next.js", "React", "PostgreSQL", "Prisma", "NextAuth", "AWS Rekognition", "MediaPipe", "Amazon S3", "Stripe", "Tailwind CSS", "Turborepo"]
demoUrl: https://coworking.meeeetup.com
image: /assets/covers/coworking-cover.webp
featured: true
order: 95
---

## Overview

Meeeetup Coworking is a coworking-space reception-automation and access-control product (コワーキング受付自動化・入退室管理) for the Japanese market. It's the second product built on the shared Meeeetup engine: it inherits the entire event/community platform, then adds the two things a physical space needs — bookable rooms and touchless entry.

## Built on the Meeeetup engine

Coworking isn't a fork. It's the same Turborepo monorepo and the same shared `features` / `ui` / Prisma packages as the Meeeetup events platform, re-skinned and re-routed by configuration: `NEXT_PUBLIC_IS_COWORKING_DOMAIN` flips client behavior, an `APP_ID` row scopes the deployment, and `next.config.js` rewrites map `/space/*` onto the `/events/*` engine before the filesystem check.

The key domain insight is that a coworking **space booking is an event under the hood** — the same `Event` model, differentiated by an `isEventFromCoworking` flag — so all the registration, payment, and check-in machinery was *reused* rather than rebuilt. Recognizing that the two domains were the same primitive is what made a whole second product cheap to ship.

## Room reservation system

On top of the event primitive, coworking adds real booking logic: bookable **Rooms** with configurable slot units (15 / 30 / 45 / 60 minutes), business hours and break times, per-user daily and active-reservation limits, automatic holiday blocking, and cross-day slots. Reservations generate confirmation emails to the booker and notifications to the host, and the analytics dashboard splits spaces from events.

## Facial reception

The headline feature is a touchless reception kiosk, built as a deliberately **layered** computer-vision pipeline:

1. **In-browser quality gate (MediaPipe).** Client-side face detection runs first to confirm there's a usable face in frame before anything leaves the device — it's free, instant, and it keeps junk frames from ever reaching a paid API.
2. **Server-side match (AWS Rekognition).** A qualifying frame is matched against an S3-indexed face collection to identify the member for touchless check-in / check-out.

Layering a free client-side gate in front of the paid server-side matcher is the whole trick: it controls cost and gives the user instant feedback, while Rekognition does the actual identification only when it's worth spending the call.

## Tech stack

Coworking shares the Meeeetup stack — Next.js 16 / React 19 / TypeScript (strict), Prisma + PostgreSQL, NextAuth, Stripe (+ Connect), Tailwind with shadcn/Radix, next-intl (Japanese / English), Turborepo + Yarn 4 — and adds the access-control layer on top:

- **Computer vision** — MediaPipe for in-browser detection and quality gating, **AWS Rekognition** for face matching.
- **Media & infra** — S3 for the face collection and media; SES / SNS / SQS → a Lambda worker for email; deployed via AWS Amplify with AWS SAM for the Lambda.

## What I took away

Coworking is the payoff of the "two products, one engine" bet. Because the booking domain mapped onto the existing event primitive, almost all of the effort went into the genuinely new parts — the reservation rules and the facial reception — instead of rebuilding registration, payments, and auth. The CV pipeline in particular taught me to think in cost and latency layers: do the cheap check on-device, and only spend the paid call once the cheap check says it's worth it.
