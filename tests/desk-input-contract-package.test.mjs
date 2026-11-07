import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const publishing = JSON.parse(await readFile(
  new URL('../templates/desk-academic-standard/1.4.0/publishing.json', import.meta.url),
  'utf8'
));
const requirements = new Map(publishing.dataRequirements.map(item => [item.path, item]));
const required = [
  'school.name',
  'calendar.year',
  'calendar.events',
  'school.profile.building',
  'school.profile.logo',
  'school.contacts'
];
const optional = [
  'monthlyImages',
  'school.profile.flower',
  'school.profile.tree',
  'school.profile.motto',
  'school.profile.song'
];

for (const path of required) {
  assert.equal(requirements.get(path)?.stage, 'project-create-required', path);
  assert.equal(requirements.get(path)?.fallback, 'empty', path);
}
for (const path of optional) {
  assert.equal(requirements.get(path)?.stage, 'optional', path);
  assert.equal(requirements.get(path)?.fallback, 'sample', path);
}
assert.equal(publishing.version, '1.4.0');
assert.equal(requirements.size, required.length + optional.length);

console.log('desk input contract package tests passed');
