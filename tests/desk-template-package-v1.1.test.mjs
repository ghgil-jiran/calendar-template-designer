import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = new URL('../templates/desk-academic-standard/1.1.0/', import.meta.url);
const readJson = async name => JSON.parse(await readFile(new URL(name, base), 'utf8'));

const manifest = await readJson('manifest.json');
const template = await readJson(manifest.files.template);
const bindings = await readJson(manifest.files.bindings);
const print = await readJson(manifest.files.print);
const parity = await readJson(manifest.files.parity);

assert.equal(manifest.version, '1.1.0');
assert.equal(manifest.status, 'review');
assert.equal(manifest.publishable, false);
assert.equal(template.version, manifest.version);
assert.equal(template.extractionStatus, 'runtime-parity-review');
assert.equal(bindings.templateVersion, manifest.version);
assert.equal(print.version, manifest.version);
assert.equal(parity.version, manifest.version);

const annual = template.masterDefinitions['annual-calendar'][0];
assert.deepEqual(annual.framePct, { x: 5, y: 21.8, width: 90, height: 71.2 });
assert.deepEqual(annual.layoutContract.titleFramePct, { x: 5, y: 10, width: 90, height: 8 });

const monthly = template.masterDefinitions['monthly-calendar'][0];
assert.deepEqual(monthly.layoutContract.headerFramePct, { x: 5, y: 7, width: 90, height: 10.5 });
assert.deepEqual(monthly.layoutContract.weekdayFramePct, { x: 5, y: 23, width: 90, height: 2.5 });
assert.deepEqual(monthly.framePct, { x: 5, y: 26.5, width: 90, height: 66.5 });

const photoMemo = template.masterDefinitions['monthly-photo-memo'][0];
assert.equal(photoMemo.layout.model, 'absolute-safe-area');
assert.deepEqual(photoMemo.layout.children[0].framePct, { x: 5, y: 9.7, width: 90, height: 50.3 });
assert.deepEqual(photoMemo.layout.children[1].framePct, { x: 5, y: 61.2, width: 90, height: 31.8 });
assert.equal(photoMemo.layout.children[1].drawnLineCount, 6);

assert.equal(parity.visual.metrics.surfaceCount, 28);
assert.equal(parity.visual.metrics.averagePixelDifferencePct, 8.743);
assert.equal(parity.print.status, 'pending');
