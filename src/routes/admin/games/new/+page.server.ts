import { fail, redirect } from '@sveltejs/kit';
import { isAcceptedImageType, isBlobConfigured, uploadScreenshot } from '$lib/server/blob';
import { addScreenshot, createGame, slugify, uniqueSlug } from '$lib/server/games';
import { isRawgConfigured } from '$lib/server/rawg';
import type { Actions, PageServerLoad } from './$types';

const EARLIEST_YEAR = 1958; // Tennis for Two
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const load: PageServerLoad = () => ({
	rawgConfigured: isRawgConfigured(),
	blobConfigured: isBlobConfigured()
});

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const year = Number(form.get('year'));
		const slugInput = String(form.get('slug') ?? '').trim();
		const file = form.get('screenshot');
		// Ticked by default in the form, so publishing is a deliberate act rather
		// than the fallthrough. An unchecked box sends nothing at all.
		const draft = form.get('draft') === 'on';

		const values = { name, year: form.get('year')?.toString() ?? '', slug: slugInput, draft };

		if (!name) return fail(400, { ...values, error: 'A name is required.' });
		if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > new Date().getFullYear() + 2) {
			return fail(400, { ...values, error: `The year must be between ${EARLIEST_YEAR} and now.` });
		}

		let gameId: number;
		let slug: string;

		try {
			slug = await uniqueSlug(slugify(slugInput || name));
			gameId = await createGame(name, year, slug, !draft);
		} catch (err) {
			console.error('Could not create game:', err);
			return fail(500, { ...values, error: 'Could not save the game.' });
		}

		if (file instanceof File && file.size > 0) {
			if (!isAcceptedImageType(file.type)) {
				return fail(400, {
					...values,
					error: `The game was created, but ${file.type || 'that file type'} is not a supported image. Add a screenshot on the edit page.`
				});
			}
			if (file.size > MAX_UPLOAD_BYTES) {
				return fail(400, {
					...values,
					error: 'The game was created, but the image is larger than 8 MB.'
				});
			}

			try {
				const url = await uploadScreenshot(slug, file, file.type);
				await addScreenshot(gameId, url);
			} catch (err) {
				console.error('Could not upload the screenshot:', err);
				return fail(500, {
					...values,
					error: 'The game was created, but the screenshot upload failed.'
				});
			}
		}

		redirect(303, `/admin/games/${gameId}/`);
	}
};
