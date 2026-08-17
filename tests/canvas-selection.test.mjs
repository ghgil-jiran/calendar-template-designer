import assert from 'node:assert/strict';

await import('../apps/designer-studio/canvas-selection.js');

const items = new Map([
  ['page:first', { id: 'first' }],
  ['page:second', { id: 'second' }],
  ['master:title:ko', { id: 'title:ko' }]
]);
const selection = globalThis.ACDLCanvasSelection.createSelectionStore((id, scope) => items.get(`${scope}:${id}`));

assert.deepEqual(selection.selectOnly('first', 'page'), { id: 'first', scope: 'page' });
assert.deepEqual(selection.views().map(view => view.id), ['first']);
assert.deepEqual(selection.toggle('second', 'page', { id: 'first', scope: 'page' }), { id: 'second', scope: 'page' });
assert.deepEqual(selection.views().map(view => view.id), ['first', 'second']);
assert.deepEqual(selection.toggle('second', 'page', { id: 'second', scope: 'page' }), { id: 'first', scope: 'page' });
assert.deepEqual(selection.selectOnly('title:ko', 'master'), { id: 'title:ko', scope: 'master' });
assert.deepEqual(selection.views().map(view => [view.scope, view.id]), [['master', 'title:ko']]);

selection.replace([{ id: 'first', scope: 'page' }, { id: 'second', scope: 'page' }]);
items.delete('page:first');
assert.deepEqual(selection.sync({ id: 'second', scope: 'page' }), { id: 'second', scope: 'page' });
assert.deepEqual(selection.views().map(view => view.id), ['second']);

assert.deepEqual(selection.sync({ id: 'new-object', scope: 'page' }), { id: 'new-object', scope: 'page' });
assert.equal(selection.has(selection.key('second', 'page')), false);
assert.equal(selection.has(selection.key('new-object', 'page')), true);
assert.equal(selection.toggle('new-object', 'page', { id: 'new-object', scope: 'page' }), null);
assert.deepEqual(selection.views(), []);
