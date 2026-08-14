import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/desk-academic-visual-parity.js');
const parity = globalThis.ACDLDeskAcademicVisualParity;

const calendar = '<section data-calendar-rows="5">' + Array.from({ length: 35 }, () => '<div class="shadow-calendar-cell"></div>').join('') + '</section>';
const photoMemo = '<section data-layout="photo-1.7-memo-1">' + Array.from({ length: 6 }, () => '<div class="shadow-memo-line has-rule"></div>').join('') + '<div class="shadow-memo-line"></div></section>';
const pages = [
  ...Array.from({ length: 3 }, () => ({ role: 'support', html: '' })),
  ...Array.from({ length: 12 }, () => ({ role: 'monthly-calendar', html: calendar })),
  ...Array.from({ length: 12 }, () => ({ role: 'monthly-photo-memo', html: photoMemo })),
  { role: 'back-contact', html: '<section class="shadow-contact-card"></section>' }
];
const report = parity.compare({ pageCount: 28, pages });
assert.equal(parity.REFERENCE.productionSize.width, 266);
assert.equal(parity.REFERENCE.productionSize.height, 186);
assert.equal(report.structurallyReady, true);
assert.equal(report.visuallyApproved, false);
assert.deepEqual(report.issues, []);
const approved = parity.compare({ pageCount: 28, pages }, { visual: { status: 'approved' } });
assert.equal(approved.visuallyApproved, true);

const broken = parity.compare({ pages: pages.map((page, index) => index === 3 ? { ...page, html: page.html.replace('data-calendar-rows="5"', 'data-calendar-rows="6"') } : page) });
assert.ok(broken.issues.some(issue => issue.code === 'VISUAL_CALENDAR_ROWS'));

const css = await readFile(new URL('../apps/designer-studio/desk-academic-shadow-renderer.css', import.meta.url), 'utf8');
assert.match(css, /grid-template-rows:auto repeat\(5/);
assert.match(css, /flex:1\.7/);
assert.match(css, /\[data-screen-only\]/);
assert.match(css, /사진 미등록 · 화면 안내/);

const qa = await readFile(new URL('../apps/designer-studio/desk-academic-visual-parity.html', import.meta.url), 'utf8');
assert.match(qa, /학사달력 에디터 서비스 v1\.1 시각 비교/);
assert.match(qa, /육안 승인 전/);
assert.match(qa, /sampleImage/);
assert.match(qa, /back\.badge/);
