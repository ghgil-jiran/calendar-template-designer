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
  const designSpec={schemaVersion:'ai-design-spec.v1',version:'0.1.0',styleId:'geometry',pageTypes:{month:'split-calendar-image'},expression:{decoration:'medium',photoMode:'mixed',seasonal:'high',density:'medium'},protectedContent:['calendar-data']};
  const request = api.buildRequest({project:{book:{id:'book.demo'},productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027,startMonth:3}},conditions:{variantCount:3,monthBackComponents:['image','previous-mini-calendar','planner-weekly','unknown']},designSpec,reference:{templateId:'template.demo',readOnly:true,aspects:['layout'],pages:[{role:'month',pageId:'month.3'}]}});
  assert.equal(request.referenceTemplate.readOnly, true);
  assert.equal(request.outputContract.applyMode, 'separate-draft');
  assert.deepEqual([...request.outputContract.groups], ['assets','objectStyles','layouts','pageResults','qualityChecks']);
  assert.ok(request.outputContract.forbiddenRasterText.includes('date'));
  assert.equal(request.source.months.length, 12);
  assert.equal(request.outputContract.designSet.monthFrontResults, 12);
  assert.equal(request.outputContract.designSet.monthBackResults, 12);
  assert.equal(request.outputContract.designSet.uniqueMonthBackIllustration, true);
  assert.deepEqual([...request.conditions.monthBackComposition.components], ['image','previous-mini-calendar','planner-weekly']);
  assert.equal(request.conditions.monthBackComposition.ignoreReferenceComposition, true);
  assert.deepEqual([...request.outputContract.designSet.monthBackComponents], ['image','previous-mini-calendar','planner-weekly']);
  assert.equal(JSON.stringify(request.designSpec),JSON.stringify(designSpec));
  assert.notEqual(request.designSpec,designSpec);
});

test('AI module manifest resolves every independently versioned rule file', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('ai-design/module-manifest.json', root)));
  assert.equal(manifest.version, '1.3.0');
  assert.equal(manifest.storagePolicy.publishedPackage, 'read-only');
  for (const relative of Object.values(manifest.rules)) assert.ok(fs.existsSync(new URL(`ai-design/${relative}`, root)), relative);
});

test('actual AI sample assets are versioned, text-free review inputs', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('ai-design/sample-assets/manifest.json', root)));
  assert.equal(manifest.version, '0.1.0');
  assert.equal(manifest.policy.containsEditableCalendarText, false);
  assert.equal(manifest.assets.length, 4);
  for (const asset of manifest.assets) {
    assert.ok(fs.existsSync(new URL(`ai-design/sample-assets/${asset.file}`, root)), asset.file);
    assert.equal(asset.quality.forbiddenText, 'pass');
  }
  assert.equal(manifest.rejected[0].rule, 'preserve-school-photo-and-symbol');
});

test('AI settings summary reads the current pageInstances structure', () => {
  const settings = loadScript('ai-design-settings.js', 'ACDLAIDesignSettings');
  const summary = settings.summary({book:{pageInstances:[{role:'cover-front'},{role:'monthly-front'}]},productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027,startMonth:3}});
  assert.equal(summary.pageCount, 2);
  assert.match(summary.versions.promptSet, /@0\.5\.0$/);
});

test('new-template completion applies the selected sample only to a separate draft project', () => {
  const html = fs.readFileSync(new URL('index.html', root), 'utf8');
  assert.match(html, /function applyAIDesignSampleDraft\(session\)/);
  assert.match(html, /function prepareNeutralAIDesignBase\(session\)/);
  assert.match(html, /schemaVersion:"ai-design-neutral-base\.v1"/);
  assert.match(html, /item\?\.role==="background-decoration"/);
  assert.match(html, /preservedResources:true,contentRolesPreserved:true/);
  assert.match(html, /preservedMasterDecorations:true/);
  assert.match(html, /mode:"role-scoped"/);
  assert.match(html, /generatedRoles=selected\?\.assetsByRole\?Object\.keys\(selected\.assetsByRole\)/);
  assert.doesNotMatch(html, /project\.template\.masterElements\[masterId\]=kept/);
  assert.match(html, /const AI_DESIGN_ROLE_MAP=\{cover:\["cover-front"\]/);
  assert.match(html, /"school-symbols":\["school-symbols","front-insert-front"\]/);
  assert.doesNotMatch(html, /selected\.generatedRole==="cover"\?new Set\(\["cover-front"\]\):new Set\(\["cover-front","cover-back","monthly-front"/);
  assert.match(html, /role:"ai-design-background"/);
  assert.match(html, /project\.template\.aiDesignDraft\.neutralBase=prepareNeutralAIDesignBase\(aiDesignMockSession\)/);
  assert.match(html, /project\.template\.aiDesignDraft\.quality=\{\.\.\.qualityReport,regeneration\}/);
  assert.match(html, /qualityReport\.status==='failed'\?"quality-review-required":"sample-applied"/);
  assert.match(html, /project\.template\.aiDesignDraft\.session=structuredClone\(aiDesignMockSession\)/);
  assert.match(html, /project\.template\.aiDesignDraft\.selectedVariant=structuredClone\(selected\)/);
  assert.match(html, /resources\?\.aiDesignAssets/);
  assert.match(html, /resource\.src=result\.asset\.dataUrl/);
  assert.match(html, /selected\.generated\?"live-ai-generation":"bundled-ai-sample"/);
  assert.match(html, /data-ai-month-back-component="image"/);
  assert.match(html, /data-ai-month-back-component="current-calendar"/);
  assert.match(html, /data-ai-month-back-component="month-date-strip"/);
  assert.match(html, /monthBackComponents=\[\.\.\.document\.querySelectorAll\("\[data-ai-month-back-component\]:checked"\)\]/);
});
