import { fail } from '@sveltejs/kit';
import { createGame, findGameBySlug, slugify, uniqueSlug, updateGame } from '$lib/server/games';
import type { Actions } from './$types';

const EARLIEST_YEAR = 1958;

interface ParsedGame {
	name: string;
	year: number;
	slug: string;
}

/** Accepts a JSON array of `{ name, year, slug? }` or CSV lines `name,year[,slug]`. */
function parse(raw: string): { games: ParsedGame[]; errors: string[] } {
	const text = raw.trim();
	const errors: string[] = [];
	const games: ParsedGame[] = [];

	const push = (name: unknown, year: unknown, slug: unknown, where: string) => {
		const cleanName = String(name ?? '').trim();
		const cleanYear = Number(year);

		if (!cleanName) return errors.push(`${where}: missing name`);
		if (!Number.isInteger(cleanYear) || cleanYear < EARLIEST_YEAR) {
			return errors.push(`${where}: invalid year "${year}"`);
		}

		games.push({
			name: cleanName,
			year: cleanYear,
			slug: slugify(String(slug ?? '').trim() || cleanName)
		});
	};

	if (text.startsWith('[')) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch (err) {
			return { games: [], errors: [`Invalid JSON: ${(err as Error).message}`] };
		}
		if (!Array.isArray(parsed)) return { games: [], errors: ['The JSON must be an array.'] };

		parsed.forEach((entry, index) => {
			const row = entry as Record<string, unknown>;
			// games.json entries carry `/screenshots/<slug>.webp` instead of a slug.
			const slug =
				row.slug ?? (typeof row.screenshot === 'string' ? row.screenshot.split('/').pop() : '');
			push(row.name, row.year, String(slug ?? '').replace(/\.\w+$/, ''), `entry ${index + 1}`);
		});

		return { games, errors };
	}

	text.split('\n').forEach((line, index) => {
		const trimmed = line.trim();
		if (!trimmed) return;

		const cells = trimmed.split(',').map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));
		if (index === 0 && cells[0].toLowerCase() === 'name') return; // header row

		push(cells[0], cells[1], cells[2], `line ${index + 1}`);
	});

	return { games, errors };
}

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const raw = String(form.get('data') ?? '');
		if (!raw.trim()) {
			return fail(400, { error: 'Paste some CSV or JSON first.', issues: [], raw });
		}

		const { games, errors } = parse(raw);
		if (games.length === 0) {
			return fail(400, { error: 'Nothing importable was found.', issues: errors, raw });
		}

		let inserted = 0;
		let updated = 0;

		try {
			for (const game of games) {
				const existing = await findGameBySlug(game.slug);
				if (existing) {
					await updateGame(existing.id, game.name, game.year, game.slug);
					updated++;
				} else {
					await createGame(game.name, game.year, await uniqueSlug(game.slug));
					inserted++;
				}
			}
		} catch (err) {
			console.error('Bulk import failed:', err);
			return fail(500, {
				error: `The import stopped after ${inserted + updated} rows.`,
				issues: errors,
				raw
			});
		}

		return { inserted, updated, issues: errors, raw: '' };
	}
};
