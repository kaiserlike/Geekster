import { describe, expect, it } from 'vitest';
import {
	CARD_SQUARES_MAX,
	marksToEmoji,
	parseShareEvent,
	shareRate,
	shareCardLayout,
	shareText,
	type ShareResult
} from './share';

const daily: ShareResult = {
	kind: 'daily',
	number: 12,
	score: 1240,
	marks: 'ooxoooxooo',
	namesKnown: 7,
	exactYears: 3,
	rank: { rank: 4, players: 37 }
};

const endless: ShareResult = {
	kind: 'endless',
	mode: 'normal',
	score: 3450,
	bestStreak: 17,
	livesWonBack: 1,
	marks: 'o'.repeat(30) + 'xxx',
	namesKnown: 21,
	exactYears: 8,
	rank: { rank: 19, players: 38 }
};

describe('marksToEmoji', () => {
	it('turns hits and misses into squares', () => {
		expect(marksToEmoji('oox')).toBe('🟩🟩🟥');
	});

	it('pads a Daily Run lost early to its ten cards', () => {
		expect(marksToEmoji('xoxx', 10)).toBe('🟥🟩🟥🟥⬛⬛⬛⬛⬛⬛');
	});
});

describe('shareText', () => {
	it('writes the Daily as in the plan, in English', () => {
		expect(shareText(daily, 'en')).toBe(
			'Geekster Daily #12\n🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩\n1,240 CR · #4 of 37 today\nNames known 7/10 · Years exact 3/10\nhttps://geekster.pro'
		);
	});

	it('writes the Daily in German, with German digits', () => {
		expect(shareText(daily, 'de')).toBe(
			'Geekster Daily #12\n🟩🟩🟥🟩🟩🟩🟥🟩🟩🟩\n1.240 CR · Platz 4 von 37 heute\nNamen erkannt 7/10 · Jahre exakt 3/10\nhttps://geekster.pro'
		);
	});

	it('leaves the rank out when the server had none', () => {
		expect(shareText({ ...daily, rank: null }, 'en').split('\n')[2]).toBe('1,240 CR');
	});

	it('writes an endless run with mode, score, streak and rank', () => {
		expect(shareText(endless, 'en')).toBe(
			'Geekster · Endless Normal\n3,450 CR · best streak 17\n#19 of 38 worldwide\nNames known 21/33 · Years exact 8/33\nhttps://geekster.pro'
		);
		expect(shareText({ ...endless, mode: 'pro', rank: null }, 'de')).toBe(
			'Geekster · Endless Pro\n3.450 CR · beste Serie 17\nNamen erkannt 21/33 · Jahre exakt 8/33\nhttps://geekster.pro'
		);
	});

	it('counts the tally out of the cards placed, not the Daily’s ten', () => {
		const text = shareText({ ...daily, marks: 'oxx', namesKnown: 2, exactYears: 0 }, 'en');
		expect(text.split('\n')[3]).toBe('Names known 2/3 · Years exact 0/3');
	});

	it('never names a game or a year', () => {
		for (const text of [shareText(daily, 'en'), shareText(endless, 'de')]) {
			expect(text).not.toMatch(/\b(19|20)\d\d\b/);
		}
	});
});

describe('shareCardLayout', () => {
	it('shows a Daily as its ten squares, unplayed cards marked', () => {
		const layout = shareCardLayout({ ...daily, marks: 'oox', rank: null }, 'en');
		expect(layout.chip).toBe('DAILY #12');
		expect(layout.squares).toBe('oox-------');
		expect(layout.more).toBe('');
		expect(layout.stats.map((s) => [s.label, s.value])).toEqual([
			['PLACED', '2'],
			['MISSES', '1']
		]);
	});

	it('adds today’s place when there is one', () => {
		expect(shareCardLayout(daily, 'de').stats.at(-1)).toEqual({
			label: 'HEUTE',
			value: '#4 / 37',
			tone: 'pink'
		});
	});

	it('caps a long endless run and counts the rest', () => {
		const layout = shareCardLayout(endless, 'en');
		expect(layout.squares).toHaveLength(CARD_SQUARES_MAX);
		expect(layout.more).toBe(`+ ${33 - CARD_SQUARES_MAX} more`);
		expect(layout.chip).toBe('ENDLESS · NORMAL');
		expect(layout.chipTone).toBe('accent');
		expect(layout.stats.map((s) => s.value)).toEqual(['30', '17', '1', '#19 / 38']);
	});

	it('puts names known and years exact beside the score, out of every card placed', () => {
		expect(shareCardLayout(endless, 'de').tally).toEqual([
			{ label: 'NAMEN ERKANNT', value: 21, of: 33, tone: 'score' },
			{ label: 'JAHRE EXAKT', value: 8, of: 33, tone: 'accent' }
		]);
		expect(
			shareCardLayout({ ...daily, marks: 'oox' }, 'en').tally.map((t) => [t.label, t.of])
		).toEqual([
			['NAMES KNOWN', 3],
			['YEARS EXACT', 3]
		]);
	});

	it('keeps a short run whole and colours Pro pink', () => {
		const layout = shareCardLayout({ ...endless, mode: 'pro', marks: 'oxo', rank: null }, 'de');
		expect(layout.squares).toBe('oxo');
		expect(layout.more).toBe('');
		expect(layout.chipTone).toBe('pink');
		expect(layout.score).toBe('3.450');
	});
});

describe('parseShareEvent', () => {
	it('takes a known kind and method', () => {
		expect(parseShareEvent({ kind: 'daily', method: 'sheet' })).toEqual({
			kind: 'daily',
			method: 'sheet'
		});
		expect(parseShareEvent({ kind: 'endless', method: 'download', extra: 1 })).toEqual({
			kind: 'endless',
			method: 'download'
		});
	});

	it('refuses anything else', () => {
		for (const body of [
			null,
			'daily',
			{},
			{ kind: 'pro', method: 'copy' },
			{ kind: 'daily', method: 'tweet' },
			{ kind: 'daily' }
		]) {
			expect(parseShareEvent(body)).toBeNull();
		}
	});
});

describe('shareRate', () => {
	it('is the shared share of finished runs, rounded', () => {
		expect(shareRate(24, 79)).toBe(30);
		expect(shareRate(0, 5)).toBe(0);
	});

	it('is null before any run finished', () => {
		expect(shareRate(3, 0)).toBeNull();
	});
});
