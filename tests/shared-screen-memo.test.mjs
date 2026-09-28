import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../apps/designer-studio/shared-screen-memo.js', import.meta.url), 'utf8');
const sandbox = { globalThis: {} };
runInNewContext(source, sandbox);
const { renderChecklist, resolveYearlyPlan, renderYearlyPlan, version } = sandbox.globalThis.ACDLSharedMemo;

test('checklist preserves editor rows and escapes user supplied text', () => {
  assert.equal(version, '0.1.0-preview.1');
  const html = renderChecklist({ title: '<img src=x onerror=alert(1)>', itemCount: 9 });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.equal((html.match(/class="planner-check-row"/g) || []).length, 9);
  assert.match(html, /grid-template-rows:auto repeat\(9,1fr\)/);
  assert.equal((renderChecklist({ itemCount: 999 }).match(/class="planner-check-row"/g) || []).length, 20);
});

test('yearly plan keeps twelve months and the authored card or group layout', () => {
  for (const [layout, groupSize] of [
    ['yearly-open-grid', 0], ['yearly-month-cards', 0],
    ['yearly-vertical-groups', 3], ['yearly-horizontal-groups', 4],
  ]) {
    const model = resolveYearlyPlan({ title: '<Yearly Plan>', baseYear: 2027, startMonth: 3,
      yearlyLayoutType: layout, yearlyGroupSize: groupSize, linesPerMonth: 4 }, 2027);
    const html = renderYearlyPlan(model);
    assert.match(html, /3 MAR/);
    assert.match(html, /2 FEB · 2028/);
    assert.match(html, /&lt;Yearly Plan&gt;/);
    assert.equal((html.match(/<section>/g) || []).length, 12);
    assert.equal((html.match(/class="yearly-plan-group"/g) || []).length, groupSize ? 12 / groupSize : 0);
    assert.match(html, new RegExp(`yearly-layout-${layout}`));
  }
});
