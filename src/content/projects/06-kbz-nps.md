---
title: Net Promoter Score (NPS) System
type: Analytics Platform · KBZ Bank
description: An internal NPS platform for a bank — customers complete a survey and are scored into a Net Promoter Score, later integrated with the branch queue-management system to print the survey QR right on each queue ticket, per branch and topic.
tech: ["TypeScript", "React", "NestJS", "OracleDB"]
image: https://placehold.co/1280x720/0c0a09/fb923c?text=NPS+System&font=inter
featured: false
order: 55
---

## Overview

NPS is an internal platform for measuring customer satisfaction at KBZ Bank using the standard Net Promoter Score method. A customer follows a survey link, gives their feedback, and is scored; the system rolls those responses up into an NPS that stands in as the customer-satisfaction signal the business tracks.

## My role

I worked on it as a **full-stack engineer**, taking it over from a senior engineer and then extending it with new features. As with any handover, the first job was understanding the existing React dashboard and NestJS API well enough to build on them safely, backed by Oracle DB.

## How it works

1. A customer is given a **survey link** and fills in how their experience felt.
2. Their response is turned into a score and run through the **NPS calculation** — the standard promoters-minus-detractors model.
3. That result is surfaced as the **customer-satisfaction state** the business monitors.

## Queue-management integration

The feature I'm happiest with connects NPS to the branch **queue management system**: the survey QR code is printed directly onto the **queue token ticket** each customer receives — scoped per branch and per topic — so the survey reaches people right at the point of service instead of relying on a link sent afterward. It turned NPS from something customers had to be chased for into a quick scan on a ticket already in their hand.

## What I took away

Two lessons stuck. First, the handover one: extending a live system someone else designed is mostly about reading intent before writing code. Second, the integration one — meeting users where they already are (a ticket in hand) beats a better-designed survey nobody opens, and that shift did more for response rates than any change to the form itself.
