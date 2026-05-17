---
title: Component System
type: Design System & Token Library
description: A small, opinionated React component library with theme tokens, accessible primitives, and a Storybook docs site that the design team can update without code review.
tech: ["React", "TypeScript", "Storybook", "Radix UI", "Vite"]
image: https://placehold.co/1280x720/292524/fb923c?text=Component+System&font=inter
featured: true
order: 30
---

## Overview

A reusable React component library built on Radix UI primitives, theme-token-driven, and shipped as an installable npm package. Every product team in the org consumes it; design owns the tokens.

## Key Highlights

- **Token-driven theming** — every color, spacing, and radius is a token, modifiable without touching component code
- **Accessibility-first** — every interactive component goes through axe + manual screen-reader testing before merge
- **Storybook as a contract** — every component has docs, controls, and visual-regression snapshots in CI
- **Tree-shakeable** — average bundle impact for consumers is ~4KB gzipped per component used

## Architecture

Vite library mode for the build, Radix UI primitives wrapped with house styling, and a CSS-variable-based theme layer that ships with light/dark out of the box. Versioning is changesets-driven; breaking changes get a migration codemod.

## What I'd do differently

I'd start with codemods on day one. Retrofitting them after the first breaking change was painful for downstream consumers.
