import assert from "node:assert/strict";
import {
  assembleTemplatePackage,
  loadTemplatePackage,
  validateTemplatePackageManifest
} from "../dist/index.js";

const manifest = {
  schemaVersion: "template-package.v1-draft",
  templateId: "desk-academic-standard",
  version: "1.0.0",
  files: {
    template: "template.json",
    bindings: "bindings.json",
    print: "print.json",
    parity: "parity.json"
  }
};
const template = { schemaVersion: "template.v2-draft", templateId: "desk-academic-standard", version: "1.0.0" };
const bindings = { contractVersion: "1.1" };
const print = { contractVersion: "print.v1" };
const parity = { schemaVersion: "desk-academic-parity.v1" };

assert.equal(validateTemplatePackageManifest(manifest), manifest);
assert.equal(assembleTemplatePackage({ manifest, template, bindings, print, parity }).template, template);
assert.throws(
  () => assembleTemplatePackage({ manifest, template: { ...template, version: "2.0.0" }, bindings, print, parity }),
  /version mismatch/
);
assert.throws(
  () => validateTemplatePackageManifest({ ...manifest, files: { template: "template.json" } }),
  /manifest\.files\.bindings/
);

const payloads = new Map([
  ["/runtime/desk/manifest.json", manifest],
  ["/runtime/desk/template.json", template],
  ["/runtime/desk/bindings.json", bindings],
  ["/runtime/desk/print.json", print],
  ["/runtime/desk/parity.json", parity]
]);
const requested = [];
const loaded = await loadTemplatePackage(async (url) => {
  requested.push(url);
  return { ok: payloads.has(url), async json() { return payloads.get(url); } };
}, "/runtime/desk");
assert.equal(loaded.manifest.templateId, "desk-academic-standard");
assert.deepEqual(requested, [
  "/runtime/desk/manifest.json",
  "/runtime/desk/template.json",
  "/runtime/desk/bindings.json",
  "/runtime/desk/print.json",
  "/runtime/desk/parity.json"
]);

await assert.rejects(
  loadTemplatePackage(async () => ({ ok: false, async json() { return {}; } }), "/missing"),
  /load failed: manifest\.json/
);

console.log("template package loader tests passed");
