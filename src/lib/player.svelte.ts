/**
 * Who this browser is on the global board (Sprint 10c). There are no accounts (decision 6):
 *
 * - `geekster-device-id`: 32 random hex characters, made on the first run. The server stores it
 *   with each run and score, so the board can show a device's best and its rank. It is an
 *   identifier, not a credential: nothing is allowed by knowing it
 * - `geekster-player-name`: the display name. Missing = never asked; an empty string = asked
 *   on a result screen and not given (10c-1 asks once; `/leaderboard` can still set one)
 *
 * Clearing storage makes a new player, and that is accepted (decision 6).
 */

const DEVICE_KEY = 'geekster-device-id';
const NAME_KEY = 'geekster-player-name';

function read(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Blocked storage: the value lives for this page only
	}
}

let deviceId: string | null = null;

/** This browser's device id, made on first use; null on the server */
export function getDeviceId(): string | null {
	if (typeof window === 'undefined') return null;
	if (deviceId) return deviceId;
	const stored = read(DEVICE_KEY);
	if (stored && /^[0-9a-f]{32}$/.test(stored)) {
		deviceId = stored;
	} else {
		deviceId = crypto.randomUUID().replaceAll('-', '');
		write(DEVICE_KEY, deviceId);
	}
	return deviceId;
}

// Read once when the module loads in the browser; a server render has no name. A component
// that renders on the server reads it after hydration, or the two renders would disagree
const stored: { name: string | null } = $state({ name: read(NAME_KEY) });

/** The display name, or null without one (never asked, or declined) */
export function getPlayerName(): string | null {
	return stored.name ? stored.name : null;
}

/** Whether the result screen should still ask for a name: never asked and never declined */
export function shouldAskName(): boolean {
	return stored.name === null;
}

/** Stores a name that has passed `checkName()` */
export function setPlayerName(name: string): void {
	stored.name = name;
	write(NAME_KEY, name);
}

/** The result screen has asked: it won't again, whether a name is given or not */
export function markNameAsked(): void {
	if (stored.name) return;
	stored.name = '';
	write(NAME_KEY, '');
}
