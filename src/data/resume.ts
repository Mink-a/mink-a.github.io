// Single source of truth for the résumé. Consumed by:
//   - src/pages/resume.astro  (renders the on-page styled sheet)
//   - scripts/resume-pdf.ts   (assembles a standalone HTML → A4 PDF)

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

export const resume = {
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
      date: "Jan 2025 — Present",
      bullets: [
        "Build and ship two production Next.js products — an event-management platform and a coworking reception system — on a single shared, multi-tenant engine where a second product launches through configuration rather than a fork (Next.js, React, TypeScript, Turborepo monorepo).",
        "Engineered a touchless facial check-in pipeline layering in-browser MediaPipe quality gating in front of AWS Rekognition matching to control cost and latency.",
        "Modeled a ~40-table domain in Prisma and PostgreSQL with Zod schemas as the single source of truth across the database, API routes, server actions, and forms.",
        "Integrated Stripe and Stripe Connect for ticketing and host payouts, and decoupled transactional email from the request path via SQS, AWS Lambda, and SES.",
      ],
    },
    {
      role: "Frontend Software Engineer",
      company: "KBZ Bank",
      date: "Nov 2023 — Jan 2025",
      bullets: [
        "Built customer-facing and internal banking systems for Myanmar's largest private bank under tight reliability and regulatory requirements (React, NestJS, Oracle Database).",
        "Engineered the frontend of a host-to-host payroll tool end to end — an Excel-upload, Zod-validated, editable and virtualized review table modeled as a Redux state machine.",
        "Developed a full-stack cash-management system tying branch and ATM cash requests to a transport (cash-in-transit) fulfillment workflow.",
        "Extended an NPS platform and integrated it with the branch queue-management system to print survey QR codes onto queue tickets per branch and topic.",
      ],
    },
    {
      role: "Web Developer",
      company: "Myanmar Information Technology",
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
  ] satisfies Experience[],
  skills: [
    { label: "Languages", items: "TypeScript, JavaScript, Python, PHP" },
    {
      label: "Frontend",
      items:
        "React, Next.js, Astro, Vite, Tailwind CSS, shadcn/ui, Redux, TanStack Query / Router / Table, Zustand",
    },
    {
      label: "Backend",
      items:
        "Node.js, NestJS, Next.js (RSC & Server Actions), Odoo (Python), WordPress (PHP)",
    },
    {
      label: "Database & ORM",
      items: "PostgreSQL, OracleDB, MySQL, Supabase, Prisma",
    },
    {
      label: "Auth & Payments",
      items: "NextAuth, JWT / RBAC, Stripe & Stripe Connect",
    },
    {
      label: "Cloud & Tooling",
      items:
        "AWS (S3, Rekognition, SES/SNS/SQS, Lambda, Amplify), Vercel, DigitalOcean, Cloudflare, Docker, GitHub Actions, Turborepo, esbuild",
    },
    { label: "Testing", items: "Vitest, Playwright, Storybook" },
  ] satisfies SkillGroup[],
  projects: [
    {
      name: "Meeeetup — Event & Coworking",
      desc: "Two production Next.js products on one shared, multi-tenant engine (Turborepo), with touchless facial check-in (MediaPipe + AWS Rekognition).",
    },
    {
      name: "AI Document Management — RAG",
      desc: "Hackathon-winning, Google-Drive-style document manager with a LangChain + Chroma RAG pipeline over a local LLM and per-department/user RBAC. React + NestJS.",
    },
    {
      name: "BurmaUni — EdTech Admin Portal",
      desc: "~30-module operations portal around a custom JWT/RBAC system and a reusable URL-state data-table hook.",
    },
    {
      name: "CoBudget — Expense-Splitting PWA",
      desc: "Offline-first PWA that settles shared expenses in the fewest transfers; authz via Supabase RLS.",
      link: { href: "https://co-budget-snowy.vercel.app", label: "Live demo" },
    },
  ] satisfies Project[],
  aiNote: {
    text: "Machine-readable version of this résumé for AI screeners & ATS:",
    href: "https://minkhantkyaw.com/llms.txt",
    label: "minkhantkyaw.com/llms.txt",
  },
};

