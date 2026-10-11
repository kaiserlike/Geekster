import { describe, expect, it } from 'vitest';
import {
	alternatePath,
	correctedPath,
	localeOfPath,
	localizedPath,
	routePath
} from './localizedPaths';

describe('localizedPath', () => {
	it('names the section in the language of the URL', () => {
		expect(localizedPath('de', 'years')).toBe('/de/jahre/');
		expect(localizedPath('en', 'years')).toBe('/en/years/');
	});

	it('ends every path with a slash, as the site does', () => {
		expect(localizedPath('de', 'years', 1998)).toBe('/de/jahre/1998/');
		expect(localizedPath('en', 'years', '1998')).toBe('/en/years/1998/');
	});
});

describe('localeOfPath', () => {
	it('reads the language from the first segment', () => {
		expect(localeOfPath('/de/jahre/1998/')).toBe('de');
		expect(localeOfPath('/en/')).toBe('en');
	});

	it('is null for the game and the pages without a language', () => {
		expect(localeOfPath('/')).toBeNull();
		expect(localeOfPath('/leaderboard/')).toBeNull();
		expect(localeOfPath('/fr/years/')).toBeNull();
		expect(localeOfPath('/admin/')).toBeNull();
	});
});

describe('routePath', () => {
	it('serves the German path from the route named in English', () => {
		expect(routePath('/de/jahre/')).toBe('/de/years/');
		expect(routePath('/de/jahre/1998/')).toBe('/de/years/1998/');
		expect(routePath('/de/jahre')).toBe('/de/years');
	});

	it('leaves the English path as it is', () => {
		expect(routePath('/en/years/1998/')).toBe('/en/years/1998/');
	});

	it('is null outside the encyclopedia', () => {
		expect(routePath('/')).toBeNull();
		expect(routePath('/leaderboard/')).toBeNull();
		expect(routePath('/de/')).toBeNull();
		expect(routePath('/de/unknown/')).toBeNull();
		expect(routePath('/fr/years/')).toBeNull();
	});
});

describe('correctedPath', () => {
	it("redirects the other language's segment to this language's", () => {
		expect(correctedPath('/de/years/1998/')).toBe('/de/jahre/1998/');
		expect(correctedPath('/en/jahre/')).toBe('/en/years/');
	});

	it('is null for a path that is already right, or not ours', () => {
		expect(correctedPath('/de/jahre/1998/')).toBeNull();
		expect(correctedPath('/en/years/')).toBeNull();
		expect(correctedPath('/privacy/')).toBeNull();
	});
});

describe('alternatePath', () => {
	it('is the same page in the other language', () => {
		expect(alternatePath('/de/jahre/1998/', 'en')).toBe('/en/years/1998/');
		expect(alternatePath('/en/years/', 'de')).toBe('/de/jahre/');
		expect(alternatePath('/en/years/', 'en')).toBe('/en/years/');
	});

	it('is null outside the encyclopedia', () => {
		expect(alternatePath('/', 'en')).toBeNull();
	});
});
