<script lang="ts">
	import { onMount } from 'svelte';
	import { tf, ts } from '$lib/i18n.svelte';
	import { fly } from '$lib/motion';
	import { MAX_NAME_BONUS, MAX_YEAR_BONUS } from '$lib/scoring';
	import Button from './ui/Button.svelte';
	import Surface from './ui/Surface.svelte';
	import TextField from './ui/TextField.svelte';

	interface Props {
		/** The guess is with the server: no second one (Sprint 10b) */
		busy?: boolean;
		/** …for longer than a normal round trip: the button shows it */
		slow?: boolean;
		onSubmit: (yearGuess: number | null, nameGuess: string | null) => void;
		onSkip: () => void;
		/**
		 * A field has focus on a touch screen, i.e. the phone keyboard is up: the HUD collapses
		 * into the header (9a's design call), so the panel and its buttons fit above the keyboard
		 */
		onKeyboard?: (open: boolean) => void;
	}

	let { busy = false, slow = false, onSubmit, onSkip, onKeyboard }: Props = $props();

	const TIME_LIMIT = 30;
	// Announced once each, never every second (U13); from the last one on, the timer is red
	const ANNOUNCE_AT = [10, 5];
	const WARN_AT = 5;

	let yearInput: string = $state('');
	let nameInput: string = $state('');
	let timeLeft: number = $state(TIME_LIMIT);
	let announcement: string = $state('');
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	const warning = $derived(timeLeft <= WARN_AT);

	onMount(() => {
		// Only a fine pointer gets the year field focused at once: on a phone that would open the
		// keyboard over the screen as the timer starts (U12). There the player taps a field
		if (window.matchMedia('(pointer: fine)').matches) {
			document.getElementById('year-guess')?.focus({ preventScroll: true });
		}

		timerInterval = setInterval(() => {
			timeLeft--;
			if (ANNOUNCE_AT.includes(timeLeft)) {
				announcement = tf<(n: number) => string>('bonus.secondsLeft')(timeLeft);
			}
			if (timeLeft <= 0) handleSubmit();
		}, 1000);

		return () => {
			stopTimer();
			onKeyboard?.(false);
		};
	});

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function handleSubmit() {
		if (busy) return;
		stopTimer();
		const yearStr = yearInput.trim();
		const nameGuess = nameInput.trim() || null;
		const yearGuess = /^\d{1,4}$/.test(yearStr) ? parseInt(yearStr, 10) : null;
		onSubmit(yearGuess, nameGuess);
	}

	function handleSkip() {
		if (busy) return;
		stopTimer();
		onSkip();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	// A touch keyboard is up while a field has focus on a coarse pointer
	function handleFocusIn() {
		if (window.matchMedia('(pointer: coarse)').matches) onKeyboard?.(true);
	}
	function handleFocusOut(e: FocusEvent) {
		const next = e.relatedTarget;
		if (next instanceof HTMLInputElement && e.currentTarget instanceof Node) {
			if ((e.currentTarget as Node).contains(next)) return;
		}
		onKeyboard?.(false);
	}
</script>

<div in:fly={{ y: 30, duration: 300 }} onfocusin={handleFocusIn} onfocusout={handleFocusOut}>
	<Surface as="section" frame="magenta" class="flex flex-col gap-3" padding="none">
		<div class="flex flex-col gap-3 px-3.5 py-3">
			<div class="font-ui flex items-center justify-between text-sm font-bold tracking-[1.5px]">
				<h2 class="text-pink uppercase">{ts('bonus.round')}</h2>
				<!-- The count itself stays silent; the live region below speaks at 10 s and 5 s -->
				<span class="tabular {warning ? 'text-danger' : 'text-ink'}" aria-hidden="true">
					{tf<(n: number) => string>('bonus.seconds')(timeLeft)}
				</span>
			</div>
			<p class="sr-only" role="status" aria-live="polite">{announcement}</p>

			<div class="bg-accent-soft h-1.5 overflow-hidden rounded-full" aria-hidden="true">
				<div
					class="h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none {warning
						? 'bg-danger shadow-[0_0_8px_rgb(255_77_109/0.8)]'
						: 'bg-accent shadow-glow-segment'}"
					style="width: {(timeLeft / TIME_LIMIT) * 100}%"
				></div>
			</div>

			<div class="grid grid-cols-2 gap-2.5">
				<!-- Never type="number": it changes its value on a scroll-wheel turn (U12) -->
				<TextField
					id="year-guess"
					label={ts('bonus.releaseYear')}
					bind:value={yearInput}
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength={4}
					autocomplete="off"
					placeholder={ts('bonus.yearPlaceholder')}
					onkeydown={handleKeydown}
				/>
				<TextField
					id="name-guess"
					label={ts('bonus.gameName')}
					bind:value={nameInput}
					autocomplete="off"
					autocapitalize="off"
					spellcheck={false}
					enterkeyhint="done"
					placeholder={ts('bonus.namePlaceholder')}
					onkeydown={handleKeydown}
				/>
			</div>
			<p class="text-ink-muted text-[13px]">
				{tf<(y: number, n: number) => string>('bonus.hint')(MAX_YEAR_BONUS, MAX_NAME_BONUS)}
			</p>

			<!-- Wraps at 320 px, where "Überspringen" doesn't fit beside "Aufdecken" -->
			<div class="flex flex-wrap gap-2">
				<Button
					variant="primary"
					size="sm"
					class="min-h-12 flex-[3_1_10rem]"
					loading={slow}
					onclick={handleSubmit}
				>
					{ts('bonus.reveal')}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					class="min-h-12 flex-[1_1_auto]"
					disabled={busy}
					onclick={handleSkip}
				>
					{ts('bonus.skip')}
				</Button>
			</div>
		</div>
	</Surface>
</div>
