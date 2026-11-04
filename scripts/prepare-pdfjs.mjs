import {cp,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export async function preparePdfJs(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 const source=resolve(root,'node_modules/pdfjs-dist'),target=resolve(root,'apps/designer-studio/pdfjs');await mkdir(target,{recursive:true});
 for(const file of ['pdf.mjs','pdf.worker.mjs'])await cp(resolve(source,'build',file),resolve(target,file));
 for(const folder of ['cmaps','standard_fonts','wasm','iccs'])await cp(resolve(source,folder),resolve(target,folder),{recursive:true});
 await cp(resolve(source,'LICENSE'),resolve(target,'LICENSE'));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await preparePdfJs();
