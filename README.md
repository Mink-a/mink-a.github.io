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
