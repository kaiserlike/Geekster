/**
 * The admin game list's sort/search/filter state.
 *
 * It lives in the URL so that the list is linkable, and it travels with a row
 * click so the detail page's prev/next steps through the same set in the same
 * order. Shared by the server loads and the components that build the links.
 */

export const GAME_SORTS = ['name', 'year', 'created'] as const;
export const GAME_STATUSES = ['all', 'draft', 'published'] as const;
/**
 * What a game lacks: a Normal or Pro screenshot, both (no screenshot at all), or the
 * encyclopedia's cover.
 */
export const GAME_MISSING = ['normal', 'pro', 'both', 'cover'] as const;

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

/** Everything the list filters by; sort and direction are an order, not a filter. */
export const CLEARED_FILTERS = {
	search: '',
	missing: null,
	status: 'all'
} as const satisfies Partial<GameListQuery>;

export interface ActiveFilter {
	key: 'search' | 'status' | 'missing';
	label: string;
	/** The overrides that remove just this filter. */
	without: Partial<GameListQuery>;
}

const STATUS_LABELS: Record<Exclude<GameStatus, 'all'>, string> = {
	draft: 'Drafts',
	published: 'Published'
};

const MISSING_LABELS: Record<GameMissing, string> = {
	normal: 'No Normal shot',
	pro: 'No Pro shot',
	both: 'No screenshot',
	cover: 'No cover'
};

/**
 * The filters narrowing the list, each with the way to drop it — so the list
 * and a game's page can both say plainly that not every game is shown.
 */
export function activeFilters(query: GameListQuery): ActiveFilter[] {
	const filters: ActiveFilter[] = [];
	if (query.status !== 'all') {
		filters.push({ key: 'status', label: STATUS_LABELS[query.status], without: { status: 'all' } });
	}
	if (query.missing) {
		filters.push({
			key: 'missing',
			label: MISSING_LABELS[query.missing],
			without: { missing: null }
		});
	}
	if (query.search.trim()) {
		filters.push({ key: 'search', label: `“${query.search.trim()}”`, without: { search: '' } });
	}
	return filters;
}

/** The row's anchor on the list, so "back" lands on the game just left. */
export function gameAnchor(id: number): string {
	return `game-${id}`;
}

/** The game a list URL's hash points at, or null. */
export function anchoredGameId(hash: string): number | null {
	const match = /^#game-(\d+)$/.exec(hash);
	return match ? Number(match[1]) : null;
}

export interface ListedGame {
	id: number;
	name: string;
	year: number;
}

export interface GameNeighbours {
	previous: { id: number; name: string } | null;
	next: { id: number; name: string } | null;
	/** 1-based index in the list; 0 when the game is not (or no longer) in it. */
	position: number;
	total: number;
}

/** The list's order: the sort column, then the id, as `listGames()` sorts in SQL. */
export function compareListed(
	a: ListedGame,
	b: ListedGame,
	sort: GameSort,
	direction: SortDirection
): number {
	const key = (game: ListedGame) =>
		sort === 'name' ? game.name : sort === 'created' ? game.id : game.year;
	const [left, right] = [key(a), key(b)];
	const byKey = left < right ? -1 : left > right ? 1 : 0;
	if (byKey !== 0) return direction === 'desc' ? -byKey : byKey;
	return a.id - b.id;
}

/**
 * The games either side of `current` in the filtered, sorted `list`. A game
 * that has dropped out of its filter — published from the drafts, given the Pro
 * shot it lacked — keeps its place in the order, so prev/next still walk the
 * same filtered set instead of jumping to every game.
 */
export function neighboursIn(
	list: ListedGame[],
	current: ListedGame,
	sort: GameSort,
	direction: SortDirection
): GameNeighbours {
	const toLink = (game: ListedGame | undefined) => (game ? { id: game.id, name: game.name } : null);
	const index = list.findIndex((game) => game.id === current.id);

	if (index !== -1) {
		return {
			previous: toLink(list[index - 1]),
			next: toLink(list[index + 1]),
			position: index + 1,
			total: list.length
		};
	}

	const after = list.findIndex((game) => compareListed(game, current, sort, direction) > 0);
	const insertAt = after === -1 ? list.length : after;
	return {
		previous: toLink(list[insertAt - 1]),
		next: toLink(list[insertAt]),
		position: 0,
		total: list.length
	};
}
