/**
 * The operator's details for the Impressum and the privacy page (Sprint 9g). Austrian law applies:
 * § 5 ECG, § 25 MedienG and the GDPR with the Austrian DSG. The texts are the operator's
 * responsibility; a change here changes both pages.
 */
export const OPERATOR = {
	name: 'Franz Dietrich',
	street: 'Heinrich von Kleist-Gasse 18/4',
	city: '2232 Deutsch-Wagram',
	country: { de: 'Österreich', en: 'Austria' },
	email: 'franzdietrich@gmx.at'
} as const;

/** A screenshot a rights holder objects to is removed within this many days */
export const TAKEDOWN_DAYS = 14;

/** The date both pages were last changed, shown under their heading (ISO) */
export const LEGAL_UPDATED = '2026-09-28';
