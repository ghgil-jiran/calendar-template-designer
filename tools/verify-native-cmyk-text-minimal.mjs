import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TemplateRuntime } from "../packages/template-runtime/dist/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "templates", "native-cmyk-text-minimal", "0.1.0");
const [template, dataset, manifest, font, license] = await Promise.all([
  readFile(path.join(fixture, "template.json"), "utf8").then(JSON.parse),
  readFile(path.join(fixture, "dataset.json"), "utf8").then(JSON.parse),
  readFile(path.join(fixture, "assets", "fonts", "manifest.json"), "utf8").then(JSON.parse),
  readFile(path.join(fixture, "assets", "fonts", "Pretendard-Regular.otf")),
  readFile(path.join(fixture, "assets", "fonts", "OFL-1.1.txt"), "utf8")
]);

const declared = manifest.fonts[0];
assert.equal(createHash("sha256").update(font).digest("hex"), declared.sha256);
assert.equal(template.pages[0].objects[0].print.font.sha256, declared.sha256);
assert.equal(template.pages[0].objects[0].print.font.postscriptName, declared.postscriptName);
assert.equal(font.subarray(0, 4).toString("ascii"), "OTTO");
assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);

const result = new TemplateRuntime().execute(template, dataset, { target: "print", strictBindings: true });
assert.equal(result.hasErrors, false, JSON.stringify(result.document.diagnostics));
const node = result.document.pages[0].objects[0];
assert.equal(node.value, "새원칙중학교");
assert.equal(node.style.fontFamily, "Pretendard");
assert.equal(node.style.fontSizePt, 24);
assert.equal(node.style.fontSize, undefined);
assert.equal(node.print.font.assetId, "assets/fonts/Pretendard-Regular.otf");
assert.equal(node.print.font.sha256, declared.sha256);

console.log(`NATIVE_CMYK_TEXT_CONTRACT_OK\nfont=${declared.postscriptName}\nsha256=${declared.sha256}\ntext=${node.value}`);
