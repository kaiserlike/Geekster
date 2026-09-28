/**
 * The HUD collapsed into the app header (Sprint 9d, 9a's design call): while the bonus guess
 * has the phone keyboard open, a keyboard leaves ~550 px, so the HUD goes and the score takes the
 * language switch's place in the header. `GameScreen` sets it, `+layout.svelte` renders it.
 *
 * Module state, but only ever written in the browser (from an effect), so the server always
 * renders null.
 */
class HeaderScore {
	/** The score to show in the header, or null for the language switch */
	value: number | null = $state(null);
}

export const headerScore = new HeaderScore();
