<script lang="ts">
	import { startGame } from '$lib/game.svelte';
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4">
	<div class="max-w-lg text-center">
		<h1
			class="mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-6xl font-bold text-transparent"
		>
			Geekster
		</h1>
		<p class="mb-8 text-xl text-gray-300">How well do you know your video game history?</p>

		<div class="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6 text-left">
			<h2 class="mb-3 text-lg font-semibold text-gray-100">How to play</h2>
			<ol class="list-inside list-decimal space-y-2 text-gray-400">
				<li>You start with one game on the timeline showing its release year</li>
				<li>A new game screenshot appears — place it before or after the existing games</li>
				<li>The timeline grows with each correct placement</li>
				<li>
					Get <span class="font-semibold text-white">10 games</span> in the right order to win!
				</li>
			</ol>
		</div>

		<button
			onclick={startGame}
			class="cursor-pointer rounded-xl bg-purple-600 px-12 py-4 text-xl font-bold text-white transition-colors hover:bg-purple-500"
		>
			Start Game
		</button>
	</div>
</div>
