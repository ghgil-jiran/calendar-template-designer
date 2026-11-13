import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf(' function historyItems('),source.indexOf(' function setPreflightButtonLabel('));
const context=vm.createContext({artifactValue:(item,...keys)=>keys.map(k=>item[k]).find(v=>v!=null)});vm.runInContext(functions,context);
test('queued and completed enlarged jobs never replace the standard inspection artifact',()=>{
 const base={id:'base',status:'done',report:{verified:true,completedAt:'2026-11-10'}},queued={id:'enlarged',status:'queued',sourceJobId:'base',outputProfile:'desk-297-uniform.v1',report:{progress:{stage:'output-variant'}}};
 assert.equal(context.latestPreflightArtifact({jobs:[queued,base]}).id,'base');
 assert.equal(context.normalizedArtifact(queued).sourceJobId,'base');assert.equal(context.normalizedArtifact(queued).outputProfile,'desk-297-uniform.v1');
 const completed={...queued,status:'done',report:{outputProfile:'desk-297-uniform.v1',completedAt:'2026-11-12'}};assert.equal(context.latestPreflightArtifact([completed,base]).id,'base');
});
test('an enlarged-only history cannot count as a standard CMYK inspection',()=>{assert.equal(context.latestPreflightArtifact([{id:'enlarged',status:'done',report:{outputProfile:'desk-297-uniform.v1'}}]),null);});

test('output-size controls remain in the visible current stage outside collapsed completed details',()=>{
 const nodes=new Map(),current={},collapsed={};const artifact={parent:current,before(host){host.parent=this.parent;nodes.set(host.id,host)}};nodes.set('templatePreflightArtifact',artifact);nodes.set('templatePreflightInventory',{parent:collapsed});
 const ctx=vm.createContext({el:id=>nodes.get(id),document:{createElement:()=>({classList:{toggle(key,value){this.hidden=value;}}})},preflightActiveGate:4,preflightProject:{productType:{category:'desk',pageSize:{width:260,height:180}}},outputVariant:null,outputSelection:'standard',outputRequestBusy:false,outputRequestError:'',outputPollError:'',preflightReport:null,preflightArtifact:{id:'base',status:'done',verified:true},escape:String});
 vm.runInContext(source.slice(source.indexOf(' function outputVariantSourceProblem('),source.indexOf(' function syncOutputPolling(')),ctx);ctx.renderOutputVariant();const host=nodes.get('templateOutputVariant');assert.equal(host.parent,current);assert.equal(host.classList.hidden,false);assert.match(host.innerHTML,/297×205.615mm/);ctx.preflightActiveGate=3;ctx.renderOutputVariant();assert.equal(host.classList.hidden,true);
});
test('new queued job with only top-level dates wins over an old completed report',()=>{
 const old={id:'old',status:'done',createdAt:'2026-11-12T00:00:00Z',completedAt:'2026-11-12T03:00:00Z',report:{verified:true,completedAt:'2026-11-12T03:00:00Z'}},fresh={id:'new',status:'queued',createdAt:'2026-11-13T00:00:00Z',updatedAt:'2026-11-13T00:00:00Z',report:{progress:{stage:'prepare'}}};
 assert.equal(context.normalizedArtifact(fresh).createdAt,fresh.createdAt);assert.equal(context.latestPreflightArtifact([old,fresh]).id,'new');assert.equal(context.latestPreflightArtifact([fresh,old]).status,'queued');
});
test('resuming an older job later cannot outrank a newly created inspection',()=>{
 const old={id:'old',status:'done',createdAt:'2026-11-12T00:00:00Z',updatedAt:'2026-11-14T00:00:00Z',report:{completedAt:'2026-11-14T00:00:00Z'}},fresh={id:'fresh',status:'processing',createdAt:'2026-11-13T00:00:00Z',report:{progress:{stage:'convert'}}};assert.equal(context.latestPreflightArtifact([old,fresh]).id,'fresh');
});
test('explicitly requested job remains selected across queued, processing, done and error updates',()=>{
 for(const status of ['queued','processing','done','error']){const requested={id:'requested',status,createdAt:'2026-11-13',report:{}},other={id:'other',status:'done',createdAt:'2026-11-14',report:{verified:true}};assert.equal(context.latestPreflightArtifact([other,requested],'requested').status,status);}
 assert.equal(context.latestPreflightArtifact([{id:'old',status:'done'}],'missing'),null);
});
test('missing requested job in history is fetched directly rather than replaced with old success',async()=>{
 const ctx=vm.createContext({preflightIdentity:{templateId:'t',version:'1',sha256:'s'},preflightTrackedJobId:'new',preflightHistory:[],preflightArtifact:{id:'new',status:'queued'},outputVariant:null,syncOutputPolling(){},console,artifactValue:context.artifactValue,window:{ACDLTemplatePublishing:{printPreflightHistory:async()=>({jobs:[{id:'old',status:'done',report:{verified:true}}]}),printPreflightStatus:async id=>({id,status:'processing',report:{progress:{stage:'convert'}}})}}});
 vm.runInContext(functions,ctx);vm.runInContext(source.slice(source.indexOf(' async function loadPreflightHistory('),source.indexOf(' function stopPreflightPolling(')),ctx);await ctx.loadPreflightHistory();assert.equal(ctx.preflightArtifact.id,'new');assert.equal(ctx.preflightArtifact.status,'processing');
});
test('late history response cannot overwrite a new request or a different template dialog',async()=>{
 let finish;const ctx=vm.createContext({preflightIdentity:{templateId:'t',version:'1',sha256:'s'},preflightTrackedJobId:null,preflightHistory:[],preflightArtifact:{id:'new',status:'queued'},outputVariant:null,syncOutputPolling(){},console,artifactValue:context.artifactValue,window:{ACDLTemplatePublishing:{printPreflightHistory:()=>new Promise(resolve=>{finish=resolve})}}});
 vm.runInContext(functions,ctx);vm.runInContext(source.slice(source.indexOf(' async function loadPreflightHistory('),source.indexOf(' function stopPreflightPolling(')),ctx);const pending=ctx.loadPreflightHistory();ctx.preflightTrackedJobId='new';finish({jobs:[{id:'old',status:'done',report:{verified:true}}]});await pending;assert.equal(ctx.preflightArtifact.id,'new');
});
