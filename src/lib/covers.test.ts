import { describe, expect, it } from 'vitest';
import { isPuzzleSource } from './covers';

const KEY_ART = 'https://media.rawg.io/media/games/abc/key-art.jpg';
const SHOT = 'https://media.rawg.io/media/screenshots/def/shot.jpg';

describe('isPuzzleSource', () => {
	it('refuses a cover from the image a screenshot was cut from', () => {
		expect(isPuzzleSource(KEY_ART, [SHOT, KEY_ART])).toBe(true);
	});

	it('allows a cover from an image no screenshot uses', () => {
		expect(isPuzzleSource(KEY_ART, [SHOT, null])).toBe(false);
	});

	it('cannot judge a cover from a file, or a game without screenshots', () => {
		expect(isPuzzleSource(null, [null, SHOT])).toBe(false);
		expect(isPuzzleSource(KEY_ART, [])).toBe(false);
	});
});
