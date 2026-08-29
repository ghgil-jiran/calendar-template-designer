import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import fs from "node:fs";
const source=fs.readFileSync(new URL("../apps/designer-studio/persistence-project.js",import.meta.url),"utf8");
const context={};vm.createContext(context);vm.runInContext(source,context);
const persistence=context.ACDLPersistenceProject;
test("project persistence keeps clone, hash, and recovery records deterministic",()=>{
 const project={book:{id:"calendar-1"},pages:[{id:"page-1"}]};
 const copy=persistence.clone(project);assert.equal(JSON.stringify(copy),JSON.stringify(project));assert.notEqual(copy,project);
 assert.equal(persistence.hash(project),JSON.stringify(project));
 const record=persistence.createRecoveryRecord(project,"page-1",{compact:value=>({book:value.book}),now:()=>new Date("2026-08-17T12:00:00.000Z")});
 assert.equal(JSON.stringify(record),JSON.stringify({id:"latest",project:{book:{id:"calendar-1"}},selectedPageId:"page-1",updatedAt:"2026-08-17T12:00:00.000Z"}));
 assert.equal(persistence.createRecoveryRecord(project,"",{now:()=>new Date(0)}).selectedPageId,null);
});
