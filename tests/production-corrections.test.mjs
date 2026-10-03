import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCorrections,documentHash } from '../server/production-corrections.js';
const asset='11111111-1111-4111-a111-111111111111';
const doc={template:{pages:[{id:'page',objects:[{id:'text',type:'text',payload:'원본',frame:{x:1,y:2,width:30,height:20}},{id:'image',type:'image',payload:{src:'production-asset://old',placement:{fit:'contain'}},frame:{x:0,y:0,width:10,height:10}}]}]}};
test('correction preserves receipt original and changes only selected object',()=>{const before=JSON.stringify(doc),copy=applyCorrections(doc,[{pageId:'page',objectId:'text',text:'교정',frame:{x:2,y:3,width:40,height:20}}],[]);assert.equal(JSON.stringify(doc),before);assert.equal(copy.template.pages[0].objects[0].payload,'교정');assert.deepEqual(copy.template.pages[0].objects[1],doc.template.pages[0].objects[1]);assert.notEqual(documentHash(copy),documentHash(doc));});
test('replacement keeps image placement and uses only receipt originals',()=>{const copy=applyCorrections(doc,[{pageId:'page',objectId:'image',assetId:asset}],[{id:asset}]);assert.deepEqual(copy.template.pages[0].objects[1].payload,{src:`production-asset://${asset}`,placement:{fit:'contain'}});assert.throws(()=>applyCorrections(doc,[{pageId:'page',objectId:'image',assetId:asset}],[]));});
test('invalid geometry or missing object cannot be saved',()=>{assert.throws(()=>applyCorrections(doc,[{pageId:'page',objectId:'text',frame:{x:0,y:0,width:0,height:10}}],[]));assert.throws(()=>applyCorrections(doc,[{pageId:'page',objectId:'absent'}],[]));});
test('cannot inject image URL via text or replace structured payload as text',()=>{assert.throws(()=>applyCorrections(doc,[{pageId:'page',objectId:'image',text:'https://example.com'}],[]));});
