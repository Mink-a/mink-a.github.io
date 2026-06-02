# minkhantkyaw.com

Personal portfolio and writing site for Min Khant Kyaw — a full‑stack software engineer.
Built with **Astro 5**, **Tailwind CSS v4**, and **Bun**; statically generated and deployed to GitHub Pages.

🔗 **Live:** https://minkhantkyaw.com

---

## Tech stack

| Area        | Choice                                                            |
| ----------- | ---------------------------------------------------------------- |
| Framework   | [Astro 5](https://astro.build) (`output: 'static'`)              |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Content     | Astro Content Collections + [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/) |
| Icons       | [astro-icon](https://www.astroicon.dev) (`lucide` + `simple-icons`) |
| Runtime     | [Bun](https://bun.sh)                                            |
| Language    | TypeScript (`astro/tsconfigs/strict`)                            |
| Hosting     | GitHub Pages (custom domain via `public/CNAME`)                  |

No client framework — interactivity is hand‑written vanilla TypeScript loaded per layout.

## Features

- **Two layouts** — a wide two‑column home (`Base.astro`) and a compact inner layout (`InnerLayout.astro`) for detail pages, sharing a sticky sidebar.
- **Dark / light theme** — stone + amber palette driven by CSS custom properties, with system‑preference detection, `localStorage` persistence, and an inline no‑flash script.
- **View Transitions** — sidebar and main column morph between routes via Astro's `ClientRouter` and shared `transition:name`s.
- **Scroll‑spy navigation** — the sidebar highlights the active in‑page section; article pages get a synced table‑of‑contents spy.
- **Content‑driven** — experience, projects, and writing live as Markdown/MDX with Zod‑validated frontmatter.
- **Polish** — bio text‑scramble effect, entry fade‑in on scroll, back‑to‑top button, and a Konami‑code easter egg.
- **Accessible by default** — skip‑to‑content link, `focus-visible` outlines, `prefers-reduced-motion` support, and schema.org `Person` markup on the resume.

## Quick start

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev          # dev server → http://localhost:4321
bun run build        # type-check + static export to dist/
bun run preview      # serve the production build locally
bun run check        # type-check only (astro check)
```

> `bun run build` runs `astro check && astro build`, so a type error fails the build.

## Project structure

```
src/
├─ pages/            # routes: /, /projects, /writing, /resume, /stack, /policy, /privacy, 404
│  ├─ projects/[...slug].astro   # project detail pages
│  └─ writing/[...slug].astro    # blog post pages
├─ layouts/          # Base (home) and InnerLayout (detail pages)
├─ components/       # Sidebar, ThemeToggle, Footer, cards/lists, Breadcrumb, StackGrid, …
├─ content/          # content collections + schema
│  ├─ config.ts      # Zod schemas for experience / projects / writing
│  ├─ experience/    # *.md
│  ├─ projects/      # *.md
│  └─ writing/       # *.{md,mdx}
├─ data/             # stack.ts (tech grid), resume.md (rendered on /resume)
├─ scripts/          # client-side TS (theme, scroll-spy, toc-spy, easter-egg, …)
└─ styles/           # global.css (theme tokens, palette, view-transition rules)
public/              # static assets; CNAME pins the custom domain
.github/workflows/   # deploy.yml — build + publish to GitHub Pages
```

## Authoring content

Add a file to the matching collection; frontmatter is validated against `src/content/config.ts` at build time. Files are conventionally prefixed (`01-…`, `02-…`) for ordering at a glance, but actual sort order is driven by the fields below.

### Project — `src/content/projects/<slug>.md`

| Field         | Type                  | Notes                                  |
| ------------- | --------------------- | -------------------------------------- |
| `title`       | string                | required                               |
| `type`        | string                | e.g. `"AI-Powered SaaS · MeeeetUp"`    |
| `description` | string                | required                               |
| `tech`        | string[]              | required                               |
| `repoUrl`     | url                   | optional                               |
| `demoUrl`     | url                   | optional                               |
| `image`       | string                | optional — path under `public/` or URL |
| `featured`    | boolean               | default `false` (shown on home)        |
| `order`       | number                | default `0` — higher sorts first       |

### Experience — `src/content/experience/<slug>.md`

| Field         | Type                     | Notes                            |
| ------------- | ------------------------ | -------------------------------- |
| `role`        | string                   | required                         |
| `company`     | string                   | required                         |
| `companyUrl`  | url                      | optional                         |
| `start`       | string                   | e.g. `"Jan 2025"`                |
| `end`         | string \| `"Present"`    | required                         |
| `description` | string                   | required                         |
| `tech`        | string[]                 | required (may be empty)          |
| `order`       | number                   | required — higher sorts first    |

### Writing — `src/content/writing/<slug>.{md,mdx}`

| Field         | Type      | Notes                                  |
| ------------- | --------- | -------------------------------------- |
| `title`       | string    | required                               |
| `description` | string    | required                               |
| `pubDate`     | date      | required — newest sorts first          |
| `draft`       | boolean   | default `false` — drafts are excluded from build |
| `tags`        | string[]  | default `[]`                           |

## Customizing

- **Colors & typography** — edit the `@theme` tokens in `src/styles/global.css`; light‑mode overrides live under `:root[data-theme="light"]`.
- **Tech stack page** — edit the categorized list in `src/data/stack.ts` (each item uses an `astro-icon` name).
- **Resume** — `/resume` renders `src/data/resume.md`; the page also links to `/resume.pdf` (add the PDF to `public/`).
- **Identity & bio** — sidebar content lives in `src/components/Sidebar.astro`; the cycling bio lines are in `src/scripts/bio-scramble.ts`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which installs with Bun, runs `bun run build`, and publishes `dist/` to GitHub Pages. The custom domain is preserved via `public/CNAME`.

**One‑time setup:** in the repo's **Settings → Pages**, set the source to **GitHub Actions**.

The workflow can also be run manually via **workflow_dispatch**.

## License

Personal project. Source is provided for reference; site content is governed by the
[content policy](https://minkhantkyaw.com/policy). Please don't republish the content as your own.
