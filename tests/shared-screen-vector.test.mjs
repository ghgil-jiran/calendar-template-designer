import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const originalSource = await readFile(resolve(root, 'apps/designer-studio/page-composition-runtime.js'), 'utf8');
const sharedSource = await readFile(resolve(root, 'apps/designer-studio/shared-screen-vector.js'), 'utf8');

test('shared screen vector matches the editor for every authored asset', () => {
  const editor = {};
  const shared = {};
  runInNewContext(originalSource, editor);
  runInNewContext(sharedSource, shared);
  const assetIds = [...originalSource.matchAll(/\{id:"([^"]+)",name:/g)].map((match) => match[1]);
  assert.ok(assetIds.length > 20);
  for (const assetId of assetIds) {
    const colors = { primary: '#123456', secondary: '#abcdef' };
    assert.equal(shared.ACDLSharedVector.renderVectorSvg(assetId, colors), editor.ACDLPageCompositionRuntime.renderVectorSvg(assetId, colors));
  }
  assert.equal(shared.ACDLSharedVector.renderVectorSvg('unknown'), '');
  assert.ok(!shared.ACDLSharedVector.renderVectorSvg('leaf', { primary: 'red" onload="alert(1)' }).includes('onload='));
});

test('checked in artifact is reproducible from the editor source', async () => {
  const { execFileSync } = await import('node:child_process');
  const previous = sharedSource;
  execFileSync(process.execPath, ['tools/extract-shared-screen-vector.mjs'], { cwd: root });
  assert.equal(await readFile(resolve(root, 'apps/designer-studio/shared-screen-vector.js'), 'utf8'), previous);
});
