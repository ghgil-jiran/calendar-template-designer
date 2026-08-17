import assert from 'node:assert/strict';

await import('../apps/designer-studio/inspector-graphic.js');

const { apply } = globalThis.ACDLInspectorGraphic;
const shape = { type: 'shape', shapeType: 'rect', style: { fill: '#000000', stroke: '#111111', strokeWidth: 1 } };
apply(shape, 'style', { shapeType: 'circle', fill: '#ffffff', stroke: '#222222', strokeWidth: '3' });
assert.deepEqual(shape, { type: 'shape', shapeType: 'circle', style: { fill: '#ffffff', stroke: '#222222', strokeWidth: 3 } });

const vector = { type: 'vector', assetId: 'book', colors: { primary: '#000000', secondary: '#ffffff' }, flipX: false, flipY: false };
apply(vector, 'style', { assetId: 'pencil', primary: '#123456', secondary: '#654321', flipX: 'true', flipY: 'false' });
assert.deepEqual(vector, { type: 'vector', assetId: 'pencil', colors: { primary: '#123456', secondary: '#654321' }, flipX: true, flipY: false });

const frame = { type: 'image-frame', frameType: 'rect', style: { stroke: '#ffffff', strokeWidth: 1 }, image: {} };
apply(frame, 'style', { frameType: 'rounded', stroke: '#333333', strokeWidth: '4' });
apply(frame, 'frame', { binding: 'school.profile.logo', fit: 'contain', scale: '1.5', offsetX: '-10', offsetY: '5' });
assert.deepEqual(frame, {
  type: 'image-frame', frameType: 'rounded', style: { stroke: '#333333', strokeWidth: 4 },
  image: { binding: 'school.profile.logo', fit: 'contain', scale: 1.5, offsetX: -10, offsetY: 5 }
});

const layout = { type: 'shape' };
apply(layout, 'layout', { x: '10', y: '20', width: '30', height: '40', rotation: '15', opacity: '.8' });
apply(layout, 'permission', { permissions: { move: true, resize: false } });
assert.deepEqual(layout, { type: 'shape', x: 10, y: 20, width: 30, height: 40, rotation: 15, opacity: .8, permissions: { move: true, resize: false } });
