import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const studioRoot = new URL('../apps/designer-studio/', import.meta.url);
const html = fs.readFileSync(new URL('index.html', studioRoot), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('features/runtime-load-manifest.json', studioRoot), 'utf8'));

test('compatibility runtimes keep their recorded owner and browser load order', () => {
  assert.equal(manifest.schemaVersion, 'designer-studio-runtime-load.v1');
  assert.equal(manifest.entries.length, 10);
  assert.deepEqual([...new Set(manifest.entries.map(entry => entry.owner))].sort(), [
    'object-editing',
    'preview-pdf',
    'shell',
    'template-settings'
  ]);
  const positions = manifest.entries.map(entry => {
    assert.match(entry.file, /\.js$/);
    assert.ok(fs.existsSync(new URL(`features/${entry.file}`, studioRoot)), entry.file);
    return html.indexOf(`./features/${entry.file}`);
  });
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});
