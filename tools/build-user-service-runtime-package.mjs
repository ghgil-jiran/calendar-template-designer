import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, 'dist/user-service-runtime-bridge'));
const source = resolve(root, 'packages/designer-runtime-integration/dist');
const bridgeVersion = '0.1.0-alpha.2';
const templateVersions = ['1.0.0', '1.1.0'];
const modules = [
  'TemplatePackageLoader',
  'DeskAcademicPackageRuntime',
  'DeskAcademicSurfacePlan',
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
await mkdir(resolve(output, 'templates/desk-academic-standard'), { recursive: true });

for (const name of modules) {
  await cp(resolve(source, `${name}.js`), resolve(output, 'dist', `${name}.js`));
  await cp(resolve(source, `${name}.d.ts`), resolve(output, 'dist', `${name}.d.ts`));
}
for (const version of templateVersions) {
  await cp(
    resolve(root, 'templates/desk-academic-standard', version),
    resolve(output, 'templates/desk-academic-standard', version),
    { recursive: true }
  );
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
    ...Object.fromEntries(templateVersions.map(version => [
      `./templates/desk-academic-standard/${version}/*`,
      `./templates/desk-academic-standard/${version}/*`
    ]))
  },
  files: ['dist/', 'templates/', 'INTEGRITY.json', 'README.md']
}, null, 2)}\n`);
await writeFile(resolve(output, 'README.md'), `# User Service Runtime Bridge\n\n` +
  `달력 템플릿 에디터에서 생성한 사용자 서비스용 고정 배포 패키지입니다.\n\n` +
  `- package: @calendar-publishing/user-service-runtime-bridge@${bridgeVersion}\n` +
  `- templates: ${templateVersions.map(version => `desk-academic-standard@${version}`).join(', ')}\n` +
  `- 사용자 서비스 UI, 저장 Schema와 PDF 경로를 자동 교체하지 않습니다.\n`);

const integrityFiles = [
  'package.json',
  'dist/index.js',
  'dist/index.d.ts',
  ...modules.flatMap(name => [`dist/${name}.js`, `dist/${name}.d.ts`]),
  ...templateVersions.flatMap(version => [
    `templates/desk-academic-standard/${version}/manifest.json`,
    `templates/desk-academic-standard/${version}/template.json`,
    `templates/desk-academic-standard/${version}/bindings.json`,
    `templates/desk-academic-standard/${version}/print.json`,
    `templates/desk-academic-standard/${version}/parity.json`
  ]),
  'templates/desk-academic-standard/1.1.0/publishing.json'
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
  templates: templateVersions.map(version => `desk-academic-standard@${version}`),
  algorithm: 'sha256',
  files: hashes
}, null, 2)}\n`);

console.log(`User service runtime package built: ${output}`);
