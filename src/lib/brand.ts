/**
 * The brand assets rendered from `/styleguide/brand/<id>/` into `static/` by
 * `npm run brand:render` (scripts/render-brand-assets.cjs). One entry per page, each at its exact
 * pixel size. The script reads this list from the dev server, so a new asset is added here only.
 */
export interface BrandAsset {
	id: string;
	width: number;
	height: number;
	/** The icon mark's variant; absent for the OG image */
	icon?: 'none' | 'opaque' | 'maskable';
	/** Where the PNG goes under static/ */
	outputs: string[];
	/** A transparent background (rounded corners) — only a PNG with alpha */
	transparent: boolean;
}

export const BRAND_ASSETS: BrandAsset[] = [
	{
		id: 'icon-16',
		width: 16,
		height: 16,
		icon: 'none',
		outputs: ['favicon-16.png'],
		transparent: true
	},
	{
		id: 'icon-32',
		width: 32,
		height: 32,
		icon: 'none',
		outputs: ['favicon-32.png'],
		transparent: true
	},
	{
		id: 'apple-touch-icon',
		width: 180,
		height: 180,
		icon: 'opaque',
		outputs: ['apple-touch-icon.png'],
		transparent: false
	},
	{
		id: 'icon-192',
		width: 192,
		height: 192,
		icon: 'none',
		outputs: ['icon-192.png'],
		transparent: true
	},
	{
		id: 'icon-512',
		width: 512,
		height: 512,
		icon: 'none',
		outputs: ['icon-512.png'],
		transparent: true
	},
	{
		id: 'icon-maskable-512',
		width: 512,
		height: 512,
		icon: 'maskable',
		outputs: ['icon-maskable-512.png'],
		transparent: false
	},
	{ id: 'og-image', width: 1200, height: 630, outputs: ['og-image.png'], transparent: false }
];

export function findBrandAsset(id: string): BrandAsset | undefined {
	return BRAND_ASSETS.find((asset) => asset.id === id);
}
