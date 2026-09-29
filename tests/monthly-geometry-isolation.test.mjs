import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../apps/designer-studio/features/object-editing.js', import.meta.url), 'utf8');
const start = source.indexOf('function matchingMonthlyObjectsFor(item){');
const end = source.indexOf('\nfunction syncMonthlySharedFields(', start);
const match = vm.runInNewContext(`${source.slice(start, end)}; matchingMonthlyObjectsFor`, {
  selectedPage: () => ({ role: 'monthly-back' }),
  pageElements: page => pages.get(page.id),
  monthlyPagesForRole: () => [{ id: 'march' }, { id: 'april' }],
  project: { template: { masterElements: {} } }
});
const pages = new Map([
  ['march', [
    { id: 'todo-march', role: 'ai-month-back-component', aiDesignComponent: 'planner-checklist', type: 'memo' },
    { id: 'memo-march', role: 'ai-month-back-component', aiDesignComponent: 'memo', type: 'memo' }
  ]],
  ['april', [
    { id: 'todo-april', role: 'ai-month-back-component', aiDesignComponent: 'planner-checklist', type: 'memo' },
    { id: 'memo-april', role: 'ai-month-back-component', aiDesignComponent: 'memo', type: 'memo' }
  ]]
]);

test('moving a month-back To Do List matches only the same component across months', () => {
  assert.deepEqual(Array.from(match(pages.get('march')[0]), item => item.id), ['todo-march', 'todo-april']);
});

test('older month-back memo objects without component IDs keep memo and To Do List separate', () => {
  for (const [month, items] of pages) {
    items[0] = { id: `todo-${month}`, role: 'ai-month-back-component', type: 'memo', memoLayout: 'checklist', title: 'TO DO LIST' };
    items[1] = { id: `memo-${month}`, role: 'ai-month-back-component', type: 'memo', memoLayout: 'lines', title: 'MEMO' };
  }
  assert.deepEqual(Array.from(match(pages.get('march')[0]), item => item.id), ['todo-march', 'todo-april']);
});
