---
title: Modern Commerce Experience
type: Web Application
description: Fast and responsive commerce experience focused on accessibility, SEO performance, clean UI systems, and scalable architecture.
tech: ["React", "Prisma", "TailwindCSS", "Vercel"]
image: https://placehold.co/1280x720/0c0a09/fb923c?text=Modern+Commerce&font=inter
featured: true
order: 10
---

## Overview

A storefront rebuild focused on the basics done right: fast first paint, screen-reader-friendly, server-rendered for SEO, and a checkout flow that doesn't lose conversions to layout jank.

## Key Highlights

- **Lighthouse 99/100/100/100** across Performance, Accessibility, Best Practices, and SEO on the product detail template
- **WCAG 2.2 AA compliant** — full keyboard navigation, semantic ARIA, contrast-tested palettes
- **Streaming SSR** for the catalog so the user gets a meaningful first paint while the backend assembles category facets

## Architecture

React Server Components for the catalog and detail pages, a Prisma-backed checkout API, image optimization via Vercel's image proxy, and edge caching on the product listings. Theming is token-driven so the design team can swap palettes without code review.

## What I'd do differently

I'd invest earlier in the design-system token layer. By the time we got there the codebase had ~15 ad-hoc spacing values that needed normalizing.
