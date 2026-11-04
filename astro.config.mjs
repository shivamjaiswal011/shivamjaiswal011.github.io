// @ts-check
import { defineConfig } from 'astro/config';

// ADR-0001: served from the GitHub Pages user site, so no base path.
export default defineConfig({
  site: 'https://shivamjaiswal011.github.io',
});
