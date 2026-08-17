import assert from 'node:assert/strict';

await import('../apps/designer-studio/preview-state.js');

const state = globalThis.ACDLPreviewState;
const project = { book: { pageInstances: [{ id: 'cover' }, { id: 'march' }] } };
assert.deepEqual(state.pages(project), project.book.pageInstances);
assert.deepEqual(state.pages(null), []);
assert.equal(state.repairPageId(project, 'march'), 'march');
assert.equal(state.repairPageId(project, 'missing'), 'cover');
assert.equal(state.repairPageId({ book: { pageInstances: [] } }, 'missing'), null);

const captured = state.capture({ pageId: 'march', elementId: 'title', scope: 'page', calendarEditing: true, preview: true, previewType: 'page' });
assert.deepEqual(captured, { pageId: 'march', elementId: 'title', scope: 'page', calendarEditing: true, preview: true, previewType: 'page' });
assert.deepEqual(state.restore(project, captured), {
  pageId: 'march', elementId: 'title', scope: 'page', calendarEditing: true, preview: false, previewType: null
});
assert.deepEqual(state.restore(project, { ...captured, pageId: 'removed' }), {
  pageId: 'cover', elementId: 'title', scope: 'page', calendarEditing: true, preview: false, previewType: null
});

const calls = [];
const source = {
  dataset: {}, style: {},
  removeAttribute: name => calls.push(['root-remove-attribute', name]),
  classList: { add: name => calls.push(['root-add-class', name]) },
  querySelectorAll: selector => {
    if (selector === '[id]') return [{ removeAttribute: name => calls.push(['child-remove-attribute', name]) }];
    if (selector.startsWith('.editor-only')) return [{ remove: () => calls.push(['remove-editor-node']) }];
    if (selector.startsWith('.selected')) return [{ classList: { remove: (...names) => calls.push(['remove-state-classes', ...names]) } }];
    return [];
  }
};
const live = { offsetWidth: 800, offsetHeight: 500, cloneNode: deep => { calls.push(['clone', deep]); return source; } };
const cloned = state.clonePage(live, { role: 'monthly-front' });
assert.equal(cloned, source);
assert.deepEqual(cloned.dataset, { previewWidth: '800', previewHeight: '500' });
assert.deepEqual(cloned.style, { width: '800px', height: '500px' });
assert.ok(calls.some(call => call[0] === 'remove-editor-node'));
assert.ok(calls.some(call => call[0] === 'remove-state-classes'));

const posterSource = { ...source, dataset: {}, style: {} };
const posterLive = { offsetWidth: 1, offsetHeight: 1, cloneNode: () => posterSource };
state.clonePage(posterLive, { role: 'poster-annual' });
assert.deepEqual(posterSource.dataset, { previewWidth: '720', previewHeight: '1018' });
