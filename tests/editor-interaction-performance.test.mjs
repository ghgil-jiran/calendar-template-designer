import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('canvas selection defers history work until a real drag begins', () => {
  const source = read('../apps/designer-studio/features/object-editing-sprint2-runtime.js');
  assert.match(source, /let snapshotTaken=false/);
  assert.match(source, /Math\.abs\(dx\)<=\.05&&Math\.abs\(dy\)<=\.05\)return;snapshot\(\)/);
  assert.match(source, /if\(result\.discardSnapshot&&g\.snapshotTaken\)/);
});

test('single-object drag completion avoids rebuilding the full editor', () => {
  const source = read('../apps/designer-studio/features/object-editing-sprint2-runtime.js');
  assert.match(source, /if\(g\.needsFullRender\|\|!result\.changed\)render\(\);else\{renderInspector\(\);renderObjectRecommendations\(\)\}/);
});

test('history and memory accounting do not repeatedly serialize image payloads', () => {
  const history = read('../apps/designer-studio/persistence-history.js');
  const core = read('../apps/designer-studio/features/studio-runtime-core.js');
  const workspace = read('../apps/designer-studio/features/template-settings-workspace-runtime.js');
  assert.match(history, /const binaryRefs = new Map\(\)/);
  assert.match(history, /binaryRefs\.get\(current\)/);
  assert.doesNotMatch(core, /function snapshot\(\)[^\n]*__acdlUpdateMemoryMonitor/);
  assert.match(workspace, /startsWith\('data:'\).*`data-ref:\$\{value\.length\}`/);
  assert.doesNotMatch(workspace, /requestAnimationFrame\(update\)/);
});
