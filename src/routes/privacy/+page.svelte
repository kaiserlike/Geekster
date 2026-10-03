<script lang="ts">
	import { resolve } from '$app/paths';
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { getLocale } from '$lib/i18n.svelte';
	import { OPERATOR, TAKEDOWN_DAYS } from '$lib/legal';

	// Every key the game writes into localStorage. A new key belongs here in the same commit
	const STORAGE_KEYS = [
		'geekster-locale',
		'geekster-mode',
		'geekster-leaderboard-normal',
		'geekster-leaderboard-pro',
		'geekster-leaderboard',
		'geekster-coach-seen'
	];

	const de = $derived(getLocale() === 'de');
</script>

<svelte:head>
	<title>{de ? 'Datenschutz' : 'Privacy'} — Geekster</title>
</svelte:head>

{#snippet address()}
	<p>
		<strong>{OPERATOR.name}</strong><br />
		{OPERATOR.street}<br />
		{OPERATOR.city}<br />
		{de ? OPERATOR.country.de : OPERATOR.country.en}<br />
		{de ? 'E-Mail' : 'Email'}: <a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>
	</p>
{/snippet}

{#snippet keys()}
	<ul>
		{#each STORAGE_KEYS as key (key)}
			<li><code class="text-ink text-sm">{key}</code></li>
		{/each}
	</ul>
{/snippet}

{#if de}
	<LegalPage title="Datenschutz">
		<h2>Kurz gesagt</h2>
		<p>
			Geekster braucht kein Konto, setzt für Spielerinnen und Spieler keine Cookies, verwendet keine
			Analyse- oder Tracking-Werkzeuge, zeigt keine Werbung und bettet keine Inhalte Dritter ein.
			Die Schriften werden von dieser Website selbst ausgeliefert, nicht von Google. Bei einem
			Seitenaufruf erhält außer dem Hosting-Anbieter niemand Daten.
		</p>

		<h2>Verantwortlicher</h2>
		{@render address()}

		<h2>Hosting</h2>
		<p>
			Die Website wird von Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, betrieben.
			Bei jedem Aufruf verarbeitet Vercel technisch notwendige Daten: IP-Adresse, Zeitpunkt,
			aufgerufene Adresse, Browser und Betriebssystem (User-Agent) und die zuvor besuchte Seite. Sie
			dienen der Auslieferung der Seite, der Fehlersuche und dem Schutz vor Missbrauch und werden
			nur kurz in Vercels Protokollen gespeichert. Die Screenshots liegen in Vercels Speicher
			(Vercel Blob, Rechenzentrum Frankfurt) und werden über Vercels Netz ausgeliefert.
		</p>
		<p>
			Rechtsgrundlage ist das berechtigte Interesse an einem sicheren und funktionierenden Betrieb
			(Art. 6 Abs. 1 lit. f DSGVO). Vercel kann Daten in den USA verarbeiten; die Übermittlung
			stützt sich auf das EU-US Data Privacy Framework (Art. 45 DSGVO) und die
			Standardvertragsklauseln in Vercels Auftragsverarbeitungsvertrag.
		</p>

		<h2>Läufe und globale Bestenliste</h2>
		<p>
			Der Server prüft jeden Zug: Während eines Laufs sendet das Spiel, an welche Stelle du eine
			Karte legst, und deinen Bonustipp. Der Server speichert dazu den Stand des Laufs unter einer
			zufälligen Kennung des Laufs: die Reihenfolge der Karten, Leben, Serie, Punkte, Modus, Beginn
			und Ende. Deine Tipps selbst werden nur bewertet, nicht gespeichert. Am Ende schreibt der
			Server das Ergebnis (Punkte, richtige und falsche Platzierungen, längste Serie, Modus) mit dem
			Zeitpunkt und dem Namen „Anonymous“ in die globale Bestenliste. Beides liegt in einer
			Datenbank bei Turso (Rechenzentrum Irland). Ein Name, eine IP-Adresse oder eine Kennung des
			Geräts wird dabei nicht gespeichert; ein Lauf oder Eintrag lässt sich keiner Person zuordnen.
		</p>

		<h2>Speicher im Browser</h2>
		<p>
			Das Spiel merkt sich im Speicher deines Browsers (localStorage) die Sprache, den gewählten
			Modus, deine eigenen Bestenlisten und ob du den Hinweis zum ersten Spiel schon gesehen hast:
		</p>
		{@render keys()}
		<p>
			Diese Daten verlassen deinen Browser nicht und sind für den von dir genutzten Dienst unbedingt
			erforderlich (§ 165 Abs. 3 TKG 2021). Du kannst sie jederzeit über die Einstellungen deines
			Browsers löschen.
		</p>

		<h2>Cookies</h2>
		<p>
			Für Spielerinnen und Spieler: keine. Nur der Betreiber erhält beim Anmelden im
			Verwaltungsbereich ein technisch notwendiges Sitzungs-Cookie (<code class="text-ink text-sm"
				>geekster_admin</code
			>, 12 Stunden gültig).
		</p>

		<h2>Keine Analyse</h2>
		<p>
			Geekster misst derzeit keine Besuche. Sollte sich das ändern, wird diese Seite vorher
			angepasst.
		</p>

		<h2>Deine Rechte</h2>
		<p>
			Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
			Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Schreib dazu an
			<a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>. Du kannst dich außerdem bei der
			Österreichischen Datenschutzbehörde beschweren: Barichgasse 40–42, 1030 Wien,
			<a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>.
		</p>

		<h2>Screenshots</h2>
		<p>
			Screenshots © der jeweiligen Rechteinhaber, Quelle: <a
				href="https://rawg.io"
				target="_blank"
				rel="noopener noreferrer">RAWG.io</a
			>. Dein Browser nimmt beim Spielen keine Verbindung zu RAWG auf. Rechteinhaber, die einen
			Screenshot entfernt haben möchten, schreiben an
			<a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>; er wird innerhalb von {TAKEDOWN_DAYS} Tagen
			entfernt.
		</p>

		<p>Siehe auch das <a href={resolve('/impressum')}>Impressum</a>.</p>
	</LegalPage>
{:else}
	<LegalPage title="Privacy">
		<h2>In short</h2>
		<p>
			Geekster needs no account, sets no cookies for players, uses no analytics or tracking, shows
			no ads and embeds nothing from third parties. The fonts are served by this site itself, not by
			Google. Nobody but the hosting provider receives anything from a page view.
		</p>

		<h2>Controller</h2>
		{@render address()}

		<h2>Hosting</h2>
		<p>
			The site is run by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. On every
			request Vercel processes what is technically needed: the IP address, the time, the address
			requested, the browser and operating system (user agent) and the referring page. It is used to
			deliver the page, to find errors and to prevent abuse, and it is kept only briefly in Vercel's
			logs. The screenshots are stored with Vercel (Vercel Blob, Frankfurt data centre) and
			delivered through Vercel's network.
		</p>
		<p>
			The legal basis is the legitimate interest in running the site securely and reliably (Art.
			6(1)(f) GDPR). Vercel may process data in the USA; the transfer rests on the EU-US Data
			Privacy Framework (Art. 45 GDPR) and the standard contractual clauses in Vercel's data
			processing agreement.
		</p>

		<h2>Runs and the global leaderboard</h2>
		<p>
			The server checks every move: during a run the game sends where you place a card and your
			bonus guess. The server keeps the run's state under a random run id: the order of the cards,
			lives, streak, score, mode, start and end. Your guesses are scored, not stored. At the end the
			server writes the result (score, right and wrong placements, best streak, mode) to the global
			leaderboard with the time and the name "Anonymous". Both are kept in a database at Turso
			(Ireland data centre). No name, IP address or device identifier is stored with them; a run or
			an entry cannot be linked to a person.
		</p>

		<h2>Storage in your browser</h2>
		<p>
			The game keeps the language, the chosen mode, your own leaderboards and whether you have seen
			the first-run hint in your browser's storage (localStorage):
		</p>
		{@render keys()}
		<p>
			This data never leaves your browser and is strictly necessary for the service you use (§
			165(3) of the Austrian Telecommunications Act 2021). You can delete it at any time in your
			browser's settings.
		</p>

		<h2>Cookies</h2>
		<p>
			For players: none. Only the operator gets a technically necessary session cookie when logging
			in to the admin area (<code class="text-ink text-sm">geekster_admin</code>, valid for 12
			hours).
		</p>

		<h2>No analytics</h2>
		<p>Geekster does not measure visits at the moment. If that changes, this page changes first.</p>

		<h2>Your rights</h2>
		<p>
			You have the right of access, rectification, erasure, restriction of processing, data
			portability and objection (Art. 15–21 GDPR). Write to
			<a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>. You can also complain to the Austrian
			Data Protection Authority: Barichgasse 40–42, 1030 Vienna,
			<a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>.
		</p>

		<h2>Screenshots</h2>
		<p>
			Screenshots © their respective rights holders, source: <a
				href="https://rawg.io"
				target="_blank"
				rel="noopener noreferrer">RAWG.io</a
			>. Your browser never connects to RAWG while you play. Rights holders who want a screenshot
			removed, please write to <a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>; it is removed
			within {TAKEDOWN_DAYS} days.
		</p>

		<p>See also the <a href={resolve('/impressum')}>legal notice</a>.</p>
	</LegalPage>
{/if}
