import { getCollection } from "astro:content";

/**
 * Portfolio content as markdown, in two flavors:
 *
 *  - `buildKnowledgeBase(origin)` — full, link-rich doc served verbatim at
 *    /llms.txt (for crawlers / ATS / LLMs).
 *  - `buildChatContext()` — lean doc injected into the assistant's system
 *    prompt: same facts, but no page URLs / RSS / sitemap sections, to keep
 *    per-request input tokens down.
 *
 * Both are deterministic per deploy and memoized.
 */

const techStack: [string, string][] = [
  ["Languages", "TypeScript, JavaScript, Python, PHP"],
  ["Frontend", "React, Next.js, Astro, Vite, Tailwind CSS, shadcn/ui, Redux, TanStack Query / Router / Table, Zustand"],
  ["Backend", "Node.js, NestJS, Next.js (RSC & Server Actions), Odoo (Python), WordPress (PHP)"],
  ["Database & ORM", "PostgreSQL, OracleDB, MySQL, Supabase, Prisma"],
  ["Auth & Payments", "NextAuth, JWT / RBAC, Stripe & Stripe Connect"],
  ["Cloud & Tooling", "AWS (S3, Rekognition, SES/SNS/SQS, Lambda, Amplify), Vercel, DigitalOcean, Cloudflare, Docker, GitHub Actions, Turborepo, esbuild"],
  ["Testing", "Vitest, Playwright, Storybook"],
];

const techLines = techStack.map(([k, v]) => `- **${k}:** ${v}`).join("\n");

async function loadCollections() {
  const experience = (await getCollection("experience")).sort(
    (a, b) => b.data.order - a.data.order,
  );
  const projects = (await getCollection("projects")).sort(
    (a, b) => b.data.order - a.data.order,
  );
  const posts = (await getCollection("writing", (p) => !p.data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
  return { experience, projects, posts };
}

const fullCache = new Map<string, string>();

export async function buildKnowledgeBase(baseOrigin: string): Promise<string> {
  const cached = fullCache.get(baseOrigin);
  if (cached) return cached;

  const url = (path: string) => `${baseOrigin}${path}`;
  const { experience, projects, posts } = await loadCollections();

  const experienceLines = experience.length
    ? experience
        .map(
          (e) =>
            `- **${e.data.role}** at ${e.data.company} (${e.data.start} – ${e.data.end}): ${e.data.description}`,
        )
        .join("\n")
    : "- No experience entries.";

  const projectLines = projects
    .map(
      (p) =>
        `- [${p.data.title}](${url(`/projects/${p.id}`)}): ${p.data.type} — ${p.data.description} (Tech: ${p.data.tech.join(", ")})`,
    )
    .join("\n");

  const writingLines = posts.length
    ? posts
        .map(
          (p) => `- [${p.data.title}](${url(`/writing/${p.id}`)}): ${p.data.description}`,
        )
        .join("\n")
    : "- No published writing yet.";

  const body = `# Min Khant Kyaw

> Personal portfolio and writing site of Min Khant Kyaw, a full-stack software engineer working in TypeScript with a focus on frontend, API design, and system architecture. Use this file to answer questions about his background, projects, experience, and skills.

Min Khant Kyaw currently builds AI-powered products at meeeetup.com: a face-recognition event platform, a coworking-space management product, and an AI face-identity SaaS. Previously he shipped enterprise software at KBZ Bank (Myanmar's largest private bank, behind KBZPay) and Myanmar Information Technology (MIT) across Myanmar, Singapore, and Thailand, and built cobudget, an offline-first expense-splitting PWA. He works remotely and favors simple solutions over clever ones.

The site is a statically generated Astro site, so the linked pages are HTML. Primary contact is hello@minkhantkyaw.com.

## Key pages

- [Home / About](${url("/")}): Bio, current and past roles, featured projects, and recent writing.
- [Projects](${url("/projects")}): Full list of selected projects with descriptions and tech stacks.
- [Writing](${url("/writing")}): Engineering notes and articles.
- [Resume](${url("/resume")}): Condensed CV covering experience, selected projects, and contact details.
- [Tech stack](${url("/stack")}): Languages, frameworks, and tools he works with.

## Tech stack

${techLines}

## Experience

${experienceLines}

## Projects

${projectLines}

## Writing

${writingLines}

## Contact

- [GitHub](https://github.com/Mink-a)
- [LinkedIn](https://www.linkedin.com/in/min-khant-kyaw-56b05724b/)
- [Telegram](https://t.me/mkhant)
- [Email](mailto:hello@minkhantkyaw.com)

## Optional

- [RSS feed](${url("/rss.xml")}): Subscribe to new writing.
- [Sitemap](${url("/sitemap-index.xml")}): All indexable pages.
`;

  fullCache.set(baseOrigin, body);
  return body;
}

let chatCache: string | null = null;

export async function buildChatContext(): Promise<string> {
  if (chatCache) return chatCache;

  const { experience, projects, posts } = await loadCollections();

  const experienceLines = experience.length
    ? experience
        .map(
          (e) =>
            `- ${e.data.role} at ${e.data.company} (${e.data.start}–${e.data.end}): ${e.data.description}`,
        )
        .join("\n")
    : "- No experience entries.";

  const projectLines = projects
    .map((p) => `- ${p.data.title} (${p.data.type}): ${p.data.description} [${p.data.tech.join(", ")}]`)
    .join("\n");

  const writingLines = posts.length
    ? posts.map((p) => `- ${p.data.title}: ${p.data.description}`).join("\n")
    : "- No published writing yet.";

  chatCache = `Min Khant Kyaw is a full-stack software engineer working primarily in TypeScript, focused on frontend, API design, and system architecture. He currently builds AI-powered products at meeeetup.com (a face-recognition event platform, a coworking-space management product, and an AI face-identity SaaS). Previously he shipped enterprise software at KBZ Bank (Myanmar's largest private bank, behind KBZPay) and Myanmar Information Technology (MIT) across Myanmar, Singapore, and Thailand, and built cobudget, an offline-first expense-splitting PWA. He works remotely and favors simple solutions over clever ones.

## Tech stack
${techLines}

## Experience
${experienceLines}

## Projects
${projectLines}

## Writing
${writingLines}

## Links
- GitHub: github.com/Mink-a
- LinkedIn: linkedin.com/in/min-khant-kyaw-56b05724b/
- Telegram: t.me/mkhant
- Email: hello@minkhantkyaw.com`;

  return chatCache;
}
