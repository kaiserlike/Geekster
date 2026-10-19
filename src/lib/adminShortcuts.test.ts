import { describe, expect, it } from 'vitest';
import { adminShortcut, type AdminKeyPress } from './adminShortcuts';

const press = (key: string, extra: Partial<AdminKeyPress> = {}): AdminKeyPress => ({
	key,
	altKey: false,
	ctrlKey: false,
	metaKey: false,
	shiftKey: false,
	defaultPrevented: false,
	isTyping: false,
	isInDialog: false,
	...extra
});

describe("a game page's keyboard", () => {
	it('steps with the arrows and goes back with Esc', () => {
		expect(adminShortcut(press('ArrowLeft'))).toBe('previous');
		expect(adminShortcut(press('ArrowRight'))).toBe('next');
		expect(adminShortcut(press('Escape'))).toBe('back');
	});

	it('ignores every other key', () => {
		expect(adminShortcut(press('ArrowUp'))).toBeNull();
		expect(adminShortcut(press('Enter'))).toBeNull();
		expect(adminShortcut(press('j'))).toBeNull();
	});

	it('leaves the arrows to a text field being typed in', () => {
		expect(adminShortcut(press('ArrowLeft', { isTyping: true }))).toBeNull();
		expect(adminShortcut(press('Escape', { isTyping: true }))).toBeNull();
	});

	it('leaves the arrows and Esc to an open dialog', () => {
		expect(adminShortcut(press('ArrowRight', { isInDialog: true }))).toBeNull();
		expect(adminShortcut(press('Escape', { isInDialog: true }))).toBeNull();
	});

	it('leaves a key someone already handled alone', () => {
		expect(adminShortcut(press('ArrowLeft', { defaultPrevented: true }))).toBeNull();
	});

	it('leaves modified keys to the browser (Alt+← is history back)', () => {
		expect(adminShortcut(press('ArrowLeft', { altKey: true }))).toBeNull();
		expect(adminShortcut(press('ArrowRight', { metaKey: true }))).toBeNull();
		expect(adminShortcut(press('ArrowRight', { ctrlKey: true }))).toBeNull();
		expect(adminShortcut(press('ArrowRight', { shiftKey: true }))).toBeNull();
	});
});
