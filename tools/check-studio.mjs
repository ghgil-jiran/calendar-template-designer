import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../apps/designer-studio/index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const requiredRuntimeMarkers = [
  'const SIZE_PRESETS=',
  'function makeProject(opts)',
  'function renderFreeElements(pageNode)',
  'function setUserWizardStep(step)',
  'window.resolveTextContent=resolveTextContent'
];
if (html.startsWith('Warning: truncated output') || html.length < 500_000) {
  throw new Error(`Designer Studio HTML이 불완전합니다: ${html.length} bytes`);
}
for (const marker of requiredRuntimeMarkers) {
  if (!html.includes(marker)) throw new Error(`Designer Studio 필수 Runtime 누락: ${marker}`);
}
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((code) => code.trim());

if (!scripts.length) throw new Error('Inline script를 찾지 못했습니다.');
for (const [index, code] of scripts.entries()) {
  try {
    new vm.Script(code, { filename: `designer-studio-inline-${index + 1}.js` });
  } catch (error) {
    console.error(`Inline script ${index + 1} 구문 검사 실패`);
    throw error;
  }
}
const release = html.match(/window\.ACDL_RELEASE=([^;]+);/);
if (!release) throw new Error('ACDL_RELEASE 메타데이터가 없습니다.');
console.log(`Designer Studio inline scripts: ${scripts.length} PASS`);
console.log(`Release metadata: ${release[1]}`);
