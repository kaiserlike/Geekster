// The display name on the global board (Sprint 10c, decision 10c-2): length and character rules
// plus a short block list, checked the same way in the browser (instant feedback) and on the
// server (the name arrives from a client and is untrusted). The admin's delete is the backstop:
// no list catches everything, and this one is kept short on purpose.

export const NAME_MIN = 2;
export const NAME_MAX = 20;

/** Why a name was refused; each has a message in the translation table */
export type NameProblem = 'short' | 'long' | 'chars' | 'blocked';

export type NameCheck = { ok: true; name: string } | { ok: false; problem: NameProblem };

// Letters of any script, digits, and a space, dot, underscore or hyphen between them
const ALLOWED = /^[\p{L}\p{M}\p{N} ._-]+$/u;
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

// Leetspeak read back as letters before the block list is matched
const LEET: Record<string, string> = {
	'0': 'o',
	'1': 'i',
	'3': 'e',
	'4': 'a',
	'5': 's',
	'7': 't',
	'8': 'b',
	'9': 'g'
};

// Matched anywhere in the folded name: long or unambiguous enough that no harmless word
// contains them
const BLOCKED_ANYWHERE = [
	'nigger',
	'nigga',
	'faggot',
	'hitler',
	'heilhitler',
	'siegheil',
	'fotze',
	'wichser',
	'hurensohn',
	'arschloch',
	'schlampe',
	'motherfucker',
	'fuck',
	'cunt',
	'kanake',
	'schwuchtel',
	'untermensch',
	'judensau',
	'vergasen',
	'pedophile',
	'paedophil',
	'kinderficker'
];

// Matched only as a whole word: short ones that hide inside harmless names (Assassin, Ignazio,
// Bastian …)
const BLOCKED_WORDS = [
	'ass',
	'arsch',
	'bitch',
	'nazi',
	'nazis',
	'ss',
	'whore',
	'hure',
	'slut',
	'dick',
	'cock',
	'penis',
	'pussy',
	'rape',
	'fag',
	'retard',
	'spast',
	'fick',
	'ficken',
	'nutte'
];

// Refused only as the whole name: they would pass for the game's own ("Geekster Fan" is fine)
const RESERVED = ['anonymous', 'anonym', 'admin', 'administrator', 'moderator', 'geekster'];

/** Trimmed, inner whitespace collapsed to one space, in Unicode's composed form */
export function normalizeName(raw: string): string {
	return raw.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Lower case, accents dropped, leetspeak read as letters: what the block list is matched on */
function fold(name: string): string {
	return name
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/ß/g, 'ss')
		.replace(/[0-9]/g, (d) => LEET[d] ?? d);
}

function isBlocked(name: string): boolean {
	const folded = fold(name);
	const words = folded.split(/[ ._-]+/).filter(Boolean);
	const joined = words.join('');
	if (BLOCKED_ANYWHERE.some((term) => joined.includes(term))) return true;
	if (RESERVED.includes(joined)) return true;
	return BLOCKED_WORDS.some((term) => joined === term || words.includes(term));
}

/** The name as it will be stored, or why it can't be */
export function checkName(raw: string): NameCheck {
	const name = normalizeName(raw);
	const length = [...name].length;
	if (length < NAME_MIN) return { ok: false, problem: 'short' };
	if (length > NAME_MAX) return { ok: false, problem: 'long' };
	if (!ALLOWED.test(name) || !HAS_LETTER_OR_DIGIT.test(name))
		return { ok: false, problem: 'chars' };
	if (isBlocked(name)) return { ok: false, problem: 'blocked' };
	return { ok: true, name };
}
