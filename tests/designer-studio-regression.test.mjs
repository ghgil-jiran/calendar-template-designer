import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = path.resolve('apps/designer-studio/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('template objects allow overlap without collision avoidance or forced grid snapping', () => {
  assert.doesNotMatch(html, /rectanglesOverlap\(/);
  assert.match(html, /function findSemanticPlacement\(base,arr\)\{\s*return \{/);
  assert.doesNotMatch(html, /if\(e\.altKey===false\)\{x=snap\(x,grid\.x\);y=snap\(y,grid\.y\)\}/);
  assert.match(html, /data-s2="front">맨 앞으로/);
  assert.match(html, /data-s2="back">맨 뒤로/);
});

test('system base templates start without sample school events', () => {
  assert.match(html, /pageInstances:\[\],events:\[\],elementsByPage:\{\}/);
  assert.doesNotMatch(html, /events:SAMPLE_EVENTS\.filter/);
});

test('postcard calendar editing uses the single shared toggle handler', () => {
  assert.match(
    html,
    /el\("editCalendarBtn"\)\.addEventListener\("click",\(\)=>\{\s*calendarEditing=!calendarEditing;/,
    'the shared calendar edit button should toggle the selection once'
  );
  assert.doesNotMatch(
    html,
    /editCalendarBtn['"]\)\?\.addEventListener\(['"]click['"],[\s\S]{0,220}productType\?\.category===['"]postcard['"]/,
    'postcard should not register a second capture-phase click handler'
  );
});

test('desk thumbnail gives most of the card area to the cover design', () => {
  assert.match(html, /calendar-product-thumb\{[^}]*padding:7px/);
  assert.match(html, /calendar-product-shell\{[^}]*width:98%;height:94%/);
  assert.match(html, /calendar-product-page\{[^}]*height:90%/);
});

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

test('wizard primary action styling stays visible without design tokens', () => {
  assert.match(html, /\.wizard-actions button\.primary\{[^}]*background:\s*#2563eb/, 'primary wizard button should use the fallback blue background');
  assert.match(html, /\.wizard-actions button\.primary\{[^}]*color:\s*#fff/, 'primary wizard button should use white text');
  assert.match(html, /\.wizard-actions button\.primary:hover\{[^}]*background:\s*#1d4ed8/, 'primary wizard button should use a hover state');
  assert.match(html, /--accent:\s*var\(--acds-primary,\s*#2563eb\)/, 'wizard styles should define an accent fallback token');
});

test('wizard helper can reset step and selection state for a fresh flow', () => {
  const wizardPath = path.resolve('apps/designer-studio/wizard-flow.js');
  const source = fs.readFileSync(wizardPath, 'utf8');
  const storage = new Map();
  const context = {
    window: {},
    globalThis: {},
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(source, context);
  const wizard = context.ACDLDesignerStudioWizard;
  wizard.persistWizardState({ selectedType: 'desk', template: 'school-basic', step: 3 });
  const reset = wizard.resetWizardState();
  assert.equal(reset.step, 1);
  assert.equal(reset.selectedType, '');
  assert.equal(reset.template, '');
  assert.equal(wizard.restoreWizardState().step, 1);
  assert.equal(wizard.restoreWizardState().selectedType, '');
  assert.match(source, /resetWizardState/, 'wizard helper should expose a reset helper');
});
