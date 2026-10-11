// The encyclopedia's rules, pure: which years have a page and how the index groups them.

/** The years with a written page, oldest first (decision 12-5) */
export function writtenYears(texts: Readonly<Record<number, unknown>>): number[] {
	return Object.keys(texts)
		.map(Number)
		.filter(Number.isInteger)
		.sort((a, b) => a - b);
}

/** 1998 → 1990 */
export function decadeOf(year: number): number {
	return Math.floor(year / 10) * 10;
}

export interface Decade<T> {
	decade: number;
	years: T[];
}

/** Sorted years grouped into their decades, oldest first; empty decades are left out */
export function groupByDecade<T extends { year: number }>(years: readonly T[]): Decade<T>[] {
	const decades: Decade<T>[] = [];
	for (const entry of years) {
		const decade = decadeOf(entry.year);
		const last = decades.at(-1);
		if (last?.decade === decade) last.years.push(entry);
		else decades.push({ decade, years: [entry] });
	}
	return decades;
}
