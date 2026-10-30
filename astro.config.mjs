import { defineConfig } from 'astro/config';

// Org Pages site: https://hikmah-hackers.github.io (no base path needed).
// If you move it to a project repo, set `base: '/<repo-name>'`.
export default defineConfig({
  site: 'https://hikmah-hackers.github.io',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
  },
});
