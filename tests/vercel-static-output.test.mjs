import assert from 'node:assert/strict';
import { access, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public');

function build(cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(root, 'scripts/build-vercel-static.mjs')], { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`build exited ${code}`)));
  });
}

test('Vercel static output contains editor, design tokens, and both package types', async () => {
  await build();
  for (const path of [
    'index.html',
    'canvas-selection.js',
    'desk-academic-shadow-renderer.js',
    'apps/designer-studio/index.html',
    'apps/designer-studio/template-remote-persistence.js',
    'design-system/09-css-tokens.css',
    'templates/desk-academic-standard/1.1.0/manifest.json',
    'templates/wall-academic-standard/0.1.0/manifest.json'
  ]) await access(resolve(output, path));

  const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
  assert.equal(config.outputDirectory, 'public');
  const html = await readFile(resolve(output, 'index.html'), 'utf8');
  for (const [, path] of html.matchAll(/(?:src|href)="\.\/([^"?#]+)"/g)) {
    await access(resolve(output, path));
  }
  await rm(output, { recursive: true, force: true });
});

test('Vercel output also builds when the working directory is Designer Studio', async () => {
  const studio = resolve(root, 'apps/designer-studio');
  const nestedOutput = resolve(studio, 'public');
  await build(studio);
  await access(resolve(nestedOutput, 'canvas-selection.js'));
  await access(resolve(nestedOutput, 'desk-academic-shadow-renderer.js'));
  await access(resolve(nestedOutput, 'apps/designer-studio/index.html'));
  await access(resolve(nestedOutput, 'templates/wall-academic-standard/0.1.0/manifest.json'));
  await rm(nestedOutput, { recursive: true, force: true });
});
