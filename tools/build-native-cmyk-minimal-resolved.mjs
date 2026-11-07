import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TemplateRuntime } from "../packages/template-runtime/dist/src/Runtime.js";
import { PrintContractValidator } from "../packages/template-runtime/dist/src/PrintContractValidator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "templates", "native-cmyk-minimal", "0.1.0");
const output = path.resolve(process.argv[2] || path.join(root, "output", "native-cmyk-minimal"));
const [template, dataset] = await Promise.all([
  readFile(path.join(fixture, "template.json"), "utf8").then(JSON.parse),
  readFile(path.join(fixture, "dataset.json"), "utf8").then(JSON.parse),
]);
const contractDiagnostics = new PrintContractValidator().validate(template);
const contractErrors = contractDiagnostics.filter((item) => item.severity === "error");
if (contractErrors.length) throw new Error(contractErrors.map((item) => `${item.code}: ${item.message}`).join("\n"));
const result = new TemplateRuntime().execute(template, dataset, { target: "print", strictBindings: true, includeDiagnostics: true });
if (result.hasErrors) throw new Error(result.document.diagnostics.filter((item) => item.severity === "error").map((item) => `${item.code}: ${item.message}`).join("\n"));
if (result.document.pages.length !== 1) throw new Error(`최소 기준은 1면이어야 합니다: ${result.document.pages.length}`);
await mkdir(output, { recursive: true });
const target = path.join(output, "resolved-print-document.json");
await writeFile(target, `${JSON.stringify(result.document, null, 2)}\n`, "utf8");
console.log(`NATIVE_CMYK_RUNTIME_MINIMAL_OK\ntemplate=${template.id}@${template.metadata.version}\npages=${result.document.pages.length}\noutput=${target}`);
