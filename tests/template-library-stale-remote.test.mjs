import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../apps/designer-studio/features/template-settings-library.js',import.meta.url),'utf8');
test('successful remote refresh removes stale remote cards while retaining unsaved local work',async()=>{
 const authoritative=[{id:'keep',stableKey:'keep'}];let saved;
 const context={window:{ACDLTemplateRemotePersistence:{isRemote:()=>true,list:async()=>authoritative}},v22Library:()=>[{id:'stale',remoteId:'stale',storage:'supabase'},{id:'older',storage:'supabase'},{id:'local-draft',storage:'local'}],v22SaveLibrary:items=>saved=items,renderTemplateLibrary(){},console};
 vm.createContext(context);const a=source.indexOf('async function refreshRemoteTemplateLibrary()'),b=source.indexOf('\nfunction ',a+1);vm.runInContext(source.slice(a,b<0?undefined:b)+';globalThis.refresh=refreshRemoteTemplateLibrary',context);
 assert.equal(await context.refresh(),true);assert.deepEqual(Array.from(saved,x=>x.id),['keep','local-draft']);
});
