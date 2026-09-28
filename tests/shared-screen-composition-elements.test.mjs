import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-composition.js';
const composition = globalThis.ACDLSharedScreenComposition;

test('master shadow, neutral background, and generated back composition use the same visibility and layer order', () => {
  const page = { aiDesignBase: { mode: 'neutral' }, aiMonthBackComposition: { mode: 'generated-layout' } };
  const masters = [
    { id: 'backdrop', role: 'background-decoration', zIndex: 0 },
    { id: 'memo', type: 'memo', zIndex: 1 },
    { id: 'hidden', type: 'text', zIndex: 2 },
    { id: 'kept', type: 'text', zIndex: 5 },
  ];
  const locals = [{ id: 'replacement', shadowOfMasterElementId: 'hidden', zIndex: 3 }];
  assert.deepEqual(composition.visibleElements(page, masters, locals).map(e => [e.id, e._scope]), [
    ['replacement', 'page'], ['kept', 'master'],
  ]);
});

test('authored frames survive conversions across page sizes and preserve deliberate bleed', () => {
  for (const size of [{ width: 260, height: 180 }, { width: 320, height: 120 }, { width: 420, height: 594 }]) {
    const authored = { x: -5, y: 12, width: 110, height: 79 };
    assert.deepEqual(composition.frameToPercent(composition.frameFromPercent(authored, size), size), authored);
  }
});
