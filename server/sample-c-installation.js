// Authenticated, restartable installation of the supplied Sample C originals.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {graphicPdfDependencies,createGraphicPackage} from './graphic-library.js';
import {pdfPackageOperation} from './graphic-pdf-package.js';
import {storeTemplateAsset,saveVersion,listTemplates} from './template-persistence.js';
import '../apps/designer-studio/graphic-template-mapping.js';
const STABLE_KEY='desk-sample-c-seasonal-illustration-2027';
const STATE_PATH='template-installations/sample-c-2027-v1.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const defaultFiles=name=>readFile(new URL('../assets/sample-c/'+name,import.meta.url));
let pending;
export function installSampleC(body,overrides={}) {
 // Serialize requests within a function instance. Durable checkpoints survive retries.
 const run=()=>runStep(body,overrides);const result=(pending||Promise.resolve()).catch(()=>{}).then(run);pending=result;return result.finally(()=>{if(pending===result)pending=null});
}
async function runStep(body,{d=graphicPdfDependencies,files=defaultFiles,createPackage=createGraphicPackage,storeAsset=storeTemplateAsset,save=saveVersion,list=listTemplates,pdf=pdfPackageOperation}={}) {
 const manifest=JSON.parse(await files('manifest.json'));
 if(!['start','document','asset','save'].includes(body.step))throw Object.assign(Error('Invalid installation step'),{statusCode:400});
 await d.ensureBucket();let state;
 try{state=await d.readJson(STATE_PATH)}catch(error){if(![400,404].includes(error.storageStatus))throw error;}
 const checkpoint=()=>d.writeJson(STATE_PATH,state);
 if(!state){
  if(body.step!=='start')throw Object.assign(Error('Start installation first'),{statusCode:409});
  const existing=(await list()).find(t=>t.stableKey===STABLE_KEY);
  if(existing)return {completed:true,templateId:existing.id};
  const pkg=await createPackage({name:'샘플 C',size:'desk-standard',mode:'pdf',tags:'2027,사계절,일러스트',source:'사용자 제공 템플릿 C.zip'});
  state={schemaVersion:'sample-c-installation.v1',packageId:pkg.id,documents:{},assets:{},createdAt:new Date().toISOString()};await checkpoint();
 }
 if(state.templateId)return {completed:true,templateId:state.templateId,packageId:state.packageId};
 if(body.step==='start')return {packageId:state.packageId,documentCount:manifest.documents.length,assetCount:manifest.assets.length};
 if(body.step==='document') {
  const entry=Number.isInteger(body.index)&&manifest.documents[body.index];if(!entry)throw Object.assign(Error('Invalid document index'),{statusCode:400});
  if(state.documents[entry.file]?.done)return {done:true,file:entry.file};
  const bytes=entry.parts?Buffer.concat(await Promise.all(entry.parts.map(files))):await files(entry.file);if(bytes.length!==entry.byteSize||sha(bytes)!==entry.sha256)throw Error('Sample C original hash mismatch');
  const call=(operation,options={})=>pdf({operation,packageId:state.packageId,...options},d);
  let saved=state.documents[entry.file];
  if(!saved){const started=await call('pdf-start',{fileName:entry.file,kind:entry.kind,byteSize:bytes.length,sha256:entry.sha256,pages:entry.pages});saved=state.documents[entry.file]={id:started.document.id};await checkpoint();}
  const status=await call('pdf-status',{documentId:saved.id});
  if(!status.document.uploadedAt&&!status.document.verifiedAt){
   const present=new Set(status.uploaded);
   for(let i=0;i<status.document.chunkCount;i++)if(!present.has(i)){const chunk=bytes.subarray(i*1048576,(i+1)*1048576);await call('pdf-chunk',{documentId:saved.id,index:i,data:chunk.toString('base64'),sha256:sha(chunk)});}
  }
  await call('pdf-complete',{documentId:saved.id});
  if(entry.kind==='background'){
   let pkg=await d.getRecord(state.packageId);
   if(!pkg.pages?.[entry.slot]){
    const preview=await files(entry.preview),thumb=await files(entry.thumbnail);
    await call('pdf-preview',{documentId:saved.id,pageNumber:1,dataUrl:'data:image/webp;base64,'+preview.toString('base64'),thumbnailDataUrl:'data:image/webp;base64,'+thumb.toString('base64'),width:entry.width,height:entry.height});
    await call('pdf-assign',{documentId:saved.id,pageNumber:1,slot:entry.slot,expectedRevision:pkg.revision});
   }
  }
  saved.done=true;await checkpoint();return {done:true,file:entry.file};
 }
 if(body.step==='asset'){
  const entry=Number.isInteger(body.index)&&manifest.assets[body.index];if(!entry)throw Object.assign(Error('Invalid asset index'),{statusCode:400});
  if(!state.assets[entry.key]){const bytes=await files(entry.file),asset=await storeAsset(`data:${entry.mimeType};base64,${bytes.toString('base64')}`);state.assets[entry.key]=asset.id;await checkpoint();}
  return {done:true,key:entry.key};
 }
 if(manifest.documents.some(x=>!state.documents[x.file]?.done)||manifest.assets.some(x=>!state.assets[x.key]))throw Object.assign(Error('Sample C assets are incomplete'),{statusCode:409});
 // Never replace an existing template that the designer may already be editing.
 const existing=(await list()).find(t=>t.stableKey===STABLE_KEY);
 if(existing){state.templateId=existing.id;await checkpoint();return {completed:true,templateId:existing.id,packageId:state.packageId};}
 let project=JSON.parse(await files('project.json'));
 const replace=v=>typeof v==='string'?v.replace(/^__ASSET:(.+)__$/,(_,key)=>{if(!state.assets[key])throw Error('Missing Sample C asset');return 'acdl-asset://'+state.assets[key]}):Array.isArray(v)?v.map(replace):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,replace(x)])):v;
 project=replace(project);
 let pkg=await d.getRecord(state.packageId);
 const overviewId=state.documents['reference-overview.pdf'].id;
 if(pkg.referencePdfId!==overviewId){pkg={...pkg,referencePdfId:overviewId,revision:pkg.revision+1};await d.putRecord(pkg);}
 const graphics=await Promise.all(Object.values(pkg.pages).map(p=>d.getRecord(p.graphicId)));
 project.template.settings.graphicPackage=globalThis.ACDLGraphicTemplateMapping.capture(pkg,graphics,{width:260,height:180});
 globalThis.ACDLGraphicTemplateMapping.apply(project);
 const result=await save({stableKey:STABLE_KEY,name:project.settings.name,description:project.template.metadata.description,edition:2027,state:'draft',isStandard:false,productType:'desk',templateKey:project.settings.template,saveKind:'manual',saveNote:'샘플 C · 제공 원본 PDF 7개 해시 검증 · 28면 최초 구성',schemaVersion:project.version||'0.1.0',projectData:project});
 state.templateId=result.template.id;state.completedAt=new Date().toISOString();await checkpoint();return {completed:true,templateId:state.templateId,packageId:state.packageId};
}
