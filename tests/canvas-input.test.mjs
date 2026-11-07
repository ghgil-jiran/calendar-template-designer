import assert from 'node:assert/strict';

await import('../apps/designer-studio/canvas-input.js');

const { capturePointer, keyboardCommand } = globalThis.ACDLCanvasInput;
const calls = [];
const listeners = new Map();
const node = {
  setPointerCapture: id => calls.push(['capture', id]),
  releasePointerCapture: id => calls.push(['release', id]),
  addEventListener: (name, handler, options) => { listeners.set(name, handler); calls.push(['add', name, options?.once === true]); },
  removeEventListener: (name, handler) => { assert.equal(listeners.get(name), handler); calls.push(['remove', name]); }
};
const move = () => {};
const end = () => {};
const release = capturePointer(node, 7, { move, end });
assert.deepEqual(calls.slice(0, 4), [
  ['capture', 7],
  ['add', 'pointermove', false],
  ['add', 'pointerup', true],
  ['add', 'pointercancel', true]
]);
release();
assert.deepEqual(calls.slice(4), [
  ['release', 7],
  ['remove', 'pointermove'],
  ['remove', 'pointerup'],
  ['remove', 'pointercancel']
]);

assert.equal(keyboardCommand({ key: 'Delete' }, 'input', true), null);
assert.deepEqual(keyboardCommand({ key: 'a', ctrlKey: true }, 'DIV', false), { type: 'select-all' });
assert.equal(keyboardCommand({ key: 'Delete' }, 'DIV', false), null);
assert.deepEqual(keyboardCommand({ key: 'Backspace' }, 'DIV', true), { type: 'delete' });
assert.deepEqual(keyboardCommand({ key: 'ArrowLeft' }, 'DIV', true), { type: 'nudge', deltaX: -.2, deltaY: 0 });
assert.deepEqual(keyboardCommand({ key: 'ArrowDown', shiftKey: true }, 'DIV', true), { type: 'nudge', deltaX: 0, deltaY: 1 });
