// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://www.behindmedia.com',
	trailingSlash: 'always',
	build: { format: 'directory' },
	integrations: [sitemap()],
	redirects: {
		'/blog/': '/writing/',
	},
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
			wrap: false,
		},
	},
});
