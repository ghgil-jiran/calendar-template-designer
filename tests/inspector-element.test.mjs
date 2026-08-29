import assert from 'node:assert/strict';

await import('../apps/designer-studio/inspector-element.js');

const { apply } = globalThis.ACDLInspectorElement;
const text = { type: 'text', content: '기존', binding: 'school.name', style: {} };
apply(text, 'text-content', { content: '새 문구', binding: '' });
apply(text, 'text-style', { fontSize: '24', textAlign: 'center', color: '#123456', background: true });
assert.deepEqual(text, {
  type: 'text', content: '새 문구', binding: null,
  style: { fontSize: 24, textAlign: 'center', color: '#123456', background: true }
});

const image = { type: 'image', fit: 'cover', alt: '' };
apply(image, 'image-style', { fit: 'contain', alt: '학교 전경' });
assert.deepEqual(image, { type: 'image', fit: 'contain', alt: '학교 전경' });

const frame = { x: 90, y: -5, width: 20, height: 2 };
apply(frame, 'geometry', { x: '95', y: '-10', width: '20', height: '2' });
assert.deepEqual(frame, { x: 80, y: 0, width: 20, height: 3 });
apply(frame, 'geometry', { x: 'not-a-number', y: '', width: '200', height: '50' });
assert.deepEqual(frame, { x: 0, y: 0, width: 100, height: 50 });
