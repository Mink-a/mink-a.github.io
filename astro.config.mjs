import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// The Cloudflare adapter aliases `react-dom/server` → `react-dom/server.browser`
// for the Worker build, but that file touches `MessageChannel` at module load
// and workerd doesn't define it, so the Worker crashes on boot (renderers.mjs is
// imported eagerly). `server.edge` is API-compatible and avoids MessageChannel.
// Apply it at BUILD only: in dev, `server.edge` is a CJS module whose top-level
// `require` breaks Vite's SSR module runner ("require is not defined"), and Node
// dev provides MessageChannel anyway.
/** @type {import('astro').AstroIntegration} */
const reactDomServerEdgeForWorker = {
  name: 'react-dom-server-edge-for-worker',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      if (command !== 'build') return;
      updateConfig({
        vite: { resolve: { alias: { 'react-dom/server': 'react-dom/server.edge' } } },
      });
    },
  },
};

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
    reactDomServerEdgeForWorker,
    mdx(),
    icon(),
    sitemap({ filter: (page) => !page.includes('/admin') }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Cloudflare's local KV (rate limiter, sessions) writes to .wrangler/state
      // on every request. Without this, the dev file-watcher reloads the page
      // mid-chat. No effect in production (real KV, no Vite watcher).
      watch: { ignored: ['**/.wrangler/**'] },
    },
  },
});
