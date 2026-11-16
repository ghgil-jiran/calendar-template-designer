import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLegacy} from './inspect-legacy.mjs';
test('inventory leaves source intact and excludes disabled bindings from connected count',()=>{
 const doc={book:{pages:[{id:'p',role:'cover'}],elementsByPage:{p:[{id:'a',type:'text',binding:'school.name'},{id:'b',type:'text',binding:'school.name',bindingEnabled:false}]}}};
 const before=structuredClone(doc),r=inspectLegacy(doc);assert.deepEqual(doc,before);assert.equal(r.pages[0].connected,1);assert.equal(r.pages[0].objects,2);
});
test('unsupported structure fails and duplicate identities are reported',()=>{
 assert.throws(()=>inspectLegacy({}));const r=inspectLegacy({book:{pageInstances:[{id:'p'}],elementsByPage:{p:[{id:'a'},{id:'a'}],orphan:[]}}});assert.deepEqual(r.issues.map(i=>i.code),['invalid-object-id','orphan-element-array']);
});
