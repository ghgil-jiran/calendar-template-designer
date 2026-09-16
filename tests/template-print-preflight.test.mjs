import test from 'node:test';
import assert from 'node:assert/strict';

await import('../apps/designer-studio/template-print-preflight.js');
await import('../apps/designer-studio/render-parity-preflight.js');
await import('../apps/designer-studio/desk-academic-print-parity.js');
await import('../apps/designer-studio/print-output-preflight.js');
const {analyze}=globalThis.ACDLTemplatePrintPreflight;
const parity=globalThis.ACDLRenderParityPreflight;
const printOutput=globalThis.ACDLPrintOutputPreflight;

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

test('screen and RGB PDF stage passes matching page snapshots',()=>{
 const renderParity=parity.aggregate([{screen:{pageId:'cover',role:'cover',width:960,height:680,objects:[{id:'background',type:'image',geometry:{left:'0%',top:'0%',width:'100%',height:'100%',transform:''},image:{loaded:true}}]},rgb:{pageId:'cover',role:'cover',width:960,height:680,objects:[{id:'background',type:'image',geometry:{left:'0%',top:'0%',width:'100%',height:'100%',transform:''},image:{loaded:true}}]},issues:[]}]);
 const report=analyze(project(),{runtimeDocument:null,renderParity});
 assert.equal(report.schemaVersion,'template-preflight-report.v4');
 assert.equal(report.stages[2].status,'passed');
 assert.deepEqual(report.renderParity,{generated:true,pages:1,screenObjects:1,rgbObjects:1});
});

test('screen and RGB PDF stage reports missing and shifted output objects',()=>{
 const screen={pageId:'cover',role:'cover',width:960,height:680,objects:[{id:'background',type:'image',geometry:{left:'0%',top:'0%',width:'100%',height:'100%',transform:''},image:{loaded:true}},{id:'title',type:'text',geometry:{left:'10%',top:'10%',width:'30%',height:'10%',transform:''},image:null}]};
 const rgb={pageId:'cover',role:'cover',width:960,height:680,objects:[{id:'background',type:'image',geometry:{left:'1%',top:'0%',width:'100%',height:'100%',transform:''},image:{loaded:true}}]};
 const renderParity=parity.aggregate([{screen,rgb,issues:parity.comparePage(screen,rgb,0)}]);
 const report=analyze(project(),{runtimeDocument:null,renderParity});
 assert.equal(report.stages[2].status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='RGB_OBJECT_MISSING'));
 assert.ok(report.issues.some(item=>item.code==='RGB_OBJECT_GEOMETRY_MISMATCH'));
});

test('hidden RGB output uses its explicit preview dimensions',()=>{
 const page={offsetWidth:0,offsetHeight:0,style:{width:'960px',height:'671px'},dataset:{previewWidth:'960',previewHeight:'671'},getBoundingClientRect:()=>({width:0,height:0}),querySelectorAll:()=>[],querySelector:()=>null};
 const snapshot=parity.pageSnapshot(page,{id:'cover',role:'cover-front'});
 assert.equal(snapshot.width,960);
 assert.equal(snapshot.height,671);
});

test('print stage confirms the production contract but waits for a real worker artifact',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const output=printOutput.inspect(value),report=analyze(value,{printOutput:output});
 assert.equal(output.contractReady,true);
 assert.equal(output.artifactVerified,false);
 assert.equal(report.schemaVersion,'template-preflight-report.v4');
 assert.equal(report.stages[3].status,'review');
 assert.ok(report.issues.some(item=>item.code==='PRINT_ARTIFACT_REQUIRED'));
 assert.equal(report.printOutput.profile.productionSize.width,266);
 assert.equal(output.geometryMappingVerified,true);
 assert.deepEqual(JSON.parse(JSON.stringify(report.printOutput.profile.coordinateMapping)),{source:'trim',target:'production',mode:'translate-no-scale',scale:1,offsetX:3,offsetY:3,comparisonBox:'TrimBox'});
 assert.equal(output.contentParity.status,'same-dataset-required');
});

test('print stage rejects a production geometry that cannot be mapped by bleed-only translation',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:-3,cropMarks:true,colorMode:'cmyk'}};
 const output=printOutput.inspect(value);
 assert.equal(output.geometryMappingVerified,false);
 assert.ok(output.issues.some(item=>item.code==='PRINT_TRIM_BLEED_MAPPING_INVALID'));
});

test('print stage blocks a contract that cannot produce the required artifact',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'png',dpi:150,bleed:0,cropMarks:false,colorMode:'rgb'}};
 const output=printOutput.inspect(value),report=analyze(value,{printOutput:output});
 assert.equal(output.contractReady,false);
 assert.equal(report.stages[3].status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='PRINT_DPI_TOO_LOW'));
 assert.ok(report.issues.some(item=>item.code==='PRINT_COLOR_MODE_INVALID'));
});

test('failed worker artifacts expose their detailed PDF preflight findings',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const artifact={status:'error',verified:false,error:'PDF 자동 Preflight 실패',issues:[{severity:'error',code:'PDF_PDFX4_MISSING',message:'pdfx4 검증에 실패했습니다.'}]};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.artifactVerified,false);
 assert.equal(report.stages[3].status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='PDF_PDFX4_MISSING'));
 assert.equal(report.issues.some(item=>item.code==='PRINT_ARTIFACT_FAILED'),false);
});

test('a legacy done artifact cannot pass while required detailed checks are missing',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const artifact={status:'done',verified:true,checks:{pdfx4:true,outputIntent:true,cmyk:true,trimBox:true,bleedBox:true,fontOutlined:true}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.artifactVerified,false);
 assert.deepEqual([...output.missingArtifactChecks],['k100','vectorContentPreserved','trimContentParity']);
 assert.equal(report.status,'review');
 assert.ok(report.issues.some(item=>item.code==='PRINT_ARTIFACT_CHECKS_INCOMPLETE'));
});
