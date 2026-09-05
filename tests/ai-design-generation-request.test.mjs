import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../apps/designer-studio/', import.meta.url);
function loadScript(name, globalName) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL(name, root), 'utf8'), context);
  return context[globalName];
}

test('AI generation request keeps the source template read-only and separates output groups', () => {
  const api = loadScript('ai-design-generation-request.js', 'ACDLAIDesignGenerationRequest');
  const request = api.buildRequest({project:{book:{id:'book.demo'},productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027,startMonth:3}},conditions:{variantCount:3},reference:{templateId:'template.demo',readOnly:true,aspects:['layout'],pages:[{role:'month',pageId:'month.3'}]}});
  assert.equal(request.referenceTemplate.readOnly, true);
  assert.equal(request.outputContract.applyMode, 'separate-draft');
  assert.deepEqual([...request.outputContract.groups], ['assets','objectStyles','layouts','pageResults','qualityChecks']);
  assert.ok(request.outputContract.forbiddenRasterText.includes('date'));
});

test('AI module manifest resolves every independently versioned rule file', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('ai-design/module-manifest.json', root)));
  assert.equal(manifest.version, '1.1.0');
  assert.equal(manifest.storagePolicy.publishedPackage, 'read-only');
  for (const relative of Object.values(manifest.rules)) assert.ok(fs.existsSync(new URL(`ai-design/${relative}`, root)), relative);
});

test('AI settings summary reads the current pageInstances structure', () => {
  const settings = loadScript('ai-design-settings.js', 'ACDLAIDesignSettings');
  const summary = settings.summary({book:{pageInstances:[{role:'cover-front'},{role:'monthly-front'}]},productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027,startMonth:3}});
  assert.equal(summary.pageCount, 2);
  assert.match(summary.versions.promptSet, /@0\.1\.0$/);
});
