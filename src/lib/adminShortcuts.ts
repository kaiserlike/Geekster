/**
 * The keyboard on a game's admin page: ← and → step through the list, Esc goes
 * back to it. Typing, a modifier, an open dialog (the lightbox and the crop
 * step use the arrows themselves) or a key someone already handled always wins.
 */

export type AdminShortcut = 'previous' | 'next' | 'back';

export interface AdminKeyPress {
	key: string;
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	defaultPrevented: boolean;
	/** The focus is in a text field, a select or anything editable. */
	isTyping: boolean;
	/** A dialog is open, or the key came from inside one. */
	isInDialog: boolean;
}

const SHORTCUTS: Record<string, AdminShortcut> = {
	ArrowLeft: 'previous',
	ArrowRight: 'next',
	Escape: 'back'
};

export function adminShortcut(press: AdminKeyPress): AdminShortcut | null {
	if (press.defaultPrevented || press.isTyping || press.isInDialog) return null;
	if (press.altKey || press.ctrlKey || press.metaKey || press.shiftKey) return null;
	return SHORTCUTS[press.key] ?? null;
}
