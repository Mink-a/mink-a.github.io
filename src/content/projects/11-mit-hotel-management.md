---
title: Hotel Management System
type: ERP Customization · MIT
description: An Odoo-based hotel management build whose standout is a drag-and-drop room-reservation calendar chart — bringing a visual booking timeline to Odoo's free Community edition.
tech: ["Odoo", "Python", "JavaScript", "XML", "PostgreSQL"]
image: /assets/covers/hotel-management-cover.webp
featured: false
order: 50
---

## Overview

Hotel-management work built on Odoo — room inventory, reservations, and the day-to-day front-desk workflow, integrated with Odoo's standard inventory and accounting modules. Most of it was general Odoo customization; the part worth showcasing is the reservation calendar I built.

## What I built

The standout feature is a **drag-and-drop room-reservation calendar chart** — a visual booking timeline where each room is a row and dates run across the top, so the whole property's occupancy is legible at a glance. Staff create a booking by dragging across the dates, and move or extend a reservation by dragging the block itself, rather than filling in a form.

Crucially, I built this for **Odoo's free Community edition**. The Gantt-style planning views that make this kind of scheduling easy are part of Odoo Enterprise, so on the Community edition there's nothing to lean on out of the box — the calendar chart, its drag-and-drop interactions, and the booking logic behind it were implemented in Odoo's JavaScript frontend and Python backend rather than configured from an existing widget.

## My role

General Odoo customization across the hotel modules — Python for the domain logic, JavaScript for the operator-facing screens — with the reservation calendar as the main engineering contribution, and integration with the existing finance and inventory stack.
