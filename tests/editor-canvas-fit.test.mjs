import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/editor-canvas-fit.js');

const { fixedCanvasViewport } = globalThis.ACDLEditorCanvasFit;

test('desk editor keeps one design canvas across browser widths', () => {
  const wide = fixedCanvasViewport({ pageWidth: 260, pageHeight: 180, availableWidth: 1000, availableHeight: 700 });
  const narrow = fixedCanvasViewport({ pageWidth: 260, pageHeight: 180, availableWidth: 460, availableHeight: 700 });
  assert.equal(wide.designWidth, 850);
  assert.equal(narrow.designWidth, 850);
  assert.equal(wide.designHeight, narrow.designHeight);
  assert.equal(wide.scale, 1);
  assert.equal(narrow.scale, .55);
  assert.equal(narrow.displayWidth, 467.50000000000006);
});

test('portrait products keep their fixed design canvas and fit both axes', () => {
  const wide = fixedCanvasViewport({ pageWidth: 297, pageHeight: 420, availableWidth: 900, availableHeight: 900 });
  const narrow = fixedCanvasViewport({ pageWidth: 297, pageHeight: 420, availableWidth: 500, availableHeight: 650 });
  assert.equal(wide.designWidth, 720);
  assert.equal(narrow.designWidth, 720);
  assert.equal(wide.designHeight, narrow.designHeight);
  assert.equal(wide.fitAxis, 'height');
  assert.ok(narrow.scale < wide.scale);
});

test('invalid print sizes are rejected before changing the editor canvas', () => {
  assert.throws(() => fixedCanvasViewport({ pageWidth: 0, pageHeight: 180, availableWidth: 900, availableHeight: 700 }), /positive print page size/);
});
