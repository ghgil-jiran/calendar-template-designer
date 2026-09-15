import test from 'node:test';
import assert from 'node:assert/strict';

await import('../apps/designer-studio/template-print-preflight.js');
const {analyze}=globalThis.ACDLTemplatePrintPreflight;

function project(overrides={}){
 return {
  template:{id:'fixture.desk',version:'1.0.0',masterElements:{monthly:[{id:'title',type:'text',binding:'school.name',style:{fontFamily:'Noto Sans KR',fontSize:12,color:'#111'}}]},print:{bleed:3}},
  productType:{pageSize:{width:266,height:186,unit:'mm'}},settings:{},
  book:{pageInstances:[{id:'cover',role:'cover'},{id:'month-1',role:'monthly-front',masterId:'monthly',calendarYear:2028,calendarMonth:3}],elementsByPage:{cover:[{id:'background',type:'image',role:'ai-background',src:'package-asset://cover'}],'month-1':[{id:'calendar',type:'calendar-grid',style:{borderWidth:.2,opacity:1}}]}},
  ...overrides
 };
}

test('supported page, element, style, binding and asset capabilities are inventoried',()=>{
 const report=analyze(project());
 assert.equal(report.status,'passed');
 assert.equal(report.summary.pages,2);
 assert.equal(report.summary.errors,0);
 assert.deepEqual(report.inventory.pageRoles,{cover:1,'monthly-front':1});
 assert.equal(report.inventory.elementTypes.text,1);
 assert.equal(report.inventory.elementTypes.image,1);
 assert.ok(report.inventory.capabilities.includes('binding.school'));
 assert.ok(report.inventory.capabilities.includes('style.fontFamily'));
});

test('unsupported capabilities and missing required assets block output',()=>{
 const value=project();
 value.book.pageInstances.push({id:'experimental',role:'fold-out'});
 value.book.elementsByPage.experimental=[{id:'unknown',type:'live-chart'},{id:'required-bg',type:'image',role:'ai-background'}];
 const report=analyze(value);
 assert.equal(report.status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='PAGE_ROLE_UNSUPPORTED'));
 assert.ok(report.issues.some(item=>item.code==='ELEMENT_TYPE_UNSUPPORTED'));
 assert.ok(report.issues.some(item=>item.code==='REQUIRED_IMAGE_MISSING'));
});

test('surface count and print declarations are checked independently',()=>{
 const value=project();value.settings.surfaceCount=28;delete value.template.print;
 const report=analyze(value);
 assert.ok(report.issues.some(item=>item.code==='SURFACE_COUNT_MISMATCH'&&item.severity==='error'));
 assert.ok(report.issues.some(item=>item.code==='BLEED_NOT_DECLARED'&&item.severity==='warning'));
});

test('editor export settings and package edge declarations both satisfy bleed contract',()=>{
 const editorProject=project();delete editorProject.template.print;editorProject.template.resources={exportSettings:{bleed:3}};
 assert.equal(analyze(editorProject).issues.some(item=>item.code==='BLEED_NOT_DECLARED'),false);
 const packageProject=project();packageProject.template.print={bleed:{top:3,right:3,bottom:3,left:3,unit:'mm'}};
 assert.equal(analyze(packageProject).issues.some(item=>item.code==='BLEED_NOT_DECLARED'),false);
});

test('current desk template semantic roles, objects and styles are official capabilities',()=>{
 const value=project();
 value.book.pageInstances=[{id:'cover',role:'cover-front',elements:[{id:'school',type:'semantic-object',style:{stroke:'#fff',strokeWidth:2,whiteSpace:'normal',containerStyle:'none',sectionDivider:'none',protectedClearArea:true}}]},{id:'symbols',role:'front-insert-front',semanticPageRole:'school-symbols',elements:[{id:'annual',type:'year-calendar',style:{titleColor:'#111',dateColor:'#222',gridLine:true}}]}];
 const report=analyze(value);
 assert.equal(report.summary.errors,0);
 assert.equal(report.issues.some(item=>['PAGE_ROLE_UNSUPPORTED','ELEMENT_TYPE_UNSUPPORTED','STYLE_NOT_CATALOGED'].includes(item.code)),false);
});

test('repeated findings are grouped while raw paths remain available',()=>{
 const value=project();
 value.book.pageInstances[0].elements=[{id:'a',type:'text',style:{futureStyle:true}},{id:'b',type:'text',style:{futureStyle:true}}];
 const report=analyze(value),group=report.issueGroups.find(item=>item.code==='STYLE_NOT_CATALOGED');
 assert.equal(group.count,2);
 assert.equal(group.paths.length,2);
 assert.equal(report.issues.filter(item=>item.code==='STYLE_NOT_CATALOGED').length,2);
});

test('runtime document stage passes only when every source surface and object survives',()=>{
 const value=project(),runtimeDocument={runtimeVersion:'1.0.0-beta.1',pages:[{id:'cover',sourcePageId:'cover',role:'cover',surfaceRole:'cover',objects:[{id:'background',sourceObjectId:'background'}]},{id:'month-1',sourcePageId:'month-1',role:'monthly-front',surfaceRole:'monthly-front',objects:[{id:'title',sourceObjectId:'title'},{id:'calendar',sourceObjectId:'calendar'}]}],diagnostics:[]};
 const report=analyze(value,{runtimeDocument});
 assert.equal(report.stages[1].status,'passed');
 assert.deepEqual(report.runtime,{generated:true,pages:2,objects:3,diagnostics:0,version:'1.0.0-beta.1'});
});

test('runtime stage blocks missing surfaces and objects and preserves diagnostics',()=>{
 const value=project(),runtimeDocument={runtimeVersion:'1.0.0-beta.1',pages:[{id:'cover',sourcePageId:'cover',role:'cover',surfaceRole:'cover',objects:[]}],diagnostics:[{severity:'warning',code:'BINDING_MISSING',message:'binding missing',pageId:'cover',objectId:'background'}]};
 const report=analyze(value,{runtimeDocument});
 assert.equal(report.stages[1].status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='RUNTIME_SURFACE_MISSING'));
 assert.ok(report.issues.some(item=>item.code==='RUNTIME_OBJECT_MISSING'));
 assert.ok(report.issues.some(item=>item.code==='RUNTIME_BINDING_MISSING'));
});
