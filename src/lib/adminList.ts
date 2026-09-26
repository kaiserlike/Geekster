/**
 * The admin game list's sort/search/filter state.
 *
 * It lives in the URL so that the list is linkable, and it travels with a row
 * click so the detail page's prev/next steps through the same set in the same
 * order. Shared by the server loads and the components that build the links.
 */

export const GAME_SORTS = ['name', 'year', 'created'] as const;
export const GAME_STATUSES = ['all', 'draft', 'published'] as const;
/** Which screenshot slot a game lacks: Normal, Pro, or both (no screenshot at all). */
export const GAME_MISSING = ['normal', 'pro', 'both'] as const;

export type GameSort = (typeof GAME_SORTS)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];
export type GameMissing = (typeof GAME_MISSING)[number];
export type SortDirection = 'asc' | 'desc';

export interface GameListQuery {
	search: string;
	sort: GameSort;
	direction: SortDirection;
	/**
	 * Only games lacking a slot: `normal` (never in a Normal round), `pro` (never
	 * in a Pro round), `both` (no screenshot at all). Null means no filter.
	 */
	missing: GameMissing | null;
	/**
	 * Draft or published. Deliberately separate from `missing`: a draft is a
	 * deliberate state and a missing screenshot is a gap, and the whole point of
	 * draft mode is that those two stop looking like the same thing.
	 */
	status: GameStatus;
}

export const DEFAULT_GAME_LIST_QUERY: GameListQuery = {
	search: '',
	sort: 'year',
	direction: 'asc',
	missing: null,
	status: 'all'
};

export function parseGameListQuery(params: URLSearchParams): GameListQuery {
	const sort = params.get('sort');
	const status = params.get('status');
	const missing = params.get('missing');
	return {
		search: params.get('q') ?? '',
		sort: GAME_SORTS.includes(sort as GameSort) ? (sort as GameSort) : 'year',
		direction: params.get('dir') === 'desc' ? 'desc' : 'asc',
		// `missing=1` predates the two tiers and meant "no screenshot at all".
		missing:
			missing === '1'
				? 'both'
				: GAME_MISSING.includes(missing as GameMissing)
					? (missing as GameMissing)
					: null,
		status: GAME_STATUSES.includes(status as GameStatus) ? (status as GameStatus) : 'all'
	};
}

/** Serialises the query, leaving out whatever is already the default. */
export function gameListQueryString(
	query: GameListQuery,
	overrides: Partial<GameListQuery> = {}
): string {
	const { search, sort, direction, missing, status } = { ...query, ...overrides };
	const params = new URLSearchParams();

	if (search.trim()) params.set('q', search.trim());
	if (sort !== DEFAULT_GAME_LIST_QUERY.sort) params.set('sort', sort);
	if (direction !== DEFAULT_GAME_LIST_QUERY.direction) params.set('dir', direction);
	if (missing) params.set('missing', missing);
	if (status !== DEFAULT_GAME_LIST_QUERY.status) params.set('status', status);

	const serialised = params.toString();
	return serialised ? `?${serialised}` : '';
}
