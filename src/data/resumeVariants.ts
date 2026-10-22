// Focused résumé variants, shown ONLY in the admin panel (src/components/admin/
// ResumeVariants.tsx). Nothing public imports this module: no page, no PDF in
// public/, no llms.txt — it is bundled solely into the client-only admin
// island. To change a variant, edit it here; the admin preview refits itself.
//
// Identity, contact, education and the footer come from the public résumé
// (src/data/resume.ts) so they never drift. Everything a variant is meant to
// re-emphasise — headline, bullet order, skills order, projects — is written
// out in full so it can be reworded per variant.

import { resume, type ResumeData } from "./resume";

export type ResumeVariantSlug = "fullstack" | "frontend" | "backend";

export interface ResumeVariant {
  slug: ResumeVariantSlug;
  /** Tab label in the admin panel. */
  label: string;
  /** Suggested PDF file name (without extension). */
  fileName: string;
  data: ResumeData;
}

/** Shared, never re-emphasised: who you are and where you studied. */
const shared = {
  name: resume.name,
  location: resume.location,
  contact: resume.contact,
  projectsLink: resume.projectsLink,
  education: resume.education,
  aiNote: resume.aiNote,
  inlineLinks: resume.inlineLinks,
} satisfies Partial<ResumeData>;

// Role headers (title, company, link, dates), skill groups and projects come
// from the base résumé, so a variant can only reorder and reword bullets and
// reorder skills — never change an employer, a date, or a skill list.
const [meeeetup, kbz, mit, freelance] = resume.experience;
const project = (name: string) => {
  const p = resume.projects.find((x) => x.name.startsWith(name));
  if (!p) throw new Error(`Unknown project: ${name}`);
  return p;
};
/** Every base skill group, in the given order. */
const skills = (order: string[]) => {
  if (order.length !== resume.skills.length || new Set(order).size !== order.length) {
    throw new Error("A variant must order every skill group exactly once");
  }
  return order.map((label) => {
    const s = resume.skills.find((x) => x.label === label);
    if (!s) throw new Error(`Unknown skill group: ${label}`);
    return s;
  });
};

const frontend: ResumeData = {
  ...shared,
  subtitle:
    "Frontend engineer specialising in React, Next.js and TypeScript — building production web interfaces, from virtualized data tables to in-browser computer vision.",
  experience: [
    {
      ...meeeetup,
      bullets: [
        "Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork (Next.js, React, TypeScript, Turborepo monorepo).",
        "Engineered a touchless facial check-in pipeline layering in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.",
        "Modeled the platform's multi-tenant relational domain in Prisma and PostgreSQL, with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.",
        "Integrated Stripe and Stripe Connect for ticketing and host payouts, and decoupled transactional email from the request path via SQS, AWS Lambda, and SES.",
      ],
    },
    {
      ...kbz,
      bullets: [
        "Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table modeled as a Redux state machine.",
        "Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements (React, NestJS, Oracle Database).",
        "Extended an NPS platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.",
        "Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow.",
      ],
    },
    {
      ...mit,
      bullets: [
        "Engineered a drag-and-drop room-reservation calendar — a visual booking timeline — for Odoo's free Community edition, where Enterprise planning views aren't available.",
        "Customized Odoo's point-of-sale for retail clients and integrated it into each client's wider Odoo deployment.",
        "Built and customized Odoo ERP solutions for enterprise clients across vertical markets using Python backend modules and JavaScript frontends.",
      ],
    },
    {
      ...freelance,
      bullets: [
        "Built BurmaUni, an EdTech operations portal, around a custom JWT-based RBAC system (route / component / action enforcement), a concurrency-safe silent-refresh interceptor, and a reusable URL-state data-table hook across ~20 server-side grids.",
        "Built MyanHealth, a Burmese-first health-news WordPress theme, with a self-built ad manager and a modern Tailwind CSS v4 + esbuild pipeline.",
        "Architect and ship full-stack products for clients alongside full-time roles, owning technical decisions from setup through deployment.",
      ],
    },
  ],
  skills: skills([
    "Frontend",
    "Languages",
    "Testing",
    "Backend",
    "Database & ORM",
    "Auth & Payments",
    "Cloud & Tooling",
  ]),
  projects: [project("BurmaUni"), project("Meeeetup")],
};

const backend: ResumeData = {
  ...shared,
  subtitle:
    "Backend engineer specialising in NestJS, TypeScript and PostgreSQL — designing relational domains, APIs, payments and event-driven AWS pipelines.",
  experience: [
    {
      ...meeeetup,
      bullets: [
        "Modeled the platform's multi-tenant relational domain in Prisma and PostgreSQL, with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.",
        "Integrated Stripe and Stripe Connect for ticketing and host payouts, and decoupled transactional email from the request path via SQS, AWS Lambda, and SES.",
        "Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork (Next.js, React, TypeScript, Turborepo monorepo).",
        "Engineered a touchless facial check-in pipeline layering in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.",
      ],
    },
    {
      ...kbz,
      bullets: [
        "Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow.",
        "Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements (React, NestJS, Oracle Database).",
        "Extended an NPS platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.",
        "Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table modeled as a Redux state machine.",
      ],
    },
    {
      ...mit,
      bullets: [
        "Built and customized Odoo ERP solutions for enterprise clients across vertical markets using Python backend modules and JavaScript frontends.",
        "Customized Odoo's point-of-sale for retail clients and integrated it into each client's wider Odoo deployment.",
        "Engineered a drag-and-drop room-reservation calendar — a visual booking timeline — for Odoo's free Community edition, where Enterprise planning views aren't available.",
      ],
    },
    {
      ...freelance,
      bullets: [
        "Built BurmaUni, an EdTech operations portal, around a custom JWT-based RBAC system (route / component / action enforcement), a concurrency-safe silent-refresh interceptor, and a reusable URL-state data-table hook across ~20 server-side grids.",
        "Architect and ship full-stack products for clients alongside full-time roles, owning technical decisions from setup through deployment.",
        "Built MyanHealth, a Burmese-first health-news WordPress theme, with a self-built ad manager and a modern Tailwind CSS v4 + esbuild pipeline.",
      ],
    },
  ],
  skills: skills([
    "Backend",
    "Database & ORM",
    "Auth & Payments",
    "Cloud & Tooling",
    "Languages",
    "Frontend",
    "Testing",
  ]),
  projects: [project("AI Document Management"), project("Meeeetup")],
};

export const resumeVariants: readonly ResumeVariant[] = [
  // Full-stack is the public résumé as-is.
  { slug: "fullstack", label: "Full-stack", fileName: "Min-Khant-Kyaw-Fullstack", data: resume },
  { slug: "frontend", label: "Frontend", fileName: "Min-Khant-Kyaw-Frontend", data: frontend },
  { slug: "backend", label: "Backend", fileName: "Min-Khant-Kyaw-Backend", data: backend },
];
