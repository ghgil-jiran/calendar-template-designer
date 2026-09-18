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
  assert.equal(pkg.version, '0.1.0-alpha.3');
  assert.deepEqual(pkg.exports['.'], { types: './dist/index.d.ts', import: './dist/index.js' });
  assert.deepEqual(pkg.exports['./native-print-runtime'], {
    types: './dist/native-print-runtime.d.ts',
    import: './dist/native-print-runtime.js'
  });
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.0.0/*'], './templates/desk-academic-standard/1.0.0/*');
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.1.0/*'], './templates/desk-academic-standard/1.1.0/*');
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.2.0/*'], './templates/desk-academic-standard/1.2.0/*');
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.3.0/*'], './templates/desk-academic-standard/1.3.0/*');
  assert.equal(pkg.exports['./templates/desk-academic-standard/1.4.0/*'], './templates/desk-academic-standard/1.4.0/*');
  assert.equal(pkg.exports['./templates/wall-academic-standard/0.1.0/*'], './templates/wall-academic-standard/0.1.0/*');
  assert.equal(pkg.exports['./templates/wall-academic-standard/0.2.0/*'], './templates/wall-academic-standard/0.2.0/*');
  assert.equal(pkg.exports['./templates/wall-academic-standard/0.3.0/*'], './templates/wall-academic-standard/0.3.0/*');

  const integrity = JSON.parse(await readFile(join(output, 'INTEGRITY.json'), 'utf8'));
  assert.equal(integrity.algorithm, 'sha256');
  assert.equal(integrity.template, 'desk-academic-standard@1.0.0');
  assert.deepEqual(integrity.templates, [
    'desk-academic-standard@1.0.0',
    'desk-academic-standard@1.1.0',
    'desk-academic-standard@1.2.0',
    'desk-academic-standard@1.3.0',
    'desk-academic-standard@1.4.0',
    'wall-academic-standard@0.1.0',
    'wall-academic-standard@0.2.0',
    'wall-academic-standard@0.3.0'
  ]);
  assert.match(integrity.files['dist/DeskAcademicSurfacePlan.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['dist/AcademicPackageSurfacePlan.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['dist/native-print-runtime.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['dist/template-runtime/Runtime.js'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.0.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.1.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.1.0/publishing.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.2.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.3.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.4.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/desk-academic-standard/1.4.0/publishing.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.1.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.1.0/publishing.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.2.0/template.json'], /^[a-f0-9]{64}$/);
  assert.match(integrity.files['templates/wall-academic-standard/0.3.0/template.json'], /^[a-f0-9]{64}$/);
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

  const nativeRuntime = await import(pathToFileURL(join(output, 'dist/native-print-runtime.js')));
  const nativeTemplate = {
    schemaVersion: '1.0',
    id: 'native-package-smoke',
    revision: 1,
    printContract: {
      schemaVersion: 'print-contract.v1',
      profile: 'Japan Color 2011 Coated',
      pdfStandard: 'PDF/X-4',
      coordinateUnit: 'mm',
      productionSizeMm: { width: 266, height: 186 },
      trimSizeMm: { width: 260, height: 180 },
      bleedMm: 3,
      safeInsetMm: 8,
      minimumImageDpi: 300
    },
    pages: [{
      id: 'page.1', role: 'proof', size: { width: 260, height: 180, unit: 'mm' },
      objects: [{
        id: 'bound-title', type: 'text', frame: { x: 12, y: 12, width: 80, height: 20 },
        binding: 'variables.title', style: { fontFamily: 'Pretendard', fontSize: 18 },
        print: {
          structure: 'native-vector', textMode: 'outline', blackMode: 'k100',
          fill: { space: 'cmyk', c: 0, m: 0, y: 0, k: 1 },
          font: { ref: 'package', assetId: 'assets/fonts/Pretendard-Regular.otf', sha256: '3ffbacde6ab8411f1d2db54bb9b1f0b3ee2a738932033722cf0388c06aed1c93', postscriptName: 'Pretendard-Regular', license: 'OFL-1.1', outlineAllowed: true }
        }
      }]
    }]
  };
  const nativeDocument = new nativeRuntime.TemplateRuntime().execute(
    nativeTemplate,
    { schemaVersion: '1.0', variables: { title: '공통 Runtime' } },
    { target: 'print', strictBindings: true }
  );
  assert.equal(nativeDocument.hasErrors, false);
  assert.equal(nativeDocument.document.target, 'print');
  assert.equal(nativeDocument.document.pages[0].objects[0].value, '공통 Runtime');
  assert.equal(nativeDocument.document.pages[0].objects[0].print.fill.k, 1);
} finally {
  await rm(output, { recursive: true, force: true });
}

console.log('user service runtime distribution package tests passed');
