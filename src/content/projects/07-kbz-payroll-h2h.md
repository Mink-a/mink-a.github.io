---
title: Payroll H2H System
type: Enterprise Tooling · KBZ Bank
description: A frontend for corporate payroll customers to upload payroll files, validate and correct them in the browser, and track disbursement status across an automated host-to-host pipeline.
tech: ["TypeScript", "React", "Redux", "Zod"]
image: /assets/covers/payroll-h2h-cover.webp
featured: false
order: 60
---

## Overview

Payroll H2H is the web interface KBZ Bank's corporate customers use to run automated **host-to-host (H2H)** payroll: upload a payroll file, get it validated and corrected before anything is submitted, and track each disbursement through to completion. The aim was to replace an error-prone file handoff with a single guided flow where mistakes surface in the browser, in seconds, instead of after a failed processing run.

## My role

I owned this one end to end as the frontend engineer — from an empty repository forward. I set up the project and its folder structure, made the technology choices, and drove the build in step with everyone it touched: the **business units** (to pin down requirements), the **project managers** (scope and delivery), and the **backend developers** (the API contract the frontend submits against). It was as much an ownership and coordination role as an implementation one.

## The frontend workflow

The app is React + Redux in TypeScript, with the multi-step flow modeled in Redux so the UI is always a pure reflection of where a batch actually is:

1. **Upload** — the user uploads an Excel payroll file, parsed into structured rows in the browser.
2. **Validate** — Zod schemas check every row against the expected shape, producing precise, per-row feedback rather than a single opaque "file rejected".
3. **Edit** — flagged rows render in an editable table the user can correct inline.
4. **Virtualize** — the table is virtualized so it stays smooth no matter how large the payroll run is.
5. **Review & submit** — once the batch is clean and the user has checked it, the validated set is submitted to the API for processing.
