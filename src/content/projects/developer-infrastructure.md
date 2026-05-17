---
title: Developer Infrastructure
type: Internal Engineering Tooling
description: Built internal tooling and reusable systems improving deployment workflows, observability, and frontend productivity.
tech: ["TypeScript", "Docker", "Bun", "CI/CD"]
image: https://placehold.co/1280x720/1c1917/a8a29e?text=Developer+Infrastructure&font=inter
featured: true
order: 20
---

## Overview

A set of internal tools and pipelines that shaved real time off every engineer's day. The work spanned CI/CD speedups, a typed deployment CLI, and a shared observability scaffold any service can adopt with two lines of config.

## Key Highlights

- **CI build time cut from 14 minutes to 3 minutes** by parallelizing test shards and aggressively caching docker layers
- **Internal CLI** (`infra deploy`, `infra logs`, `infra rollback`) that wraps the deployment platform with sane defaults — onboarding now takes hours instead of days
- **Observability scaffold** ships with metrics, tracing, and structured logging preconfigured; service authors don't write boilerplate

## Architecture

Everything is shipped as containerized Bun processes deployed via GitHub Actions. The CLI is a small TypeScript binary that wraps the cloud provider's SDK and adds policy guards (no prod deploys outside business hours, mandatory PR-approval check, etc.).

## What I'd do differently

I would have built the observability scaffold *first*, before the CLI. Debugging the early CLI versions in prod was harder than it needed to be because we didn't yet have the very tooling we were about to build.
