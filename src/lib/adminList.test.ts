import { describe, expect, it } from 'vitest';
import {
	activeFilters,
	anchoredGameId,
	DEFAULT_GAME_LIST_QUERY,
	gameAnchor,
	gameListQueryString,
	neighboursIn,
	parseGameListQuery,
	type ListedGame
} from './adminList';

const parse = (query: string) => parseGameListQuery(new URLSearchParams(query));

describe('the missing-slot filter', () => {
	it('reads normal, pro and both', () => {
		expect(parse('missing=normal').missing).toBe('normal');
		expect(parse('missing=pro').missing).toBe('pro');
		expect(parse('missing=both').missing).toBe('both');
	});

	it('reads a missing cover', () => {
		expect(parse('missing=cover').missing).toBe('cover');
	});

	it('reads the pre-0003 missing=1 as "no screenshot at all"', () => {
		expect(parse('missing=1').missing).toBe('both');
	});

	it('ignores an unknown value', () => {
		expect(parse('missing=medium').missing).toBeNull();
		expect(parse('').missing).toBeNull();
	});

	it('round-trips through the query string and leaves defaults out', () => {
		const query = { ...DEFAULT_GAME_LIST_QUERY, missing: 'pro' as const, status: 'draft' as const };
		expect(gameListQueryString(query)).toBe('?missing=pro&status=draft');
		expect(parse(gameListQueryString(query).slice(1))).toEqual(query);
		expect(gameListQueryString(DEFAULT_GAME_LIST_QUERY)).toBe('');
	});
});

describe('the active filters', () => {
	it('are none on the plain list, whatever the sort', () => {
		expect(activeFilters(DEFAULT_GAME_LIST_QUERY)).toEqual([]);
		expect(activeFilters({ ...DEFAULT_GAME_LIST_QUERY, sort: 'name', direction: 'desc' })).toEqual(
			[]
		);
	});

	it('name each filter and how to drop just that one', () => {
		const query = { ...DEFAULT_GAME_LIST_QUERY, status: 'draft' as const, missing: 'pro' as const };
		const filters = activeFilters(query);
		expect(filters.map((filter) => filter.label)).toEqual(['Drafts', 'No Pro shot']);
		expect(gameListQueryString(query, filters[0].without)).toBe('?missing=pro');
		expect(gameListQueryString(query, filters[1].without)).toBe('?status=draft');
	});

	it('count a search, but not one of blanks', () => {
		expect(activeFilters({ ...DEFAULT_GAME_LIST_QUERY, search: ' zelda ' })[0].label).toBe(
			'“zelda”'
		);
		expect(activeFilters({ ...DEFAULT_GAME_LIST_QUERY, search: '   ' })).toEqual([]);
	});
});

describe("a row's anchor", () => {
	it('round-trips through the hash', () => {
		expect(anchoredGameId(`#${gameAnchor(42)}`)).toBe(42);
	});

	it('is null for any other hash', () => {
		expect(anchoredGameId('')).toBeNull();
		expect(anchoredGameId('#game-')).toBeNull();
		expect(anchoredGameId('#top')).toBeNull();
	});
});

describe('prev/next through a filtered list', () => {
	const game = (id: number, year: number, name = `Game ${id}`): ListedGame => ({ id, name, year });
	// Drafts by year: 1999, 2001, 2001, 2005.
	const drafts = [game(4, 1999), game(2, 2001), game(7, 2001), game(1, 2005)];

	it('steps either side of a game in the list', () => {
		expect(neighboursIn(drafts, drafts[1], 'year', 'asc')).toEqual({
			previous: { id: 4, name: 'Game 4' },
			next: { id: 7, name: 'Game 7' },
			position: 2,
			total: 4
		});
	});

	it('has no previous on the first game and no next on the last', () => {
		expect(neighboursIn(drafts, drafts[0], 'year', 'asc').previous).toBeNull();
		expect(neighboursIn(drafts, drafts[3], 'year', 'asc').next).toBeNull();
	});

	it('keeps a game that left the filter in its place, between its old neighbours', () => {
		// Game 5 (2001) was just published, so it is no longer among the drafts.
		const left = neighboursIn(drafts, game(5, 2001), 'year', 'asc');
		expect(left.previous?.id).toBe(2);
		expect(left.next?.id).toBe(7);
		expect(left.position).toBe(0);
		expect(left.total).toBe(4);
	});

	it('breaks a tie in the sort column by id, as the list does', () => {
		expect(neighboursIn(drafts, game(3, 2001), 'year', 'asc').next?.id).toBe(7);
		expect(neighboursIn(drafts, game(9, 2001), 'year', 'asc').previous?.id).toBe(7);
	});

	it('follows a descending sort', () => {
		const byYearDesc = [...drafts].reverse();
		const left = neighboursIn(byYearDesc, game(5, 2003), 'year', 'desc');
		expect(left.previous?.id).toBe(1);
		expect(left.next?.id).toBe(7);
	});

	it('sorts by name when asked', () => {
		const byName = [game(1, 2000, 'Alpha'), game(2, 2000, 'Delta')];
		const left = neighboursIn(byName, game(3, 2000, 'Charlie'), 'name', 'asc');
		expect(left.previous?.id).toBe(1);
		expect(left.next?.id).toBe(2);
	});

	it('has neither neighbour when the filter has emptied', () => {
		expect(neighboursIn([], game(5, 2001), 'year', 'asc')).toEqual({
			previous: null,
			next: null,
			position: 0,
			total: 0
		});
	});
});
