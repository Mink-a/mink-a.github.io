---
title: MyanHealth.org
type: WordPress Theme · Freelance
description: A Burmese-first health-news WordPress theme with a BBC-inspired magazine layout — a self-built ad manager with impression/click stats, a modern Tailwind v4 + esbuild build pipeline, and typography tuned for Burmese script.
tech: ["WordPress", "PHP", "JavaScript", "Tailwind CSS", "esbuild", "PostCSS", "MySQL"]
demoUrl: https://myanhealth.org
image: /assets/covers/myan-health-cover.webp
featured: false
order: 70
---

## Overview

MyanHealth is a Burmese-language health-information site, and this project is the custom WordPress theme behind it — a BBC-inspired news-magazine layout with typography tuned specifically for Burmese script. It's built on the [`_tw`](https://underscoretw.com/) starter theme and then heavily customized: a self-built **Ad Manager** with impression and click tracking, a front-page **FAQ accordion**, a set of custom **page templates** (team, authors, membership, partner, careers), post-view tracking, an author-photo override, and a Burmese-tuned type scale.

A throughline of the work is that it replaced a heavy Avada/Fusion page-builder setup with a clean, hand-built theme — while keeping the existing content (FAQ entries, view counts, builder shortcodes) working, so nothing the editorial team had already published broke in the move.

## Build pipeline

The repo is a **build project**: the root holds the sources and tooling, and everything compiles *into* a `theme/` directory, which is the installable WordPress theme that actually ships. Bringing a modern frontend toolchain to a classic WordPress theme was a deliberate choice.

- **CSS** is compiled by **PostCSS + Tailwind CSS v4** into three targets, selected by a `_TW_TARGET` env var: `frontend` (the public `style.css` plus the WordPress theme header), `editor` (block/classic editor styles, with Preflight scoped to `.not-prose` so it can't fight the editor chrome), and an `intellisense` target that exists only to power the Tailwind LSP across all the `@import`-ed files in development.
- **JavaScript** is bundled by **esbuild** from `javascript/*.js` into minified `theme/js/*.min.js`.
- **`npm run bundle`** runs a production build (adding `cssnano`) and zips `theme/` into `myan-health.zip`, rewriting the theme version to a base-36 timestamp so browsers cache-bust the new assets on deploy.

Because Tailwind only emits classes it actually finds in the source, the rule on the project is to rebuild after touching templates — and to keep layout-critical properties as inline styles, reserving Tailwind for color and typography.

## Theme architecture

**Custom post types & taxonomy.** A `faq` type (where the title is the question and the body the answer, with an admin-only UI) and a REST-enabled `job_listing` type for careers. The `faq_category` taxonomy is deliberately shared with the *legacy* `avada_faq` post type, so FAQ content created under the old Avada setup keeps working untouched. Rewrite rules auto-flush exactly once per version bump rather than on every load.

**Page templates.** Several templates (membership, partner & volunteer, careers, team listings) pull structured content from **native meta boxes** rather than ACF Pro — values save to `wp_postmeta` and work in both the block and classic editors, which keeps the dependency surface small for the client. Author archives work automatically at `/author/{username}/`.

**Front page.** The hero is the single latest post, followed by an 8-item paginated sub-grid. Because the page runs its own `WP_Query` with a manual offset, it uses a custom `?subpage=N` query param instead of WordPress's built-in `paged` — and pagination is detected with `$sub_page > 1`, never `is_paged()`. The category sections and FAQ accordion render only on page 1.

## Ad Manager

The most substantial custom feature is a self-contained ad system under **WP Admin → Ad Manager**, gated behind the `manage_options` capability — no third-party ad plugin.

- **9 slots** across banner, sidebar, and popup types, each with fixed target dimensions. A slot holds **up to 4 images**, one chosen at random per page load, with a per-slot enable toggle, legend text, click URL, alt text, and (for popups) a delay.
- **Click tracking** runs through a `template_redirect` interstitial (`?myan_ad_click=&myan_ad_img=`); **impression tracking** fires from a footer `fetch()` to `admin-ajax.php`.
- Counts are stored per slot, per day, in a `{prefix}_myan_ad_stats` table (created with `dbDelta` and incremented atomically) and surfaced on an **Ad Stats** admin page.
- A template drops a slot in with `myan_health_render_ad('a1')`, and disabled slots degrade gracefully — some show a house promo, others simply collapse.

## Custom features

Most of these exist to migrate cleanly off the previous Avada/Fusion build without losing history:

- **Post-view tracking** increments the historical `avada_post_views_count` meta on single-post views — skipping bots, admins, and previews — so the old view counts carry forward instead of resetting.
- **Author profile image** adds a Media Library picker on the user-edit screen and overrides `get_avatar` / `get_avatar_url` site-wide, so every existing avatar call picks up the new image with no template changes.
- **Fusion Builder cleanup** is a `the_content` filter that decodes `[fusion_code]` base64 blocks, keeps the inner text of other `[fusion_*]` shortcodes, and strips the tags — unwinding the page-builder markup with no plugin still installed.
- **Archive density** uses `pre_get_posts` to force 12 posts per page on archives, categories, and tags, keeping the 3-column grid even.
- **Editor constraints** limit block headings to H2–H4 and inject Tailwind Typography (`prose`) classes consistently across the block editor, the classic editor (TinyMCE), and the front end.

## Burmese typography and design system

Burmese script has tall glyphs with stacked diacritics, so the type scale uses **generous line-heights** — body `2.1`, headings `1.7` — which are treated as load-bearing, not stylistic. The font stack is `Pyidaungsu → Padauk → Noto Sans Myanmar → Arial → sans-serif`, with Pyidaungsu and Padauk (Myanmar + Latin subsets) **self-hosted** as `woff2` so the site doesn't depend on a CDN that may be slow for the local audience. A single accent red (`#b91c1c`) carries category labels, borders, and CTAs, with design tokens defined once in the Tailwind theme and mirrored into `theme.json` so the editor palette matches the front end.

## Deployment

`npm run bundle` produces `myan-health.zip`, which installs through **Appearance → Add Themes → Upload Theme**. A `setup.md` runbook covers the post-install WordPress configuration the theme expects — the free ACF plugin, optional Contact Form 7 and Classic Editor, the primary menu, categories, FAQ terms, footer page slugs, and the six self-hosted font files that ship with the theme.

## What I took away

This project was about respecting two constraints at once: the *readers* (Burmese typography on modest connections) and the *editors* (an existing WordPress workflow with years of Avada content). The interesting engineering wasn't any single feature but the combination — bringing a real build pipeline to a classic WordPress theme, hand-building the pieces a page-builder used to provide, and writing the migration shims (`avada_faq`, `avada_post_views_count`, the Fusion shortcode decoder) so the switch was invisible to everyone who just wanted to keep publishing.
