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
