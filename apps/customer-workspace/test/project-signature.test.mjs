import test from 'node:test';
import assert from 'node:assert/strict';
import {draftSignature} from '../src/lib/projects/signature.ts';
const draft=()=>({name:'학교',template:{id:'a',version:1},school:{values:{},hidden:[]},editorState:{version:1,pageId:'cover',edits:[]},events:[],step:'editor',photos:[],assignments:{}});
test('page navigation does not dirty saved calendar content',()=>{const a=draft(),b=structuredClone(a);b.editorState.pageId='march';assert.equal(draftSignature(a),draftSignature(b));});
test('object, school and image edits still dirty saved content',()=>{for(const mutate of [d=>d.editorState.edits.push({elementId:'logo',layout:{x:2}}),d=>d.school.values.name='학교2',d=>d.editorState.logoMode='combined',d=>d.assignments.cover={photoId:'new'}]){const a=draft(),b=structuredClone(a);mutate(b);assert.notEqual(draftSignature(a),draftSignature(b));}});
