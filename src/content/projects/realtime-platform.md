---
title: Realtime Platform
type: Full-stack SaaS Platform
description: High-performance realtime application with scalable APIs, authentication, websocket infrastructure, and optimized frontend rendering.
tech: ["Next.js", "Hono", "PostgreSQL", "Redis"]
image: https://placehold.co/1280x720/0c0a09/fb923c?text=Realtime+Platform&font=inter
featured: true
order: 40
---

## Overview

A full-stack realtime SaaS platform serving thousands of concurrent users. The backend uses Hono on Bun for low-overhead HTTP and a websocket layer fanning out events from a PostgreSQL-backed source of truth. The frontend is Next.js with optimistic UI updates and a granular React-Query cache.

## Key Highlights

- **Sub-100ms p99 broadcast latency** between event producer and connected clients, sustained across all regions
- **Authentication and authorization** via JWT-backed sessions with rotating refresh tokens and per-resource ABAC
- **PostgreSQL + Redis architecture** — writes go to Postgres, hot reads cached in Redis, websocket fanout from Redis pub/sub
- **Frontend** designed so 80% of interactions render optimistically with rollback on server rejection

## Architecture

The system is monorepo'd with a separate API service and a Next.js web app. Shared TypeScript types are emitted from a single source of truth (Zod schemas in the API) and consumed by the frontend without manual hand-off.

## What I'd do differently

If I were starting again, I'd push the websocket layer earlier in the design — retrofitting realtime onto an already-shipped REST API meant more rework than necessary.
