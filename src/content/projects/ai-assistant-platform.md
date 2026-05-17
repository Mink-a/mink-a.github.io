---
title: AI Assistant Platform
type: Full-stack SaaS Platform
description: LLM API gateway and assistant — a single OpenAI-compatible endpoint fronting 300+ models with usage-based billing, streaming responses, and a multilingual conversational UI.
tech: ["Next.js", "Hono", "Bun", "Drizzle", "PostgreSQL", "OpenAI"]
image: https://placehold.co/1280x720/0c0a09/fb923c?text=AI+Assistant+Platform&font=inter
featured: true
order: 50
---

## Overview

A full-stack LLM platform exposing one OpenAI-compatible API that fans out to 300+ underlying models, with metered billing, a streaming chat surface, and tool-augmented assistants.

## Key Highlights

- **OpenAI-compatible gateway** so any existing SDK just works — drop-in `baseURL` swap
- **Streaming chat** with real-time tool invocation (search, lookup, summarize) on every response
- **Multilingual UI** (English + Burmese) with token-stream-safe locale switching
- **Usage-based billing** built directly into the request/response pipeline; no async reconciliation jobs

## Architecture

The gateway is a Hono service on Bun. Requests are normalized, mapped to the upstream provider's schema, and billed on response close. The frontend is a Next.js 15 portal with a token-streamed conversation view and a small library of pre-built assistants.

## What I'd do differently

The pricing-cache invalidation logic took two rewrites to get right. I'd structure it as an event-sourced reducer from the start instead of a TTL cache with backfill.
