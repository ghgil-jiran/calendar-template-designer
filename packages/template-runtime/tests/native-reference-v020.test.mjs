import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { TemplateRuntime } from "../dist/src/Runtime.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const fixture=path.join(root,"templates","desk-native-print-reference","0.2.0");

test("native print reference 0.2.0 keeps weekdays and dataset events in the print runtime",async()=>{
  const [template,dataset]=await Promise.all([
    readFile(path.join(fixture,"template.json"),"utf8").then(JSON.parse),
    readFile(path.join(fixture,"dataset.json"),"utf8").then(JSON.parse)
  ]);
  const result=new TemplateRuntime().execute(template,dataset,{target:"print",strictBindings:true});
  assert.equal(result.hasErrors,false);
  assert.equal(template.metadata.version,"0.2.0");
  const month=result.document.pages.find(page=>page.id==="native.month-front");
  assert.ok(month);
  assert.deepEqual(month.objects.filter(object=>object.role==="weekday").map(object=>object.payload),["일","월","화","수","목","금","토"]);
  const events=month.objects.find(object=>object.id==="month.events");
  assert.equal(events.print.structure,"native-vector");
  assert.equal(events.print.textMode,"outline");
  assert.equal(events.payload.length,3);
  assert.equal(events.payload[0].date,"2028-03-02");
});
