import '../apps/designer-studio/graphic-vector-design.js';
import '../apps/designer-studio/graphic-package-model.js';
import {randomUUID} from 'node:crypto';
import {storeTemplateAsset} from './template-persistence.js';
const BUCKET='common-graphics',PREFIX='graphics-library',UUID=/^[0-9a-f-]{36}$/i;
export const GRAPHIC_CATEGORIES=['background','photo','illustration','decoration','vector'];
export function validateGraphicMetadata(body){
 const name=String(body.name||'').trim(),category=body.category||'illustration',width=Number(body.width),height=Number(body.height);
 if(!name||name.length>120||!GRAPHIC_CATEGORIES.includes(category)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>60000||height>60000)throw Object.assign(new Error('이미지 정보를 확인해주세요'),{statusCode:400,code:'INVALID_GRAPHIC_METADATA'});
 return {name,category,width,height,tags:String(body.tags||'').trim().slice(0,500),source:String(body.source||'').trim().slice(0,500)};
}
function fail(code,statusCode=400){throw Object.assign(new Error(code),{code,statusCode})}
async function storage(path,options={}){const url=process.env.SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)fail('SERVER_NOT_CONFIGURED',503);const r=await fetch(`${url.replace(/\/$/,'')}/storage/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,...options.headers}});if(!r.ok){const error=Object.assign(new Error('GRAPHIC_STORAGE_FAILED'),{code:'GRAPHIC_STORAGE_FAILED',statusCode:502,storageStatus:r.status});console.error('graphic-storage-failed',{operation:options.method||'GET',stage:path.split('/')[0],status:r.status});throw error}return r}
let bucketReady;
export async function ensureGraphicBucket(){
 if(!bucketReady)bucketReady=(async()=>{
  try{await storage(`bucket/${BUCKET}`);return}catch(error){if(![400,404].includes(error.storageStatus))throw error}
  try{await storage('bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:BUCKET,name:BUCKET,public:false,file_size_limit:20971520,allowed_mime_types:['application/json','application/octet-stream']})})}catch(error){await storage(`bucket/${BUCKET}`)}
 })().catch(error=>{bucketReady=null;throw error});
 return bucketReady;
}
const path=id=>{if(!UUID.test(id))fail('INVALID_GRAPHIC_ID');return `${PREFIX}/${id}.json`};
async function listGraphicRecords(){await ensureGraphicBucket();const items=[];let offset=0;while(true){const r=await storage(`object/list/${BUCKET}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix:PREFIX,limit:100,offset,sortBy:{column:'name',order:'asc'}})}),rows=await r.json();const validRows=rows.filter(row=>UUID.test(row.name.replace(/\.json$/,''))&&row.name.endsWith('.json'));let next=0;await Promise.all(Array.from({length:Math.min(4,validRows.length)},async()=>{while(next<validRows.length){const row=validRows[next++],value=await storage(`object/${BUCKET}/${PREFIX}/${row.name}`).then(r=>r.json());if(['graphic-library.v1','graphic-package.v1'].includes(value.schemaVersion))items.push(value)}}));if(rows.length<100)break;offset+=100}return items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
export async function listGraphics(){return (await listGraphicRecords()).filter(g=>g.schemaVersion==='graphic-library.v1')}
export async function listGraphicCatalog(){const records=await listGraphicRecords();return {graphics:records.filter(g=>g.schemaVersion==='graphic-library.v1'),packages:records.filter(g=>g.schemaVersion==='graphic-package.v1')}}
export async function getGraphic(id){return storage(`object/${BUCKET}/${path(id)}`).then(r=>r.json())}
async function write(value){await storage(`object/${BUCKET}/${path(value.id)}`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify(value)});return value}
export async function uploadChunk(body){await ensureGraphicBucket();const {uploadId,index,total,data}=body;if(!UUID.test(uploadId)||!Number.isInteger(index)||!Number.isInteger(total)||total<1||total>20||index<0||index>=total||typeof data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))fail('INVALID_GRAPHIC_CHUNK');const bytes=Buffer.from(data,'base64');if(!bytes.length||bytes.length>1024*1024)fail('GRAPHIC_CHUNK_TOO_LARGE',413);await storage(`object/${BUCKET}/graphics-uploads/${uploadId}/${index}`,{method:'POST',headers:{'Content-Type':'application/octet-stream','x-upsert':'true'},body:bytes});return {index}}
export async function createGraphic(body){const metadata=validateGraphicMetadata(body);if(!UUID.test(body.uploadId)||!Number.isInteger(body.total)||body.total<1||body.total>20||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(body.mimeType))fail('INVALID_GRAPHIC_UPLOAD');const chunks=[];for(let index=0;index<body.total;index++)chunks.push(Buffer.from(await storage(`object/${BUCKET}/graphics-uploads/${body.uploadId}/${index}`).then(r=>r.arrayBuffer())));const bytes=Buffer.concat(chunks);if(!bytes.length||bytes.length>20*1024*1024)fail('GRAPHIC_TOO_LARGE',413);
 const valid=body.mimeType==='image/svg+xml'?Boolean(validateGraphicSvg(bytes.toString('utf8'))):body.mimeType==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):body.mimeType==='image/jpeg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)fail('INVALID_GRAPHIC_IMAGE');
 const original=await storeTemplateAsset(`data:${body.mimeType};base64,${bytes.toString('base64')}`),preview=await storeTemplateAsset(body.previewDataUrl);const record=await write({schemaVersion:'graphic-library.v1',id:randomUUID(),...metadata,thumbnailDataUrl:validateThumbnail(body.thumbnailDataUrl),originalAssetId:original.id,previewAssetId:preview.id,mimeType:body.mimeType,byteSize:bytes.length,fileName:String(body.fileName||'').slice(0,200),status:'active',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 await storage(`object/${BUCKET}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:chunks.map((_,i)=>`graphics-uploads/${body.uploadId}/${i}`)})}).catch(()=>{});return record}
export function validateThumbnail(value){if(value==null)return null;if(typeof value!=='string'||value.length>180000||!/^data:image\/(png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))fail('INVALID_GRAPHIC_THUMBNAIL');const bytes=Buffer.from(value.split(',')[1],'base64'),valid=value.startsWith('data:image/png')?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)fail('INVALID_GRAPHIC_THUMBNAIL');return value;}
export async function updateGraphic(body){const current=await getGraphic(body.id),changes={};if(current.schemaVersion!=='graphic-library.v1')fail('INVALID_GRAPHIC_ID');if(body.status!==undefined){if(!['active','archived'].includes(body.status))fail('INVALID_GRAPHIC_STATUS');changes.status=body.status}if(['name','category','tags','source'].some(key=>Object.hasOwn(body,key)))Object.assign(changes,validateGraphicMetadata({...current,...Object.fromEntries(['name','category','tags','source'].filter(key=>Object.hasOwn(body,key)).map(key=>[key,body[key]]))}));if(body.thumbnailDataUrl!==undefined)changes.thumbnailDataUrl=validateThumbnail(body.thumbnailDataUrl);return write({...current,...changes,updatedAt:new Date().toISOString()})}

export function validateGraphicSvg(value){
 if(typeof value!=='string'||value.length>1024*1024||!/^\s*<svg\s/.test(value)||!/<\/svg>\s*$/.test(value))fail('INVALID_GRAPHIC_SVG');
 const tags=new Set(['svg','g','defs','rect','circle','ellipse','path','polygon','polyline','line','linearGradient','radialGradient','stop','clipPath']);
 const attrs=new Set(['xmlns','width','height','viewBox','id','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','spreadMethod','fx','fy','clip-path','clipPathUnits']);
 const stack=[];let cursor=0,roots=0;const tokens=value.matchAll(/<([^<>]+)>/g);
 for(const token of tokens){if(value.slice(cursor,token.index).trim())fail('INVALID_GRAPHIC_SVG');cursor=token.index+token[0].length;const content=token[1],closing=content.startsWith('/'),match=content.match(/^\/?([A-Za-z]+)([\s\S]*?)\/?$/);if(!match||!tags.has(match[1]))fail('INVALID_GRAPHIC_SVG');
  const tag=match[1],rest=match[2];if(closing){if(rest.trim()||stack.pop()!==tag)fail('INVALID_GRAPHIC_SVG');continue}
  let end=0;const seen=new Set();for(const attribute of rest.matchAll(/\s+([\w-]+)\s*=\s*("[^"]*"|'[^']*')/g)){if(rest.slice(end,attribute.index).trim())fail('INVALID_GRAPHIC_SVG');end=attribute.index+attribute[0].length;const name=attribute[1],v=attribute[2].slice(1,-1);if(!attrs.has(name)||seen.has(name)||/[<>&]/.test(v)||/url\(/i.test(v)&&!/^url\(#[\w.-]+\)$/.test(v))fail('INVALID_GRAPHIC_SVG');if(name==='xmlns'&&v!=='http://www.w3.org/2000/svg')fail('INVALID_GRAPHIC_SVG');seen.add(name)}if(rest.slice(end).trim())fail('INVALID_GRAPHIC_SVG');if(!stack.length&&(tag!=='svg'||++roots>1))fail('INVALID_GRAPHIC_SVG');if(!content.endsWith('/'))stack.push(tag);
 }
 if(roots!==1||stack.length||value.slice(cursor).trim())fail('INVALID_GRAPHIC_SVG');return value;
}
export async function generateGraphic(body){
 let design;try{design=globalThis.ACDLGraphicVectorDesign.normalize(body.design)}catch{fail('INVALID_VECTOR_DESIGN')}
 const metadata=validateGraphicMetadata({...body,category:design.kind==='background'?'background':'vector',width:1300,height:900});
 await ensureGraphicBucket();
 let parent=null;if(body.parentGraphicId){parent=await getGraphic(body.parentGraphicId);if(!parent.design)fail('INVALID_GRAPHIC_PARENT')}
 const svg=globalThis.ACDLGraphicVectorDesign.svg(design),asset=await storeTemplateAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
 return write({schemaVersion:'graphic-library.v1',id:randomUUID(),...metadata,thumbnailDataUrl:validateThumbnail(body.thumbnailDataUrl),originalAssetId:asset.id,previewAssetId:asset.id,mimeType:'image/svg+xml',byteSize:Buffer.byteLength(svg),fileName:design.kind==='background'?'vector-background.svg':'vector-illustration.svg',status:'active',design,generationInfo:body.generationInfo?{generationId:String(body.generationInfo.generationId||'').slice(0,80),engine:String(body.generationInfo.engine||'').slice(0,80),model:String(body.generationInfo.model||'').slice(0,100),generatedAt:String(body.generationInfo.generatedAt||'').slice(0,40),prompt:String(body.generationInfo.prompt||'').slice(0,2000)}:null,setInfo:globalThis.ACDLGraphicVectorDesign.setInfo(design),physicalSizeMm:{width:260,height:180},parentGraphicId:parent?.id||null,revision:(parent?.revision||0)+1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
}

const packageModel=globalThis.ACDLGraphicPackageModel;
function packageMetadata(body){try{return packageModel.metadata(body)}catch{fail('INVALID_GRAPHIC_PACKAGE')}}
export async function createGraphicPackage(body){await ensureGraphicBucket();const metadata=packageMetadata(body),now=new Date().toISOString();return write({schemaVersion:'graphic-package.v1',id:randomUUID(),...metadata,status:'active',revision:1,pages:{},thumbnailDataUrl:null,createdAt:now,updatedAt:now})}
async function packageForUpdate(body){const pkg=await getGraphic(body.packageId||body.id);if(pkg.schemaVersion!=='graphic-package.v1')fail('INVALID_GRAPHIC_PACKAGE');if(!Number.isInteger(body.expectedRevision)||pkg.revision!==body.expectedRevision)fail('GRAPHIC_PACKAGE_CONFLICT',409);return pkg}
export async function updateGraphicPackage(body){const pkg=await packageForUpdate(body),changes={};if(body.status!==undefined){if(!['active','archived'].includes(body.status))fail('INVALID_GRAPHIC_STATUS');changes.status=body.status}if(['name','tags','source'].some(k=>Object.hasOwn(body,k)))Object.assign(changes,packageMetadata({...pkg,...body}));return write({...pkg,...changes,revision:pkg.revision+1,updatedAt:new Date().toISOString()})}
export async function saveGraphicPackagePage(body){
 const pkg=await packageForUpdate(body),page=body.page;if(!packageModel.pages[page]||pkg.status!=='active')fail('INVALID_GRAPHIC_PACKAGE_PAGE');
 if(page!=='cover'&&!pkg.pages.cover?.graphicId)fail('GRAPHIC_PACKAGE_COVER_REQUIRED');
 let graphic;if(body.graphicId){graphic=await getGraphic(body.graphicId);if(graphic.schemaVersion!=='graphic-library.v1'||graphic.status!=='active'||graphic.design?.page!==page||graphic.design?.kind!=='background')fail('INVALID_GRAPHIC_PACKAGE_ASSET')}
 else {let design;try{design=globalThis.ACDLGraphicVectorDesign.normalize(body.design)}catch{fail('INVALID_VECTOR_DESIGN')}if(design.page!==page||design.kind!=='background')fail('INVALID_GRAPHIC_PACKAGE_ASSET');graphic=await generateGraphic({...body,design})}
 // Each page points to an immutable asset. Replacing a page never overwrites its previous asset.
 const latest=await packageForUpdate(body),now=new Date().toISOString(),slot={graphicId:graphic.id,derivedFromCoverId:page==='cover'?null:pkg.pages.cover.graphicId,updatedAt:now};
 const updated=await write({...latest,pages:{...latest.pages,[page]:slot},thumbnailDataUrl:page==='cover'?graphic.thumbnailDataUrl:latest.thumbnailDataUrl,revision:latest.revision+1,updatedAt:now});return {graphic,package:updated};
}
