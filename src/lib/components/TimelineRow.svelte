<script lang="ts">
	import type { Game } from '$lib/types';
	import GameCard from './GameCard.svelte';

	interface Props {
		game: Game;
		/** The card just placed: its year stays hidden during the bonus guess */
		hideYear: boolean;
		/** The card just placed, during the reveal */
		revealed: boolean;
		/** One line (name and year) instead of the screenshot */
		minified: boolean;
	}

	let { game, hideYear, revealed, minified }: Props = $props();
</script>

<GameCard {game} {hideYear} highlight={false} {revealed} {minified} compact={true} />
