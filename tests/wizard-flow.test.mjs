import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value)
};
await import('../apps/designer-studio/wizard-flow.js');
const wizard = globalThis.ACDLDesignerStudioWizard;

test('a fresh wizard does not choose a type or template', () => {
  values.clear();
  assert.deepEqual(wizard.restoreWizardState(), { selectedType: '', template: '', step: 1 });
});

test('choosing a type does not auto-select a template', () => {
  const next = wizard.applyTypeSelection({ selectedType: '', template: '', step: 1 }, 'postcard');
  assert.deepEqual(next, { selectedType: 'postcard', template: '', step: 1 });
});

test('changing type clears a template selected for the previous type', () => {
  const next = wizard.applyTypeSelection({ selectedType: 'desk', template: 'school-basic', step: 2 }, 'postcard');
  assert.deepEqual(next, { selectedType: 'postcard', template: '', step: 2 });
});

test('designer entry opens the selection home before setup', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /if\(source==='entry'\)\{el\('designerHome'\)\.classList\.remove\('hidden'\);return;\}/);
  assert.doesNotMatch(html, /if\(source==='entry'\)\{el\('setup'\)\.classList\.remove\('hidden'\);return;\}/);
});

test('template choices are not rendered preselected', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /class="template-choice selected"/);
  assert.doesNotMatch(runtime, /index===0\?'selected'/);
  assert.match(runtime, /updateWizardActions\(\)/);
});

test('template click persists the choice before refreshing wizard actions', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /persistWizardState\?\.\(\{selectedType:selectedCalendarType,template:selectedUserTemplate\.template,step:userWizardStep\}\);updateWizardActions\(\)/);
});

test('returning home clears the previous editor project', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /function showEntry\(\)\{beginProjectTransition\(\{clearProject:true\}\)/);
  assert.match(html, /function beginProjectTransition\(\{clearProject=false\}=\{\}\)/);
});

test('template switching ignores stale async loads', () => {
  const html = fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url), 'utf8');
  assert.match(html, /const transitionId=beginProjectTransition\(\{clearProject:true\}\)/);
  assert.match(html, /if\(!isCurrentProjectTransition\(transitionId\)\)return;/);
});

test('library thumbnails cannot restore an earlier editor state', () => {
  const runtime = fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /let thumbnailQueue=Promise\.resolve\(\)/);
  assert.match(runtime, /if\(!host\.isConnected\|\|\(navigation&&!navigation\.isCurrent\(transitionId\)\)\)return;/);
  assert.match(runtime, /original&&\(!navigation\|\|navigation\.isCurrent\(transitionId\)\)/);
});
