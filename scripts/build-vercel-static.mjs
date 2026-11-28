import {preparePdfJs} from './prepare-pdfjs.mjs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.cwd(), 'public');
await preparePdfJs(root);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const studioSource = resolve(root, 'apps/designer-studio');
const studioOutput = resolve(output, 'apps/designer-studio');
await mkdir(studioOutput, { recursive: true });
for (const entry of await readdir(studioSource, { withFileTypes: true })) {
  if (entry.name === 'public') continue;
  const source = resolve(studioSource, entry.name);
  await cp(source, resolve(output, entry.name), { recursive: entry.isDirectory() });
  await cp(source, resolve(studioOutput, entry.name), { recursive: entry.isDirectory() });
}

// The designer runs inside a sandboxed iframe. Bundle its local modules so
// the preview's deployment authentication only applies to the document load.
const designerFile = 'template-designer.html';
const designerHtml = await readFile(resolve(studioSource, designerFile), 'utf8');
const designerScripts = /<script src="\.\/(template-designer\/[\w-]+\.js)\?[^"]+"><\/script>/g;
const scripts = Array.from(designerHtml.matchAll(designerScripts));
if (!scripts.length) throw new Error('Template designer modules are missing');
const embeddedScripts = new Map(await Promise.all(scripts.map(async ([tag, path]) => {
  const source = await readFile(resolve(studioSource, path), 'utf8');
  return [tag, `<script data-designer-module="${path}">${source.replace(/<\/script/gi, '<\\/script')}</script>`];
})));
const bundledDesigner = designerHtml.replace(designerScripts, tag => embeddedScripts.get(tag));
await Promise.all([output, studioOutput].map(directory =>
  writeFile(resolve(directory, designerFile), bundledDesigner)
));

for (const directory of ['design-system', 'templates']) {
  await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
}

console.log('VERCEL_STATIC_OUTPUT_OK');

