import assert from 'node:assert/strict';

await import('../apps/designer-studio/persistence-history.js');

const codec = globalThis.ACDLPersistenceHistory.createHistoryCodec();
const image = `data:image/png;base64,${'A'.repeat(4096)}`;
const project = { id: 'book', cover: image, pages: [{ image }] };
project.self = project;

const compact = codec.compact(project);
assert.deepEqual(compact.cover, { __acdlBinaryRef: 'bin-1' });
assert.deepEqual(compact.pages[0].image, { __acdlBinaryRef: 'bin-1' });
assert.equal(compact.self, null);
assert.equal(codec.binaryPool.size, 1);

const serialized = codec.stringify({ first: image, second: image });
assert.equal(codec.binaryPool.size, 1);
const restored = codec.parse(serialized);
assert.equal(restored.first, image);
assert.equal(restored.second, image);

assert.equal(codec.restore({ __acdlBinaryRef: 'missing' }), '');
assert.equal(codec.compact('short data:text/plain,value'), 'short data:text/plain,value');

// Pages are referenced both by sheets and by the ordered page list.
const front = { id: 'front', role: 'cover-front', image };
const back = { id: 'back', role: 'back-cover' };
const shared = { book: { sheets: [{ front, back }], pageInstances: [front, back] }, template: { firstPage: front } };
const roundTrip = codec.parse(codec.stringify(shared));
assert.deepEqual(roundTrip.book.pageInstances.map(page => page.id), ['front', 'back']);
assert.equal(roundTrip.book.sheets[0].front.image, image);
assert.equal(roundTrip.book.pageInstances[0].image, image);
assert.equal(roundTrip.template.firstPage.id, 'front');
assert.deepEqual(codec.parse(codec.stringify(roundTrip)), roundTrip);
const style = { color: '#123456' };
assert.deepEqual(codec.parse(codec.stringify({ elements: [{ style }, { style }] })).elements[1].style, style);
