import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex >= 0 ? process.argv[portArgIndex + 1] : undefined;
const port = Number(portArg || process.env.PORT || 3000);
const apiOrigin = String(process.env.ACDL_DEV_API_ORIGIN || 'https://calendar-template-designer.vercel.app').replace(/\/$/, '');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };
const studioEntry = 'apps/designer-studio/index.html';
const studioAssetAliases = new Map([
  ['/calendar-domain-bridge.js', 'apps/designer-studio/calendar-domain-bridge.js'],
  ['/project-document.js', 'apps/designer-studio/project-document.js'],
  ['/project-asset-resolver.js', 'apps/designer-studio/project-asset-resolver.js'],
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
  ['/user-service-dataset-bridge.js', 'apps/designer-studio/user-service-dataset-bridge.js'],
  ['/user-service-asset-resolver.js', 'apps/designer-studio/user-service-asset-resolver.js'],
  ['/desk-academic-page-adapter.js', 'apps/designer-studio/desk-academic-page-adapter.js'],
  ['/integration-parity-bridge.js', 'apps/designer-studio/integration-parity-bridge.js'],
  ['/runtime-project-adapter.js', 'apps/designer-studio/runtime-project-adapter.js'],
  ['/template-package-loader.js', 'apps/designer-studio/template-package-loader.js'],
  ['/desk-academic-package-runtime.js', 'apps/designer-studio/desk-academic-package-runtime.js'],
  ['/desk-academic-shadow-renderer.js', 'apps/designer-studio/desk-academic-shadow-renderer.js'],
  ['/desk-academic-shadow-renderer.css', 'apps/designer-studio/desk-academic-shadow-renderer.css'],
  ['/schedule-api-client.js', 'apps/designer-studio/schedule-api-client.js'],
  ['/schedule-api-client.css', 'apps/designer-studio/schedule-api-client.css'],
  ['/schedule-file-parser.js', 'apps/designer-studio/schedule-file-parser.js'],
  ['/desk-academic-visual-parity.js', 'apps/designer-studio/desk-academic-visual-parity.js'],
  ['/desk-academic-print-parity.js', 'apps/designer-studio/desk-academic-print-parity.js'],
  ['/user-service-shadow-session.js', 'apps/designer-studio/user-service-shadow-session.js'],
  ['/user-service-shadow-diagnostics.js', 'apps/designer-studio/user-service-shadow-diagnostics.js'],
  ['/template-catalog.js', 'apps/designer-studio/template-catalog.js'],
  ['/wizard-flow.js', 'apps/designer-studio/wizard-flow.js'],
  ['/template-remote-persistence.js', 'apps/designer-studio/template-remote-persistence.js'],
  ['/template-library-runtime.js', 'apps/designer-studio/template-library-runtime.js']
]);
const legacyEntryPaths = new Set([
  '/apps/designer-studio',
  '/apps/designer-studio/',
  '/apps/designer-studio/index.html',
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
    if (url.pathname === '/favicon.ico') {
      res.writeHead(204, {'cache-control':'public, max-age=86400'});res.end();return;
    }
    if (url.pathname.startsWith('/api/')) {
      const chunks = [];
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        for await (const chunk of req) chunks.push(chunk);
      }
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const headers = {};
      for (const name of ['accept', 'authorization', 'content-type']) {
        if (req.headers[name]) headers[name] = req.headers[name];
      }
      const upstream = await fetch(`${apiOrigin}${url.pathname}${url.search}`, {
        method: req.method,
        headers,
        body,
        redirect: 'manual'
      });
      const data = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      });
      res.end(data);
      return;
    }
    const requestRel = url.pathname.replace(/^\//,'');
    const sharedRootPath = /^(?:api|apps|design-system|packages)\//.test(requestRel);
    const rel = url.pathname === '/' || legacyEntryPaths.has(url.pathname)
      ? studioEntry
      : studioAssetAliases.get(url.pathname) || (sharedRootPath ? requestRel : `apps/designer-studio/${requestRel}`);
    const file = normalize(join(root, rel));
    if (!file.startsWith(normalize(root))) throw new Error('invalid path');
    let data = await readFile(file);
    if (rel === studioEntry) {
      data = Buffer.from(data.toString('utf8').replace('<head>', '<head><script>window.ACDL_LOCAL_API_PROXY=true</script>'));
    }
    res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control':'no-store'});res.end(data);
  } catch (error) { res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});res.end('Not found'); }
});
server.listen(port,'127.0.0.1',()=>{
  console.log(`Designer Studio: http://localhost:${port}`);
  console.log(`Designer Studio API proxy: ${apiOrigin}`);
});
