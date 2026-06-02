# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `minkhantkyaw.com` from a single static `index.html` into a Brittany Chiang / Hein Soe-inspired Astro portfolio with a sticky-sidebar layout, content collections for projects/experience/blog, and seven signature interactive effects.

**Architecture:** Astro 5 (static output) + Tailwind v4 (via `@tailwindcss/vite` plugin, configured with the `@theme` directive in CSS) + Bun as package manager. Sticky-sidebar shell in `Base.astro` wraps every page. Client JS for spotlight, scroll-spy, entry animation, and Konami easter egg is hand-written vanilla TypeScript (~120 lines total). Content lives in `src/content/` (markdown with Zod-validated frontmatter) and renders into typed components. Deploys to GitHub Pages via Actions.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript, Bun, MDX (`@astrojs/mdx`), `astro-icon` (`simple-icons` + `lucide` collections), GitHub Pages, GitHub Actions.

**Reference spec:** [`docs/superpowers/specs/2026-05-15-portfolio-redesign-design.md`](../specs/2026-05-15-portfolio-redesign-design.md)

**Working assumptions:**
- Bun is installed on the dev machine (`bun --version` works).
- We are on branch `v1` (created in this session).
- The current site has only `index.html`, `CNAME`, `README.md`, `.gitignore`. We replace `index.html` with the Astro build; `CNAME` moves to `public/`.

**Verification model:** No test framework on day 1 (per spec). Each task ends with a verification step using `bun run astro check` (type/schema validation) and/or `bun run build` (full static build) and/or a manual dev-server smoke check at `http://localhost:4321`. Every task ends with a commit.

**Standing dev-server tip:** Once Task 1 completes, keep `bun run dev` running in a second terminal. Astro hot-reloads on save, so the manual smoke checks in later tasks are instant.

---

## Task 1: Scaffold the Astro project (manual init, preserve git history)

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/env.d.ts`, `public/CNAME`, `public/.gitkeep`
- Modify: `.gitignore`
- Delete: `index.html`, `CNAME` (from repo root — moved to `public/`)

- [ ] **Step 1: Move the CNAME file into the future `public/` location and delete the old `index.html`**

```bash
mkdir -p public src/pages
git mv CNAME public/CNAME
git rm index.html
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "minkhantkyaw-portfolio",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://minkhantkyaw.com',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 6: Write a placeholder `src/pages/index.astro` so the first dev-server run renders something**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Min Khant Kyaw — Software Engineer</title>
  </head>
  <body>
    <h1>Scaffolded. Replace me in later tasks.</h1>
  </body>
</html>
```

- [ ] **Step 7: Update `.gitignore` to cover Astro build output and Bun/Node artifacts**

Replace contents of `.gitignore` with:

```
# Astro
dist/
.astro/

# Dependencies
node_modules/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Bun
.bun/

# Env
.env
.env.local
.env.production

# OS
.DS_Store

# Brainstorm artifacts (already present)
.superpowers/
```

- [ ] **Step 8: Install dependencies and run the dev server once to confirm scaffold works**

```bash
bun install
bun run dev
```

Expected: `bun run dev` prints `http://localhost:4321`. Open it in a browser — you should see "Scaffolded. Replace me in later tasks." Stop the dev server with Ctrl-C.

- [ ] **Step 9: Verify the static build succeeds**

```bash
bun run build
```

Expected: build completes without errors. `dist/` is produced. `dist/CNAME` exists.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro 5 project with Bun, replace static index.html

Move CNAME to public/ so the static build preserves the custom domain.
Add Astro tsconfig + env, scripts wired to bun.
Placeholder home page; real layout follows."
```

---

## Task 2: Add Tailwind CSS v4, MDX, and astro-icon integrations

**Files:**
- Modify: `package.json`, `astro.config.mjs`
- Create: `src/styles/global.css`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro` (use Base layout)

- [ ] **Step 1: Add Tailwind via Astro's CLI (this installs `@tailwindcss/vite` and `tailwindcss@4`)**

```bash
bun astro add tailwind --yes
```

Expected: prints "Successfully installed `tailwind`". `astro.config.mjs` now imports and registers `tailwindcss/vite` as a Vite plugin. `package.json` has `@tailwindcss/vite` and `tailwindcss` in deps.

- [ ] **Step 2: Add MDX integration**

```bash
bun astro add mdx --yes
```

Expected: adds `@astrojs/mdx` to deps and registers the integration in `astro.config.mjs`.

- [ ] **Step 3: Add astro-icon and the icon collections**

```bash
bun add astro-icon
bun add -d @iconify-json/simple-icons @iconify-json/lucide
```

- [ ] **Step 4: Register astro-icon in `astro.config.mjs`**

Final `astro.config.mjs` should look like:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://minkhantkyaw.com',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [mdx(), icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 5: Create `src/styles/global.css` with the Tailwind import (tokens come in Task 3)**

```css
@import "tailwindcss";

/* tokens defined in Task 3 */

html, body {
  background-color: #0c0a09;
  color: #f5f5f4;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
}
```

- [ ] **Step 6: Create `src/layouts/Base.astro` as a minimal layout that imports the global stylesheet**

```astro
---
interface Props {
  title: string;
  description?: string;
}
const { title, description = "Software Engineer building modern digital products." } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import "../styles/global.css";
</style>
```

- [ ] **Step 7: Update `src/pages/index.astro` to use `Base.astro`**

```astro
---
import Base from "../layouts/Base.astro";
---
<Base title="Min Khant Kyaw — Software Engineer">
  <main class="p-8">
    <h1 class="text-4xl font-bold tracking-tight">Tailwind is wired up.</h1>
    <p class="mt-4 text-stone-400">Tokens and layout come next.</p>
  </main>
</Base>
```

- [ ] **Step 8: Verify the dev server still renders with Tailwind classes applying**

```bash
bun run dev
```

Open `http://localhost:4321`. The heading should be large and bold. The paragraph should be muted gray. Background should be the dark stone color (`#0c0a09`). Stop the server.

- [ ] **Step 9: Verify the build succeeds**

```bash
bun run build
```

Expected: no errors. `dist/index.html` contains compiled Tailwind classes.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind v4, MDX, and astro-icon integrations

Tailwind via @tailwindcss/vite plugin (Tailwind 4 — tokens in next task).
MDX ready for blog posts. astro-icon configured with simple-icons and
lucide collections for the stack grid."
```

---

## Task 3: Define design tokens via Tailwind `@theme` directive

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace the contents of `src/styles/global.css` with the full token set**

```css
@import "tailwindcss";

