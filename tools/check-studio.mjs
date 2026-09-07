import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../apps/designer-studio/index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const featuresDirectory = new URL('../apps/designer-studio/features/', import.meta.url);
const runtimeManifest = JSON.parse(fs.readFileSync(new URL('runtime-load-manifest.json', featuresDirectory), 'utf8'));
const featureFiles = fs.readdirSync(featuresDirectory)
  .filter((name) => name.endsWith('.js'))
  .sort()
  .map((name) => `../apps/designer-studio/features/${name}`);
const featureSource = featureFiles.map(relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8')).join('\n');
const studioSource = `${html}\n${featureSource}`;
if (runtimeManifest.schemaVersion !== 'designer-studio-runtime-load.v1') {
  throw new Error(`Designer Studio Runtime manifest 버전 오류: ${runtimeManifest.schemaVersion}`);
}
let previousRuntimeIndex = -1;
for (const entry of runtimeManifest.entries) {
  const runtimePath = new URL(entry.file, featuresDirectory);
  if (!fs.existsSync(runtimePath)) throw new Error(`Designer Studio Runtime 파일 누락: ${entry.file}`);
  const marker = `./features/${entry.file}`;
  const runtimeIndex = html.indexOf(marker);
  if (runtimeIndex < 0) throw new Error(`Designer Studio Runtime 로드 누락: ${entry.file}`);
  if (runtimeIndex <= previousRuntimeIndex) throw new Error(`Designer Studio Runtime 로드 순서 오류: ${entry.file}`);
  previousRuntimeIndex = runtimeIndex;
}
const requiredRuntimeMarkers = [
  'const SIZE_PRESETS=',
  'function makeProject(opts)',
  'function renderFreeElements(pageNode)',
  'function setUserWizardStep(step)',
  'window.resolveTextContent=resolveTextContent'
];
if (html.startsWith('Warning: truncated output') || studioSource.length < 500_000) {
  throw new Error(`Designer Studio 소스가 불완전합니다: ${studioSource.length} bytes`);
}
for (const marker of requiredRuntimeMarkers) {
  if (!studioSource.includes(marker)) throw new Error(`Designer Studio 필수 Runtime 누락: ${marker}`);
}
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((code) => code.trim());

for (const [index, code] of scripts.entries()) {
  try {
    new vm.Script(code, { filename: `designer-studio-inline-${index + 1}.js` });
  } catch (error) {
    console.error(`Inline script ${index + 1} 구문 검사 실패`);
    throw error;
  }
}
for (const relative of featureFiles) {
  const code = fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
  new vm.Script(code, { filename: relative });
}
const release = studioSource.match(/window\.ACDL_RELEASE=([^;]+);/);
if (!release) throw new Error('ACDL_RELEASE 메타데이터가 없습니다.');
console.log(`Designer Studio inline scripts: ${scripts.length} PASS`);
console.log(`Release metadata: ${release[1]}`);
