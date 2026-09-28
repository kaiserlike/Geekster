<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Admin Login — Geekster</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4">
	<form
		method="POST"
		class="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl"
	>
		<h1 class="mb-1 text-2xl font-bold text-white">Geekster Admin</h1>
		<p class="mb-6 text-sm text-gray-400">Sign in to manage games and screenshots.</p>

		{#if !data.configured}
			<p class="mb-4 rounded-lg border border-amber-800 bg-amber-950/60 p-3 text-sm text-amber-200">
				<code>ADMIN_PASSWORD</code> is not set for this environment. Add it in the Vercel dashboard
				(and in your local <code>.env</code>) before logging in.
			</p>
		{/if}

		{#if form?.error}
			<p
				role="alert"
				class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
			>
				{form.error}
			</p>
		{/if}

		<label class="mb-2 block text-sm font-medium text-gray-300" for="password">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			required
			class="focus:border-accent mb-5 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none"
		/>

		<button
			type="submit"
			class="bg-accent text-on-accent hover:bg-accent-strong w-full cursor-pointer rounded-lg px-4 py-2.5 font-semibold transition-colors"
		>
			Sign in
		</button>

		<a href={resolve('/')} class="mt-4 block text-center text-xs text-gray-400 hover:text-gray-200">
			Back to the game
		</a>
	</form>
</main>
