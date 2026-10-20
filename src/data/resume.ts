// Single source of truth for the résumé. Consumed by:
//   - src/pages/resume.astro            (canonical on-page styled sheet)
//   - src/pages/resume/[variant].astro  (the three curated views)
//   - scripts/resume-pdf.ts             (standalone HTML → A4 PDFs)
//
// Facts live ONCE, in the `*Source` tables below, each entry carrying a stable
// `id`. The canonical résumé and every curated view are derived from those
// tables by id, so editing a fact updates all of them.

export interface Experience {
  role: string;
  company: string;
  date: string;
  bullets: string[];
}
export interface SkillGroup {
  label: string;
  items: string;
}
export interface Project {
  name: string;
  desc: string;
  link?: { href: string; label: string };
}
export interface Education {
  school: string;
  date: string;
  field: string;
}

interface SourceExperience {
  id: string;
  role: string;
  company: string;
  date: string;
  bullets: readonly { id: string; text: string }[];
}
interface SourceSkillGroup extends SkillGroup {
  id: string;
}
interface SourceProject extends Project {
  id: string;
}

const experienceSource = [
  {
    id: "meeeetup",
    role: "Software Engineer",
    company: "MeeeetUp",
    date: "Jan 2025 — Present",
    bullets: [
      {
        id: "meeeetup.platform",
        text: "Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork (Next.js, React, TypeScript, Turborepo monorepo).",
      },
      {
        id: "meeeetup.facial-checkin",
        text: "Engineered a touchless facial check-in pipeline layering in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.",
      },
      {
        id: "meeeetup.domain-model",
        text: "Modeled the platform's multi-tenant relational domain in Prisma and PostgreSQL, with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.",
      },
      {
        id: "meeeetup.payments-email",
        text: "Integrated Stripe and Stripe Connect for ticketing and host payouts, and decoupled transactional email from the request path via SQS, AWS Lambda, and SES.",
      },
    ],
  },
  {
    id: "kbz",
    role: "Frontend Software Engineer",
    company: "KBZ Bank",
    date: "Nov 2023 — Jan 2025",
    bullets: [
      {
        id: "kbz.banking-systems",
        text: "Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements (React, NestJS, Oracle Database).",
      },
      {
        id: "kbz.payroll",
        text: "Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table modeled as a Redux state machine.",
      },
      {
        id: "kbz.cash-management",
        text: "Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow.",
      },
      {
        id: "kbz.nps-queue",
        text: "Extended an NPS platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.",
      },
    ],
  },
  {
    id: "mit",
    role: "Web Developer",
    company: "Myanmar Information Technology",
    date: "Oct 2022 — Nov 2023",
    bullets: [
      {
        id: "mit.odoo-erp",
        text: "Built and customized Odoo ERP solutions for enterprise clients across vertical markets using Python backend modules and JavaScript frontends.",
      },
      {
        id: "mit.reservation-calendar",
        text: "Engineered a drag-and-drop room-reservation calendar — a visual booking timeline — for Odoo's free Community edition, where Enterprise planning views aren't available.",
      },
      {
        id: "mit.pos",
        text: "Customized Odoo's point-of-sale for retail clients and integrated it into each client's wider Odoo deployment.",
      },
    ],
  },
  {
    id: "freelance",
    role: "Freelance Developer",
    company: "Independent",
    date: "2022 — Present",
    bullets: [
      {
        id: "freelance.ownership",
        text: "Architect and ship full-stack products for clients alongside full-time roles, owning technical decisions from setup through deployment.",
      },
      {
        id: "freelance.burmauni",
        text: "Built BurmaUni, an EdTech operations portal, around a custom JWT-based RBAC system (route / component / action enforcement), a concurrency-safe silent-refresh interceptor, and a reusable URL-state data-table hook across ~20 server-side grids.",
      },
      {
        id: "freelance.myanhealth",
        text: "Built MyanHealth, a Burmese-first health-news WordPress theme, with a self-built ad manager and a modern Tailwind CSS v4 + esbuild pipeline.",
      },
    ],
  },
] as const satisfies readonly SourceExperience[];

