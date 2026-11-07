import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TemplateRuntime } from "../packages/template-runtime/dist/src/Runtime.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const version="0.2.0";
const fixture=path.join(root,"templates","desk-native-print-reference",version);
const output=path.join(root,"output","native-print-reference");
const [template,dataset]=await Promise.all([
  readFile(path.join(fixture,"template.json"),"utf8").then(JSON.parse),
  readFile(path.join(fixture,"dataset.json"),"utf8").then(JSON.parse)
]);
const result=new TemplateRuntime().execute(template,dataset,{target:"print",strictBindings:true,includeDiagnostics:true});
if(result.hasErrors) throw new Error(result.document.diagnostics.filter(item=>item.severity==="error").map(item=>`${item.code}: ${item.message}`).join("\n"));
await mkdir(output,{recursive:true});
const target=path.join(output,"resolved-print-document.json");
await writeFile(target,`${JSON.stringify(result.document,null,2)}\n`,"utf8");
console.log("NATIVE_PRINT_REFERENCE_OK");
console.log(`template=${template.id}@${template.metadata.version}`);
console.log(`pages=${result.document.pages.length}`);
console.log(`output=${target}`);
