import '../apps/designer-studio/photo-frame-editing.js';
import assert from 'node:assert/strict';

await import('../apps/designer-studio/inspector-graphic.js');

const { apply } = globalThis.ACDLInspectorGraphic;
const rounded = {type:'shape',shapeType:'rect',style:{}};
apply(rounded,'style',{shapeType:'rounded'});
assert.equal(rounded.style.cornerRadiusMm,3);
rounded.style.cornerRadiusMm=4.95;
apply(rounded,'style',{fill:'#abcdef'});
assert.equal(rounded.style.cornerRadiusMm,4.95);
const shape = { type: 'shape', shapeType: 'rect', style: { fill: '#000000', stroke: '#111111', strokeWidth: 1 } };
apply(shape, 'style', { shapeType: 'circle', fill: '#ffffff', stroke: '#222222', strokeWidth: '3' });
assert.deepEqual(shape, { type: 'shape', shapeType: 'circle', style: { fill: '#ffffff', stroke: '#222222', strokeWidth: 3, dash: 'solid', shadow: false, shadowColor: '#000000', shadowBlur: 0, shadowX: 0, shadowY: 0 } });

const vector = { type: 'vector', assetId: 'book', colors: { primary: '#000000', secondary: '#ffffff' }, flipX: false, flipY: false };
apply(vector, 'style', { assetId: 'pencil', primary: '#123456', secondary: '#654321', flipX: 'true', flipY: 'false' });
assert.deepEqual(vector, { type: 'vector', assetId: 'pencil', colors: { primary: '#123456', secondary: '#654321' }, flipX: true, flipY: false, shadow: false, shadowColor: '#000000', shadowBlur: 0 });

const frame = { type: 'image-frame', frameType: 'rect', style: { stroke: '#ffffff', strokeWidth: 1 }, image: {} };
apply(frame, 'style', { frameType: 'rounded', stroke: '#333333', strokeWidth: '4' });
apply(frame, 'frame', { binding: 'school.profile.logo', fit: 'contain', scale: '1.5', offsetX: '-10', offsetY: '5' });
assert.deepEqual(frame, {
  type: 'image-frame', frameType: 'rounded', style: { stroke: '#333333', strokeWidth: 4, background: '#eef2f7', shadow: false, shadowColor: '#000000', shadowBlur: 0 },
  image: { binding: 'school.profile.logo', fit: 'contain', scale: 1.5, offsetX: -10, offsetY: 5, flipX: false, flipY: false, brightness: 100, contrast: 100, saturation: 100 }
});

const layout = { type: 'shape' };
apply(layout, 'layout', { x: '10', y: '20', width: '30', height: '40', rotation: '15', opacity: '.8' });
apply(layout, 'permission', { permissions: { move: true, resize: false } });
assert.deepEqual(layout, { type: 'shape', x: 10, y: 20, width: 30, height: 40, rotation: 15, opacity: .8, permissions: { move: true, resize: false } });

const posterSize = {width:420,height:594};
const footer = {type:'shape',shapeType:'rect',width:75,height:5,style:{fill:'#ffffff',strokeWidth:0,shadow:false}};
apply(footer,'shape-form',{shapeType:'rounded',cornerPercent:'50',pageSize:posterSize});
assert.equal(footer.shapeType,'rounded');
assert.equal(footer.style.cornerRadiusMm,7.425);
assert.equal(footer.style.strokeWidth,0);
assert.equal(globalThis.ACDLInspectorGraphic.shapeCornerPercent(footer,posterSize),50);
apply(footer,'shape-form',{shapeType:'rect',pageSize:posterSize});
assert.equal(footer.shapeType,'rect');
assert.equal(footer.style.cornerRadiusMm,7.425);

const translucentShape = {type:'shape',shapeType:'rect',opacity:.5,style:{fill:'#ffffff',strokeWidth:0}};
apply(translucentShape,'style',{shapeOpacityPercent:'35'});
assert.equal(translucentShape.opacity,.35);
apply(translucentShape,'layout',{x:10,y:20,width:30,height:40});
assert.equal(translucentShape.opacity,.35);
apply(translucentShape,'style',{shapeOpacityPercent:''});
assert.equal(translucentShape.opacity,.35);
apply(translucentShape,'style',{shapeOpacityPercent:'0'});
assert.equal(translucentShape.opacity,0);
