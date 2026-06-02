---
title: Cash Management System
type: Enterprise System · KBZ Bank
description: An internal full-stack system for a bank's cash operations — raising cash requests across branches and ATMs and fulfilling them through an integrated transport (cash-in-transit) management workflow.
tech: ["TypeScript", "React", "NestJS", "OracleDB"]
image: /assets/covers/cash-cover.jpg
featured: false
order: 75
---

## Overview

Cash Management is an internal full-stack system for KBZ Bank's cash operations — the tooling behind getting physical cash to where it's needed across branches and ATMs. The core of it is a **cash request** raised against a location, then **fulfilled through a transport (cash-in-transit) management system** that moves the money and tracks the operation through to completion.

## My role

I joined as a **full-stack engineer**, taking the project over from a senior engineer to continue the build. Picking up an in-flight internal system meant getting up to speed on the existing React frontend and NestJS API quickly, then carrying the work forward across both the request side and the transport-fulfillment side, backed by Oracle DB.

## The workflow

At a high level the system connects two halves:

1. A branch or ATM raises a **cash request** for the funds it needs.
2. That request is **fulfilled through the transport management system**, which schedules and tracks the cash-in-transit movement that satisfies it — through to completion.

Tying the request side to the transport side in one system is the point: the people asking for cash and the people moving it work from the same source of truth instead of separate, disconnected processes.

## What I took away

Taking a live internal system over from a senior engineer is its own skill — the first job isn't writing code, it's understanding someone else's architecture and decisions well enough to extend them safely. Doing that across the full stack, on a system a bank's operations actually depend on, is where a lot of my comfort with unfamiliar codebases comes from.
