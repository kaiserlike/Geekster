// The global board's pure rules (Sprint 10c), shared by `/api/scores`, the result screen and
// `/leaderboard`. The board shows each device's best run in a mode (decision 2026-10-04), so
// one keen player cannot fill the first page; a row written without a device is its own player.

export type BoardPeriod = 'all' | 'week';

/** Which board: an endless mode, or today's Daily Run (10d) */
export type BoardMode = 'normal' | 'pro' | 'daily';

export function isBoardMode(value: unknown): value is BoardMode {
	return value === 'normal' || value === 'pro' || value === 'daily';
}

export const BOARD_PERIODS: readonly BoardPeriod[] = ['all', 'week'];
/** Rows per page of `/leaderboard` */
export const BOARD_PAGE_SIZE = 20;
/** No page past this one is served; the board is for the top, not an archive */
export const BOARD_MAX_PAGE = 50;

export function isBoardPeriod(value: unknown): value is BoardPeriod {
	return value === 'all' || value === 'week';
}

/**
 * The start of the week `now` is in, as SQLite writes `created_at` (`2026-10-05 00:00:00`, UTC):
 * Monday 00:00 UTC. One week for every player, the same way the Daily will have one day
 */
export function weekStart(now: Date): string {
	const day = now.getUTCDay(); // 0 = Sunday
	const sinceMonday = (day + 6) % 7;
	const monday = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - sinceMonday)
	);
	return `${monday.toISOString().slice(0, 10)} 00:00:00`;
}

/** The lower bound on `created_at` for a period, or null for all-time */
export function periodStart(period: BoardPeriod, now: Date): string | null {
	return period === 'week' ? weekStart(now) : null;
}

/** A 1-based page number from a query string, clamped to the pages that are served */
export function parsePage(value: string | null): number {
	const page = Number.parseInt(value ?? '1', 10);
	if (!Number.isFinite(page) || page < 1) return 1;
	return Math.min(page, BOARD_MAX_PAGE);
}

/** How many pages `players` rows fill, at least one */
export function pageCount(players: number): number {
	return Math.min(Math.max(1, Math.ceil(players / BOARD_PAGE_SIZE)), BOARD_MAX_PAGE);
}

/** The page the row at 1-based `position` of the board is on (a rank can be shared; a position can't) */
export function pageOfPosition(position: number): number {
	return Math.max(1, Math.ceil(position / BOARD_PAGE_SIZE));
}

const DEVICE_ID = /^[0-9a-f]{32}$/;

/** A device id as the browser makes it (32 hex), or null: it is an identifier, not a credential */
export function parseDeviceId(value: unknown): string | null {
	return typeof value === 'string' && DEVICE_ID.test(value) ? value : null;
}
