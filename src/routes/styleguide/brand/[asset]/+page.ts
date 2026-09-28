import { error } from '@sveltejs/kit';
import { findBrandAsset } from '$lib/brand';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const asset = findBrandAsset(params.asset);
	if (!asset) error(404, 'No such brand asset');
	return { asset };
};
