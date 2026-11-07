import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
}

const scriptPath = path.resolve('apps/designer-studio/wizard-flow.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');
const context = {
  console,
  localStorage: createStorage(),
  document: { getElementById() { return null; }, querySelectorAll() { return []; }, querySelector() { return null; } }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(scriptSource, context);

const api = context.ACDLDesignerStudioWizard;
assert.ok(api, 'wizard api should be exported');
assert.deepEqual({ ...api.createFreshWizardState() }, {
  step: 1,
  calendarType: null,
  templateId: null,
  validationMessage: '달력 유형을 선택해 주세요.'
});

const fresh = api.createFreshWizardState();
const typeSelected = api.selectCalendarType(fresh, 'postcard');
assert.equal(typeSelected.calendarType, 'postcard');
assert.equal(typeSelected.templateId, null);
assert.equal(typeSelected.validationMessage, '');

const stepTwoState = api.moveWizardStep(typeSelected, 'next');
assert.equal(stepTwoState.step, 2);
assert.equal(stepTwoState.validationMessage, '사용할 템플릿을 선택해 주세요.');

const templateSelected = api.selectTemplate(stepTwoState, 'minimal');
assert.equal(templateSelected.templateId, 'minimal');
assert.equal(templateSelected.validationMessage, '');

const normalized = api.normalizeState({ selectedType: 'desk', template: 'school-basic', step: 7 });
assert.equal(normalized.step, 5);
assert.equal(normalized.calendarType, 'desk');
assert.equal(normalized.templateId, 'school-basic');

const empty = api.normalizeState({ selectedType: '', template: '', step: 0 });
assert.equal(empty.calendarType, null);
assert.equal(empty.templateId, null);
assert.equal(empty.step, 1);

const restored = api.restoreWizardState('acdl-user-wizard-state', { allowStored: false });
assert.equal(restored.calendarType, null);
assert.equal(restored.templateId, null);
assert.equal(restored.step, 1);

console.log('wizard-flow tests passed');
