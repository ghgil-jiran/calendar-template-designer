import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.cwd(), 'public');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const studioSource = resolve(root, 'apps/designer-studio');
const studioOutput = resolve(output, 'apps/designer-studio');
await mkdir(studioOutput, { recursive: true });
for (const entry of await readdir(studioSource, { withFileTypes: true })) {
  if (entry.name === 'public') continue;
  await cp(resolve(studioSource, entry.name), resolve(studioOutput, entry.name), { recursive: entry.isDirectory() });
}

for (const directory of ['design-system', 'templates']) {
  await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
}

console.log('VERCEL_STATIC_OUTPUT_OK');
