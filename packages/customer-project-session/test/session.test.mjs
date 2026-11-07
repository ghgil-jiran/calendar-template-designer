import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomerProject, readCustomerProject, nextRevision, copyAsNewProject, createFinalSnapshot} from '../src/index.js';

function native(count = 28, category = 'desk') {
  return {
    format: 'acdl-project', productType: {category, pageSize: {width: 260, height: 180}},
    settings: {startMonth: 8, weekStart: 'monday', calendarRows: 6},
    template: {masterElements: {front: [{id: 'grid', type: 'calendar', style: {annotations: {layout: 'beside'}, weekdayBackground: 'transparent'}}]}},
    book: {
      school: {name: '학교'},
      pageInstances: Array.from({length: count}, (_, i) => ({id: `p${i + 1}`, masterId: 'front', calendarMonth: i % 12 + 1})),
      elementsByPage: {p1: [{id: 'future-object', type: 'future-style', x: 1.125, printSource: {src: 'package-asset://original.pdf'}, image: {src: 'package-asset://preview.webp'}}]}
    },
    futureExtension: {keep: true}
  };
}
function draft(project = native()) {return createCustomerProject({id: 'project-1', templateRef: {id: 'template-a', version: 8}, engineVersion: 'editor-test-1', project});}

test('native source and all 28 pages survive JSON round trip without conversion', () => {
  const source = native(), value = draft(source);
  assert.deepEqual(readCustomerProject(JSON.parse(JSON.stringify(value))).project, source);
  value.project.book.school.name = '변경';
  assert.equal(source.book.school.name, '학교');
});
test('opaque new objects, styles, coordinates and original PDF asset references survive', () => {
  const project = native();
  assert.deepEqual(draft(project).project, project);
  assert.equal(draft(project).project.book.elementsByPage.p1[0].printSource.src, 'package-asset://original.pdf');
});
test('does not enforce MVP March/Sunday/five-row assumptions', () => {
  assert.deepEqual(draft().project.settings, {startMonth: 8, weekStart: 'monday', calendarRows: 6});
  assert.equal(draft(native(1, 'poster')).project.book.pageInstances.length, 1);
});
test('accepts engine result as new revision and does not mutate previous revision', () => {
  const old = draft(), edited = structuredClone(old.project);
  edited.book.school.name = '새 학교';
  const next = nextRevision(old, edited);
  assert.equal(next.revision, 2);
  assert.equal(old.project.book.school.name, '학교');
  assert.deepEqual(next.project, edited);
});
test('final snapshot remains unchanged after subsequent editing', () => {
  const value = draft(), final = createFinalSnapshot(value, 'snapshot-1');
  value.project.book.school.name = '수정';
  assert.equal(final.project.book.school.name, '학교');
  assert.equal(final.templateRef.version, 8);
});
test('copy starts a new project without losing template or photo data', () => {
  const value = nextRevision(draft(), native());
  const copied = copyAsNewProject(value, 'project-2');
  assert.equal(copied.revision, 1);
  assert.deepEqual(copied.project, value.project);
  assert.throws(() => copyAsNewProject(value, value.id));
});
test('rejects another document format, malformed dimensions and duplicate pages', () => {
  assert.throws(() => draft({...native(), format: 'runtime-document'}));
  const bad = native(); bad.productType.pageSize.width = 0; assert.throws(() => draft(bad));
  const duplicate = native(); duplicate.book.pageInstances[1].id = 'p1'; assert.throws(() => draft(duplicate));
});
test('requires pinned template and engine versions', () => {
  assert.throws(() => createCustomerProject({id: 'a', templateRef: {id: 'b'}, engineVersion: 'v1', project: native()}));
  assert.throws(() => createCustomerProject({id: 'a', templateRef: {id: 'b', version: 1}, project: native()}));
});
test('rejects type changes and page reordering within the same project', () => {
  const value = draft(), changed = native(); changed.book.pageInstances.reverse();
  assert.throws(() => nextRevision(value, changed));
  assert.throws(() => nextRevision(value, native(1, 'poster')));
});
test('read rejects unsupported envelope versions rather than silently migrating', () => {
  assert.throws(() => readCustomerProject({...draft(), schemaVersion: 'unknown'}));
});
