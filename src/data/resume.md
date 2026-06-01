# Min Khant Kyaw

**Full-Stack Software Engineer**

Remote · [hello@minkhantkyaw.com](mailto:hello@minkhantkyaw.com) · [GitHub](https://github.com/mink-a) · [LinkedIn](https://www.linkedin.com/) · [minkhantkyaw.com](https://minkhantkyaw.com)

---

## Summary

Full-stack software engineer working in TypeScript, focused on frontend, API design, and system architecture. I build production web applications end to end — from React/Next.js interfaces and NestJS / Server-Action APIs through PostgreSQL data models to cloud deployment — and lean toward simple, maintainable solutions over clever ones.

Currently at MeeeetUp, building an AI-powered event platform and a coworking product on a shared, multi-tenant engine. Previously shipped enterprise systems at KBZ Bank (Myanmar's largest private bank) and Odoo ERP solutions at Myanmar Information Technology.

---

## Skills

**Languages:** TypeScript, JavaScript, Python, PHP

**Frontend:** React, Next.js, Astro, Vite, Tailwind CSS, shadcn/ui, Redux, TanStack Query / Router / Table, Zustand

**Backend:** Node.js, NestJS, Next.js (RSC & Server Actions), Odoo (Python), WordPress (PHP)

**Database & ORM:** PostgreSQL, OracleDB, MySQL, Supabase, Prisma

**Auth & Payments:** NextAuth, JWT / RBAC, Stripe & Stripe Connect

**Cloud & Tooling:** AWS (S3, Rekognition, SES/SNS/SQS, Lambda, Amplify), Vercel, DigitalOcean, Cloudflare, Docker, GitHub Actions, Turborepo, esbuild

**Testing:** Vitest, Playwright, Storybook

---

## Experience

### Software Engineer · MeeeetUp

*Jan 2025 — Present · Remote*

- Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork, using Next.js, React, TypeScript, and a Turborepo monorepo.
- Engineer a touchless facial check-in pipeline that layers in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.
- Model a ~40-table domain in Prisma and PostgreSQL with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.
- Integrate Stripe and Stripe Connect for ticketing and host payouts, and decouple transactional email from the request path through SQS, AWS Lambda, and SES.

### Frontend Software Engineer · KBZ Bank

*Nov 2023 — Jan 2025*

- Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements, using React, NestJS, and Oracle Database.
- Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table — modeled as a Redux state machine.
- Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow, continuing the build after taking it over from a senior engineer.
- Extended a customer-satisfaction (NPS) platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.

### Web Developer · Myanmar Information Technology

*Oct 2022 — Nov 2023*

- Built and customized Odoo ERP solutions for enterprise clients across vertical markets using Python backend modules and JavaScript frontends.
- Engineered a drag-and-drop room-reservation calendar — a visual booking timeline — for Odoo's free Community edition, where the Enterprise planning views aren't available out of the box.
- Customized Odoo's point-of-sale for retail clients and integrated it into each client's wider Odoo deployment.

### Freelance Developer · Independent

*2022 — Present · alongside full-time roles*

- Architect and ship full-stack products for clients alongside my full-time roles, owning technical decisions from project setup through deployment.
- Built BurmaUni, an EdTech operations portal, around a custom JWT-based RBAC system enforcing access at the route, component, and action levels, plus a concurrency-safe silent-refresh interceptor and a reusable URL-state data-table hook shared across ~20 server-side grids in React and TypeScript.
- Built MyanHealth, a Burmese-first health-news WordPress theme, with a self-built ad manager and a modern Tailwind CSS v4 + esbuild build pipeline, migrating it cleanly off an Avada page-builder.
- Maintained and fixed bugs across the modules of a live hospital ERP frontend (Master Care).

---

## Projects

### Meeeetup — Event & Coworking Platforms

Two production Next.js products on one shared, multi-tenant engine (Turborepo): an event-management platform and a coworking reception system with touchless facial check-in (MediaPipe + AWS Rekognition).

**Tech:** TypeScript, Next.js, Prisma, PostgreSQL, AWS, Stripe

### BurmaUni — EdTech Admin Portal

Internal operations portal (~30 modules) built around a custom JWT-based RBAC system (route / component / action enforcement, 6 roles × ~35 resources), a concurrency-safe silent-refresh interceptor, and a reusable URL-state data-table hook.

**Tech:** React, TypeScript, TanStack Query & Table, Tailwind CSS

### CoBudget — Expense-Splitting PWA

[Live demo](https://co-budget-snowy.vercel.app) · An offline-first PWA that splits shared expenses and settles up in the fewest transfers via a close-based ledger; authorization enforced entirely through Supabase Row Level Security.

**Tech:** React, Vite, Supabase, PostgreSQL, PWA

### Textify — OCR App

A full-stack app that turns images and PDFs into editable text using Google Drive's built-in document conversion as a zero-cost OCR engine instead of a paid Vision API.

**Tech:** React, NestJS, Google Drive API, Docker

_More at [minkhantkyaw.com/projects](https://minkhantkyaw.com/projects)._
