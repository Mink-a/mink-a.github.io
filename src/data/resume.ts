// Single source of truth for the résumé. Consumed by:
//   - src/pages/resume.astro         (on-page A4 sheet, fitted live)
//   - scripts/resume-pdf.ts          (static A4 PDF in public/)
//   - src/data/resumeVariants.ts     (admin-only focused variants: shared
//                                     identity/education + renderers)

import { FILL_HEIGHT_MM, PAGE_MARGIN_X_MM, PAGE_MARGIN_Y_MM } from "../lib/resumeFit";

export interface Experience {
  role: string;
  company: string;
  /** Company website; the company name links to it. */
  companyUrl?: string;
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

export interface ResumeData {
  name: string;
  subtitle: string;
  location: string;
  contact: { label: string; href: string }[];
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  projectsLink: { href: string; label: string };
  /** Rendered last in the narrow column. */
  education: Education[];
  aiNote: { text: string; href: string; label: string };
  /** Names linked wherever they appear in a bullet, e.g. a product. */
  inlineLinks: { text: string; href: string }[];
}

export const resume: ResumeData = {
  name: "Min Khant Kyaw",
  subtitle:
    "Full-stack software engineer working in TypeScript, focused on frontend, API design, and system architecture — building production web apps end to end.",
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
  experience: [
    {
      role: "Software Engineer",
      company: "MeeeetUp",
      companyUrl: "https://www.meeeetup.com",
      date: "Jan 2025 — Present",
      bullets: [
        "Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork (Next.js, React, TypeScript, Turborepo monorepo).",
        "Modeled the platform's multi-tenant relational domain in Prisma and PostgreSQL, with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.",
        "Integrated Stripe and Stripe Connect for ticketing and host payouts, and decoupled transactional email from the request path via SQS, AWS Lambda, and SES.",
        "Engineered a touchless facial check-in pipeline layering in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.",
      ],
    },
    {
      role: "Frontend Software Engineer",
      company: "KBZ Bank",
      companyUrl: "https://www.kbzbank.com",
      date: "Nov 2023 — Jan 2025",
      bullets: [
        "Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements (React, NestJS, Oracle Database).",
        "Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow.",
        "Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table modeled as a Redux state machine.",
        "Extended an NPS platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.",
      ],
    },
    {
      role: "Web Developer",
      company: "MIT",
      companyUrl: "https://www.mit.com.mm",
      date: "Oct 2022 — Nov 2023",
      bullets: [
        "Built and customized Odoo ERP solutions for enterprise clients across vertical markets using Python backend modules and JavaScript frontends.",
        "Engineered a drag-and-drop room-reservation calendar — a visual booking timeline — for Odoo's free Community edition, where Enterprise planning views aren't available.",
        "Customized Odoo's point-of-sale for retail clients and integrated it into each client's wider Odoo deployment.",
      ],
    },
    {
      role: "Freelance Developer",
      company: "Independent",
      date: "2022 — Present",
      bullets: [
        "Architect and ship full-stack products for clients alongside full-time roles, owning technical decisions from setup through deployment.",
        "Built BurmaUni, an EdTech operations portal, around a custom JWT-based RBAC system (route / component / action enforcement), a concurrency-safe silent-refresh interceptor, and a reusable URL-state data-table hook across ~20 server-side grids.",
        "Built MyanHealth, a Burmese-first health-news WordPress theme, with a self-built ad manager and a modern Tailwind CSS v4 + esbuild pipeline.",
      ],
    },
  ],
  skills: [
    { label: "Languages", items: "TypeScript, JavaScript, Python, PHP" },
    {
      label: "Frontend",
      items:
        "React, Next.js, Astro, Vite, Tailwind CSS, shadcn/ui, Redux, TanStack Query / Router / Table, Zustand",
    },
    {
      label: "Backend",
      items: "Node.js, NestJS, Next.js (RSC & Server Actions), Odoo (Python), WordPress (PHP)",
    },
    { label: "Database & ORM", items: "PostgreSQL, OracleDB, MySQL, Supabase, Prisma" },
    { label: "Auth & Payments", items: "NextAuth, JWT / RBAC, Stripe & Stripe Connect" },
    {
      label: "Cloud & Tooling",
      items:
        "AWS (S3, Rekognition, SES/SNS/SQS, Lambda, Amplify), Vercel, DigitalOcean, Cloudflare, Docker, GitHub Actions, Turborepo, esbuild",
    },
    { label: "Testing", items: "Vitest, Playwright, e2e (TesterArmy), Storybook" },
  ],
  projects: [
    {
      name: "AI Document Management — RAG",
      desc: "Hackathon-winning, Google-Drive-style document manager with a LangChain + Chroma RAG pipeline over a local LLM and per-department/user RBAC. React + NestJS.",
    },
    {
      name: "BurmaUni — EdTech Admin Portal",
      desc: "~30-module operations portal around a custom JWT/RBAC system and a reusable URL-state data-table hook.",
      link: { href: "https://burmauni.com", label: "burmauni.com" },
    },
    {
      name: "Meeeetup — Event & Coworking",
      desc: "Two production Next.js products on one shared, multi-tenant engine (Turborepo), with touchless facial check-in (MediaPipe + AWS Rekognition).",
    },
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
  inlineLinks: [
    { text: "BurmaUni", href: "https://burmauni.com" },
    { text: "MyanHealth", href: "https://myanhealth.org" },
  ],
};

/**
 * Styles for the résumé, scoped under `.resume-doc` so they never leak into
 * the site.
 *
 * `--density` (default `1`) is a single dial on VERTICAL whitespace — leading
 * (`line-height`) and vertical margins/gaps/padding — expressed as
 * `calc(<original value> * var(--density))` throughout, so `--density: 1`
 * reproduces the natural layout. Font sizes, letter-spacing, and the `.name`
 * heading are never multiplied. `src/lib/resumeFit.ts` sets it on the
 * document so the taller column fills the page, then overrides it on the
 * shorter column (`main` / `aside` re-derive their own `line-height`) so both
 * columns end on the same line. Horizontal-only gaps are left alone.
 *
 * The sheet is a flex column pinned to the page height (a full A4 sheet on
 * screen, `FILL_HEIGHT_MM` of content in print), so `.layout` absorbs any
 * sub-pixel slack and the footer always sits on the bottom edge — no white
 * tail.
 *
 * Page margins are the sheet's own padding, with `@page { margin: 0 }`: the
 * browser print dialog draws its header/footer (date, title, URL, page
 * number) inside the `@page` margin, so a zero margin leaves it no room and
 * the printed page carries only the résumé.
 */
export const resumeCSS = `
.resume-doc {
  --accent: #2d52e0;
  --ink: #1a1a1a;
  --body: #3a3a3a;
  --muted: #8a8a8a;
  --density: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--body);
  font-size: 11px;
  line-height: calc(1.46 * var(--density));
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.resume-doc a { color: inherit; text-decoration: none; }

/* On-screen: a white A4 sheet; its padding is the printed page margin, so the
   content box is the same 182mm x 271mm the PDF prints into. */
@media screen {
  .resume-doc {
    background: #fff;
    width: 100%;
    max-width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
    border-radius: 6px;
    /* Edge drawn as a shadow ring, not a border, so it takes no layout width. */
    box-shadow: 0 0 0 1px #e5e5e5, 0 10px 40px rgba(0, 0, 0, 0.16);
  }
}

@page { size: A4; margin: 0; }
@media print {
  .resume-doc {
    width: 210mm;
    margin: 0;
    padding: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
    min-height: ${FILL_HEIGHT_MM + PAGE_MARGIN_Y_MM * 2}mm;
  }
}

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
  grid-template-columns: 1.45fr 1fr;
  gap: calc(32px * var(--density));
  align-items: start;
  flex: 1 0 auto;
}
.resume-doc main,
.resume-doc aside { line-height: calc(1.46 * var(--density)); }
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
.resume-doc .accent { color: var(--accent); }
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
    min-height: 0;
    padding: 26px 22px;
    font-size: 12px;
    box-shadow: 0 0 0 1px #e5e5e5, 0 6px 24px rgba(0, 0, 0, 0.12);
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

/** Escaped bullet text with each `inlineLinks` name linked at its first mention. */
const linkify = (text: string, links: ResumeData["inlineLinks"]): string =>
  links.reduce(
    (html, l) => html.replace(esc(l.text), `<a class="accent" href="${esc(l.href)}">${esc(l.text)}</a>`),
    esc(text),
  );

/** Renders the résumé markup (the inner content of `.resume-doc`). */
export function renderResumeBody(data: ResumeData = resume): string {
  const contact =
    data.contact
      .map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a>`)
      .join("<br />") + `<br />${esc(data.location)}`;

  const experience = data.experience
    .map((e) => {
      const company = e.companyUrl
        ? `<a class="company" href="${esc(e.companyUrl)}">${esc(e.company)}</a>`
        : `<span class="company">${esc(e.company)}</span>`;
      return `
      <div class="entry">
        <div class="entry-head">
          <div class="role">${esc(e.role)} · ${company}</div>
          <div class="date">${esc(e.date)}</div>
        </div>
        <ul>${e.bullets.map((b) => `<li>${linkify(b, data.inlineLinks)}</li>`).join("")}</ul>
      </div>`;
    })
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

/** Serializes the résumé to Markdown. */
export function renderResumeMarkdown(data: ResumeData = resume): string {
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
    const company = e.companyUrl ? `[${e.company}](${e.companyUrl})` : e.company;
    lines.push("", `### ${e.role} · ${company}`, `_${e.date}_`, "");
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
