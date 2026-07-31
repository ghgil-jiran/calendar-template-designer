import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg' };
const server = createServer(async (req,res)=>{
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const rel = url.pathname === '/' ? 'apps/designer-studio/index.html' : url.pathname.replace(/^\//,'');
    const file = normalize(join(root, rel));
    if (!file.startsWith(normalize(root))) throw new Error('invalid path');
    const data = await readFile(file);
    res.writeHead(200, {'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control':'no-store'});res.end(data);
  } catch (error) { res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});res.end('Not found'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Designer Studio: http://localhost:${port}`));
