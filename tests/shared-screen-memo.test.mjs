import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../apps/designer-studio/shared-screen-memo.js', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
runInNewContext(source, sandbox);
const { renderChecklist, version } = sandbox.globalThis.ACDLSharedMemo;

test('checklist preserves editor rows and escapes user supplied text', () => {
  assert.equal(version, '0.1.0-preview.1');
  const html = renderChecklist({ title: '<img src=x onerror=alert(1)>', itemCount: 9 });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.equal((html.match(/class="planner-check-row"/g) || []).length, 9);
  assert.match(html, /grid-template-rows:auto repeat\(9,1fr\)/);
  assert.equal((renderChecklist({ itemCount: 999 }).match(/class="planner-check-row"/g) || []).length, 20);
});
