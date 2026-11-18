import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source=fs.readFileSync(new URL("../apps/designer-studio/persistence-indexeddb.js",import.meta.url),"utf8");
const context={};vm.createContext(context);vm.runInContext(source,context);

function fakeIndexedDB(){
 const records=new Map(),created=[];
 const db={
  objectStoreNames:{contains:name=>created.includes(name)},
  createObjectStore(name,options){created.push(name);return {name,options}},
  transaction(store,mode){const tx={error:null,objectStore(){return {
   put(value){records.set(`${store}:${value.id}`,value);queueMicrotask(()=>tx.oncomplete?.())},
   get(key){const request={};queueMicrotask(()=>{request.result=records.get(`${store}:${key}`);request.onsuccess?.()});return request}
  }},mode};return tx},
  close(){}
 };
 return {created,records,open(){const request={result:db};queueMicrotask(()=>{request.onupgradeneeded?.();request.onsuccess?.()});return request}}
}

test("indexeddb persistence preserves configured database and store contracts",async()=>{
 const api=fakeIndexedDB();
 const storage=context.ACDLPersistenceIndexedDB.createDatabase(api,{databaseName:"acdl-test",version:1,stores:{templates:{keyPath:"id"},recovery:{keyPath:"id"}}});
 const value={id:"template-1",data:{version:"2.18.0"}};
 assert.equal(await storage.put("templates",value),value);
 assert.equal(await storage.get("templates","template-1"),value);
 assert.equal(await storage.get("templates",null),undefined);
 assert.deepEqual(api.created,["templates","recovery"]);
 assert.equal(storage.databaseName,"acdl-test");
 assert.equal(storage.version,1);
});

test('an aborted browser write rejects instead of leaving template save pending',async()=>{
 let closed=0;
 const db={close(){closed++},transaction(){const tx={error:null,objectStore(){return {put(){queueMicrotask(()=>tx.onabort())}}}};return tx}};
 const api={open(){const r={result:db};queueMicrotask(()=>r.onsuccess());return r}};
 const storage=context.ACDLPersistenceIndexedDB.createDatabase(api,{databaseName:'aborted',stores:{templates:{}}});
 await assert.rejects(storage.put('templates',{id:'sample-c',data:{originals:'preserved on server'}}),/브라우저 저장이 중단/);
 assert.equal(closed,1);
});

test('a blocked database open reports the blocker',async()=>{
 const api={open(){const r={};queueMicrotask(()=>r.onblocked());return r}};
 const storage=context.ACDLPersistenceIndexedDB.createDatabase(api,{databaseName:'blocked',stores:{templates:{}}});
 await assert.rejects(storage.open(),/다른 창에 의해 잠겨/);
});
