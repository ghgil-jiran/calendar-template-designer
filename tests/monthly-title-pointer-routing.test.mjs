import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../apps/designer-studio/features/object-editing-sprint2-runtime.js',import.meta.url),'utf8');
const handler=code.split('\n').find(line=>line.includes("document.addEventListener('pointerdown'"));
function pointer(target){let callback,renders=0,cleared=0;const page={};runInNewContext(handler,{document:{addEventListener(type,cb,capture){assert.equal(type,'pointerdown');assert.equal(capture,true);callback=cb}},project:{},preview:false,clearSelection(){cleared++},render(){renders++}});callback({target:{closest(selector){return selector==='#page'?page:selector===target?{}:null}}});return {renders,cleared};}
test('month title pointerdown survives document capture until its own click handler',()=>assert.deepEqual(pointer('.monthly-title-region'),{renders:0,cleared:0}));
test('calendar grid and free objects retain their own pointer handlers',()=>{assert.deepEqual(pointer('.calendar-region'),{renders:0,cleared:0});assert.deepEqual(pointer('.free-element'),{renders:0,cleared:0});});
test('empty canvas still clears the previous selection',()=>assert.deepEqual(pointer('.surface-content'),{renders:1,cleared:1}));
