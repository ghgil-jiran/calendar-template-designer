import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const output = await mkdtemp(join(tmpdir(), 'user-service-runtime-'));
try {
  const build = spawnSync(process.execPath, ['tools/build-user-service-runtime-package.mjs', output], {
    cwd: resolve('.'), encoding: 'utf8'
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const pkg = JSON.parse(await readFile(join(output, 'package.json'), 'utf8'));
  assert.equal(pkg.name, '@calendar-publishing/user-service-runtime-bridge');
  assert.equal(pkg.version, '0.1.0-alpha.2');
  assert.deepEqual(pkg.exports['.'], { types: './dist/index.d.ts', import: './dist/index.js' });
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.0.0/*'], './templates/desk-academic-standard/1.0.0/*');
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.1.0/*'], './templates/desk-academic-standard/1.1.0/*');
  assert.equal(pkg.exports['./templates/wall-academic-standard/0.1.0/*'], './templates/wall-academic-standard/0.1.0/*');

  const integrity = JSON.parse(await readFile(join(output, 'INTEGRITY.json'), 'utf8'));
  assert.equal(integrity.algorithm, 'sha256');
  assert.equal(integrity.template, 'desk-academic-standard@1.0.0');
  assert.deepEqual(integrity.templates, [
    'desk-academic-standard@1.0.0',
    'desk-academic-standard@1.1.0',
    'wall-academic-standard@0.1.0'
  ]);
  assert.match(integrity.files['dist/DeskAcademicSurfacePlan.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['dist/AcademicPackageSurfacePlan.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.0.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.1.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.1.0/publishing.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.1.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.1.0/publishing.json'], /^[a-f0-9]{64}$/);
  const templateBytes = await readFile(join(output, 'templates/desk-academic-standard/1.0.0/template.json'));
  assert.equal(createHash('sha256').update(templateBytes).digest('hex'), integrity.files['templates/desk-academic-standard/1.0.0/template.json']);

  const runtime = await import(pathToFileURL(join(output, 'dist/index.js')));
  const template = JSON.parse(await readFile(join(output, 'templates/desk-academic-standard/1.0.0/template.json'), 'utf8'));
  const dataset = {
    school: { name: '패키지 검사 학교', profile: {}, contact: {} },
    calendar: { year: 2027, startMonth: 3, events: [] },
    monthlyImages: {}
  };
  const document = runtime.composeDeskAcademicPackageDocument(dataset, template);
  assert.equal(document.template.pages.length, 28);
  assert.equal(document.dataset.calendar.gridRows, 5);
  assert.equal(document.dataset.school.name, '패키지 검사 학교');
  assert.equal(runtime.validateDeskAcademicPackageDocument(document).filter(item => item.severity === 'error').length, 0);

  const precisionTemplate = JSON.parse(await readFile(join(output, 'templates/desk-academic-standard/1.1.0/template.json'), 'utf8'));
  const precisionDocument = runtime.composeDeskAcademicPackageDocument(dataset, precisionTemplate);
  assert.equal(precisionDocument.template.pages.length, 28);
  assert.equal(runtime.validateDeskAcademicPackageDocument(precisionDocument).filter(item => item.severity === 'error').length, 0);
} finally {
  await rm(output, { recursive: true, force: true });
}

console.log('user service runtime distribution package tests passed');
