import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Pure logic only (scoring, placement). Nothing is tested through runes or the DOM.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
