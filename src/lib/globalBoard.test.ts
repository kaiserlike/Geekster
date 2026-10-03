import { describe, expect, it } from 'vitest';
import {
	BOARD_MAX_PAGE,
	BOARD_PAGE_SIZE,
	pageCount,
	pageOfPosition,
	parseDeviceId,
	parsePage,
	periodStart,
	weekStart
} from './globalBoard';

describe('weekStart', () => {
	it('is the Monday of the week, 00:00 UTC', () => {
		// 2026-10-04 is a Sunday
		expect(weekStart(new Date('2026-10-04T23:59:59Z'))).toBe('2026-09-28 00:00:00');
		expect(weekStart(new Date('2026-10-05T00:00:00Z'))).toBe('2026-10-05 00:00:00');
		expect(weekStart(new Date('2026-10-07T12:00:00Z'))).toBe('2026-10-05 00:00:00');
	});

	it('crosses a month and a year', () => {
		expect(weekStart(new Date('2027-01-01T10:00:00Z'))).toBe('2026-12-28 00:00:00');
	});

	it('goes by UTC, not the local clock', () => {
		// Monday 00:30 in Vienna is still Sunday in UTC
		expect(weekStart(new Date('2026-10-05T00:30:00+02:00'))).toBe('2026-09-28 00:00:00');
	});
});

describe('periodStart', () => {
	it('has no bound for all-time', () => {
		expect(periodStart('all', new Date())).toBeNull();
		expect(periodStart('week', new Date('2026-10-07T12:00:00Z'))).toBe('2026-10-05 00:00:00');
	});
});

describe('pages', () => {
	it('parses a page, falling back to the first and stopping at the last served', () => {
		expect(parsePage(null)).toBe(1);
		expect(parsePage('3')).toBe(3);
		expect(parsePage('0')).toBe(1);
		expect(parsePage('-2')).toBe(1);
		expect(parsePage('abc')).toBe(1);
		expect(parsePage('9999')).toBe(BOARD_MAX_PAGE);
	});

	it('counts pages, one at least', () => {
		expect(pageCount(0)).toBe(1);
		expect(pageCount(BOARD_PAGE_SIZE)).toBe(1);
		expect(pageCount(BOARD_PAGE_SIZE + 1)).toBe(2);
		expect(pageCount(1_000_000)).toBe(BOARD_MAX_PAGE);
	});

	it('finds the page of a position, past the last served one too', () => {
		expect(pageOfPosition(1)).toBe(1);
		expect(pageOfPosition(BOARD_PAGE_SIZE)).toBe(1);
		expect(pageOfPosition(BOARD_PAGE_SIZE + 1)).toBe(2);
		expect(pageOfPosition(BOARD_PAGE_SIZE * (BOARD_MAX_PAGE + 3))).toBe(BOARD_MAX_PAGE + 3);
	});
});

describe('parseDeviceId', () => {
	it('takes 32 lower-case hex characters only', () => {
		expect(parseDeviceId('0123456789abcdef0123456789abcdef')).toBe(
			'0123456789abcdef0123456789abcdef'
		);
		expect(parseDeviceId('0123456789ABCDEF0123456789ABCDEF')).toBeNull();
		expect(parseDeviceId('abc')).toBeNull();
		expect(parseDeviceId(42)).toBeNull();
		expect(parseDeviceId(undefined)).toBeNull();
	});
});
