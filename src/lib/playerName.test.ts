import { describe, expect, it } from 'vitest';
import { checkName, NAME_MAX, normalizeName } from './playerName';

describe('normalizeName', () => {
	it('trims and collapses inner whitespace', () => {
		expect(normalizeName('  Pixel   Pete \t')).toBe('Pixel Pete');
	});

	it('composes accents, so one name has one spelling', () => {
		expect(normalizeName('José')).toBe('José');
	});
});

describe('checkName', () => {
	it('accepts a plain name, normalised', () => {
		expect(checkName('  Pixel  Pete ')).toEqual({ ok: true, name: 'Pixel Pete' });
	});

	it('accepts letters of any script, digits and . _ -', () => {
		expect(checkName('Jürgen_92').ok).toBe(true);
		expect(checkName('Ōkami-Fan').ok).toBe(true);
		expect(checkName('ゲーマー').ok).toBe(true);
		expect(checkName('a.b').ok).toBe(true);
	});

	it('refuses too short and too long', () => {
		expect(checkName('a')).toEqual({ ok: false, problem: 'short' });
		expect(checkName('   ')).toEqual({ ok: false, problem: 'short' });
		expect(checkName('x'.repeat(NAME_MAX)).ok).toBe(true);
		expect(checkName('x'.repeat(NAME_MAX + 1))).toEqual({ ok: false, problem: 'long' });
	});

	it('counts characters, not UTF-16 units', () => {
		expect(checkName('𝔸'.repeat(NAME_MAX)).ok).toBe(true);
		expect(checkName('𝔸'.repeat(NAME_MAX + 1))).toEqual({ ok: false, problem: 'long' });
		expect(checkName('😀😀')).toEqual({ ok: false, problem: 'chars' });
	});

	it('refuses other characters, and a name of separators only', () => {
		expect(checkName('<script>')).toEqual({ ok: false, problem: 'chars' });
		expect(checkName('a@b')).toEqual({ ok: false, problem: 'chars' });
		expect(checkName('--__..')).toEqual({ ok: false, problem: 'chars' });
	});

	it('blocks a listed word anywhere, through case, accents, separators and leetspeak', () => {
		expect(checkName('Hitler')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('xXH1tl3rXx')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('f.u.c.k')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('Arschloch99')).toEqual({ ok: false, problem: 'blocked' });
	});

	it('blocks a short word only as a word of its own', () => {
		expect(checkName('Nazi')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('big ass')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('Ignazio').ok).toBe(true);
		expect(checkName('Assassin').ok).toBe(true);
		expect(checkName('Bastian').ok).toBe(true);
		expect(checkName('Classic Gamer').ok).toBe(true);
	});

	it("refuses names that would pass for the game's own", () => {
		expect(checkName('Anonymous')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('admin')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('Geekster')).toEqual({ ok: false, problem: 'blocked' });
		expect(checkName('Geekster Fan').ok).toBe(true);
	});
});
