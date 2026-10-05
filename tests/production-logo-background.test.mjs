import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function renderSemanticObject('),source.indexOf('function pageRecommendations('));
const render=vm.runInNewContext(fn+';renderSemanticObject',{semanticData:()=>({image:'transparent-logo.png'}),semanticRoleLabel:()=> '교표',semanticTitleVisible:()=>false,escapeAttr:s=>s.replaceAll('"','&quot;')});
test('logo defaults to transparency while explicit backgrounds survive',()=>{
 for(const style of [undefined,{}, {background:false}])assert.match(render({role:'school-logo',style}),/style="background:transparent"/);
 assert.match(render({role:'school-logo',style:{background:true,backgroundColor:'#123456'}}),/background:#123456/);
 assert.match(render({role:'school-logo',style:{background:'#abcdef'}}),/background:#abcdef/);
 const css=readFileSync(new URL('../apps/designer-studio/designer-studio-core.css',import.meta.url),'utf8');
 assert.match(css,/\.semantic-logo \.semantic-media\{[^}]*background:transparent/);
});
