import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const base = (context.site ?? new URL("https://minkhantkyaw.com")).origin;
  const url = (path: string) => `${base}${path}`;

  const projects = (await getCollection("projects")).sort(
    (a, b) => b.data.order - a.data.order,
  );
  const posts = (await getCollection("writing", (p) => !p.data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  const projectLines = projects
    .map(
      (p) =>
        `- [${p.data.title}](${url(`/projects/${p.id}`)}): ${p.data.type} — ${p.data.description}`,
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

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
