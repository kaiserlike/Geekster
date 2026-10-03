import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// dub1 sits next to Turso (aws-eu-west-1): every API call queries it, and from
		// Sprint 10b every placement is one. Hobby allows a single region (Sprint 10a)
		adapter: adapter({ regions: ['dub1'] })
	}
};

export default config;
