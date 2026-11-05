import '../apps/designer-studio/shared-screen-composition.js';
import '../apps/designer-studio/pdf-background-print-model.js';

// The frozen project hash selects originals. Never resolve the library's current page assignment.
export async function resolvePdfBackgroundPrintSources(project,deps,{pageNumber=null}={}){
 const plans=globalThis.ACDLPdfBackgroundPrint.projectPlans(project),sources=new Map();
 if(pageNumber!==null&&(!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>plans.length))throw Error('PDF_BACKGROUND_PAGE_INVALID');
 for(const plan of pageNumber===null?plans:[plans[pageNumber-1]])for(const layer of plan.layers){
  const ref=layer.source,key=ref.documentId;
  if(!sources.has(key)){
   const prefix=`graphics-pdf-sources/${key}`,m=await deps.readJson(`${prefix}/manifest.json`);
   if(m.schemaVersion!=='graphic-pdf-document.v1'||!m.verifiedAt||m.kind!=='background'||m.id!==key||m.packageId!==ref.packageId||m.sha256!==ref.sha256||m.byteSize!==ref.byteSize||!Number.isSafeInteger(m.chunkCount)||m.chunkCount<1||m.chunkCount>250)throw Error('PDF_BACKGROUND_SOURCE_MISMATCH: '+key);
   const chunks=[];for(let offset=0;offset<m.chunkCount;offset+=8)chunks.push(...await Promise.all(Array.from({length:Math.min(8,m.chunkCount-offset)},async(_,n)=>{const i=offset+n,receipt=await deps.readJson(`${prefix}/chunk-${i}.json`);if(receipt.index!==i||!Number.isSafeInteger(receipt.byteSize)||receipt.byteSize<1||receipt.byteSize>1048576||!/^[a-f0-9]{64}$/.test(receipt.sha256))throw Error('PDF_BACKGROUND_CHUNK_INVALID');return {...receipt,url:await deps.sign(`${prefix}/chunk-${i}.bin`)};})));
   if(chunks.reduce((n,c)=>n+c.byteSize,0)!==m.byteSize)throw Error('PDF_BACKGROUND_SIZE_MISMATCH');
   sources.set(key,{manifest:m,chunks});
  }
  const {manifest,chunks}=sources.get(key),p=manifest.pages?.[ref.pageNumber-1];
  if(manifest.sha256!==ref.sha256||manifest.packageId!==ref.packageId||!p||p.pageNumber!==ref.pageNumber||Math.abs(p.widthPt-ref.widthPt)>.02||Math.abs(p.heightPt-ref.heightPt)>.02)throw Error('PDF_BACKGROUND_PAGE_MISMATCH');
  layer.source={...ref,chunks};
 }
 return plans;
}