const skillSource = [
  { id: "languages", label: "Languages", items: "TypeScript, JavaScript, Python, PHP" },
  {
    id: "frontend",
    label: "Frontend",
    items:
      "React, Next.js, Astro, Vite, Tailwind CSS, shadcn/ui, Redux, TanStack Query / Router / Table, Zustand",
  },
  {
    id: "backend",
    label: "Backend",
    items: "Node.js, NestJS, Next.js (RSC & Server Actions), Odoo (Python), WordPress (PHP)",
  },
  {
    id: "data",
    label: "Database & ORM",
    items: "PostgreSQL, OracleDB, MySQL, Supabase, Prisma",
  },
  {
    id: "auth-payments",
    label: "Auth & Payments",
    items: "NextAuth, JWT / RBAC, Stripe & Stripe Connect",
  },
  {
    id: "cloud",
    label: "Cloud & Tooling",
    items:
      "AWS (S3, Rekognition, SES/SNS/SQS, Lambda, Amplify), Vercel, DigitalOcean, Cloudflare, Docker, GitHub Actions, Turborepo, esbuild",
  },
  { id: "testing", label: "Testing", items: "Vitest, Playwright, Storybook" },
] as const satisfies readonly SourceSkillGroup[];

const projectSource = [
  {
    id: "meeeetup",
    name: "Meeeetup — Event & Coworking",
    desc: "Two production Next.js products on one shared, multi-tenant engine (Turborepo), with touchless facial check-in (MediaPipe + AWS Rekognition).",
  },
  {
    id: "ai-docs",
    name: "AI Document Management — RAG",
    desc: "Hackathon-winning, Google-Drive-style document manager with a LangChain + Chroma RAG pipeline over a local LLM and per-department/user RBAC. React + NestJS.",
  },
  {
    id: "burmauni",
    name: "BurmaUni — EdTech Admin Portal",
    desc: "~30-module operations portal around a custom JWT/RBAC system and a reusable URL-state data-table hook.",
  },
] as const satisfies readonly SourceProject[];

type RoleId = (typeof experienceSource)[number]["id"];
type BulletId = (typeof experienceSource)[number]["bullets"][number]["id"];
type SkillId = (typeof skillSource)[number]["id"];
type ProjectId = (typeof projectSource)[number]["id"];

/**
 * Shape the renderers consume: the canonical résumé or a curated view, both
 * derived from the source tables above.
 */
export interface ResumeData {
  name: string;
  subtitle: string;
  location: string;
  contact: { label: string; href: string }[];
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  projectsLink: { href: string; label: string };
  education: Education[];
  aiNote: { text: string; href: string; label: string };
}

const identity = {
  name: "Min Khant Kyaw",
  location: "Remote",
  contact: [
    { label: "hello@minkhantkyaw.com", href: "mailto:hello@minkhantkyaw.com" },
    { label: "github.com/Mink-a", href: "https://github.com/Mink-a" },
    {
      label: "linkedin.com/in/min-khant-kyaw",
      href: "https://www.linkedin.com/in/min-khant-kyaw-56b05724b/",
    },
    { label: "minkhantkyaw.com", href: "https://minkhantkyaw.com" },
  ],
  projectsLink: {
    href: "https://minkhantkyaw.com/projects",
    label: "View all projects",
  },
  education: [
    {
      school: "The European International University (EIU-Paris)",
      date: "2026 — 2027 (expected)",
      field: "Information Technology — specialising in Cloud and DevOps",
    },
    {
      school: "University of Technology (Yadanarbon Cyber City)",
      date: "2015 — 2020",
      field: "Computer Engineering",
    },
  ],
  aiNote: {
    text: "Machine-readable version of this résumé for AI screeners & ATS:",
    href: "https://minkhantkyaw.com/llms.txt",
    label: "minkhantkyaw.com/llms.txt",
  },
} satisfies Omit<ResumeData, "subtitle" | "experience" | "skills" | "projects">;

const canonicalSubtitle =
  "Full-stack software engineer working in TypeScript, focused on frontend, API design, and system architecture — building production web apps end to end.";

