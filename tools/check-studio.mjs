import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../apps/designer-studio/index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
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
