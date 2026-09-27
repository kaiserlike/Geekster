<script lang="ts">
	import IconMark from '$lib/components/ui/IconMark.svelte';
	import OgImage from '$lib/components/brand/OgImage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	<title>{data.asset.id} — Geekster brand</title>
</svelte:head>

<!-- Exactly the asset's pixel size at the top left, nothing else: scripts/render-brand-assets.cjs
     screenshots this box. The page ground stays transparent for the icons with rounded corners. -->
<div
	data-brand-asset={data.asset.id}
	class="overflow-hidden"
	style:width="{data.asset.width}px"
	style:height="{data.asset.height}px"
>
	{#if data.asset.icon}
		<IconMark size={data.asset.width} fill={data.asset.icon} />
	{:else}
		<OgImage />
	{/if}
</div>
