import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/photo-frame-model.js';
import {installPhotoFrames,PHOTO_FRAME_INSTALL_ID} from '../server/graphic-photo-frames.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
const m=globalThis.ACDLPhotoFrameModel;
test('authored openings scale proportionally and outlines share the same path',()=>{assert.equal(m.catalog.length,22);assert.equal(new Set(m.catalog.map(f=>f.id)).size,22);for(const f of m.catalog){assert.match(m.clip(f.id),/^polygon\(/);assert.ok(!m.clip(f.id).includes('NaN'));assert.ok(m.outline(f.id,'#123456',0).includes('stroke-width="0"'));assert.ok(m.outline(f.id,'#123456',3).includes(f.path));assert.ok(f.path.endsWith('Z'));}assert.equal(m.clip('unknown'),m.clip('rect'));});
test('frame assets install once, resume interrupted registration and preserve edits/deletions',async()=>{const records=[],deps={records,validateSvg:validateGraphicSvg,storeAsset:async()=>({id:'original'}),createRecord:async r=>{records.push(r);return r}};let calls=0;await assert.rejects(installPhotoFrames({...deps,storeAsset:async()=>{if(++calls===4)throw Error('interrupted');return {id:'original'}}}));assert.equal(records.length,3);records[0].name='edited';records[0].status='archived';await installPhotoFrames(deps);assert.equal(records.length,m.catalog.length+1);assert.equal(records[0].name,'edited');assert.equal(records[0].status,'archived');assert.ok(records.some(r=>r.id===PHOTO_FRAME_INSTALL_ID));assert.equal(records.filter(r=>r.subjectId==='frames').length,m.catalog.length);records.splice(0,1);assert.deepEqual(await installPhotoFrames(deps),[]);});

test('soft edges use the authored opening and physical frame dimensions', () => {
  assert.equal(m.edgeMask('rect', 0, 100, 50), '');
  assert.equal(m.edgeMask('rect', 6, 0, 50), '');
  assert.equal(m.softEdgeSize(-1), 0);
  assert.equal(m.softEdgeSize(100), 80);
  assert.equal(m.softEdgeSize(100, 50), 50);
  assert.notEqual(m.edgeMask('rect', 50, 100, 100), m.edgeMask('rect', 80, 100, 100));
  const mask = decodeURIComponent(m.edgeMask('hexagon', 6, 100, 50));
  assert.ok(mask.includes(m.get('hexagon').path));
  assert.match(mask, /stdDeviation="0.706 1.411"/);
});
