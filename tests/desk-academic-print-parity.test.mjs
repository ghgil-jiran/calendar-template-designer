import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/desk-academic-print-parity.js');
const parity = globalThis.ACDLDeskAcademicPrintParity;
const base = new URL('../templates/desk-academic-standard/1.0.0/', import.meta.url);
const profile = JSON.parse(await readFile(new URL('print.json', base), 'utf8'));
const approval = JSON.parse(await readFile(new URL('parity.json', base), 'utf8'));

const report = parity.compare(profile, approval);
assert.equal(report.contractReady, true);
assert.equal(report.outputApproved, false);
assert.deepEqual(report.issues, []);
assert.ok(report.blockers.includes('REFERENCE_PDF_NOT_ATTACHED'));

const outdated = parity.compare({ ...profile, pdfStandard: 'PDF/X-3' }, approval);
assert.equal(outdated.contractReady, false);
assert.ok(outdated.issues.some(issue => issue.code === 'PRINT_PDF_STANDARD_MISMATCH'));

const approved = parity.compare(profile, { print: { status: 'approved', blockers: [] } });
assert.equal(approved.outputApproved, true);
assert.deepEqual(approved.blockers, []);
