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
 assert.deepEqual(report.gates.map(gate=>gate.name),['생성 준비','Print Document·화면','핵심 자동검사','AI 생성 이미지 검사','외부·실물 승인']);
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
 assert.equal(report.schemaVersion,'template-preflight-report.v6');
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
 assert.equal(report.schemaVersion,'template-preflight-report.v6');
 assert.equal(report.stages[3].status,'review');
 assert.equal(report.gates[2].status,'pending');
 assert.ok(report.issues.some(item=>item.code==='PRINT_ARTIFACT_REQUIRED'));
 assert.equal(report.printOutput.profile.productionSize.width,266);
 assert.equal(output.geometryMappingVerified,true);
 assert.deepEqual(JSON.parse(JSON.stringify(report.printOutput.profile.coordinateMapping)),{source:'trim',target:'production',mode:'translate-no-scale',scale:1,offsetX:3,offsetY:3,comparisonBox:'TrimBox'});
 assert.equal(output.contentParity.status,'same-dataset-required');
 assert.equal(report.finalApproved,false);
 assert.equal(report.approval.external.status,'not_run');
 assert.equal(report.approval.physical.status,'not_run');
 assert.equal(report.stages[4].name,'Acrobat 외부 Preflight');
 assert.equal(report.stages[5].name,'실물 인쇄 승인');
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
 assert.equal(report.gates[1].status,'blocked');
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

test('a legacy done artifact cannot pass while core checks are missing',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const artifact={status:'done',verified:true,checks:{pdfx4:true,outputIntent:true,cmyk:true,trimBox:true,bleedBox:true,fontOutlined:true}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.artifactVerified,false);
 assert.deepEqual([...output.missingArtifactChecks],['k100','vectorContentPreserved']);
 assert.deepEqual([...output.followUpArtifactChecks],['trimContentParity']);
 assert.equal(output.aiImageInspection.status,'pending');
 assert.deepEqual([...output.runtimeArtifactChecks],['imageDpi','finalPrintImageApproval']);
 assert.equal(report.status,'review');
 assert.ok(report.issues.some(item=>item.code==='PRINT_ARTIFACT_CHECKS_INCOMPLETE'));
});

test('a completed artifact with a failed core structural check is blocked',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const passed={status:'passed'},artifact={status:'done',verified:false,filePath:'private/path.pdf',downloadUrl:'https://signed.example/pdf',checks:{pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,fontOutlined:{status:'failed',message:'페이지 전체가 래스터화되었습니다.'},vectorContentPreserved:{status:'failed'},trimContentParity:{status:'failed'}}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.artifactVerified,false);
 assert.deepEqual([...output.failedArtifactChecks],['fontOutlined','vectorContentPreserved']);
 assert.deepEqual([...output.missingArtifactChecks],[]);
 assert.deepEqual([...output.followUpArtifactChecks],['trimContentParity']);
 assert.deepEqual([...output.runtimeArtifactChecks],['imageDpi','finalPrintImageApproval']);
 assert.equal(report.status,'blocked');
 assert.ok(report.issues.some(item=>item.code==='PRINT_ARTIFACT_CHECKS_FAILED'));
 assert.deepEqual(report.printOutput.failedArtifactChecks,['fontOutlined','vectorContentPreserved']);
 assert.equal(report.printOutput.artifact.checks.fontOutlined.status,'failed');
 assert.equal(report.printOutput.artifact.filePath,undefined);
});

test('automated PDF success remains review until external and physical approvals exist',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const passed={status:'passed'},artifact={status:'done',verified:true,checks:{pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,fontOutlined:passed,vectorContentPreserved:passed,trimContentParity:passed,imageDpi:passed,templateImageApproval:passed,finalPrintImageApproval:passed}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.approval.automated.status,'passed');
 assert.equal(output.approval.artifactClass,'legacy-converted');
 assert.equal(report.status,'review');
 assert.equal(report.approvalLevel,'core-print-preflight');
 assert.equal(report.finalApproved,false);
 assert.equal(report.stages[3].status,'passed');
 assert.equal(report.stages[4].status,'pending');
 assert.equal(report.stages[5].status,'pending');
 assert.equal(report.gates[2].status,'passed');
 assert.equal(report.gates[3].status,'pending');
 assert.equal(report.gates[4].status,'pending');
});



test('image checks are reported outside the Template Editor automated gate',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const passed={status:'passed'};
 const artifact={status:'done',verified:false,checks:{
  pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,
  fontOutlined:passed,vectorContentPreserved:passed,trimContentParity:passed,
  imageDpi:{status:'failed',message:'3개 이미지가 300DPI 미만입니다.'},
  templateImageApproval:{status:'failed',message:'교체 필요 이미지가 남아 있습니다.'},
  finalPrintImageApproval:{status:'failed',message:'최종 인쇄 이미지 승인이 필요합니다.'},
 }};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.deepEqual([...output.failedArtifactChecks],[]);
 assert.deepEqual([...output.followUpArtifactChecks],[]);
 assert.equal(output.aiImageInspection.status,'pending');
 assert.deepEqual([...output.runtimeArtifactChecks],['imageDpi','finalPrintImageApproval']);
 assert.equal(output.artifactVerified,true);
 assert.equal(output.approval.automated.status,'passed');
 assert.equal(report.status,'review');
 assert.equal(report.issues.some(item=>item.code==='PRINT_ARTIFACT_CHECKS_FAILED'),false);
 assert.equal(report.issues.some(item=>item.code==='PRINT_ARTIFACT_FOLLOW_UP'),false);
 assert.equal(report.gates[2].status,'passed');
 assert.equal(report.gates[3].status,'pending');
 assert.equal(report.gates[3].access,'available');
 assert.equal(report.gates[4].access,'locked');
 assert.equal(report.gates[4].blockedBy,4);
});

