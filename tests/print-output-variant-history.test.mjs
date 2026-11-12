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
