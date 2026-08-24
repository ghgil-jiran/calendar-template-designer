import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, 'dist/user-service-runtime-bridge'));
const source = resolve(root, 'packages/designer-runtime-integration/dist');
const bridgeVersion = '0.1.0-alpha.2';
const templatePackages = [
  { templateId: 'desk-academic-standard', versions: ['1.0.0', '1.1.0'] },
  { templateId: 'wall-academic-standard', versions: ['0.1.0'] }
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
await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, 'dist'), { recursive: true });
await mkdir(resolve(output, 'templates'), { recursive: true });

for (const name of modules) {
  await cp(resolve(source, `${name}.js`), resolve(output, 'dist', `${name}.js`));
  await cp(resolve(source, `${name}.d.ts`), resolve(output, 'dist', `${name}.d.ts`));
}
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
  `- templates: ${templatePackages.flatMap(({ templateId, versions }) => versions.map(version => `${templateId}@${version}`)).join(', ')}\n` +
  `- 사용자 서비스 UI, 저장 Schema와 PDF 경로를 자동 교체하지 않습니다.\n`);

const integrityFiles = [
  'package.json',
  'dist/index.js',
  'dist/index.d.ts',
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
