import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg' };
const studioEntry = 'apps/designer-studio/index.html';
const studioAssetAliases = new Map([
  ['/calendar-domain-bridge.js', 'apps/designer-studio/calendar-domain-bridge.js'],
  ['/project-document.js', 'apps/designer-studio/project-document.js'],
  ['/package-project-adapter.js', 'apps/designer-studio/package-project-adapter.js'],
  ['/canvas-geometry.js', 'apps/designer-studio/canvas-geometry.js'],
  ['/canvas-selection.js', 'apps/designer-studio/canvas-selection.js'],
  ['/canvas-gesture.js', 'apps/designer-studio/canvas-gesture.js'],
  ['/canvas-input.js', 'apps/designer-studio/canvas-input.js'],
  ['/inspector-form.js', 'apps/designer-studio/inspector-form.js'],
  ['/inspector-graphic.js', 'apps/designer-studio/inspector-graphic.js'],
  ['/inspector-element.js', 'apps/designer-studio/inspector-element.js'],
  ['/preview-state.js', 'apps/designer-studio/preview-state.js'],
  ['/persistence-history.js', 'apps/designer-studio/persistence-history.js'],
  ['/persistence-project.js', 'apps/designer-studio/persistence-project.js'],
  ['/persistence-indexeddb.js', 'apps/designer-studio/persistence-indexeddb.js'],
  ['/dataset-domain-bridge.js', 'apps/designer-studio/dataset-domain-bridge.js'],
  ['/desk-academic-page-adapter.js', 'apps/designer-studio/desk-academic-page-adapter.js'],
  ['/integration-parity-bridge.js', 'apps/designer-studio/integration-parity-bridge.js'],
  ['/runtime-project-adapter.js', 'apps/designer-studio/runtime-project-adapter.js'],
  ['/template-package-loader.js', 'apps/designer-studio/template-package-loader.js'],
  ['/desk-academic-package-runtime.js', 'apps/designer-studio/desk-academic-package-runtime.js'],
  ['/desk-academic-shadow-renderer.js', 'apps/designer-studio/desk-academic-shadow-renderer.js'],
  ['/desk-academic-shadow-renderer.css', 'apps/designer-studio/desk-academic-shadow-renderer.css'],
  ['/desk-academic-visual-parity.js', 'apps/designer-studio/desk-academic-visual-parity.js'],
  ['/desk-academic-print-parity.js', 'apps/designer-studio/desk-academic-print-parity.js'],
  ['/template-catalog.js', 'apps/designer-studio/template-catalog.js'],
  ['/wizard-flow.js', 'apps/designer-studio/wizard-flow.js'],
  ['/template-library-runtime.js', 'apps/designer-studio/template-library-runtime.js']
]);
const legacyEntryPaths = new Set([
  '/editor-core-demo',
  '/editor-core-demo/',
  '/apps/editor-core-demo',
  '/apps/editor-core-demo/',
  '/apps/editor-core-demo/index.html',
  '/preview-workspace',
  '/preview-workspace/',
  '/apps/preview-workspace',
  '/apps/preview-workspace/'
]);
const server = createServer(async (req,res)=>{
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const rel = url.pathname === '/' || legacyEntryPaths.has(url.pathname) ? studioEntry : studioAssetAliases.get(url.pathname) || url.pathname.replace(/^\//,'');
    const file = normalize(join(root, rel));
    if (!file.startsWith(normalize(root))) throw new Error('invalid path');
    const data = await readFile(file);
    res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control':'no-store'});res.end(data);
  } catch (error) { res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});res.end('Not found'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Designer Studio: http://localhost:${port}`));
