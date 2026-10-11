// The encyclopedia's covers (12c, decision 12-2): what a cover may be cut from.

/**
 * Whether a cover would show a puzzle: it comes from the same rawg.io image as one of the game's
 * screenshots. Whatever the crops, one search would then find the Daily's answer on a year page.
 * A cover from a file has no source and cannot be checked; the admin page says so.
 */
export function isPuzzleSource(
	coverSource: string | null,
	screenshotSources: readonly (string | null)[]
): boolean {
	return coverSource !== null && screenshotSources.includes(coverSource);
}
