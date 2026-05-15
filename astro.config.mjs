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