const toProject = (p: SourceProject): Project =>
  p.link ? { name: p.name, desc: p.desc, link: p.link } : { name: p.name, desc: p.desc };

/** The canonical résumé: every fact, in source order. */
export const resume: ResumeData = {
  ...identity,
  subtitle: canonicalSubtitle,
  experience: experienceSource.map((e) => ({
    role: e.role,
    company: e.company,
    date: e.date,
    bullets: e.bullets.map((b) => b.text),
  })),
  skills: skillSource.map((s) => ({ label: s.label, items: s.items })),
  projects: projectSource.map(toProject),
};

export type ResumeVariant = "fullstack" | "frontend" | "backend";

/**
 * A curated view over the source tables. It only SELECTS and ORDERS entries by
 * id — it never carries résumé text of its own (apart from the headline), so
 * there is nothing in a view that can drift from the facts.
 *
 * Every role is required (`Record<RoleId, …>`): views re-emphasise, they never
 * hide employment history. Education and identity always come from the base.
 */
export interface VariantView {
  slug: ResumeVariant;
  /** Short focus label, e.g. "Backend". */
  label: string;
  /** Page / document title. */
  title: string;
  /** Headline under the name. */
  subtitle: string;
  /** Static PDF in /public generated by scripts/resume-pdf.ts. */
  pdf: string;
  /** Per role: which bullets appear, in order. */
  bullets: Record<RoleId, readonly BulletId[]>;
  /** Every skill group, in display order. */
  skills: readonly SkillId[];
  /** Which projects are shown, in order. */
  projects: readonly ProjectId[];
}

export const resumeVariants: readonly VariantView[] = [
  {
    slug: "fullstack",
    label: "Full-stack",
    title: "Full-stack Engineer",
    subtitle: canonicalSubtitle,
    pdf: "/Min-Khant-Kyaw-Fullstack.pdf",
    bullets: {
      meeeetup: [
        "meeeetup.platform",
        "meeeetup.domain-model",
        "meeeetup.payments-email",
        "meeeetup.facial-checkin",
      ],
      kbz: ["kbz.banking-systems", "kbz.cash-management", "kbz.payroll", "kbz.nps-queue"],
      mit: ["mit.odoo-erp", "mit.reservation-calendar", "mit.pos"],
      freelance: ["freelance.ownership", "freelance.burmauni", "freelance.myanhealth"],
    },
    skills: ["languages", "frontend", "backend", "data", "auth-payments", "cloud", "testing"],
    // The MeeeetUp project is left out here: all four MeeeetUp bullets above
    // already cover it, and the third project made the aside outrun Experience.
    projects: ["ai-docs", "burmauni"],
  },
  {
    slug: "frontend",
    label: "Frontend",
    title: "Frontend Engineer",
    subtitle:
      "Frontend engineer specialising in React, Next.js and TypeScript — building production web interfaces, from virtualized data tables to in-browser computer vision.",
    pdf: "/Min-Khant-Kyaw-Frontend.pdf",
    bullets: {
      meeeetup: [
        "meeeetup.platform",
        "meeeetup.facial-checkin",
        "meeeetup.domain-model",
        "meeeetup.payments-email",
      ],
      kbz: ["kbz.payroll", "kbz.banking-systems", "kbz.nps-queue", "kbz.cash-management"],
      mit: ["mit.reservation-calendar", "mit.pos", "mit.odoo-erp"],
      freelance: ["freelance.burmauni", "freelance.myanhealth", "freelance.ownership"],
    },
    skills: ["frontend", "languages", "testing", "backend", "data", "auth-payments", "cloud"],
    projects: ["burmauni", "meeeetup"],
  },
  {
    slug: "backend",
    label: "Backend",
    title: "Backend Engineer",
    subtitle:
      "Backend engineer specialising in NestJS, TypeScript and PostgreSQL — designing relational domains, APIs, payments and event-driven AWS pipelines.",
    pdf: "/Min-Khant-Kyaw-Backend.pdf",
    bullets: {
      meeeetup: [
        "meeeetup.domain-model",
        "meeeetup.payments-email",
        "meeeetup.platform",
        "meeeetup.facial-checkin",
      ],
      kbz: ["kbz.cash-management", "kbz.banking-systems", "kbz.nps-queue", "kbz.payroll"],
      mit: ["mit.odoo-erp", "mit.pos", "mit.reservation-calendar"],
      freelance: ["freelance.burmauni", "freelance.ownership", "freelance.myanhealth"],
    },
    skills: ["backend", "data", "auth-payments", "cloud", "languages", "frontend", "testing"],
    projects: ["ai-docs", "meeeetup"],
  },
];

