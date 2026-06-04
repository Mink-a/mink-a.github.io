import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://minkhantkyaw.com',
  base: '/',
  // Hybrid: every page is prerendered to static HTML by default. Only routes
  // that opt out with `export const prerender = false` (currently just
  // /api/chat) run on-demand in the Cloudflare Worker.
  output: 'static',
  adapter: cloudflare({
    // Surfaces wrangler bindings + .dev.vars as Astro.locals.runtime.* during
    // `astro dev`, matching the production Worker environment.
    platformProxy: { enabled: true },
  }),
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    icon(),
    sitemap({ filter: (page) => !page.includes('/admin') }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Cloudflare Workers lack `MessageChannel`, which react-dom's browser SSR
      // build references at module load. The edge build doesn't, so the Worker
      // boots. (Only the admin island uses React, and it's client:only.)
      alias: { "react-dom/server": "react-dom/server.edge" },
    },
    server: {
      // Cloudflare's local KV (rate limiter, sessions) writes to .wrangler/state
      // on every request. Without this, the dev file-watcher reloads the page
      // mid-chat. No effect in production (real KV, no Vite watcher).
      watch: { ignored: ['**/.wrangler/**'] },
    },
  },
});
