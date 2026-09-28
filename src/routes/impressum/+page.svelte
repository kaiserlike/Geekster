<script lang="ts">
	import { resolve } from '$app/paths';
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { getLocale } from '$lib/i18n.svelte';
	import { OPERATOR, TAKEDOWN_DAYS } from '$lib/legal';

	// The Impressum is an Austrian legal text, so the German version is the binding one; the
	// English one is a translation of it
	const de = $derived(getLocale() === 'de');
</script>

<svelte:head>
	<title>{de ? 'Impressum' : 'Legal notice'} — Geekster</title>
	<meta
		name="description"
		content="Impressum und Offenlegung von Geekster gemäß § 5 ECG und § 25 MedienG."
	/>
</svelte:head>

{#snippet address()}
	<p>
		<strong>{OPERATOR.name}</strong><br />
		{OPERATOR.street}<br />
		{OPERATOR.city}<br />
		{de ? OPERATOR.country.de : OPERATOR.country.en}
	</p>
	<p>
		{de ? 'E-Mail' : 'Email'}: <a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a>
	</p>
{/snippet}

{#if de}
	<LegalPage title="Impressum">
		<p>Informationen gemäß § 5 E-Commerce-Gesetz (ECG) und Offenlegung gemäß § 25 Mediengesetz.</p>

		<h2>Medieninhaber und Betreiber</h2>
		{@render address()}

		<h2>Unternehmensgegenstand und Blattlinie</h2>
		<p>
			Geekster ist ein privat und nicht kommerziell betriebenes Browserspiel: Spielerinnen und
			Spieler ordnen Videospiele anhand eines Screenshots nach ihrem Erscheinungsjahr. Die Website
			enthält keine Werbung und verfolgt keine meinungsbildende Absicht.
		</p>

		<h2>Screenshots und Spieldaten</h2>
		<p>
			Die Screenshots zeigen Spiele, deren Rechte bei den jeweiligen Entwicklern und Publishern
			liegen, und werden zur Kennzeichnung des jeweiligen Spiels verwendet. Screenshots © der
			jeweiligen Rechteinhaber, Quelle: <a
				href="https://rawg.io"
				target="_blank"
				rel="noopener noreferrer">RAWG.io</a
			>.
		</p>

		<h2>Entfernung auf Anfrage</h2>
		<p>
			Rechteinhaber, die mit der Verwendung eines Screenshots nicht einverstanden sind, schreiben
			bitte an <a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a> und nennen das Spiel und den
			Screenshot. Der Screenshot wird innerhalb von {TAKEDOWN_DAYS} Tagen nach Eingang der Nachricht entfernt.
		</p>

		<h2>Haftung für Links</h2>
		<p>
			Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.
			Bei Bekanntwerden einer Rechtsverletzung wird ein solcher Link umgehend entfernt.
		</p>

		<p>Datenschutz: siehe die <a href={resolve('/privacy')}>Datenschutzerklärung</a>.</p>
	</LegalPage>
{:else}
	<LegalPage title="Legal notice">
		<p>
			Information under § 5 of the Austrian E-Commerce Act (ECG) and disclosure under § 25 of the
			Austrian Media Act. This is a translation; the German version is binding.
		</p>

		<h2>Owner and operator</h2>
		{@render address()}

		<h2>Purpose</h2>
		<p>
			Geekster is a browser game run privately and without commercial interest: players put video
			games in order by their release year, from a screenshot. The site carries no advertising and
			has no editorial line.
		</p>

		<h2>Screenshots and game data</h2>
		<p>
			The screenshots show games whose rights belong to their developers and publishers, and are
			used to identify each game. Screenshots © their respective rights holders, source: <a
				href="https://rawg.io"
				target="_blank"
				rel="noopener noreferrer">RAWG.io</a
			>.
		</p>

		<h2>Removal on request</h2>
		<p>
			Rights holders who object to a screenshot being used, please write to
			<a href="mailto:{OPERATOR.email}">{OPERATOR.email}</a> naming the game and the screenshot. It
			is removed within {TAKEDOWN_DAYS} days of the message arriving.
		</p>

		<h2>Links</h2>
		<p>
			The operators of linked external sites are solely responsible for their content. A link is
			removed as soon as an infringement becomes known.
		</p>

		<p>Privacy: see the <a href={resolve('/privacy')}>privacy policy</a>.</p>
	</LegalPage>
{/if}
