import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const directory of ['apps/designer-studio', 'design-system', 'templates']) {
  await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
}

console.log('VERCEL_STATIC_OUTPUT_OK');

