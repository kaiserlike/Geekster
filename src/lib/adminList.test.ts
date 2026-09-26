import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_LIST_QUERY, gameListQueryString, parseGameListQuery } from './adminList';

const parse = (query: string) => parseGameListQuery(new URLSearchParams(query));

describe('the missing-slot filter', () => {
	it('reads normal, pro and both', () => {
		expect(parse('missing=normal').missing).toBe('normal');
		expect(parse('missing=pro').missing).toBe('pro');
		expect(parse('missing=both').missing).toBe('both');
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