test('AI image inspection unlocks only after core output and then unlocks final approval',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const passed={status:'passed'},core={pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,fontOutlined:passed,vectorContentPreserved:passed,trimContentParity:passed};
 let output=printOutput.inspect(value,{artifact:{status:'done',verified:true,checks:core}}),report=analyze(value,{printOutput:output});
 assert.equal(report.gates[2].status,'passed');
 assert.equal(report.gates[3].status,'pending');
 assert.equal(report.gates[3].access,'available');
 assert.equal(report.gates[4].access,'locked');
 const criteria=Object.fromEntries(['identity','generationStandard','frameSuitability','placementIntegrity','visualArtifacts','contentLegibility'].map(key=>[key,{status:'passed'}]));
 output=printOutput.inspect(value,{artifact:{status:'done',verified:true,checks:{...core,aiImagePrintQuality:{status:'passed',criteriaVersion:'ai-print-v1',criteria}}}});report=analyze(value,{printOutput:output});
 assert.equal(report.gates[3].status,'passed');
 assert.equal(report.gates[4].access,'available');
});

test('a top-level AI pass without six criterion results cannot unlock final approval',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};
 const passed={status:'passed'},artifact={status:'done',verified:true,checks:{pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,fontOutlined:passed,vectorContentPreserved:passed,trimContentParity:passed,aiImagePrintQuality:{status:'passed',criteriaVersion:'ai-print-v1'}}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.aiImageInspection.criteriaComplete,false);
 assert.equal(output.aiImageInspection.status,'pending');
 assert.equal(report.gates[4].access,'locked');
});

test('saved AI quality evidence is shown per criterion but remains non-decisive',()=>{
 const value=project();value.template.aiDesignDraft={quality:{schemaVersion:'ai-design-quality.v1@0.2.0',status:'review-required',pageCount:1,checkedAt:'2026-09-20T00:00:00.000Z',pages:[{pageId:'cover',issues:[{code:'print-resolution-review',severity:'review'}]}]}};
 const output=printOutput.inspect(value,{artifact:{status:'done',checks:{}}});
 assert.equal(output.aiImageInspection.status,'pending');
 assert.equal(output.aiImageInspection.criteria.length,6);
 assert.equal(output.aiImageInspection.criteria.find(item=>item.key==='frameSuitability').status,'review');
 assert.ok(output.aiImageInspection.criteria.every(item=>item.source==='legacy-ai-quality'));
});

test('a saved dedicated print inspection feeds the six AI image cards',()=>{
 const value=project(),passed={status:'passed'};value.template.aiDesignDraft={quality:{schemaVersion:'ai-design-quality.v1@0.2.0',printInspection:{status:'pending',criteriaVersion:'ai-image-print-quality.v1@0.1.0',criteria:{identity:passed,generationStandard:{status:'review'},frameSuitability:{status:'review'},placementIntegrity:passed,visualArtifacts:{status:'review'},contentLegibility:passed}}}};
 const output=printOutput.inspect(value,{artifact:{status:'done',checks:{}}});
 assert.equal(output.aiImageInspection.criteriaVersion,'ai-image-print-quality.v1@0.1.0');
 assert.equal(output.aiImageInspection.criteriaSummary.passed,3);
 assert.equal(output.aiImageInspection.criteriaSummary.review,3);
 assert.equal(output.aiImageInspection.criteriaComplete,false);
 assert.equal(output.aiImageInspection.status,'pending');
 assert.ok(output.aiImageInspection.criteria.every(item=>item.source==='ai-image-print-quality'));
});

test('templates without AI generated images skip the AI gate after core output',()=>{
 const value=project();value.productType.pageSize={width:260,height:180,unit:'mm'};value.template.resources={exportSettings:{format:'pdf',dpi:300,bleed:3,cropMarks:true,colorMode:'cmyk'}};value.book.elementsByPage.cover=[{id:'editor-background',type:'image',role:'background',src:'package-asset://cover'}];
 const passed={status:'passed'},artifact={status:'done',verified:true,checks:{pdfx4:passed,outputIntent:passed,cmyk:passed,k100:passed,trimBox:passed,bleedBox:passed,fontOutlined:passed,vectorContentPreserved:passed,trimContentParity:passed}};
 const output=printOutput.inspect(value,{artifact}),report=analyze(value,{printOutput:output});
 assert.equal(output.aiImageInspection.required,false);
 assert.equal(output.aiImageInspection.status,'passed');
 assert.equal(report.gates[3].disposition,'not_applicable');
 assert.equal(report.gates[4].access,'available');
});

test('a skipped AI gate cannot bypass an unfinished core output gate',()=>{
 const value=project();value.book.elementsByPage.cover=[];
 const output=printOutput.inspect(value),report=analyze(value,{printOutput:output});
 assert.equal(report.gates[2].status,'pending');
 assert.equal(report.gates[3].status,'passed');
 assert.equal(report.gates[3].access,'locked');
 assert.equal(report.gates[4].access,'locked');
});
