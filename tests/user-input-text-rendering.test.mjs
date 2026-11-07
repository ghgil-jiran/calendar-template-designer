import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function declaration(file,name){const source=readFileSync(new URL('../apps/designer-studio/'+file,import.meta.url),'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.ok(node,name);return node.getText(ast);}
const escapeSource=declaration('features/studio-runtime-core.js','escapeAttr');
test('shared semantic renderer treats user school text as text, including titles and descriptions',()=>{
 const context={semanticData:()=>({name:'<b>학교</b>',description:'<img src=x onerror="alert(1)">',image:''}),semanticRoleLabel:()=> '교훈',semanticTitleVisible:()=>true};vm.createContext(context);vm.runInContext(escapeSource+'\n'+declaration('features/object-editing.js','renderSemanticObject'),context);
 const html=context.renderSemanticObject({role:'school-motto',titleOverride:'<script>title</script>',style:{}});assert.ok(html.includes('&lt;script>title&lt;/script>'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));
});
test('shared classic event layer escapes user event labels as well as attributes',()=>{
 const context={project:{template:{masters:{calendar:{rangeEventStyle:{enabled:true,labelMode:'every'}}}}},assignRangeLanes:()=>({segments:[{event:{title:'<img src=x onerror="alert(1)">',startDate:'2027-03-02',endDate:'2027-03-03'},startColumn:1,endColumn:2,week:0,lane:0,isFirstVisible:true}]}),eventColor:()=> '#4777bd'};vm.createContext(context);vm.runInContext(escapeSource+'\n'+declaration('features/calendar-rendering.js','rangeLabel')+'\n'+declaration('features/calendar-rendering.js','renderRangeEventLayer'),context);const html=context.renderRangeEventLayer([],5);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));
});
