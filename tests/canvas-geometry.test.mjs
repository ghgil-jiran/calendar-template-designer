import assert from 'node:assert/strict';

await import('../apps/designer-studio/canvas-geometry.js');

const { moveFrame, resizeFrame, rotateFrame, nudgeFrame } = globalThis.ACDLCanvasGeometry;
const frame = { x: 20, y: 30, width: 40, height: 25, rotation: 0 };

assert.deepEqual(moveFrame(frame, 10, -5), { x: 30, y: 25 });
assert.deepEqual(moveFrame(frame, 80, 90), { x: 99, y: 99 });
assert.deepEqual(moveFrame(frame, -50, -50), { x: -30, y: -20 });
assert.deepEqual(resizeFrame(frame, 'se', 10, 15), { x: 20, y: 30, width: 50, height: 40 });
assert.deepEqual(resizeFrame(frame, 'nw', 5, 10), { x: 25, y: 40, width: 35, height: 15 });
assert.deepEqual(resizeFrame(frame, 'w', 50, 0), { x: 70, y: 30, width: 3, height: 25 });
assert.deepEqual(resizeFrame(frame, 'n', 0, -50), { x: 20, y: -20, width: 40, height: 75 });
assert.equal(rotateFrame(0, 0, 10, { x: 0, y: 0 }, 0, false), 90);
assert.equal(rotateFrame(350, 10, 0, { x: 0, y: 0 }, Math.PI / 2, false), 260);
assert.deepEqual(nudgeFrame(frame, .2, -.2), { x: 20.2, y: 29.8 });
assert.deepEqual(nudgeFrame({ x: 99, y: 99, width: 40, height: 25 }, .2, .2), { x: 99, y: 99 });
