import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window=globalThis;
await import('./native-print-authoring.js');
await import('./native-print-package-compiler.js');
await import('./runtime-project-adapter.js');

const font={ref:'package',assetId:'assets/fonts/Pretendard-Regular.otf',sha256:'3ffbacde6ab8411f1d2db54bb9b1f0b3ee2a738932033722cf0388c06aed1c93',postscriptName:'Pretendard-Regular',license:'OFL-1.1',outlineAllowed:true,packaged:true};
const project={template:{nativePrintAuthoring:{enabled:true},resources:{nativePrint:{colors:{'#ef3340':{space:'cmyk',c:0,m:.82,y:.72,k:.12}},fonts:{body:font,calendar:font},images:{}}}}};

test('editor objects receive final print policies only after Package resources are ready',()=>{
 const text=globalThis.ACDLRuntimeProjectAdapter.legacyObject({id:'title',type:'text',x:10,y:10,width:50,height:10,content:'새 기준',style:{color:'#17202e',fontSizePt:18}},260,180,1,project);
 const shape=globalThis.ACDLRuntimeProjectAdapter.legacyObject({id:'red',type:'shape',shapeType:'rect',x:10,y:30,width:20,height:20,style:{fill:'#ef3340'}},260,180,2,project);
 assert.equal(text.print.textMode,'outline');
 assert.equal(text.print.font.sha256,font.sha256);
 assert.deepEqual(text.print.fill,{space:'cmyk',c:0,m:0,y:0,k:1});
 assert.deepEqual(shape.print.fill,{space:'cmyk',c:0,m:.82,y:.72,k:.12});
 assert.deepEqual(text.frame,{x:26,y:18,width:130,height:18});
 assert.deepEqual(shape.frame,{x:26,y:54,width:52,height:36});
});

test('unresolved process colors stay out of the final print policy',()=>{
 const shape=globalThis.ACDLRuntimeProjectAdapter.legacyObject({id:'unknown',type:'shape',x:0,y:0,width:10,height:10,style:{fill:'#123456'}},260,180,1,project);
 assert.equal(shape.print,undefined);
 assert.equal(shape.printIntent.paint.fill.resolution,'pending-cmyk-authoring');
});
