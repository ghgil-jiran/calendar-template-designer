import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
function setup(overrides={}){
 const nodes=new Map(),listeners=new Map();
 const node=id=>({id,classList:{toggle(){}},addEventListener(type,callback){listeners.set(id+':'+type,callback)},set innerHTML(value){this.html=value;for(const match of value.matchAll(/id="([^"]+)"/g))if(!nodes.has(match[1]))nodes.set(match[1],node(match[1]));},get innerHTML(){return this.html||''}});
 nodes.set('templatePreflightArtifact',{before(host){nodes.set(host.id,host)}});nodes.set('downloadTemplatePrintPdfBtn',node('downloadTemplatePrintPdfBtn'));nodes.set('templatePreflightStatus',node('templatePreflightStatus'));
 const ctx=vm.createContext({el:id=>nodes.get(id),document:{createElement:()=>node('new')},escape:value=>String(value).replaceAll('<','&lt;'),location:{origin:'https://editor.example'},preflightActiveGate:4,preflightProject:{productType:{category:'desk',pageSize:{width:260,height:180}}},preflightReport:null,preflightArtifact:{id:'base',status:'done',verified:true},outputVariant:null,outputSelection:'enlarged',outputRequestBusy:false,outputRequestError:'',outputPollError:'',outputPollTimer:null,window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async()=>({id:'enlarged',sourceJobId:'base',outputProfile:'desk-297-uniform.v1',status:'queued'})}},setTimeout:()=>1,clearTimeout(){},artifactValue(){},...overrides});
 vm.runInContext(source.slice(source.indexOf(' function workerPowerShellCommand('),source.indexOf('\n async function copyWorkerPowerShellCommand(')),ctx);
 vm.runInContext(source.slice(source.indexOf(' function progressMarkup('),source.indexOf(' function artifactValue(')),ctx);
 vm.runInContext(source.slice(source.indexOf(' function outputVariantSourceProblem('),source.indexOf(' function setPreflightButtonLabel(')),ctx);
 return {ctx,nodes,listeners,html:()=>nodes.get('templateOutputVariant')?.innerHTML};
}
test('completed original without server verification shows the blocking reason without issuing a job',async()=>{
 let calls=0;const app=setup({preflightArtifact:{id:'base',status:'done',verified:false,checks:{imageDpi:{status:'review',message:'해상도 확인 필요'}}},window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async()=>{calls++;}}}});
 app.ctx.renderOutputVariant();assert.match(app.html(),/서버의 최종 검증 승인/);assert.match(app.html(),/해상도 확인 필요/);assert.match(app.html(),/refreshOutputVariantSource/);await app.ctx.requestOutputVariant();assert.equal(calls,0);
});
test('API rejection persists visibly with HTTP status and error code and allows retry',async()=>{
 const app=setup({window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async()=>{throw Object.assign(new Error('verified_source_pdf_required'),{code:'verified_source_pdf_required',status:409});}}}});
 await app.ctx.requestOutputVariant();assert.match(app.html(),/role="alert"/);assert.match(app.html(),/HTTP 409/);assert.match(app.html(),/verified_source_pdf_required/);assert.match(app.html(),/다시 시도/);assert.doesNotMatch(app.html(),/npm.cmd/);assert.equal(app.ctx.outputRequestBusy,false);
});
test('successful request displays the new job worker command and leaves download disabled',async()=>{
 const app=setup();await app.ctx.requestOutputVariant();assert.match(app.html(),/--job "enlarged" --once/);assert.match(app.html(),/다시 실행해야/);assert.equal(app.nodes.get('downloadTemplatePrintPdfBtn').disabled,true);assert.equal(app.ctx.outputVariantState().status,'pending');
});
test('invalid success response never displays a fabricated or original worker job',async()=>{
 const app=setup({window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async()=>({id:'base',status:'done'})}}});await app.ctx.requestOutputVariant();assert.match(app.html(),/유효한 새 작업 ID/);assert.doesNotMatch(app.html(),/npm.cmd/);assert.equal(app.ctx.outputVariant,null);
});
test('duplicate clicks during an in-flight request issue exactly one request',async()=>{
 let finish,calls=0;const app=setup({window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:()=>{calls++;return new Promise(resolve=>{finish=resolve});}}}});const pending=app.ctx.requestOutputVariant();await app.ctx.requestOutputVariant();assert.equal(calls,1);finish({id:'enlarged',sourceJobId:'base',outputProfile:'desk-297-uniform.v1',status:'queued'});await pending;
});
test('source status refresh enables enlargement only after server confirms verification',async()=>{
 const app=setup({preflightArtifact:{id:'base',status:'done',verified:false},window:{ACDLTemplatePublishing:{printPreflightStatus:async()=>({id:'base',status:'done',report:{verified:true}})}}});app.ctx.renderOutputVariant();await app.listeners.get('refreshOutputVariantSource:click')();assert.equal(app.ctx.preflightArtifact.verified,true);assert.equal(app.ctx.outputVariantSourceProblem(),'');assert.doesNotMatch(app.html(),/서버의 최종 검증 승인/);
});
test('completed enlarged PDF with review checks is not reported as passed',()=>{
 const app=setup({outputVariant:{id:'enlarged',status:'done',verified:false,checks:{dpi:{status:'review'}}}});assert.equal(app.ctx.outputVariantState().status,'review');app.ctx.outputVariant.verified=true;app.ctx.outputVariant.checks={cmyk:{status:'passed'}};assert.equal(app.ctx.outputVariantState().status,'passed');
});
test('completed output offers regeneration and requests a new worker job explicitly',async()=>{
 let requested;const app=setup({outputVariant:{id:'old-enlarged',status:'done',verified:true},window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async(id,dpi,options)=>{requested={id,dpi,...options};return {id:'new-enlarged',sourceJobId:'base',outputProfile:'desk-297-uniform.v1',status:'queued'};}}}});app.ctx.renderOutputVariant();assert.match(app.html(),/확대 PDF 다시 생성·검사/);await app.ctx.requestOutputVariant();assert.equal(requested.force,true);assert.match(app.html(),/--job "new-enlarged" --once/);assert.equal(app.nodes.get('downloadTemplatePrintPdfBtn').disabled,true);
});
test('old API returning the completed output cannot pretend regeneration succeeded',async()=>{
 const old={id:'old-enlarged',sourceJobId:'base',outputProfile:'desk-297-uniform.v1',status:'done',verified:true};const app=setup({outputVariant:old,window:{ACDLTemplatePublishing:{ensurePrintOutputVariant:async()=>old}}});await app.ctx.requestOutputVariant();assert.match(app.html(),/재생성을 지원하는 API 연결/);assert.equal(app.ctx.outputVariant.id,'old-enlarged');
});
