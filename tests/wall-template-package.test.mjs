import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL("../templates/wall-academic-standard/0.1.0/", import.meta.url);
const readJson = async (file) => JSON.parse(await readFile(new URL(file, base), "utf8"));
const manifest = await readJson("manifest.json");
const template = await readJson("template.json");
const bindings = await readJson("bindings.json");
const print = await readJson("print.json");
const parity = await readJson("parity.json");
const publishing = await readJson("publishing.json");

assert.equal(manifest.templateId, "wall-academic-standard");
assert.equal(manifest.productType, "wall");
assert.equal(manifest.pageComposition.surfaceCount, 15);
assert.equal(manifest.pageComposition.frontInsertCount, 1);
assert.equal(manifest.pageComposition.rearInsertCount, 0);
assert.equal(manifest.pageComposition.duplex, false);
assert.equal(template.pageSequence[2].repeat, 12);
assert.deepEqual(template.pageSequence.map((rule) => rule.role), ["cover-front", "school-symbols", "monthly-calendar", "back-contact"]);
assert.equal(template.masterDefinitions["monthly-calendar"].some((item) => item.type === "calendar"), true);
assert.equal(bindings.templateVersion, manifest.version);
assert.deepEqual(print.trimSize, { width: 297, height: 420, unit: "mm" });
assert.equal(print.orientation, "portrait");
assert.equal(parity.visual.status, "pending");
assert.equal(publishing.lifecycle.currentStatus, "review");
assert.equal(publishing.releaseReadiness.ready, false);

console.log("wall template package tests passed");
