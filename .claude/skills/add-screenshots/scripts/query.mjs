// Read-only SQL against a stage. Usage: node query.mjs "<SELECT …>" [--target=production]
import { db } from './lib.mjs';

const sql = process.argv[2];
const target = process.argv.find((a) => a.startsWith('--target='))?.split('=')[1] ?? 'production';
if (!/^\s*(select|with)\b/i.test(sql ?? '')) throw new Error('Read-only: SELECT or WITH only.');
const r = await db(target).execute(sql);
console.log(
	JSON.stringify(r.rows.map((row) => Object.fromEntries(r.columns.map((c) => [c, row[c]]))))
);
