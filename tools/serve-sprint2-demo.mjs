import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8" };
const studioEntry = "apps/designer-studio/index.html";

createServer(async (request,response)=>{
  try{
    const urlPath=decodeURIComponent((request.url||"/").split("?")[0]);
    const legacyDemoPath=urlPath==="/editor-core-demo"||urlPath==="/editor-core-demo/"||urlPath==="/apps/editor-core-demo"||urlPath==="/apps/editor-core-demo/"||urlPath==="/apps/editor-core-demo/index.html";
    const relative=urlPath==="/"||legacyDemoPath?studioEntry:urlPath.replace(/^\//,"");
    const filePath=normalize(join(root,relative));
    if(!filePath.startsWith(root)){response.writeHead(403);response.end("Forbidden");return;}
    const info=await stat(filePath); const target=info.isDirectory()?join(filePath,"index.html"):filePath;
    const body=await readFile(target); response.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream"});response.end(body);
  }catch{response.writeHead(404);response.end("Not found");}
}).listen(port,()=>console.log(`Designer Studio: http://localhost:${port}`));