/** Styles for the résumé, scoped under `.resume-doc` so they never leak into the site. */
export const resumeCSS = `
.resume-doc {
  --accent: #2d52e0;
  --ink: #1a1a1a;
  --body: #3a3a3a;
  --muted: #8a8a8a;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--body);
  font-size: 11px;
  line-height: 1.46;
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
  margin-bottom: 26px;
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
  line-height: 1.55;
  margin: 10px 0 0;
  max-width: 30em;
}
.resume-doc .contact {
  text-align: right;
  font-size: 10.5px;
  line-height: 2.15;
  color: #5a5a5a;
  white-space: nowrap;
  flex-shrink: 0;
}
.resume-doc .layout {
  display: grid;
  grid-template-columns: 1.75fr 1fr;
  gap: 32px;
  align-items: start;
}
.resume-doc h2 {
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
}
.resume-doc section { margin-bottom: 22px; }
.resume-doc section:last-child { margin-bottom: 0; }
.resume-doc .entry { margin-bottom: 13px; break-inside: avoid; }
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
.resume-doc ul { margin: 6px 0 0; padding-left: 15px; list-style: disc; }
.resume-doc li { margin-bottom: 4px; }
.resume-doc .skill-group { margin-bottom: 11px; }
.resume-doc .skill-group:last-child { margin-bottom: 0; }
.resume-doc .skill-group h3 { font-size: 11px; font-weight: 700; color: var(--ink); margin: 0 0 3px; }
.resume-doc .skill-group p { margin: 0; font-size: 10.5px; color: #4a4a4a; }
.resume-doc .proj { margin-bottom: 13px; break-inside: avoid; }
.resume-doc .proj:last-child { margin-bottom: 0; }
.resume-doc .proj h3 { font-size: 11px; font-weight: 700; color: var(--ink); margin: 0 0 3px; }
.resume-doc .proj p { margin: 0; font-size: 10.5px; color: #4a4a4a; }
.resume-doc .proj .accent { color: var(--accent); }
.resume-doc .ai-note {
  margin-top: 16px;
  padding-top: 9px;
  border-top: 1px solid #e6e6e6;
  font-size: 9px;
  color: var(--muted);
  text-align: center;
}
.resume-doc .ai-note a { color: var(--accent); font-weight: 600; }

/* On small screens the A4 "sheet" doesn't fit: shrink padding, drop the
   two-column grid to one column, and stack the header. Placed last so these
   screen-only rules win over the equal-specificity base rules above; the
   print/PDF path (print media) is untouched. */
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
 * Shape the renderers consume: the base résumé, or the base spread with a
 * tailored override (`{ ...resume, ...tailored }`). Identity fields — name,
 * contact, location, aiNote — always come from the base, so a tailored
 * résumé can never alter them.
 */
export interface ResumeData {
  name: string;
  subtitle: string;
  location: string;
  contact: { label: string; href: string }[];
  experience: Experience[];
  skills: SkillGroup[];
  projects: Project[];
  aiNote: { text: string; href: string; label: string };
}

/**
 * Escapes text for HTML interpolation. The base résumé is plain text, so this
 * is a no-op for it visually (`&` in "Database & ORM" becomes `&amp;`, which
 * renders identically). Tailored résumés are model-generated, so every
 * interpolated value goes through it.
 */
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Renders the résumé markup (the inner content of `.resume-doc`). */
export function renderResumeBody(data: ResumeData = resume): string {
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
        <section><h2>Selected Projects</h2>${projects}</section>
      </aside>
    </div>
    <footer class="ai-note">${esc(data.aiNote.text)} <a href="${esc(data.aiNote.href)}">${esc(data.aiNote.label)}</a></footer>`;
}

/** Serializes a résumé to Markdown, for pasting into application forms. */
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
    lines.push("", `### ${e.role} · ${e.company}`, `_${e.date}_`, "");
    for (const b of e.bullets) lines.push(`- ${b}`);
  }

  lines.push("", "## Skills", "");
  for (const s of data.skills) lines.push(`**${s.label}:** ${s.items}`, "");

  lines.push("## Selected Projects");
  for (const p of data.projects) {
    lines.push("", `### ${p.name}`, p.link ? `[${p.link.label}](${p.link.href}) · ${p.desc}` : p.desc);
  }

  return lines.join("\n") + "\n";
}
