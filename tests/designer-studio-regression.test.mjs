import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('apps/designer-studio/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('designer studio entry flow uses the unified studio entry and hides sample entry', () => {
  assert.match(html, /<script src="\.\/wizard-flow\.js"><\/script>/, 'wizard-flow script should be loaded');
  assert.match(html, /function openDesignerStudio\(/, 'the studio entry flow should expose openDesignerStudio');
  assert.doesNotMatch(html, /id="designerHomeSample"/, 'the sample project action should be removed from the home UI');
  assert.doesNotMatch(html, /designerHomeSample/, 'sample entry handler should not remain in the app shell');
});

test('wizard state helper is available for step persistence', () => {
  const wizardPath = path.resolve('apps/designer-studio/wizard-flow.js');
  const wizard = fs.readFileSync(wizardPath, 'utf8');
  assert.match(wizard, /ACDLDesignerStudioWizard/, 'wizard helper should expose the shared state API');
  assert.match(wizard, /persistWizardState/, 'wizard helper should persist the selected type and step');
});
