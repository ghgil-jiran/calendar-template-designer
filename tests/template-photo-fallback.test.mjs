import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readTemplate(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

const desk = await readTemplate('../templates/desk-academic-standard/1.2.0/template.json');
const wall = await readTemplate('../templates/wall-academic-standard/0.2.0/template.json');

for (const template of [desk, wall]) {
  const asset = template.sampleAssets?.schoolPhoto;
  assert.equal(asset?.ref, 'url');
  assert.equal(asset?.kind, 'template-sample');
  assert.equal(asset?.replaceable, true);
  assert.match(asset?.src || '', /^data:image\/svg\+xml;base64,/);
}

assert.equal(desk.masterDefinitions['cover-front'][0].sampleAssetKey, 'schoolPhoto');
assert.equal(desk.masterDefinitions['monthly-photo-memo'][0].layout.children[0].sampleAssetKey, 'schoolPhoto');
assert.equal(desk.masterDefinitions['back-contact'].find(item => item.id === 'back.photo').sampleAssetKey, 'schoolPhoto');

assert.equal(wall.masterDefinitions['cover-front'].find(item => item.id === 'wall.cover.school-image').sampleAssetKey, 'schoolPhoto');
assert.equal(wall.masterDefinitions['monthly-calendar'].find(item => item.id === 'wall.monthly.image').sampleAssetKey, 'schoolPhoto');
assert.equal(wall.masterDefinitions['back-contact'].find(item => item.id === 'wall.back.photo').sampleAssetKey, 'schoolPhoto');

console.log('template photo fallback tests passed');
