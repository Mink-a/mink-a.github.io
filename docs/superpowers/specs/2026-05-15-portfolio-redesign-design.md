# Portfolio Redesign — Design Spec

**Date:** 2026-05-15
**Branch:** `v1`
**Status:** Approved by user, ready for implementation planning

## Goal

Redesign `minkhantkyaw.com` as a portfolio inspired by [brittanychiang.com](https://brittanychiang.com/) and [heinsoe.com](https://www.heinsoe.com/). The current site is a single-file dark portfolio with About / Projects / Contact. The redesign keeps the dark aesthetic but adopts Brittany Chiang's signature sticky-sidebar layout, adds Experience / Stack / Writing sections, and switches from hand-edited HTML to Astro + Tailwind so the blog and project list can grow without pain.

## Non-goals

- Multi-language support
- CMS or admin UI (markdown files in the repo are the CMS)
- AI Assistant widget (Hein Soe has one — out of scope)
- A test suite at launch (`astro check` only)
- Backend / server functions

## Reference sites — what we're taking from each

| From Brittany Chiang | From Hein Soe |
|---|---|
| Sticky left sidebar layout | Categorized tech stack icon grid |
| Mouse spotlight effect | Resume link in sidebar |
| Hover-dim sibling cards | (Single-page detail layout — explicitly *not* used, see "Decisions" below) |
| Animated nav indicator (growing line) | |
| Scroll spy (active section highlights in nav) | |

## Decisions (brainstorming outcomes)

| Decision | Choice | Notes |
|---|---|---|
| Overall layout | Sticky left sidebar (Brittany style) | Applied to **all** routes — home and inner pages share the same shell |
| Sections | About, Experience, Projects, Stack, Writing, Contact, Resume link | All seven from the brainstorming menu |
| Color palette | Stone + Amber (`#0c0a09` / `#fb923c`) | Warm dark; distinct from the heavily-copied Brittany slate+teal |
| Typography | Inter throughout | Matches reference sites; safe and readable |
| Tech stack | Astro + Tailwind, static export | MDX for blog, content collections for experience/projects |
| Package manager | Bun | Matches existing stack |
| Page architecture | Hybrid: long-scroll home + per-section detail pages | Home is the highlights reel; `/projects`, `/stack`, `/blog` are deep pages |
| Interactive effects | All seven (spotlight, hover-dim, nav indicator, scroll spy, entry anim, view transitions, easter egg) | Each respects `prefers-reduced-motion` and `(hover: none)` |

## Architecture

### Routes

| Route | Purpose |
|---|---|
| `/` | Home — long scroll: About → Experience → Featured Projects → Contact |
| `/projects` | Full project grid (all projects, not just featured) |
| `/stack` | Full tech stack grid (Hein Soe style icon groups) |
| `/blog` | Post index |
| `/blog/[slug]` | Individual post (MDX-rendered) |
| `/404` | Custom 404 with easter-egg art |

All routes use the same sticky-sidebar shell (`src/layouts/Base.astro`). On inner pages, the sidebar shows "Home" navigation in place of section anchors.

### File layout

```
mink-a.github.io/
├── astro.config.mjs              # static output, site: minkhantkyaw.com
├── tailwind.config.ts            # design tokens (colors, fonts, spacing)
├── tsconfig.json
├── package.json                  # scripts: dev, build, preview, check
├── bun.lock                      # committed
├── public/
│   ├── resume.pdf                # linked from sidebar
│   ├── og.png                    # social preview
│   └── CNAME                     # minkhantkyaw.com — preserved from current site
├── src/
│   ├── content/
│   │   ├── config.ts             # collections schema (zod)
│   │   ├── experience/*.md       # one file per role
│   │   ├── projects/*.md         # one file per project
│   │   └── blog/*.mdx            # posts
│   ├── data/
│   │   └── stack.ts              # tech stack icons grouped by category
│   ├── layouts/
│   │   └── Base.astro            # html, head, theme, fonts, sidebar, spotlight
│   ├── components/
│   │   ├── Sidebar.astro         # sticky left identity + nav + socials + resume
│   │   ├── Spotlight.astro       # mouse-follow radial glow
│   │   ├── SectionHeading.astro  # eyebrow + heading pair
│   │   ├── ExperienceList.astro  # hover-dim wrapper
│   │   ├── ExperienceCard.astro
│   │   ├── ProjectList.astro     # hover-dim wrapper
│   │   ├── ProjectCard.astro
│   │   ├── StackGrid.astro       # categorized icon grid
│   │   ├── BlogList.astro
│   │   ├── Tag.astro             # tech pill
│   │   └── EasterEgg.astro       # konami listener
│   ├── pages/
│   │   ├── index.astro           # long-scroll home
│   │   ├── projects.astro
│   │   ├── stack.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   └── 404.astro
│   ├── styles/
│   │   └── global.css            # tailwind layers + fonts + base resets
│   └── scripts/
│       ├── spotlight.ts          # client-only, ~30 lines
│       ├── scroll-spy.ts         # client-only, ~40 lines
│       ├── entry-anim.ts         # client-only, ~20 lines
│       └── easter-egg.ts         # client-only, ~30 lines
└── .github/workflows/
    └── deploy.yml                # bun install + build + deploy to Pages
```

### Component rationale

Each section gets its own small component so it's editable in isolation. Content lives in `src/content/` (markdown) rather than being hand-coded in pages — adding a new project means creating one file. Client scripts are tiny and isolated; Astro ships zero JS for everything else.

## Layout system

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐  ┌────────────────────────────────┐   │
│ │ STICKY SIDEBAR   │  │ SCROLLING CONTENT              │   │
│ │                  │  │                                 │   │
│ │ Min Khant Kyaw   │  │ ABOUT                           │   │
│ │ Software Eng     │  │ ...                             │   │
│ │ Tagline.         │  │                                 │   │
│ │                  │  │ EXPERIENCE                      │   │
│ │ — About          │  │ [hover-dim cards]               │   │
│ │ ─ Experience     │  │                                 │   │
│ │ — Projects       │  │ FEATURED PROJECTS               │   │
│ │ — Contact        │  │ [hover-dim cards]               │   │
│ │                  │  │                                 │   │
│ │ ● Available      │  │ WHAT'S NEXT                     │   │
│ │ GH LI X @        │  │ Contact CTA + Resume button    │   │
│ │ Resume →         │  │                                 │   │
│ └──────────────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- Grid: `lg:grid-cols-[minmax(0,380px)_minmax(0,720px)] gap-16`
- Outer wrapper: `max-w-screen-xl mx-auto px-12`
- Left column: `lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-between py-24`
- Right column flows; the page itself scrolls (not the right column)

### Tablet (640–1023px)

Sidebar collapses to a non-sticky top banner. Nav links hide — visitors scroll instead of jumping.

```
┌────────────────────────────┐
│ Min Khant Kyaw             │
│ Software Engineer          │
│ Tagline.                   │
│ GH LI X @  Resume →        │
├────────────────────────────┤
│ ABOUT                      │
│ ...                        │
│ EXPERIENCE                 │
└────────────────────────────┘
```

Content width: `max-w-2xl mx-auto px-6`.

### Mobile (< 640px)

Same as tablet with `px-5`. Touch-device adjustments:
- Mouse spotlight disabled (no cursor)
- Hover-dim disabled (no hover)
- Entry animations honor `prefers-reduced-motion`

### Accessibility

- `<nav aria-label="Section navigation">` wraps sidebar nav
- Active section gets `aria-current="location"` via scroll spy
- Skip-to-content link before the sidebar
- All interactive elements have 2px amber outline focus state at 3px offset

## Visual design tokens

### Colors

| Token | Value | Use |
|---|---|---|
| `bg` | `#0c0a09` (stone-950) | Page background |
| `surface` | `#1c1917` (stone-900) | Cards, slight elevation |
| `surface-2` | `#292524` (stone-800) | Hover on cards |
| `border` | `rgba(245, 245, 244, 0.08)` | Hairline borders |
| `border-strong` | `rgba(245, 245, 244, 0.16)` | Hover/active borders |
| `text` | `#f5f5f4` (stone-50) | Primary text |
| `text-muted` | `#a8a29e` (stone-400) | Secondary text |
| `text-dim` | `#78716c` (stone-500) | Eyebrows, captions |
| `accent` | `#fb923c` (orange-400) | Active nav, links, tag text |
| `accent-soft` | `rgba(251, 146, 60, 0.1)` | Tag backgrounds |
| `accent-glow` | `rgba(251, 146, 60, 0.15)` | Spotlight gradient |

### Typography (Inter)

| Token | Size / Line height | Use |
|---|---|---|
| `display` | `clamp(48px, 8vw, 80px)` / 0.95 / -0.04em / 800 | Hero, sidebar name |
| `h2` | `clamp(28px, 4vw, 40px)` / 1.0 / -0.03em / 700 | Section headings |
| `h3` | `22px` / 1.2 / -0.02em / 600 | Card titles |
| `body` | `16px` / 1.6 / 0 / 400 | Body text |
| `body-lg` | `18px` / 1.6 / 0 / 400 | Lead paragraphs |
| `eyebrow` | `12px` / 1 / 0.16em / 600 uppercase | Section labels |
| `caption` | `13px` / 1.4 / 0 / 400 | Tag text, meta |

### Spacing / sizing

- Section gap: `py-24` desktop, `py-16` mobile
- Card padding: `p-6`, gap between siblings `gap-6`
- Card radius: `rounded-md` (6px); pills: `rounded-full`; page body: 0
- Borders: 1px hairline; hover bumps to `border-strong`
- Shadows: none (flat + bordered aesthetic)

### Motion

| Property | Value |
|---|---|
| Default transition | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| Hover-dim transition | `200ms ease` on opacity |
| Entry animation | `400ms ease-out`, `translateY(12px) → 0` + opacity 0 → 1 |
| Spotlight follow | Continuous, no transition |

All animations honor `prefers-reduced-motion: reduce` (become 0ms).

## Interactive effects

### 1. Mouse spotlight — `src/scripts/spotlight.ts`

A fixed `<div>` covering `inset:0`, `pointer-events:none`, behind content. Background is `radial-gradient(600px circle at var(--mx) var(--my), rgba(251,146,60,0.15), transparent 40%)`. A script listens to `mousemove` on `window`, throttled with `requestAnimationFrame`, and updates `--mx` / `--my` on the spotlight element.

Disabled when `matchMedia("(hover: none)")` matches or `prefers-reduced-motion: reduce` is set.

### 2. Hover-dim siblings — pure CSS

```css
.hover-dim-group:hover .hover-dim-item { opacity: 0.4; transition: opacity 200ms ease; }
.hover-dim-group .hover-dim-item:hover { opacity: 1; }
@media (hover: none) {
  .hover-dim-group:hover .hover-dim-item { opacity: 1; }
}
```

### 3. Animated nav indicator — CSS only

Each nav link has a `<span>` line before it. Default `width: 24px`, active/hover `width: 64px`. Color goes from `text-dim` to `accent`. 200ms transition on width and color.

### 4. Scroll spy — `src/scripts/scroll-spy.ts` (home only)

IntersectionObserver watches all `<section id>` elements with `rootMargin: "-40% 0px -55% 0px"`. The section in that mid-viewport band is "active". On intersection, set `data-active="true"` on the matching sidebar nav link; CSS hooks off that to apply active styles from effect 3. Also updates `aria-current="location"`.

### 5. Entry animations — CSS + small JS

Sections start with `.fade-in-up { opacity: 0; transform: translateY(12px); }`. IntersectionObserver adds `.is-visible` when 15% intersects viewport: `opacity: 1; transform: none;` over 400ms ease-out. Observer disconnects after first reveal per element. Disabled under reduced motion.

### 6. View Transitions — Astro built-in

`<ClientRouter />` in `Base.astro`. Sidebar gets `transition:persist` so it survives navigation between routes. Page content cross-fades by default. Falls back to normal navigation on unsupported browsers.

### 7. Easter egg

Two parts:
- **Konami code** — `↑↑↓↓←→←→BA` listener on `window`. On match, toggles `<body data-konami>`; CSS swaps spotlight to a rainbow gradient and adds a "👋" cursor floater.
- **`/404` page** — animated paper-airplane ASCII art, copy: *"this page took a different flight path."*

### Performance budget

Total client JS across the home page < 8 KB gzipped (spotlight + scroll-spy + entry-anim + easter-egg combined). No animation libraries — vanilla TS + CSS only.

## Content model

### `src/content/config.ts` — Zod schemas

**Experience** (`src/content/experience/*.md`)

```ts
{
  role: string,
  company: string,
  companyUrl?: string,
  start: string,           // "2023-06"
  end: string | "Present",
  description: string,     // 2-3 sentences
  tech: string[],
  order: number            // sort key (higher = newer)
}
```

**Projects** (`src/content/projects/*.md`)

```ts
{
  title: string,
  type: string,            // "Web Application", "SaaS Platform"
  description: string,
  tech: string[],
  repoUrl?: string,
  demoUrl?: string,
  featured: boolean,       // shown on /, all show on /projects
  order: number
}
```

The markdown body of each file is rendered when present (used for optional long-form case studies in a future iteration; not surfaced in v1).

**Blog** (`src/content/blog/*.mdx`)

```ts
{
  title: string,
  description: string,
  pubDate: Date,
  draft: boolean,          // hidden from index
  tags: string[]
}
```

### Tech stack data — `src/data/stack.ts`

Hand-edited TypeScript (not a content collection — structured, rarely changes):

```ts
export const stack = [
  { category: "Languages", items: [{ name: "TypeScript", icon: "..." }, ...] },
  { category: "Frontend", items: [...] },
  // Backend, Database, Cloud, Tools
];
```

Icons via `astro-icon` with `simple-icons` and `lucide` collections — no image files to manage.

### Resume

`public/resume.pdf` lives in the repo. Sidebar links to `/resume.pdf` (opens in new tab). If the file is missing at build time, the sidebar link is hidden (conditional render based on file existence, checked at build).

### Initial content seeding

- Migrate current `index.html` content into the new schema:
  - The 3 placeholder projects → `src/content/projects/*.md` with `featured: true`
  - About text → `src/pages/index.astro` (paragraphs are short enough to inline)
- Experience and Writing sections start **hidden** when their collections are empty. The components return `null` if the collection has no entries, so the sidebar nav item and on-page section are both omitted. Adding the first `.md` / `.mdx` file makes the section appear automatically — no code change needed.

## Deployment

### `.github/workflows/deploy.yml`

Runs on push to `main`. Steps:
1. Checkout
2. `oven-sh/setup-bun@v2`
3. `bun install --frozen-lockfile`
4. `bun run build`
5. Upload `dist/` as Pages artifact (`actions/upload-pages-artifact@v3`)
6. Deploy (`actions/deploy-pages@v4`)

`public/CNAME` (containing `minkhantkyaw.com`) is copied into the build output, preserving the custom domain.

**One-time manual step:** In repo settings, set Pages source to "GitHub Actions" (not "Branch").

### `astro.config.mjs`

- `site: "https://minkhantkyaw.com"`
- `base: "/"`
- `output: "static"`
- `integrations: [tailwind(), mdx(), icon()]`
- `<ClientRouter />` for View Transitions (in `Base.astro`)

### Local dev

```sh
bun install
bun run dev          # http://localhost:4321
bun run build && bun run preview
bun run astro check  # type-checks frontmatter + Astro components
```

## Risks

1. **GitHub Pages + Astro base path** — needs `site: "https://minkhantkyaw.com"` and `base: "/"` in `astro.config.mjs`. The `CNAME` file must be in `public/` so the build output preserves it. Mitigation: verify in CI build output before first deploy.
2. **One-time Pages source switch** — the repo's Pages settings need to flip from "Branch" to "GitHub Actions" before the new workflow can deploy. Mitigation: documented step in this spec; user does it once after the first PR merges.
3. **Easter egg scope** — Konami code + custom 404 art is two pieces. Both are in scope for v1; the 404 art is higher-leverage if either gets cut for time.

## Success criteria

- The home page renders the full long scroll on desktop with sticky sidebar, scroll-spy, and all seven interactive effects working.
- Adding a new project or blog post is a single file commit, no code edits needed.
- Site builds in CI and deploys to `minkhantkyaw.com` on push to `main`.
- Lighthouse scores: Performance ≥ 95, Accessibility ≥ 95, Best Practices = 100, SEO ≥ 95 (desktop).
- Site works on mobile Safari and Chrome — content readable, no broken layouts, no broken interactions (effects gracefully disabled where they don't make sense).
