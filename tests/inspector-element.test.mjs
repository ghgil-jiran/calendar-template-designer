import assert from 'node:assert/strict';

await import('../apps/designer-studio/inspector-element.js');

const { apply } = globalThis.ACDLInspectorElement;
const text = { type: 'text', content: '기존', binding: 'school.name', style: {} };
apply(text, 'text-content', { content: '새 문구', binding: '' });
apply(text, 'text-style', {
  fontFamily: 'Noto Serif KR', fontSize: '24', fontWeight: '800', fontStyle: 'italic', underline: true, strike: true,
  textAlign: 'justify', verticalAlign: 'bottom', color: '#123456', letterSpacing: '-1.5', lineHeight: '1.65', opacity: '.75',
  background: true, backgroundColor: '#fff8dc', strokeWidth: '1.5', strokeColor: '#ffffff', shadow: true,
  shadowX: '2', shadowY: '3', shadowBlur: '4', shadowColor: '#334455'
});
assert.deepEqual(text, {
  type: 'text', content: '새 문구', binding: null,
  style: {
    fontFamily: 'Noto Serif KR', fontSize: 24, fontWeight: 800, fontStyle: 'italic', textDecoration: 'underline line-through',
    textAlign: 'justify', verticalAlign: 'bottom', color: '#123456', letterSpacing: -1.5, lineHeight: 1.65, opacity: .75,
    background: true, backgroundColor: '#fff8dc', strokeWidth: 1.5, strokeColor: '#ffffff', shadow: true,
    shadowX: 2, shadowY: 3, shadowBlur: 4, shadowColor: '#334455'
  }
});

const boundedText = { type: 'text', style: {} };
apply(boundedText, 'text-style', { fontSize: '500', fontWeight: '1200', textAlign: 'invalid', verticalAlign: 'invalid', letterSpacing: '-30', lineHeight: '8', opacity: '2', strokeWidth: '20', shadowX: '-80', shadowY: '80', shadowBlur: '100' });
assert.equal(boundedText.style.fontSize, 240);
assert.equal(boundedText.style.fontWeight, 900);
assert.equal(boundedText.style.textAlign, 'left');
assert.equal(boundedText.style.verticalAlign, 'top');
assert.equal(boundedText.style.letterSpacing, -20);
assert.equal(boundedText.style.lineHeight, 4);
assert.equal(boundedText.style.opacity, 1);
assert.equal(boundedText.style.strokeWidth, 10);
assert.equal(boundedText.style.shadowX, -50);
assert.equal(boundedText.style.shadowY, 50);
assert.equal(boundedText.style.shadowBlur, 50);

const image = { type: 'image', fit: 'cover', alt: '' };
apply(image, 'image-style', { fit: 'contain', alt: '학교 전경' });
assert.deepEqual(image, { type: 'image', fit: 'contain', alt: '학교 전경' });

const frame = { x: 90, y: -5, width: 20, height: 2 };
apply(frame, 'geometry', { x: '95', y: '-10', width: '20', height: '2' });
assert.deepEqual(frame, { x: 80, y: 0, width: 20, height: 3 });
apply(frame, 'geometry', { x: 'not-a-number', y: '', width: '200', height: '50' });
assert.deepEqual(frame, { x: 0, y: 0, width: 100, height: 50 });
