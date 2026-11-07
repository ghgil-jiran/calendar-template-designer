import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewCatalog, pageLabel} from '../src/server/review-catalog.ts';
test('review records cannot be mistaken for released templates', () => {
  const catalog = reviewCatalog();
  assert.equal(catalog.mode, 'review');
  assert.equal(new Set(catalog.templates.map(item => item.id)).size, 5);
  assert.ok(catalog.templates.every(item => item.id.startsWith('review-')));
  assert.ok(catalog.templates.filter(item => item.previewKind === 'shared-example').every(item => /예시|가정/.test(item.note)));
});
test('page composition and preview navigation describe the same calendar', () => {
  for (const template of reviewCatalog().templates) {
    assert.equal(template.composition.reduce((sum, item) => sum + item.count, 0), template.pageCount);
    assert.equal(template.pages.length, template.pageCount);
    assert.equal(template.pages[3].label, '3월 월력 뒷면');
    assert.equal(template.pages[26].label, '2월 월력 앞면');
    assert.equal(template.pages[27].label, '뒷표지');
  }
  assert.equal(pageLabel(5), '3월 월력 앞면');
});
test('one response cannot mutate later requests or another templates field settings', () => {
  const first = reviewCatalog(); first.templates[0].fields[0].required = false;
  assert.equal(first.templates[1].fields[0].required, true);
  assert.equal(reviewCatalog().templates[0].fields[0].required, true);
});
