// Pure placement rules. `game.svelte.ts` owns the state; everything that decides
// whether a placement is right lives here, so it can be tested without runes.

/** Anything with a release year — a `Game`, or a bare `{ year }` in a test. */
interface Dated {
	year: number;
}

/**
 * A slot is correct when the year fits between its neighbours. Equal years are
 * always correct, on either side: two games from the same year have no order.
 */
export function isPlacementCorrect(timeline: Dated[], year: number, slotIndex: number): boolean {
	if (slotIndex > 0 && year < timeline[slotIndex - 1].year) return false;
	if (slotIndex < timeline.length && year > timeline[slotIndex].year) return false;
	return true;
}

/** Where a wrongly placed game is auto-inserted: before the first game of the same year or later. */
export function findCorrectIndex(timeline: Dated[], year: number): number {
	const index = timeline.findIndex((game) => year <= game.year);
	return index === -1 ? timeline.length : index;
}
