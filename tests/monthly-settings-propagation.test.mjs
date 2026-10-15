import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
test('explicit monthly style/geometry propagation retains per-month data and other object kinds',()=>{
 const a={id:'a',style:{fontSize:18},x:4,y:5,width:30,height:20,content:'3월',binding:'march',src:'march.png'},b={id:'b',style:{fontSize:8},x:9,content:'4월',binding:'april',src:'april.png'};
 const context={sourceElement:()=>a,selectedPage:()=>({role:'monthly-back'}),inspectorDirty:false,snapshot(){},matchingMonthlyObjectsFor:()=>[a,b],structuredClone,markDirty(){},render(){},showEditorToast(){},monthlyMasterLabel:()=> '모든 월력 뒷면'};
 vm.createContext(context);vm.runInContext(src.slice(src.indexOf('function applySelectedMonthlySettings('),src.indexOf('function promoteSelectedToMonthlyMaster()'))+';globalThis.apply=applySelectedMonthlySettings',context);
 context.apply('style');assert.deepEqual(b.style,{fontSize:18});assert.equal(b.x,9);assert.equal(b.content,'4월');assert.equal(b.binding,'april');assert.equal(b.src,'april.png');
 context.apply('geometry');assert.equal(b.x,4);assert.equal(b.width,30);assert.equal(b.content,'4월');
 context.inspectorDirty=true;a.x=99;context.apply('geometry');assert.equal(b.x,4);
});
