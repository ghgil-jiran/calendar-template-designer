import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../apps/designer-studio/',import.meta.url);

test('template menu exposes a dedicated AI image review PDF action',()=>{
 const html=fs.readFileSync(new URL('index.html',root),'utf8');
 assert.match(html,/id="aiImageReviewPdfBtn">AI 생성 이미지 검토용 PDF/);
 assert.match(html,/features\/ai-image-review-export\.js\?v=20260922\.1/);
});

test('AI review PDF uses live RGB source assets without the review JPEG optimizer',()=>{
 const source=fs.readFileSync(new URL('features/ai-image-review-export.js',root),'utf8');
 assert.match(source,/source\?\.type==="live-ai-generation"/);
 assert.match(source,/\^\(data:image\\\/\|blob:\|https\?:\\\/\\\/\)/);
 assert.match(source,/dataset\.reviewSource="original"/);
 assert.doesNotMatch(source,/toDataURL|image\/jpeg|optimizeReviewBackgrounds/);
 assert.match(source,/@page\{size:A4 landscape/);
 assert.match(source,/중앙부 확대/);
 assert.match(source,/generationEvidence/);
 assert.match(source,/expectedTargets/);
 assert.match(source,/missingTargets/);
 assert.match(source,/요약 1쪽과 AI 원본/);
 assert.match(source,/‘연력’은 독립 면이 아니라 표지 안쪽면/);
 assert.match(source,/generation\.model\|\|evidence\.model/);
 assert.match(source,/window\.ACDLAIImageReviewPdf/);
});

test('applied AI resources preserve generation evidence for later review',()=>{
 const runtime=fs.readFileSync(new URL('features/ai-design-runtime.js',root),'utf8');
 assert.match(runtime,/generation:\{\.\.\.metadata\},print:\{colorSpace:"RGB",sourcePreserved:true/);
 assert.match(runtime,/resource\.generation=\{\.\.\.metadata\}/);
 assert.match(runtime,/model:result\.asset\.model\|\|""/);
});
