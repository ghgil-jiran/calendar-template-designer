import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, 'dist/user-service-runtime-bridge'));
const source = resolve(root, 'packages/designer-runtime-integration/dist');
const templateRuntimeSource = resolve(root, 'packages/template-runtime/dist/src');
const bridgeVersion = '0.1.0-alpha.3';
const templatePackages = [
  { templateId: 'desk-academic-standard', versions: ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0'] },
  { templateId: 'wall-academic-standard', versions: ['0.1.0', '0.2.0', '0.3.0'] }
];
const modules = [
  'TemplatePackageLoader',
  'DeskAcademicPackageRuntime',
  'DeskAcademicSurfacePlan',
  'AcademicPackageSurfacePlan',
  'UserServiceShadowDiagnostics'
];

async function assertBuilt(name) {
  try {
    await readFile(resolve(source, `${name}.js`));
    await readFile(resolve(source, `${name}.d.ts`));
  } catch {
    throw new Error(`Build designer-runtime-integration before packaging: ${name}`);
  }
}

await Promise.all(modules.map(assertBuilt));
await readFile(resolve(templateRuntimeSource, 'index.js')).catch(() => {
  throw new Error('Build template-runtime before packaging: index');
});
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, 'dist'), { recursive: true });
await mkdir(resolve(output, 'templates'), { recursive: true });

for (const name of modules) {
  await cp(resolve(source, `${name}.js`), resolve(output, 'dist', `${name}.js`));
  await cp(resolve(source, `${name}.d.ts`), resolve(output, 'dist', `${name}.d.ts`));
}
await cp(templateRuntimeSource, resolve(output, 'dist/template-runtime'), { recursive: true });
const nativePrintExport = 'export * from "./template-runtime/index.js";\n';
await writeFile(resolve(output, 'dist/native-print-runtime.js'), nativePrintExport);
await writeFile(resolve(output, 'dist/native-print-runtime.d.ts'), nativePrintExport);
for (const { templateId, versions } of templatePackages) {
  for (const version of versions) {
    await cp(
      resolve(root, 'templates', templateId, version),
      resolve(output, 'templates', templateId, version),
      { recursive: true }
    );
  }
}

const exportLines = modules.map(name => `export * from "./${name}.js";`).join('\n') + '\n';
await writeFile(resolve(output, 'dist/index.js'), exportLines);
await writeFile(resolve(output, 'dist/index.d.ts'), exportLines);
await writeFile(resolve(output, 'package.json'), `${JSON.stringify({
  name: '@calendar-publishing/user-service-runtime-bridge',
  version: bridgeVersion,
  private: true,
  type: 'module',
  main: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    './native-print-runtime': { types: './dist/native-print-runtime.d.ts', import: './dist/native-print-runtime.js' },
    ...Object.fromEntries(templatePackages.flatMap(({ templateId, versions }) => versions.map(version => [
      `./templates/${templateId}/${version}/*`,
      `./templates/${templateId}/${version}/*`
    ])))
  },
  files: ['dist/', 'templates/', 'INTEGRITY.json', 'README.md']
}, null, 2)}\n`);
await writeFile(resolve(output, 'README.md'), `# User Service Runtime Bridge\n\n` +
  `달력 템플릿 에디터에서 생성한 사용자 서비스용 고정 배포 패키지입니다.\n\n` +
  `- package: @calendar-publishing/user-service-runtime-bridge@${bridgeVersion}\n` +
  `- native print runtime: @calendar-publishing/user-service-runtime-bridge/native-print-runtime\n` +
  `- screen/print 대상은 동일한 해석 결과를 사용하며 print 대상은 인쇄 계약 검증만 추가합니다.\n` +
  `- templates: ${templatePackages.flatMap(({ templateId, versions }) => versions.map(version => `${templateId}@${version}`)).join(', ')}\n` +
  `- 사용자 서비스 UI, 저장 Schema와 PDF 경로를 자동 교체하지 않습니다.\n`);

async function listFiles(directory, prefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await listFiles(resolve(directory, entry.name), path));
    else files.push(path);
  }
  return files;
}

const nativeRuntimeFiles = await listFiles(resolve(output, 'dist/template-runtime'), 'dist/template-runtime');
const integrityFiles = [
  'package.json',
  'dist/index.js',
  'dist/index.d.ts',
  'dist/native-print-runtime.js',
  'dist/native-print-runtime.d.ts',
  ...nativeRuntimeFiles,
  ...modules.flatMap(name => [`dist/${name}.js`, `dist/${name}.d.ts`]),
  ...templatePackages.flatMap(({ templateId, versions }) => versions.flatMap(version => [
    `templates/${templateId}/${version}/manifest.json`,
    `templates/${templateId}/${version}/template.json`,
    `templates/${templateId}/${version}/bindings.json`,
    `templates/${templateId}/${version}/print.json`,
    `templates/${templateId}/${version}/parity.json`,
    ...(version === '1.0.0' ? [] : [`templates/${templateId}/${version}/publishing.json`])
  ]))
];
const hashes = {};
for (const path of integrityFiles) {
  const content = await readFile(resolve(output, path));
  hashes[path] = createHash('sha256').update(content).digest('hex');
}
await writeFile(resolve(output, 'INTEGRITY.json'), `${JSON.stringify({
  schemaVersion: 'user-service-runtime-integrity.v1',
  package: `@calendar-publishing/user-service-runtime-bridge@${bridgeVersion}`,
  template: 'desk-academic-standard@1.0.0',
  templates: templatePackages.flatMap(({ templateId, versions }) => versions.map(version => `${templateId}@${version}`)),
  algorithm: 'sha256',
  files: hashes
}, null, 2)}\n`);

console.log(`User service runtime package built: ${output}`);
