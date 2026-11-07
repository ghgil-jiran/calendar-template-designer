import assert from 'node:assert/strict';

await import('../apps/designer-studio/canvas-geometry.js');
await import('../apps/designer-studio/canvas-gesture.js');

const primaryItem = { id: 'first', x: 10, y: 20, width: 30, height: 20, rotation: 0 };
const secondaryItem = { id: 'second', x: 60, y: 70, width: 30, height: 20, rotation: 0 };
const rect = { left: 100, top: 50, width: 1000, height: 500 };
const gesture = globalThis.ACDLCanvasGesture.begin({
  pointerId: 1,
  startX: 200,
  startY: 100,
  handle: 'move',
  rect,
  views: [{ id: 'first', scope: 'page', item: primaryItem }, { id: 'second', scope: 'page', item: secondaryItem }],
  primary: { id: 'first', scope: 'page', item: primaryItem },
  node: {}
});

assert.equal(gesture.changed, false);
assert.deepEqual(gesture.originals.map(view => [view.original.x, view.original.y]), [[10, 20], [60, 70]]);
globalThis.ACDLCanvasGesture.update(gesture, { clientX: 300, clientY: 150, shiftKey: false });
assert.equal(gesture.changed, true);
assert.deepEqual([primaryItem.x, primaryItem.y], [20, 30]);
assert.deepEqual([secondaryItem.x, secondaryItem.y], [70, 80]);
assert.deepEqual(globalThis.ACDLCanvasGesture.finish(gesture), {
  changed: true,
  discardSnapshot: false,
  message: 'Canvas에서 개체 편집 결과를 반영했습니다.'
});

const resizeItem = { id: 'resize', x: 20, y: 20, width: 40, height: 30, rotation: 0 };
const resize = globalThis.ACDLCanvasGesture.begin({ pointerId: 2, startX: 0, startY: 0, handle: 'se', rect: { left: 0, top: 0, width: 100, height: 100 }, views: [{ id: 'resize', scope: 'page', item: resizeItem }], primary: { id: 'resize', scope: 'page', item: resizeItem }, node: {} });
globalThis.ACDLCanvasGesture.update(resize, { clientX: 10, clientY: 20, shiftKey: false });
assert.deepEqual([resizeItem.x, resizeItem.y, resizeItem.width, resizeItem.height], [20, 20, 50, 50]);

const rotateItem = { id: 'rotate', x: 0, y: 0, width: 20, height: 20, rotation: 0 };
const rotate = globalThis.ACDLCanvasGesture.begin({ pointerId: 3, startX: 20, startY: 10, handle: 'rotate', rect: { left: 0, top: 0, width: 100, height: 100 }, views: [{ id: 'rotate', scope: 'page', item: rotateItem }], primary: { id: 'rotate', scope: 'page', item: rotateItem }, node: {} });
globalThis.ACDLCanvasGesture.update(rotate, { clientX: 10, clientY: 20, shiftKey: false });
assert.equal(rotateItem.rotation, 90);

const untouched = globalThis.ACDLCanvasGesture.begin({ pointerId: 4, startX: 0, startY: 0, handle: 'move', rect, views: [{ id: 'first', scope: 'page', item: primaryItem }], primary: { id: 'first', scope: 'page', item: primaryItem }, node: {} });
assert.deepEqual(globalThis.ACDLCanvasGesture.finish(untouched), {
  changed: false,
  discardSnapshot: true,
  message: '개체를 선택했습니다.'
});
