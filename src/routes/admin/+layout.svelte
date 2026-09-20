<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const links = [
		{ href: resolve('/admin'), label: 'Dashboard' },
		{ href: resolve('/admin/games'), label: 'Games' },
		{ href: resolve('/admin/games/new'), label: 'Add game' },
		{ href: resolve('/admin/games/import'), label: 'Bulk import' }
	];

	const isLogin = $derived(page.url.pathname.startsWith('/admin/login'));

	/**
	 * Only the deepest matching link lights up: `/admin/games/new` sits under
	 * `/admin/games`, and highlighting both reads as two active pages.
	 */
	const activeHref = $derived.by(() => {
		const path = page.url.pathname.replace(/\/$/, '');
		let best = '';

		for (const link of links) {
			const target = link.href.replace(/\/$/, '');
			const matches = path === target || path.startsWith(`${target}/`);
			if (matches && target.length > best.length) best = target;
		}

		return best;
	});

	function isActive(href: string): boolean {
		return href.replace(/\/$/, '') === activeHref;
	}
</script>

{#if isLogin}
	{@render children()}
{:else}
	<div class="flex min-h-screen flex-col md:flex-row">
		<aside
			class="border-b border-gray-800 bg-gray-900 md:w-56 md:shrink-0 md:border-r md:border-b-0"
		>
			<div class="flex items-center justify-between p-4 md:block">
				<a href={resolve('/admin')} class="text-lg font-bold text-white">Geekster Admin</a>
				<a href={resolve('/')} class="text-xs text-gray-500 hover:text-gray-300 md:mt-1 md:block">
					View the game →
				</a>
			</div>

			<nav class="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:gap-0.5 md:pb-4">
				{#each links as link (link.href)}
					<!-- link.href is already a resolve() result — the rule cannot see through the array -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={link.href}
						class="rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors {isActive(
							link.href
						)
							? 'bg-purple-600 text-white'
							: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
					>
						{link.label}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
			</nav>

			<form method="POST" action={resolve('/admin/logout')} class="px-2 pb-4 md:mt-auto">
				<button
					type="submit"
					class="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
				>
					Log out
				</button>
			</form>
		</aside>

		<main class="min-w-0 flex-1 p-4 md:p-8">
			{@render children()}
		</main>
	</div>
{/if}