@theme {
  /* Colors — Stone + Amber palette */
  --color-bg: #0c0a09;
  --color-surface: #1c1917;
  --color-surface-2: #292524;
  --color-border: rgba(245, 245, 244, 0.08);
  --color-border-strong: rgba(245, 245, 244, 0.16);
  --color-text: #f5f5f4;
  --color-text-muted: #a8a29e;
  --color-text-dim: #78716c;
  --color-accent: #fb923c;
  --color-accent-soft: rgba(251, 146, 60, 0.1);
  --color-accent-glow: rgba(251, 146, 60, 0.15);

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;

  /* Motion */
  --ease-out-soft: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base resets */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

img, svg {
  display: block;
  max-width: 100%;
}

/* Focus state — amber outline */
:where(a, button, [tabindex]):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Display heading utility — clamped responsive size */
.h-display {
  font-size: clamp(48px, 8vw, 80px);
  line-height: 0.95;
  letter-spacing: -0.04em;
  font-weight: 800;
}

.h-2 {
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 700;
}

.h-3 {
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.eyebrow {
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-text-dim);
}

.body-lg {
  font-size: 18px;
  line-height: 1.6;
}
```

- [ ] **Step 2: Update the placeholder home page to use the tokens**

Replace `src/pages/index.astro` with:

```astro
---
import Base from "../layouts/Base.astro";
---
<Base title="Min Khant Kyaw — Software Engineer">
  <main class="max-w-screen-xl mx-auto px-12 py-24">
    <div class="eyebrow mb-3">Software Engineer</div>
    <h1 class="h-display">Tokens loaded.</h1>
    <p class="body-lg mt-6 text-text-muted max-w-2xl">
      Background uses <span class="text-accent">--color-bg</span> and accent uses
      <span class="text-accent">--color-accent</span>. Both come from <code class="text-accent">@theme</code>.
    </p>
  </main>
</Base>
```

- [ ] **Step 3: Verify the design tokens render in the browser**

```bash
bun run dev
```

Open `http://localhost:4321`. You should see:
- Dark warm stone background (not pure black — slight warmth).
- Eyebrow "SOFTWARE ENGINEER" in muted gray, all-caps, tight tracking.
- Huge "Tokens loaded." heading in white.
- Body paragraph in muted gray with two amber-colored spans.
- Inter font everywhere.

Stop the server.

- [ ] **Step 4: Verify type check + build**

```bash
bun run check
bun run build
```

Both should succeed.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/pages/index.astro
git commit -m "feat: define design tokens via Tailwind @theme directive

Stone + Amber palette, Inter typography, motion easing, reduced-motion
handling, and focus outline tokens. Display/h2/h3/eyebrow utilities
defined for use in section headings."
```

---

## Task 4: Build the Sidebar component (static — interactions come later)

**Files:**
- Create: `src/components/Sidebar.astro`
- Modify: `src/layouts/Base.astro` (insert Sidebar into the grid shell)
- Modify: `src/pages/index.astro` (drop the placeholder, use grid right column)

- [ ] **Step 1: Create `src/components/Sidebar.astro`**

```astro
---
interface NavItem { id: string; label: string; }

interface Props {
  /** Section anchors when on home. Empty array means "no in-page nav" (inner routes). */
  navItems?: NavItem[];
  /** Whether to show the "Available for work" status pill. */
  showStatus?: boolean;
}

const { navItems = [], showStatus = true } = Astro.props;
---

<aside class="lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-between py-12 lg:py-24">
  <div>
    <a href="/" class="block group">
      <h1 class="h-display">Min Khant<br />Kyaw</h1>
      <p class="mt-2 text-accent text-base font-medium">Software Engineer</p>
    </a>
    <p class="mt-6 text-text-muted max-w-xs">
      Building modern digital products with clean architecture and developer experience in mind.
    </p>

    {navItems.length > 0 && (
      <nav class="mt-16 hidden lg:block" aria-label="Section navigation">
        <ul class="space-y-3">
          {navItems.map((item) => (
            <li>
              <a
                href={`#${item.id}`}
                data-nav-link
                data-section={item.id}
                class="group inline-flex items-center gap-4 py-2"
              >
                <span class="nav-indicator inline-block h-px bg-text-dim transition-all duration-200 ease-out group-hover:bg-accent" />
                <span class="text-text-dim text-xs uppercase tracking-[0.16em] font-semibold transition-colors duration-200 group-hover:text-text">
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    )}
  </div>

  <div class="mt-12 lg:mt-0">
    {showStatus && (
      <div class="flex items-center gap-2 mb-4">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </span>
        <span class="text-xs text-text-muted">Available for work</span>
      </div>
    )}
    <div class="flex items-center gap-5 text-text-muted">
      <a href="https://github.com/mink-a" aria-label="GitHub" class="hover:text-text transition-colors">GH</a>
      <a href="https://www.linkedin.com/" aria-label="LinkedIn" class="hover:text-text transition-colors">LI</a>
      <a href="https://x.com/" aria-label="X" class="hover:text-text transition-colors">X</a>
      <a href="mailto:hello@minkhantkyaw.com" aria-label="Email" class="hover:text-text transition-colors">@</a>
    </div>
    <a
      href="/resume.pdf"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 mt-6 text-xs uppercase tracking-[0.16em] font-semibold text-text hover:text-accent transition-colors"
    >
      Resume <span aria-hidden="true">→</span>
    </a>
  </div>
</aside>

<style>
  .nav-indicator {
    width: 24px;
  }
  [data-nav-link][data-active="true"] .nav-indicator,
  [data-nav-link]:hover .nav-indicator {
    width: 64px;
    background-color: var(--color-accent);
  }
  [data-nav-link][data-active="true"] span:last-child {
    color: var(--color-text);
  }
</style>
```

> Note: Replace the social link URLs with the user's real ones during initial content seeding. They're placeholders here.

- [ ] **Step 2: Modify `src/layouts/Base.astro` to render the grid shell with the Sidebar slot**

Replace the body of `src/layouts/Base.astro` with:

```astro
---
import Sidebar from "../components/Sidebar.astro";

interface NavItem { id: string; label: string; }

interface Props {
  title: string;
  description?: string;
  navItems?: NavItem[];
}

const { title, description = "Software Engineer building modern digital products.", navItems = [] } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-accent focus:text-bg focus:px-4 focus:py-2 focus:rounded-md focus:z-50">
      Skip to content
    </a>
    <div class="max-w-screen-xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[minmax(0,380px)_minmax(0,720px)] gap-16">
      <Sidebar navItems={navItems} />
      <main id="main" class="py-12 lg:py-24">
        <slot />
      </main>
    </div>
  </body>
</html>

<style is:global>
  @import "../styles/global.css";
</style>
```

- [ ] **Step 3: Simplify `src/pages/index.astro` to use the new grid shell**

```astro
---
import Base from "../layouts/Base.astro";

const navItems = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];
---
<Base title="Min Khant Kyaw — Software Engineer" navItems={navItems}>
  <section id="about" class="min-h-screen">
    <p class="eyebrow mb-4">About</p>
    <p class="text-text-muted body-lg">
      Sections will be filled in over the next several tasks. The sidebar is now sticky on the
      left, with hover-animated nav indicators.
    </p>
  </section>
  <section id="experience" class="min-h-screen">
    <p class="eyebrow mb-4">Experience</p>
  </section>
  <section id="projects" class="min-h-screen">
    <p class="eyebrow mb-4">Projects</p>
  </section>
  <section id="contact" class="min-h-screen">
    <p class="eyebrow mb-4">Contact</p>
  </section>
</Base>
```

- [ ] **Step 4: Smoke check the layout in the dev server**

```bash
bun run dev
```

At `http://localhost:4321`:
- Sidebar on the left is sticky (scroll the right side — sidebar stays).
- Name + tagline at top of sidebar; status pill + social links + resume link at bottom.
- Hovering "About", "Experience", "Projects", "Contact" nav links: the small line grows from 24px to 64px and turns amber.
- On a narrow viewport (DevTools mobile preview): sidebar stacks above content, nav links hide (`hidden lg:block`).

Stop the server.

- [ ] **Step 5: Verify build + type check**

```bash
bun run build
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: sticky sidebar shell with animated nav indicators

Sidebar holds identity, in-page nav with growing-line indicators, status
pill, social links, and resume CTA. Base layout wraps every route in a
12-col grid; sidebar collapses to a stacked header on tablet/mobile."
```

---

## Task 5: Add the mouse spotlight effect

**Files:**
- Create: `src/components/Spotlight.astro`
- Modify: `src/layouts/Base.astro` (mount the spotlight)

- [ ] **Step 1: Create `src/components/Spotlight.astro`**

```astro
---
---
<div id="spotlight" aria-hidden="true"></div>

<style>
  #spotlight {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(
      600px circle at var(--mx, 50%) var(--my, 50%),
      var(--color-accent-glow),
      transparent 40%
    );
    transition: background 200ms ease;
  }

  /* Konami code easter-egg flair */
  body[data-konami] #spotlight {
    background: radial-gradient(
      600px circle at var(--mx, 50%) var(--my, 50%),
      rgba(251, 146, 60, 0.25),
      rgba(167, 139, 250, 0.2) 25%,
      rgba(94, 234, 212, 0.15) 50%,
      transparent 60%
    );
  }

  /* Disable on touch devices and when reduced motion is preferred */
  @media (hover: none), (prefers-reduced-motion: reduce) {
    #spotlight {
      display: none;
    }
  }
</style>

<script>
  const el = document.getElementById("spotlight");
  if (el && window.matchMedia("(hover: hover)").matches) {
    let pending = false;
    let mx = 0, my = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          el.style.setProperty("--mx", `${mx}px`);
          el.style.setProperty("--my", `${my}px`);
          pending = false;
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
  }
</script>
```

- [ ] **Step 2: Mount the Spotlight in `src/layouts/Base.astro` and add the `js`-class inline script**

The inline `is:inline` script flips `<html class="js">` before CSS evaluates. The `.fade-in-up` entry animation in Task 10 gates on this class so JS-less / pre-hydration users never see invisible content.

```astro
---
import Sidebar from "../components/Sidebar.astro";
import Spotlight from "../components/Spotlight.astro";

interface NavItem { id: string; label: string; }
interface Props {
  title: string;
  description?: string;
  navItems?: NavItem[];
}

const { title, description = "Software Engineer building modern digital products.", navItems = [] } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <script is:inline>document.documentElement.classList.add('js');</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
  </head>
  <body class="relative">
    <Spotlight />
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-accent focus:text-bg focus:px-4 focus:py-2 focus:rounded-md focus:z-50">
      Skip to content
    </a>
    <div class="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[minmax(0,380px)_minmax(0,720px)] gap-16">
      <Sidebar navItems={navItems} />
      <main id="main" class="py-12 lg:py-24">
        <slot />
      </main>
    </div>
  </body>
</html>

<style is:global>
  @import "../styles/global.css";
</style>
```

- [ ] **Step 3: Smoke check in the dev server**

```bash
bun run dev
```

Move your mouse around the home page. You should see a soft amber glow following your cursor. On touch devices or with `prefers-reduced-motion: reduce` (try DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion`), the spotlight should not render.

Stop the server.

- [ ] **Step 4: Verify build**

```bash
bun run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Spotlight.astro src/layouts/Base.astro
git commit -m "feat: mouse spotlight with reduced-motion + touch fallbacks

Fixed full-viewport radial-gradient layer that follows the cursor via
rAF-throttled CSS custom properties. Hidden on touch devices and when
prefers-reduced-motion is set. Konami easter-egg branch builds in here
via a body[data-konami] selector for later wiring."
```

---

## Task 6: Define content collections (experience, projects, blog)

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/experience/.gitkeep`, `src/content/projects/.gitkeep`, `src/content/blog/.gitkeep`

- [ ] **Step 1: Create `src/content/config.ts`**

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    companyUrl: z.string().url().optional(),
    start: z.string(),                               // "2023-06"
    end: z.union([z.string(), z.literal("Present")]),
    description: z.string(),
    tech: z.array(z.string()),
    order: z.number(),                               // higher = newer
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),                                // "SaaS Platform", "Web App"
    description: z.string(),
    tech: z.array(z.string()),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { experience, projects, blog };
```

- [ ] **Step 2: Create empty content directories so the loaders don't error**

```bash
mkdir -p src/content/experience src/content/projects src/content/blog
touch src/content/experience/.gitkeep src/content/projects/.gitkeep src/content/blog/.gitkeep
```

- [ ] **Step 3: Verify Astro recognizes the collections**

```bash
bun run check
```

Expected: passes. (You'll see `.astro/content.d.ts` regenerate.)

- [ ] **Step 4: Commit**

```bash
git add src/content/
git commit -m "feat: content collections (experience, projects, blog)

Zod-validated frontmatter for each collection. Markdown bodies are
implicit and used in v1.1 when project case studies expand."
```

---

## Task 7: Seed initial content (3 projects migrated from old index.html)

**Files:**
- Create: `src/content/projects/realtime-platform.md`
- Create: `src/content/projects/developer-infrastructure.md`
- Create: `src/content/projects/modern-commerce.md`

- [ ] **Step 1: Write `src/content/projects/realtime-platform.md`**

```markdown
---
title: Realtime Platform
type: Full-stack SaaS Platform
description: High-performance realtime application with scalable APIs, authentication, websocket infrastructure, and optimized frontend rendering.
tech: ["Next.js", "Hono", "PostgreSQL", "Redis"]
featured: true
order: 30
---
```

- [ ] **Step 2: Write `src/content/projects/developer-infrastructure.md`**

```markdown
---
title: Developer Infrastructure
type: Internal Engineering Tooling
description: Built internal tooling and reusable systems improving deployment workflows, observability, and frontend productivity.
tech: ["TypeScript", "Docker", "Bun", "CI/CD"]
featured: true
order: 20
---
```

- [ ] **Step 3: Write `src/content/projects/modern-commerce.md`**

```markdown
---
title: Modern Commerce Experience
type: Web Application
description: Fast and responsive commerce experience focused on accessibility, SEO performance, clean UI systems, and scalable architecture.
tech: ["React", "Prisma", "TailwindCSS", "Vercel"]
featured: true
order: 10
---
```

- [ ] **Step 4: Verify frontmatter validates**

```bash
bun run check
```

Expected: passes. Astro will type-check these against the zod schemas from Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/content/projects/
git commit -m "feat: seed three featured projects from the old index.html

These are the same placeholder entries from the previous site, now
schema-validated and consumable via getCollection."
```

---

## Task 8: Build the tech stack data + `StackGrid` component

**Files:**
- Create: `src/data/stack.ts`
- Create: `src/components/StackGrid.astro`

- [ ] **Step 1: Create `src/data/stack.ts`**

```ts
export interface StackItem {
  name: string;
  /** astro-icon name, e.g. "simple-icons:typescript" or "lucide:server" */
  icon: string;
}

export interface StackCategory {
  category: string;
  items: StackItem[];
}

export const stack: StackCategory[] = [
  {
    category: "Languages",
    items: [
      { name: "TypeScript", icon: "simple-icons:typescript" },
      { name: "JavaScript", icon: "simple-icons:javascript" },
    ],
  },
  {
    category: "Frontend",
    items: [
      { name: "React", icon: "simple-icons:react" },
      { name: "Next.js", icon: "simple-icons:nextdotjs" },
      { name: "Astro", icon: "simple-icons:astro" },
      { name: "Tailwind CSS", icon: "simple-icons:tailwindcss" },
      { name: "Shadcn UI", icon: "simple-icons:shadcnui" },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Bun", icon: "simple-icons:bun" },
      { name: "Hono", icon: "simple-icons:hono" },
      { name: "Node.js", icon: "simple-icons:nodedotjs" },
    ],
  },
  {
    category: "Database & ORM",
    items: [
      { name: "PostgreSQL", icon: "simple-icons:postgresql" },
      { name: "Redis", icon: "simple-icons:redis" },
      { name: "Prisma", icon: "simple-icons:prisma" },
    ],
  },
  {
    category: "Cloud & Tools",
    items: [
      { name: "Docker", icon: "simple-icons:docker" },
      { name: "GitHub Actions", icon: "simple-icons:githubactions" },
      { name: "Vercel", icon: "simple-icons:vercel" },
    ],
  },
];
```

- [ ] **Step 2: Create `src/components/StackGrid.astro`**

```astro
---
import { Icon } from "astro-icon/components";
import { stack } from "../data/stack";
---
<div class="space-y-12">
  {stack.map((group) => (
    <div>
      <h3 class="eyebrow mb-5">{group.category}</h3>
      <ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {group.items.map((item) => (
          <li
            class="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-surface hover:border-border-strong hover:bg-surface-2 transition-colors"
          >
            <Icon name={item.icon} class="w-5 h-5 text-text-muted" aria-hidden="true" />
            <span class="text-sm text-text">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Smoke check by temporarily importing `StackGrid` into `src/pages/index.astro` and viewing it**

Add this to the `experience` section block in `src/pages/index.astro` temporarily:

```astro
---
import Base from "../layouts/Base.astro";
import StackGrid from "../components/StackGrid.astro";
// ... rest of existing frontmatter
---
```

And inside the `<section id="experience">`:

```astro
<StackGrid />
```

```bash
bun run dev
```

Open `http://localhost:4321`. Scroll to the Experience section — you should see the stack grid with icons. If an icon is missing it'll render as a tiny dot. Check the console for any "icon not found" warnings; fix the icon names in `stack.ts` if so.

- [ ] **Step 4: Remove the temporary import / render from `index.astro`** — we'll wire it into `/stack` in Task 18. Revert `index.astro` so the experience section is empty again.

- [ ] **Step 5: Verify build**

```bash
bun run build
```

- [ ] **Step 6: Commit**

```bash
git add src/data/stack.ts src/components/StackGrid.astro
git commit -m "feat: tech stack data + StackGrid component

Categorized icon grid using astro-icon (simple-icons). Used on /stack
in Task 18; can also be embedded inline elsewhere if desired."
```

---

## Task 9: Build `SectionHeading` and `Tag` primitives

**Files:**
- Create: `src/components/SectionHeading.astro`, `src/components/Tag.astro`

- [ ] **Step 1: Create `src/components/SectionHeading.astro`**

```astro
---
interface Props {
  eyebrow: string;
  heading: string;
  id?: string;
}
const { eyebrow, heading, id } = Astro.props;
---
<header class="mb-10 fade-in-up" id={id}>
  <p class="eyebrow mb-3">{eyebrow}</p>
  <h2 class="h-2">{heading}</h2>
</header>
```

- [ ] **Step 2: Create `src/components/Tag.astro`**

```astro
---
interface Props {
  label: string;
}
const { label } = Astro.props;
---
<span class="inline-flex items-center px-3 py-1 text-xs rounded-full bg-accent-soft text-accent border border-transparent">
  {label}
</span>
```

- [ ] **Step 3: Verify type check**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SectionHeading.astro src/components/Tag.astro
git commit -m "feat: SectionHeading + Tag primitives

Both used across home and inner routes. SectionHeading is also where
the fade-in-up scroll animation hook is applied per section."
```

---

## Task 10: Build `ExperienceList` and `ExperienceCard` with hover-dim

**Files:**
- Create: `src/components/ExperienceList.astro`, `src/components/ExperienceCard.astro`
- Modify: `src/styles/global.css` (add `.hover-dim-*` rules)

- [ ] **Step 1: Add the `.hover-dim-*` CSS to `src/styles/global.css` (append at the end of the file)**

The `.fade-in-up` initial-hidden state is gated on `html.js` so users without JS — or anyone briefly before the entry-anim script attaches — see content normally. The script in Task 14 adds `.is-visible` to flip the state.

```css
/* Hover-dim siblings — pure CSS */
.hover-dim-group .hover-dim-item {
  transition: opacity 200ms ease;
}
@media (hover: hover) {
  .hover-dim-group:hover .hover-dim-item {
    opacity: 0.4;
  }
  .hover-dim-group .hover-dim-item:hover {
    opacity: 1;
  }
}

/* Entry animation — set by IntersectionObserver in Task 14 */
html.js .fade-in-up {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}
html.js .fade-in-up.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  html.js .fade-in-up {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Create `src/components/ExperienceCard.astro`**

```astro
---
import Tag from "./Tag.astro";

interface Props {
  role: string;
  company: string;
  companyUrl?: string;
  start: string;
  end: string;
  description: string;
  tech: string[];
}
const { role, company, companyUrl, start, end, description, tech } = Astro.props;

function formatRange(s: string, e: string) {
  return `${s} — ${e}`;
}
---
<article class="hover-dim-item group grid md:grid-cols-[140px_1fr] gap-4 p-4 -mx-4 rounded-md border border-transparent hover:border-border-strong hover:bg-surface/50 transition-colors">
  <p class="text-xs uppercase tracking-[0.16em] font-semibold text-text-dim pt-1">
    {formatRange(start, end)}
  </p>
  <div>
    <h3 class="h-3 text-text group-hover:text-accent transition-colors">
      {role}
      <span class="text-text-muted"> · </span>
      {companyUrl ? (
        <a href={companyUrl} target="_blank" rel="noopener" class="hover:text-accent">{company}</a>
      ) : (
        <span>{company}</span>
      )}
    </h3>
    <p class="mt-2 text-text-muted">{description}</p>
    <ul class="mt-3 flex flex-wrap gap-2">
      {tech.map((t) => <li><Tag label={t} /></li>)}
    </ul>
  </div>
</article>
```

- [ ] **Step 3: Create `src/components/ExperienceList.astro`**

```astro
---
import { getCollection } from "astro:content";
import ExperienceCard from "./ExperienceCard.astro";

const entries = (await getCollection("experience")).sort(
  (a, b) => b.data.order - a.data.order
);
---
{entries.length > 0 && (
  <ol class="hover-dim-group space-y-6">
    {entries.map((entry) => (
      <li>
        <ExperienceCard
          role={entry.data.role}
          company={entry.data.company}
          companyUrl={entry.data.companyUrl}
          start={entry.data.start}
          end={String(entry.data.end)}
          description={entry.data.description}
          tech={entry.data.tech}
        />
      </li>
    ))}
  </ol>
)}
```

- [ ] **Step 4: Seed one placeholder experience entry to verify the component renders**

Create `src/content/experience/01-placeholder.md`:

```markdown
---
role: Software Engineer
company: Independent
start: "2024-01"
end: "Present"
description: Building production web applications with focus on performance, maintainability, and developer experience. Replace this entry with real work history.
tech: ["TypeScript", "Next.js", "Bun", "Hono", "PostgreSQL"]
order: 100
---
```

> Note to the user: this is intentionally a placeholder. Replace or expand with real role history when you have time. The Experience section auto-hides if this file is deleted (see ExperienceList logic).

- [ ] **Step 5: Verify component renders by viewing the home page**

```bash
bun run dev
```

You won't see the experience section yet (we wire it into `index.astro` in Task 13). For now, verify there are no type errors:

```bash
bun run check
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: ExperienceList + ExperienceCard with hover-dim siblings

CSS-only hover-dim (siblings fade to 0.4, hovered card to 1.0) gated to
(hover: hover). Cards render date range, role · company, description,
and tech tags. Seeded one placeholder entry for verification."
```

---

## Task 11: Build `ProjectList` and `ProjectCard`

**Files:**
- Create: `src/components/ProjectList.astro`, `src/components/ProjectCard.astro`

- [ ] **Step 1: Create `src/components/ProjectCard.astro`**

```astro
---
import Tag from "./Tag.astro";

interface Props {
  title: string;
  type: string;
  description: string;
  tech: string[];
  repoUrl?: string;
  demoUrl?: string;
}
const { title, type, description, tech, repoUrl, demoUrl } = Astro.props;
---
<article class="hover-dim-item group grid md:grid-cols-[140px_1fr] gap-4 p-4 -mx-4 rounded-md border border-transparent hover:border-border-strong hover:bg-surface/50 transition-colors">
  <p class="text-xs uppercase tracking-[0.16em] font-semibold text-text-dim pt-1">{type}</p>
  <div>
    <h3 class="h-3 text-text group-hover:text-accent transition-colors flex items-center gap-3">
      <span>{title}</span>
      {demoUrl && (
        <a href={demoUrl} target="_blank" rel="noopener" class="text-text-muted hover:text-accent text-base" aria-label={`${title} demo`}>↗</a>
      )}
      {repoUrl && (
        <a href={repoUrl} target="_blank" rel="noopener" class="text-text-muted hover:text-accent text-base" aria-label={`${title} repository`}>{`{ }`}</a>
      )}
    </h3>
    <p class="mt-2 text-text-muted">{description}</p>
    <ul class="mt-3 flex flex-wrap gap-2">
      {tech.map((t) => <li><Tag label={t} /></li>)}
    </ul>
  </div>
</article>
```

- [ ] **Step 2: Create `src/components/ProjectList.astro`**

```astro
---
import { getCollection } from "astro:content";
import ProjectCard from "./ProjectCard.astro";

interface Props {
  /** When true, only render featured projects. */
  featuredOnly?: boolean;
}
const { featuredOnly = false } = Astro.props;

let entries = await getCollection("projects");
if (featuredOnly) {
  entries = entries.filter((e) => e.data.featured);
}
entries.sort((a, b) => b.data.order - a.data.order);
---
{entries.length > 0 && (
  <ol class="hover-dim-group space-y-6">
    {entries.map((entry) => (
      <li>
        <ProjectCard
          title={entry.data.title}
          type={entry.data.type}
          description={entry.data.description}
          tech={entry.data.tech}
          repoUrl={entry.data.repoUrl}
          demoUrl={entry.data.demoUrl}
        />
      </li>
    ))}
  </ol>
)}
```

- [ ] **Step 3: Verify type check**

```bash
bun run check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectList.astro src/components/ProjectCard.astro
git commit -m "feat: ProjectList + ProjectCard

ProjectList accepts featuredOnly for the home page vs full /projects.
Cards mirror ExperienceCard's hover-dim and column layout."
```

---

## Task 12: Build `BlogList` component

**Files:**
- Create: `src/components/BlogList.astro`

- [ ] **Step 1: Create `src/components/BlogList.astro`**

```astro
---
import { getCollection } from "astro:content";

interface Props {
  limit?: number;
}
const { limit } = Astro.props;

let entries = (await getCollection("blog")).filter((e) => !e.data.draft);
entries.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
if (limit) entries = entries.slice(0, limit);

const formatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });
---
{entries.length > 0 ? (
  <ol class="hover-dim-group space-y-6">
    {entries.map((entry) => (
      <li>
        <a
          href={`/blog/${entry.id}`}
          class="hover-dim-item group block p-4 -mx-4 rounded-md border border-transparent hover:border-border-strong hover:bg-surface/50 transition-colors"
        >
          <p class="text-xs uppercase tracking-[0.16em] font-semibold text-text-dim mb-2">
            {formatter.format(entry.data.pubDate)}
          </p>
          <h3 class="h-3 text-text group-hover:text-accent transition-colors">
            {entry.data.title}
          </h3>
          <p class="mt-2 text-text-muted">{entry.data.description}</p>
        </a>
      </li>
    ))}
  </ol>
) : (
  <p class="text-text-muted">No posts yet — first one coming soon.</p>
)}
```

- [ ] **Step 2: Verify type check**

```bash
bun run check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BlogList.astro
git commit -m "feat: BlogList component

Renders the most recent posts as a hover-dim list. Empty state shows
a 'coming soon' line so the section never looks broken in v1."
```

---

## Task 13: Wire up the home page (`/`) with all sections

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro` with the full home composition**

```astro
---
import Base from "../layouts/Base.astro";
import SectionHeading from "../components/SectionHeading.astro";
import ExperienceList from "../components/ExperienceList.astro";
import ProjectList from "../components/ProjectList.astro";
import { getCollection } from "astro:content";

const experience = await getCollection("experience");
const hasExperience = experience.length > 0;

const navItems = [
  { id: "about", label: "About" },
  ...(hasExperience ? [{ id: "experience", label: "Experience" }] : []),
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];
---
<Base title="Min Khant Kyaw — Software Engineer" navItems={navItems}>
  <section id="about" class="mb-24 fade-in-up">
    <p class="body-lg text-text-muted">
      I design and develop performant applications with a strong focus on maintainability, user
      experience, and scalable architecture. Experienced across frontend, backend, database
      design, APIs, authentication systems, and cloud-native development.
    </p>
    <p class="body-lg text-text-muted mt-4">
      Currently focused on modern TypeScript ecosystems and full-stack systems — Astro, Next.js,
      Bun, Hono, PostgreSQL.
    </p>
  </section>

  {hasExperience && (
    <section id="experience" class="mb-24">
      <SectionHeading eyebrow="Experience" heading="Where I've worked." />
      <ExperienceList />
      <a
        href="/resume.pdf"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-text hover:text-accent transition-colors group"
      >
        View Full Resume
        <span aria-hidden="true" class="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </section>
  )}

  <section id="projects" class="mb-24">
    <SectionHeading eyebrow="Selected Work" heading="Featured projects." />
    <ProjectList featuredOnly />
    <a
      href="/projects"
      class="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-text hover:text-accent transition-colors group"
    >
      View All Projects
      <span aria-hidden="true" class="transition-transform group-hover:translate-x-1">→</span>
    </a>
  </section>

  <section id="contact" class="mb-24 fade-in-up">
    <SectionHeading eyebrow="What's Next" heading="Open for ambitious work." />
    <p class="body-lg text-text-muted max-w-xl">
      Available for software engineering, product development, and system architecture
      collaborations. The fastest way to reach me is email.
    </p>
    <a
      href="mailto:hello@minkhantkyaw.com"
      class="inline-flex items-center gap-3 mt-8 px-6 py-3 rounded-full bg-accent text-bg font-semibold hover:bg-accent/90 transition-colors"
    >
      Say hello
      <span aria-hidden="true">→</span>
    </a>
  </section>
</Base>
```

- [ ] **Step 2: Smoke check the full home page**

```bash
bun run dev
```

At `http://localhost:4321`:
- About section copy
- Experience section with one placeholder card (hover dims would activate in Task 14 — for now hover-dim works because the CSS is already loaded from Task 10)
- Featured projects (three cards from Task 7)
- Contact CTA
- Sidebar shows: About, Experience, Projects, Contact (4 items)

Hover a project card — the other two dim to 40%. Same for the experience card (only one, so just the hover style on it).

- [ ] **Step 3: Verify build**

```bash
bun run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: wire up the full home page composition

About + Experience (if collection non-empty) + Featured Projects +
Contact CTA. Sidebar nav items conditionally include Experience based
on whether the collection has any entries."
```

---

## Task 14: Add scroll-spy script and entry animations

**Files:**
- Create: `src/scripts/scroll-spy.ts`, `src/scripts/entry-anim.ts`
- Modify: `src/pages/index.astro` (include the scripts)

- [ ] **Step 1: Create `src/scripts/scroll-spy.ts`**

The script listens to `astro:page-load` so it re-binds after Astro View Transitions (Task 15). Each call disconnects any previous observer to prevent leaks across navigations.

```ts
let currentObserver: IntersectionObserver | null = null;

function initScrollSpy() {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }

  const sections = document.querySelectorAll<HTMLElement>("main section[id]");
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]");
  if (sections.length === 0 || links.length === 0) return;

  const setActive = (id: string | null) => {
    links.forEach((link) => {
      const isActive = link.dataset.section === id;
      link.dataset.active = String(isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  currentObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
      if (visible.length > 0) {
        const id = (visible[0].target as HTMLElement).id;
        setActive(id);
      }
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((s) => currentObserver!.observe(s));
}

document.addEventListener("astro:page-load", initScrollSpy);
```

- [ ] **Step 2: Create `src/scripts/entry-anim.ts`**

Also re-binds on `astro:page-load` so animations fire on view-transition navigations.

```ts
function initEntryAnim() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".fade-in-up").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll<HTMLElement>(".fade-in-up:not(.is-visible)").forEach((el) => observer.observe(el));
}

document.addEventListener("astro:page-load", initEntryAnim);
```

- [ ] **Step 3: Load both scripts globally from `src/layouts/Base.astro` (not just on home)**

The entry-anim runs on every route since `SectionHeading` uses `.fade-in-up` everywhere. The scroll-spy is a no-op on routes without `main section[id]` (early-returns), so it's safe to load globally too.

Add to `src/layouts/Base.astro`, anywhere outside the layout markup (Astro hoists `<script>` tags):

```astro
<script>
  import "../scripts/scroll-spy";
  import "../scripts/entry-anim";
</script>
```

- [ ] **Step 4: Smoke check**

```bash
bun run dev
```

Open `http://localhost:4321`:
- As you scroll past About → Experience → Projects → Contact, the sidebar nav indicator (the growing line) and label color follow your position. The current section gets the long amber line.
- Each section's heading and content fades+slides up gently as it enters the viewport.
- With `prefers-reduced-motion: reduce` toggled in DevTools, the fade is instant (no transform animation).

- [ ] **Step 5: Verify build**

```bash
bun run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scroll-spy + entry animations

IntersectionObserver-based scroll spy highlights the active section in
the sidebar nav with aria-current and the growing-line indicator.
Entry animation is a one-shot fade+slide-up per element. Reduced-motion
preference fully respected — both effects degrade gracefully."
```

---

## Task 15: Add Astro View Transitions for inner-route navigation

**Files:**
- Modify: `src/layouts/Base.astro`
- Modify: `src/components/Sidebar.astro` (mark for transition persistence)

- [ ] **Step 1: Import and mount `<ClientRouter />` in `Base.astro`**

Add this import at the top of `src/layouts/Base.astro` frontmatter:

```ts
import { ClientRouter } from "astro:transitions";
```

And inside `<head>`, before the `</head>` tag:

```astro
<ClientRouter />
```

- [ ] **Step 2: Skip `transition:persist` on the sidebar**

The sidebar's `navItems` differ between home and inner routes (home has section anchors, inner routes have none). Persisting the sidebar across navigations would freeze stale nav items on inner pages. We let it re-render and rely on the default cross-fade for visual smoothness — the scroll-spy / entry-anim scripts re-bind on `astro:page-load`, so they pick up the new DOM correctly.

No code change needed for this step — just don't add `transition:persist`.

- [ ] **Step 3: Smoke check (need at least one inner route first)**

We don't have `/projects` yet — that's Task 16. Skip the live smoke check for now and just verify the build:

```bash
bun run build
```

Expected: no errors. The build output should now include the View Transitions client script (a few KB).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: enable Astro View Transitions

ClientRouter in <head> opts the whole site into cross-fade page
navigations. Sidebar wrapper uses transition:persist so it survives
route changes without re-rendering — keeps scroll-spy/spotlight stable."
```

---

## Task 16: Build the `/projects` page (full project grid)

**Files:**
- Create: `src/pages/projects.astro`

- [ ] **Step 1: Create `src/pages/projects.astro`**

```astro
---
import Base from "../layouts/Base.astro";
import SectionHeading from "../components/SectionHeading.astro";
import ProjectList from "../components/ProjectList.astro";
---
<Base
  title="Projects — Min Khant Kyaw"
  description="Selected work and side projects by Min Khant Kyaw."
>
  <SectionHeading eyebrow="All Projects" heading="Things I've built." />
  <ProjectList />
  <a
    href="/"
    class="inline-flex items-center gap-2 mt-12 text-sm font-semibold text-text hover:text-accent transition-colors group"
  >
    <span aria-hidden="true" class="transition-transform group-hover:-translate-x-1">←</span>
    Back home
  </a>
</Base>
```

- [ ] **Step 2: Smoke check**

```bash
bun run dev
```

Navigate to `http://localhost:4321/projects` — you should see all three projects (`featuredOnly` is not passed, so all are shown). Click "Back home" — view transition should cross-fade you back.

- [ ] **Step 3: Verify build**

```bash
bun run build
```

Expected: `dist/projects/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: /projects page lists all projects (not just featured)"
```

---

## Task 17: Build the `/stack` page

**Files:**
- Create: `src/pages/stack.astro`

- [ ] **Step 1: Create `src/pages/stack.astro`**

```astro
---
import Base from "../layouts/Base.astro";
import SectionHeading from "../components/SectionHeading.astro";
import StackGrid from "../components/StackGrid.astro";
---
<Base title="Stack — Min Khant Kyaw" description="The technologies I use day-to-day.">
  <SectionHeading eyebrow="Stack" heading="Tools I work with." />
  <StackGrid />
  <a
    href="/"
    class="inline-flex items-center gap-2 mt-12 text-sm font-semibold text-text hover:text-accent transition-colors group"
  >
    <span aria-hidden="true" class="transition-transform group-hover:-translate-x-1">←</span>
    Back home
  </a>
</Base>
```

- [ ] **Step 2: Smoke check at `http://localhost:4321/stack`**

```bash
bun run dev
```

You should see the categorized icon grid. Each row in a category renders as a small bordered tile with an icon + name.

- [ ] **Step 3: Verify build**

```bash
bun run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/stack.astro
git commit -m "feat: /stack page renders the full tech grid"
```

---

## Task 18: Build the `/blog` index page

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Create `src/pages/blog/index.astro`**

```astro
---
import Base from "../../layouts/Base.astro";
import SectionHeading from "../../components/SectionHeading.astro";
import BlogList from "../../components/BlogList.astro";
---
<Base
  title="Writing — Min Khant Kyaw"
  description="Notes and articles on software engineering by Min Khant Kyaw."
>
  <SectionHeading eyebrow="Writing" heading="Notes and articles." />
  <BlogList />
  <a
    href="/"
    class="inline-flex items-center gap-2 mt-12 text-sm font-semibold text-text hover:text-accent transition-colors group"
  >
    <span aria-hidden="true" class="transition-transform group-hover:-translate-x-1">←</span>
    Back home
  </a>
</Base>
```

- [ ] **Step 2: Smoke check at `http://localhost:4321/blog`**

You should see the "No posts yet — first one coming soon." empty state.

- [ ] **Step 3: Verify build**

```bash
bun run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: /blog index page with empty-state fallback"
```

---

## Task 19: Build the `/blog/[...slug]` post page

**Files:**
- Create: `src/pages/blog/[...slug].astro`
- Create: `src/content/blog/2026-05-15-hello-world.mdx` (seed post so the route can be exercised)

- [ ] **Step 1: Create `src/pages/blog/[...slug].astro`**

```astro
---
import Base from "../../layouts/Base.astro";
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog", (p) => !p.data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);

const formatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });
---
<Base title={`${post.data.title} — Min Khant Kyaw`} description={post.data.description}>
  <article class="prose-stone max-w-none">
    <p class="text-xs uppercase tracking-[0.16em] font-semibold text-text-dim mb-3">
      {formatter.format(post.data.pubDate)}
    </p>
    <h1 class="h-2 mb-6">{post.data.title}</h1>
    <p class="body-lg text-text-muted mb-10">{post.data.description}</p>
    <div class="text-text-muted leading-relaxed space-y-5 [&_a]:text-accent [&_a:hover]:underline [&_h2]:h-3 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-text [&_h3]:text-text [&_h3]:mt-8 [&_h3]:mb-2 [&_code]:text-accent [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
      <Content />
    </div>
  </article>
  <a
    href="/blog"
    class="inline-flex items-center gap-2 mt-16 text-sm font-semibold text-text hover:text-accent transition-colors group"
  >
    <span aria-hidden="true" class="transition-transform group-hover:-translate-x-1">←</span>
    Back to all writing
  </a>
</Base>
```

- [ ] **Step 2: Seed a first blog post so the route renders**

Create `src/content/blog/2026-05-15-hello-world.mdx`:

```mdx
---
title: Hello, world
description: Kicking off the new site with a brief note about why I rebuilt it.
pubDate: 2026-05-15
draft: false
tags: ["meta"]
---

This is the first post on the redesigned site.

The previous version was a single static `index.html` — fine for getting something online, painful for adding anything beyond it. This one is built on Astro, so each post is just a markdown file and the rest of the site stays out of the way.

## What changed

- Sticky-sidebar layout inspired by [Brittany Chiang](https://brittanychiang.com)
- Categorized tech stack page inspired by [Hein Soe](https://www.heinsoe.com)
- A stone + amber palette so it doesn't look like every other dev portfolio
- All the interactive niceties: spotlight cursor, hover-dim cards, scroll-spy, view transitions

## What's next

Real experience entries. Real project case studies. More writing.
```

- [ ] **Step 3: Smoke check at `http://localhost:4321/blog`**

You should now see one post listed ("Hello, world"). Click into it — the post renders with formatted typography, code spans in amber, etc.

- [ ] **Step 4: Verify build**

```bash
bun run build
```

Expected: `dist/blog/2026-05-15-hello-world/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: /blog/[slug] post page + seed first post

MDX-rendered post pages with arbitrary-variant Tailwind selectors for
inline content styling (no @tailwindcss/typography dependency)."
```

---

## Task 20: Build the `/404` page with paper-airplane art

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create `src/pages/404.astro`**

```astro
---
import Base from "../layouts/Base.astro";
---
<Base title="404 — Min Khant Kyaw" description="This page took a different flight path.">
  <div class="flex flex-col items-start gap-8 pt-12">
    <pre class="text-text-dim leading-tight text-xs sm:text-sm font-mono whitespace-pre" aria-hidden="true">
{`        ___
       /   \\
      /     \\
     /       \\
    /  ___    \\
   /  /   \\    \\
  /  /     \\____\\
 /__/__________\\
    \\_____/
`}
    </pre>
    <div>
      <p class="eyebrow mb-3 text-accent">404</p>
      <h1 class="h-2 mb-4">This page took a different flight path.</h1>
      <p class="body-lg text-text-muted max-w-xl">
        The page you were looking for doesn't exist — or possibly never did. Try the home page,
        or pick a section from the sidebar.
      </p>
    </div>
    <a
      href="/"
      class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-accent text-bg font-semibold hover:bg-accent/90 transition-colors"
    >
      <span aria-hidden="true">←</span>
      Take me home
    </a>
  </div>
</Base>

<style>
  pre {
    animation: glide 6s ease-in-out infinite;
  }
  @keyframes glide {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(20px, -10px) rotate(2deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    pre { animation: none; }
  }
</style>
```

- [ ] **Step 2: Smoke check at `http://localhost:4321/this-does-not-exist`**

Astro's dev server serves the 404 for unknown routes. You should see the ASCII paper airplane gently gliding, the "404" eyebrow, and the message.

- [ ] **Step 3: Verify build**

```bash
bun run build
```

Expected: `dist/404.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: custom /404 page with paper-airplane ASCII art

Gentle glide animation respects prefers-reduced-motion."
```

---

## Task 21: Add the Konami code easter egg

**Files:**
- Create: `src/scripts/easter-egg.ts`
- Modify: `src/layouts/Base.astro` (load script globally)

- [ ] **Step 1: Create `src/scripts/easter-egg.ts`**

```ts
const SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

function initKonami() {
  let index = 0;
  window.addEventListener("keydown", (e) => {
    const expected = SEQUENCE[index];
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === expected) {
      index += 1;
      if (index === SEQUENCE.length) {
        document.body.dataset.konami = "true";
        index = 0;
      }
    } else {
      index = key === SEQUENCE[0] ? 1 : 0;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKonami);
} else {
  initKonami();
}
```

- [ ] **Step 2: Load the script globally in `Base.astro`**

Add to `src/layouts/Base.astro` (anywhere outside the layout markup, Astro hoists `<script>` tags):

```astro
<script>
  import "../scripts/easter-egg";
</script>
```

- [ ] **Step 3: Smoke check at `http://localhost:4321`**

Type `↑ ↑ ↓ ↓ ← → ← → B A` on the home page. The spotlight should switch to a rainbow gradient (the `body[data-konami] #spotlight` rule from Task 5).

To reset: refresh the page.

- [ ] **Step 4: Verify build**

```bash
bun run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Konami code easter egg

Triggers a rainbow spotlight gradient via body[data-konami] attribute.
Resets on page reload."
```

---

## Task 22: Polish the About copy + about-section breathing room

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Refine the About copy and add a small "Currently" sub-block**

In `src/pages/index.astro`, replace the `<section id="about">` block with:

```astro
<section id="about" class="mb-24 pt-8 fade-in-up">
  <p class="body-lg text-text-muted">
    I design and develop performant applications with a strong focus on maintainability, user
    experience, and scalable architecture. My day-to-day is full-stack TypeScript — Astro,
    Next.js, Bun, Hono — with a soft spot for tools that make other developers faster.
  </p>
  <p class="body-lg text-text-muted mt-4">
    I care about the seams: clean APIs, well-named code, fast feedback loops, and interfaces
    that respect the user's attention. Outside of work I read, build small tools, and probably
    over-tweak personal sites like this one.
  </p>
</section>
```

- [ ] **Step 2: Smoke check**

```bash
bun run dev
```

The About section should have two paragraphs now, with comfortable spacing above and below.

- [ ] **Step 3: Verify build**

```bash
bun run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "polish: expand About copy to two paragraphs

Adds enough text to fill the section without padding it. Replace
this with the user's real bio when ready."
```

---

## Task 23: GitHub Actions deployment workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/.gitkeep` (only if directory is otherwise empty)

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the workflow YAML is valid by running yamllint OR (simpler) by committing and watching the first CI run**

Just confirm visually the indentation is correct. We'll watch CI on push.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages via Actions with Bun

Builds on push to main, publishes dist/ as a Pages artifact.
Requires repo Pages settings to be flipped to 'GitHub Actions' as
a one-time manual step (documented in spec)."
```

---

## Task 24: Final verification, README update, and merge prep

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with a brief setup doc**

```markdown
# minkhantkyaw.com

Personal portfolio. Astro 5 + Tailwind v4 + Bun, deployed to GitHub Pages.

## Local development

```sh
bun install
bun run dev          # http://localhost:4321
bun run build        # static export to dist/
bun run preview      # serve the built site
bun run check        # type-check
```

## Adding content

- **Project** — `src/content/projects/<slug>.md` with frontmatter (`title`, `type`, `description`, `tech`, `featured`, `order`).
- **Experience** — `src/content/experience/<slug>.md` with frontmatter (`role`, `company`, `start`, `end`, `description`, `tech`, `order`).
- **Blog post** — `src/content/blog/<slug>.mdx` with frontmatter (`title`, `description`, `pubDate`, `draft`, `tags`).

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds with Bun and publishes to GitHub Pages. The custom domain (`minkhantkyaw.com`) is preserved via `public/CNAME`.

**One-time setup:** Set the repo's Pages source to "GitHub Actions" under Settings → Pages.
```

- [ ] **Step 2: Full local verification**

```bash
bun run check       # type-check passes
bun run build       # full static build passes
bun run preview     # smoke check at http://localhost:4321
```

While previewing, click through every route and confirm:
- [ ] `/` — sidebar sticky, all four nav items, scroll-spy follows, hover-dim works, spotlight follows cursor
- [ ] `/projects` — all three project cards
- [ ] `/stack` — categorized icon grid
- [ ] `/blog` — one post listed ("Hello, world")
- [ ] `/blog/2026-05-15-hello-world` — post renders with formatted content
- [ ] `/this-does-not-exist` — 404 page renders with airplane art
- [ ] Konami code activates rainbow spotlight
- [ ] DevTools mobile preview — sidebar stacks above content, no broken layouts, spotlight is hidden (touch device)
- [ ] DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` — animations are instant, spotlight hidden

- [ ] **Step 3: Commit the README update**

```bash
git add README.md
git commit -m "docs: update README with current setup and content workflow"
```

- [ ] **Step 4: Final commit prep — review the full diff against `main`**

```bash
git log main..HEAD --oneline
git diff main..HEAD --stat
```

You should see ~24 commits and a substantial diff covering the new src/, components, layouts, content seeds, workflow, and removal of the old `index.html`.

- [ ] **Step 5: Push the branch and open a PR (when ready)**

```bash
git push -u origin v1
```

Then open a PR from `v1` → `main`. Title: `Portfolio redesign (v1)`. PR body: summarize the design doc highlights and link to `docs/superpowers/specs/2026-05-15-portfolio-redesign-design.md`.

**One-time GitHub setup before the deploy will work:**
1. Repo Settings → Pages → Source: change from "Deploy from branch" to "GitHub Actions"
2. Repo Settings → Environments → create `github-pages` if it doesn't exist (the workflow references it)

After merging, watch the `Deploy to GitHub Pages` action run — first successful run should publish to `minkhantkyaw.com`.

---

## Done

After Task 24, the site is live on `minkhantkyaw.com` with the full feature set from the design spec.

**Post-launch follow-ups (not part of this plan):**
- Replace placeholder experience entry with real role history
- Add real social URLs to `Sidebar.astro`
- Drop a real `resume.pdf` into `public/`
- Write more blog posts
- Consider adding per-project case study pages (the markdown body of project files is already wired up — they just need a `/projects/[slug].astro` route to render)
