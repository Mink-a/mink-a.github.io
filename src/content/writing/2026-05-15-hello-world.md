---
title: Hello, world
description: How I rebuilt minkhantkyaw.com from a single static page into a content-driven Astro site — the architecture, the trade-offs, and the details behind it.
pubDate: 2026-05-15
draft: false
tags: ["meta", "astro", "performance"]
---

This is the first post on the redesigned site, so it may as well be about the site itself.

The previous version was a single static `index.html` — fine for getting something online, painful for adding anything beyond it. Every change meant editing one growing file by hand. I wanted the opposite: content I can add as plain files, a layout that stays out of the way, and a site fast enough that performance stops being something I think about. So I rebuilt it on Astro.

## Why rebuild

The goal wasn't a redesign for its own sake. It was to make the site *cheap to extend*. Adding a project, an experience entry, or a post should be a one-file change that can't silently break the build, and the rest of the site should keep working without me touching it. That pushed me toward a content-first architecture and away from anything with a runtime to babysit.

## How it's built

Everything visible is a *projection* of files in `src/content`. Astro **content collections** load each Markdown/MDX file through a `glob` loader and validate its frontmatter against a **Zod** schema, so a typo or a missing field fails the build instead of shipping a broken page. There are three collections — `experience`, `projects`, and `writing` — and a couple of plain data modules for the tech-stack grid and the résumé.

The site builds in `output: 'static'` mode, so every route is prerendered to HTML at build time. The one exception is the chat API, which opts out with `prerender = false` and runs on demand in a Cloudflare Worker. And there's no client framework: interactivity is hand-written vanilla TypeScript, loaded per layout, rather than a framework runtime shipped to every visitor.

## Key features

### Two layouts, one sidebar

The home page uses a wide two-column layout (`Base.astro`); detail pages use a compact inner layout (`InnerLayout.astro`). Both share a sticky sidebar, and the shared pieces carry the same `transition:name`, so the sidebar and main column *morph* between the two layouts instead of hard-cutting.

### Dark / light theme

A stone + amber palette driven entirely by CSS custom properties, with system-preference detection and `localStorage` persistence. An inline script in `<head>` sets the theme before first paint, so there's no flash of the wrong colors, and a short `.theme-transitioning` window animates the tokens only while you actually toggle.

### View Transitions

Astro's `ClientRouter` cross-fades routes and morphs the shared sidebar/main pieces. The chat widget rides along via `transition:persist`, so its open/closed state and conversation survive navigations rather than resetting on every page change.

### Build-time images with ThumbHash blur-up

`src/lib/images.ts` reads each referenced image with `sharp` at build time, derives its real dimensions, and computes a tiny **ThumbHash** placeholder encoded straight into the markup. `BlurImage.astro` reserves a box with the correct aspect ratio, paints the placeholder, and fades the full image in once it decodes (`img-blur.ts`). The layout never shifts, and above-the-fold images can opt into `loading="eager"` + `fetchpriority="high"`. Project covers ship as WebP.

### Self-hosted fonts, no swap shift

Inter is served as a single variable `woff2` (latin subset) from `public/fonts`, preloaded, with no Google Fonts request. It's paired with a metric-matched `Inter Fallback` (`size-adjust` plus ascent/descent overrides) so the fallback occupies the same box as Inter — the swap on load doesn't move any text.

### The AI assistant

A small chat widget answers questions about my work. It's deliberately vanilla TypeScript, so visitors never download React just to ask a question. It talks to a streaming `/api/chat` endpoint — the only route that opts out of prerendering and runs in a Cloudflare Worker. The endpoint forwards the conversation to an OpenAI-compatible model and streams the reply back token by token; greetings and thanks are answered locally without a model call at all. Requests are rate-limited per IP with Cloudflare **KV**, and each turn is logged to **InstantDB**, which a separate React admin island (`client:only`, so it's never server-rendered) reads. What gets stored is spelled out in the [privacy notice](/privacy).

### Polish and accessibility

A spotlight cursor, hover-dimmed cards, a cycling text-scramble bio, scroll-triggered fade-ins, an animated dot-pattern divider on mobile, and a back-to-top button. Underneath: a skip-to-content link, `focus-visible` outlines, `aria-current` indicators, and `prefers-reduced-motion` fallbacks for every animation, down to the cursor parallax.

## Performance

The architecture does most of the work here. Shipping static HTML with no client framework keeps the main thread mostly idle; the inline ThumbHash placeholders reserve every image box up front, so nothing reflows as images load; and the metric-matched fallback font means the Inter swap doesn't nudge text around. The interactive layer is a few kilobytes of hand-written TypeScript loaded per layout, not a framework runtime — so the fast numbers fall out of the design rather than from chasing a benchmark after the fact.

## Content model

A post is just a file. The frontmatter is validated by the Zod schema in `src/content/config.ts`:

```markdown
---
title: Hello, world
description: A short summary used for the page meta and the listing.
pubDate: 2026-05-15
draft: false
tags: ["meta"]
---
```

`draft: true` keeps a post out of the build, and `pubDate` drives ordering (newest first). Adding writing is the whole routine: drop a `.md`/`.mdx` file into `src/content/writing/` and build. The same idea applies to projects and experience — each is one validated file.

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that installs with **Bun**, runs `bun run build` (which is `astro check && astro build`, so a type error fails the deploy), and publishes to **Cloudflare Pages** via `wrangler-action`. The prerendered pages are served straight from the CDN, while the chat API runs as a Pages Worker. The model key and database admin token live as Pages project secrets, never in the repo.

## What I took away

The theme running through all of this is pushing work to build time and keeping content as plain files. Deriving every page from a single validated source, rendering placeholders and metadata ahead of time, and reserving for an empty server most of the time means the shipped site is fast, cheap to host, and genuinely easy to extend — which was the entire point of the rebuild. The next entries here can just be files.