const noDuplicates = (ids: readonly string[], where: string): void => {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate id in ${where}`);
};

/**
 * Resolves a view against the source tables. Throws on any reference that does
 * not resolve, so a broken view fails the static build instead of shipping a
 * résumé with a silently missing line.
 */
function resolveVariant(slug: ResumeVariant): ResumeData {
  const view = resumeVariants.find((v) => v.slug === slug);
  if (!view) throw new Error(`Unknown résumé variant: ${slug}`);

  const experience = experienceSource.map((role): Experience => {
    const ids = view.bullets[role.id];
    if (ids.length === 0) throw new Error(`${slug}: role "${role.id}" has no bullets`);
    noDuplicates(ids, `${slug}.bullets.${role.id}`);
    return {
      role: role.role,
      company: role.company,
      date: role.date,
      bullets: ids.map((id) => {
        const bullet = role.bullets.find((b) => b.id === id);
        if (!bullet) throw new Error(`${slug}: bullet "${id}" does not belong to role "${role.id}"`);
        return bullet.text;
      }),
    };
  });

  noDuplicates(view.skills, `${slug}.skills`);
  if (view.skills.length !== skillSource.length) {
    throw new Error(`${slug}: skills must order every group exactly once`);
  }
  const skills = view.skills.map((id): SkillGroup => {
    const group = skillSource.find((s) => s.id === id);
    if (!group) throw new Error(`${slug}: unknown skill group "${id}"`);
    return { label: group.label, items: group.items };
  });

  if (view.projects.length === 0) throw new Error(`${slug}: no projects selected`);
  noDuplicates(view.projects, `${slug}.projects`);
  const projects = view.projects.map((id): Project => {
    const project = projectSource.find((p) => p.id === id);
    if (!project) throw new Error(`${slug}: unknown project "${id}"`);
    return toProject(project);
  });

  return { ...identity, subtitle: view.subtitle, experience, skills, projects };
}

const toData = (variantOrData: ResumeVariant | ResumeData): ResumeData =>
  typeof variantOrData === "string" ? resolveVariant(variantOrData) : variantOrData;

/**
 * Styles for the résumé, scoped under `.resume-doc` so they never leak into
 * the site.
 *
 * `--density` (default `1`) is a single dial on VERTICAL whitespace — leading
 * (`line-height`) and vertical margins/gaps/padding — expressed as
 * `calc(<original value> * var(--density))` throughout, so `--density: 1`
 * reproduces the natural layout exactly. Font sizes, letter-spacing, and the
 * `.name` heading are never multiplied: `src/lib/resumeFit.ts` steps this
 * value down to fit a résumé onto one A4 page without shrinking type.
 * Horizontal-only values (flex/grid gaps that run left-right, like `header`'s
 * row gap) are left alone; `.layout`'s `gap` sets both row- and column-gap via
 * the shorthand, so it's included even though this grid only ever has one row.
 */
export const resumeCSS = `
.resume-doc {
  --accent: #2d52e0;
  --ink: #1a1a1a;
  --body: #3a3a3a;
  --muted: #8a8a8a;
  --density: 1;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--body);
  font-size: 11px;
  line-height: calc(1.46 * var(--density));
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.resume-doc a { color: inherit; text-decoration: none; }

/* On-screen: render as a white A4 "sheet" centered in the page. */
@media screen {
  .resume-doc {
    background: #fff;
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    padding: 14mm 15mm;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
  }
}

@page { size: A4; margin: 13mm 14mm; }

.resume-doc header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 26px;
  margin-bottom: calc(26px * var(--density));
}
.resume-doc .name {
  color: var(--accent);
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.05;
  margin: 0;
}
.resume-doc .subtitle {
  color: var(--muted);
  font-size: 11px;
  line-height: calc(1.55 * var(--density));
  margin: calc(10px * var(--density)) 0 0;
  max-width: 30em;
}
.resume-doc .contact {
  text-align: right;
  font-size: 10.5px;
  line-height: calc(2.15 * var(--density));
  color: #5a5a5a;
  white-space: nowrap;
  flex-shrink: 0;
}
.resume-doc .layout {
  display: grid;
  /* Sized so Experience runs at least as tall as Skills + Projects + Education
     in every curated view (measured at the 182mm print width). */
  grid-template-columns: 1.45fr 1fr;
  gap: calc(32px * var(--density));
  align-items: start;
}
.resume-doc h2 {
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 calc(14px * var(--density));
}
.resume-doc section { margin-bottom: calc(22px * var(--density)); }
.resume-doc section:last-child { margin-bottom: 0; }
.resume-doc .entry { margin-bottom: calc(13px * var(--density)); break-inside: avoid; }
.resume-doc .entry:last-child { margin-bottom: 0; }
.resume-doc .entry-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.resume-doc .role { font-weight: 700; font-size: 11.5px; color: var(--ink); }
.resume-doc .company { color: var(--accent); font-weight: 700; }
.resume-doc .date { color: var(--muted); font-size: 10px; white-space: nowrap; flex-shrink: 0; }
.resume-doc ul { margin: calc(6px * var(--density)) 0 0; padding-left: 15px; list-style: disc; }
.resume-doc li { margin-bottom: calc(4px * var(--density)); }
.resume-doc .skill-group { margin-bottom: calc(11px * var(--density)); }
.resume-doc .skill-group:last-child { margin-bottom: 0; }
.resume-doc .skill-group h3 { font-size: 11px; font-weight: 700; color: var(--ink); margin: 0 0 calc(3px * var(--density)); }
.resume-doc .skill-group p { margin: 0; font-size: 10.5px; color: #4a4a4a; }
.resume-doc .proj { margin-bottom: calc(13px * var(--density)); break-inside: avoid; }
.resume-doc .proj:last-child { margin-bottom: 0; }
.resume-doc .proj h3 { font-size: 11px; font-weight: 700; color: var(--ink); margin: 0 0 calc(3px * var(--density)); }
.resume-doc .proj p { margin: 0; font-size: 10.5px; color: #4a4a4a; }
.resume-doc .proj .accent { color: var(--accent); }
.resume-doc .more { margin: calc(9px * var(--density)) 0 0; font-size: 10.5px; }
.resume-doc .more a { color: var(--accent); font-weight: 600; text-decoration: none; }
.resume-doc .edu { margin-bottom: calc(13px * var(--density)); break-inside: avoid; }
.resume-doc .edu:last-child { margin-bottom: 0; }
.resume-doc .edu h3 { font-size: 11px; font-weight: 700; color: var(--ink); margin: 0 0 calc(2px * var(--density)); }
.resume-doc .edu .date { margin: 0 0 calc(2px * var(--density)); font-size: 10px; color: var(--muted); }
.resume-doc .edu p { margin: 0; font-size: 10.5px; color: #4a4a4a; }
.resume-doc .ai-note {
  margin-top: calc(16px * var(--density));
  padding-top: calc(9px * var(--density));
  border-top: 1px solid #e6e6e6;
  font-size: 9px;
  color: var(--muted);
  text-align: center;
}
.resume-doc .ai-note a { color: var(--accent); font-weight: 600; }

/* On small screens the A4 "sheet" doesn't fit: shrink padding, drop the
   two-column grid to one column, and stack the header. Placed last so these
   screen-only rules win over the equal-specificity base rules above; the
   print/PDF path (print media) is untouched. Fixed px values here (not
   density-scaled calc()) are intentional: this breakpoint is the
   small-viewport reading layout, never the print/auto-fit path. */
@media screen and (max-width: 640px) {
  .resume-doc {
    padding: 26px 22px;
    font-size: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }
  .resume-doc header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 22px;
  }
  .resume-doc .name { font-size: 30px; letter-spacing: -0.5px; }
  .resume-doc .subtitle { font-size: 12px; max-width: none; }
  .resume-doc .contact {
    text-align: left;
    white-space: normal;
    line-height: 1.9;
    font-size: 11.5px;
  }
  .resume-doc .layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .resume-doc h2 { font-size: 16px; }
}
`;

/**
 * Escapes text for HTML interpolation. The résumé is plain text, so this is a
 * no-op visually (`&` in "Database & ORM" becomes `&amp;`, which renders
 * identically).
 */
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Renders the résumé markup (the inner content of `.resume-doc`) for the
 * canonical résumé, a curated variant by slug, or explicit data.
 */
export function renderResumeBody(variantOrData: ResumeVariant | ResumeData = resume): string {
  const data = toData(variantOrData);
  const contact =
    data.contact
      .map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a>`)
      .join("<br />") + `<br />${esc(data.location)}`;

  const experience = data.experience
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <div class="role">${esc(e.role)} · <span class="company">${esc(e.company)}</span></div>
          <div class="date">${esc(e.date)}</div>
        </div>
        <ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`,
    )
    .join("");

  const skills = data.skills
    .map(
      (s) =>
        `<div class="skill-group"><h3>${esc(s.label)}</h3><p>${esc(s.items)}</p></div>`,
    )
    .join("");

  const projects = data.projects
    .map(
      (p) =>
        `<div class="proj"><h3>${esc(p.name)}</h3><p>${
          p.link
            ? `<a class="accent" href="${esc(p.link.href)}">${esc(p.link.label)}</a> · `
            : ""
        }${esc(p.desc)}</p></div>`,
    )
    .join("");

  const education = data.education
    .map(
      (e) =>
        `<div class="edu"><h3>${esc(e.school)}</h3><p class="date">${esc(e.date)}</p><p>${esc(e.field)}</p></div>`,
    )
    .join("");

  return `
    <header>
      <div>
        <h1 class="name">${esc(data.name)}</h1>
        <p class="subtitle">${esc(data.subtitle)}</p>
      </div>
      <div class="contact">${contact}</div>
    </header>
    <div class="layout">
      <main>
        <section><h2>Experience</h2>${experience}</section>
      </main>
      <aside>
        <section><h2>Skills</h2>${skills}</section>
        <section><h2>Selected Projects</h2>${projects}<p class="more"><a class="accent" href="${esc(data.projectsLink.href)}">${esc(data.projectsLink.label)}</a></p></section>
        <section><h2>Education</h2>${education}</section>
      </aside>
    </div>
    <footer class="ai-note">${esc(data.aiNote.text)} <a href="${esc(data.aiNote.href)}">${esc(data.aiNote.label)}</a></footer>`;
}

/** Serializes a résumé (canonical, a variant, or explicit data) to Markdown. */
export function renderResumeMarkdown(variantOrData: ResumeVariant | ResumeData = resume): string {
  const data = toData(variantOrData);
  const lines: string[] = [
    `# ${data.name}`,
    "",
    data.subtitle,
    "",
    [...data.contact.map((c) => `[${c.label}](${c.href})`), data.location].join(" · "),
    "",
    "## Experience",
  ];

  for (const e of data.experience) {
    lines.push("", `### ${e.role} · ${e.company}`, `_${e.date}_`, "");
    for (const b of e.bullets) lines.push(`- ${b}`);
  }

  lines.push("", "## Skills", "");
  for (const s of data.skills) lines.push(`**${s.label}:** ${s.items}`, "");

  lines.push("## Selected Projects");
  for (const p of data.projects) {
    lines.push("", `### ${p.name}`, p.link ? `[${p.link.label}](${p.link.href}) · ${p.desc}` : p.desc);
  }
  lines.push("", `[${data.projectsLink.label}](${data.projectsLink.href})`);

  lines.push("", "## Education");
  for (const e of data.education) {
    lines.push("", `### ${e.school}`, `_${e.date}_`, e.field);
  }

  return lines.join("\n") + "\n";
}
