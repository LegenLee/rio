import { defaultClientConditions, defaultServerConditions } from 'vite';
import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

// Import workspace packages straight from src, like the playground, so the docs always show the
// current code without a build.
const source = '@rio-m3e/source';

export default defineConfig({
  title: 'Rio',
  description: 'Material 3 Expressive for Vue',
  lang: 'en',
  // Served from GitHub Pages at legenlee.github.io/rio/
  base: '/rio/',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Foundations', link: '/foundations' },
      { text: 'Components', link: '/components/button' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Languages', link: '/guide/languages' },
          { text: 'Icons', link: '/guide/icons' },
        ],
      },
      {
        text: 'Foundations',
        items: [{ text: 'M3E core principles', link: '/foundations' }],
      },
      {
        text: 'Components',
        items: [
          { text: 'Button', link: '/components/button' },
          { text: 'Button group', link: '/components/button-group' },
          { text: 'Checkbox', link: '/components/checkbox' },
          { text: 'Chips', link: '/components/chip' },
          { text: 'Date picker', link: '/components/date-picker' },
          { text: 'Dialog', link: '/components/dialog' },
          { text: 'Icon button', link: '/components/icon-button' },
          { text: 'Lists', link: '/components/list' },
          { text: 'Loading indicator', link: '/components/loading-indicator' },
          { text: 'Menu', link: '/components/menu' },
          { text: 'Progress indicators', link: '/components/progress-indicator' },
          { text: 'Radio button', link: '/components/radio-button' },
          { text: 'Scroll fields', link: '/components/scroll-field' },
          { text: 'Select', link: '/components/select' },
          { text: 'Slider', link: '/components/slider' },
          { text: 'Split button', link: '/components/split-button' },
          { text: 'Switch', link: '/components/switch' },
          { text: 'Text field', link: '/components/text-field' },
          { text: 'Time picker', link: '/components/time-picker' },
          { text: 'Tooltip', link: '/components/tooltip' },
        ],
      },
      {
        text: 'Contributing',
        items: [{ text: 'Conventions', link: '/conventions' }],
      },
    ],
    outline: [2, 3],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/LegenLee/rio/edit/dev/docs/:path',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LegenLee/rio' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@rio-m3e/vue' },
    ],
    footer: {
      message:
        'Released under the Apache License 2.0. Material Design and Material 3 are trademarks of Google LLC; Rio is not affiliated with Google.',
      copyright: 'Copyright © 2026 LegenLee',
    },
  },

  vite: {
    plugins: [llmstxt()],
    resolve: { conditions: [source, ...defaultClientConditions] },
    ssr: {
      resolve: { conditions: [source, ...defaultServerConditions] },
      // MCU breaks under Node ESM (upstream #195), so let Vite process it, as the Vitest unit
      // project does. The published @rio-m3e/tokens bundles it instead.
      noExternal: ['@material/material-color-utilities'],
    },
  },
});
