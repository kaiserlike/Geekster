/**
 * Normal and Pro: the two screenshot tiers, and the rule that each tier of a
 * game has exactly one primary shot once it has any shot at all.
 *
 * Pure, so it is shared by the server, the admin pages and the tests. The
 * database backs the rule up with a partial unique index (migration 0003), so a
 * slip here fails loudly instead of serving a game twice.
 */

export const DIFFICULTIES = ['normal', 'pro'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
	normal: 'Normal',
	pro: 'Pro'
};

export function isDifficulty(value: unknown): value is Difficulty {
	return DIFFICULTIES.includes(value as Difficulty);
}

/** A missing or unknown value becomes the default — for inputs that must never fail. */
export function parseDifficulty(value: unknown): Difficulty {
	return isDifficulty(value) ? value : DEFAULT_DIFFICULTY;
}

export interface TieredShot {
	id: number;
	difficulty: string;
	isPrimary: boolean;
}

export interface PrimaryChanges {
	/** Ids that lose the primary flag. Written first, so the unique index never sees two. */
	clear: number[];
	/** Ids that gain it. */
	set: number[];
}

/**
 * The flag changes that leave every tier with exactly one primary, relative to
 * the flags `shots` carry now (i.e. what the database holds).
 *
 * Per tier: `preferred`, if it is in that tier, becomes the primary; otherwise
 * an existing primary stays; with none, the oldest shot (lowest id) is
 * promoted; with several, the oldest of them keeps it. A tier with no shots has
 * no primary.
 *
 * Callers first make a row change that cannot create a second primary — insert
 * as non-primary, move as non-primary, delete — and then apply what this
 * returns. So a new or moved shot becomes primary only in an empty tier.
 */
export function reconcilePrimaries(shots: TieredShot[], preferred?: number): PrimaryChanges {
	const byTier = new Map<string, TieredShot[]>();
	for (const shot of shots) {
		const tier = byTier.get(shot.difficulty) ?? [];
		tier.push(shot);
		byTier.set(shot.difficulty, tier);
	}

	const changes: PrimaryChanges = { clear: [], set: [] };

	for (const tier of byTier.values()) {
		const ordered = [...tier].sort((a, b) => a.id - b.id);
		const keep =
			ordered.find((shot) => shot.id === preferred) ??
			ordered.find((shot) => shot.isPrimary) ??
			ordered[0];

		for (const shot of ordered) {
			if (shot.id === keep.id && !shot.isPrimary) changes.set.push(shot.id);
			if (shot.id !== keep.id && shot.isPrimary) changes.clear.push(shot.id);
		}
	}

	return changes;
}
