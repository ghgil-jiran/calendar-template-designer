import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');

test('annual event list supports limited and full display modes', () => {
  assert.match(source, /id="eventListDisplayMode"/);
  assert.match(source, /<option value="all"[^>]*>전체 일정 표시<\/option>/);
  assert.match(source, /view\.displayMode==="all"\?allItems:allItems\.slice/);
});

test('poster event list defaults to full automatic fitting', () => {
  assert.match(source, /type:"event-list"[^\n]+displayMode:"all"[^\n]+columns:"auto"[^\n]+autoShrink:true/);
});

test('event list exposes automatic columns and bounded type controls', () => {
  assert.match(source, /<option value="auto"[^>]*>자동 · 개체 크기에 맞춤<\/option>/);
  assert.match(source, /id="eventListFontSize"/);
  assert.match(source, /id="eventListMinFontSize"/);
  assert.match(source, /id="eventListAutoShrink"/);
  assert.match(source, /while\(list\.scrollHeight>list\.clientHeight\+1&&font>minFont\)/);
});

test('overflow feedback is editor-only', () => {
  assert.match(source, /event-list-overflow-warning/);
  assert.match(source, /\.preview-only \.event-list-overflow-warning/);
  assert.match(source, /전체 \$\{count\}건 · 영역 초과/);
});
