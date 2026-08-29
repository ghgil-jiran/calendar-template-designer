import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../apps/designer-studio/schedule-file-parser.js');

const { rowsToScheduleText, worksheetRows } = globalThis.ACDLScheduleFileParser;

const text = rowsToScheduleText([
  ['2028년 3월'],
  ['3일', '개학식'],
  ['4일-12일', '학급공동체 세우기주간'],
  ['5', '학부모연수'],
  ['2028.04.02', '과학의 날']
], 2028);

assert.match(text, /2028년 3월/);
assert.match(text, /3일 : 개학식/);
assert.match(text, /3월 4일-3월 12일 : 학급공동체 세우기주간/);
assert.match(text, /5일 : 학부모연수/);
assert.match(text, /2028년 4월/);
assert.match(text, /2일 : 과학의 날/);

const xml = '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>개학식</t></is></c></row></sheetData></worksheet>';
assert.deepEqual(worksheetRows(xml, ['3일']), [['3일', '개학식']]);

const studio = await readFile(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
assert.match(studio, /schedule-file-parser\.js/);
assert.match(studio, /ACDLScheduleFileParser\.extractText\(file,year\)/);
assert.match(studio, /accept="\.xlsx,\.csv,\.txt"/);
assert.doesNotMatch(studio, /샘플 일정 파일 등록<\/button><input id="resourceScheduleInput"[^>]*\.doc/);
