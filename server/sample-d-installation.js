import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {graphicPdfDependencies,createGraphicPackage} from './graphic-library.js';
import {pdfPackageOperation} from './graphic-pdf-package.js';
import {saveVersion,getTemplate,storeTemplateAsset} from './template-persistence.js';
const STATE='template-installations/sample-d-v4.json';
const files=name=>readFile(new URL('../assets/sample-d-v4/'+name,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
let pending;
export function installSampleD(body,overrides={}){const run=()=>step(body,overrides);const result=(pending||Promise.resolve()).catch(()=>{}).then(run);pending=result;return result.finally(()=>{if(pending===result)pending=null});}
async function step(body,{d=graphicPdfDependencies,createPackage=createGraphicPackage,get=getTemplate,save=saveVersion,storeAsset=storeTemplateAsset,pdf=pdfPackageOperation}={}){
 if(!['start','document','save','verify'].includes(body.step))throw Object.assign(Error('Invalid step'),{statusCode:400});
 const manifest=JSON.parse(await files('manifest.json')),project=JSON.parse(await files('project.json'));
 await d.ensureBucket();let state;try{state=await d.readJson(STATE)}catch(e){if(![400,404].includes(e.storageStatus))throw e;}
 const checkpoint=()=>d.writeJson(STATE,state);
 if(!state){if(body.step!=='start')throw Object.assign(Error('Start first'),{statusCode:409});const current=await get(project.template.remoteId);if(current.template.latestVersionNumber!==project.template.remoteVersionNumber)throw Object.assign(Error('기존 템플릿 버전이 변경되었습니다. 덮어쓰지 않고 중단합니다.'),{statusCode:409});const pkg=await createPackage({name:'샘플 D · 지오메트릭 수정 v4',size:'desk-standard',mode:'pdf',tags:'2027,샘플D',source:'사용자 제공 샘플 D 원본'});state={packageId:pkg.id,documents:{},assets:{},baseVersionId:current.version.id};await checkpoint();}
 if(body.step==='verify'||state.completed){const current=await get(project.template.remoteId);return {completed:state.completed===true,templateId:current.template.id,version:current.version.versionNumber,verified:current.version.projectData.template.metadata.sampleDRemoteRevision==='sample-d-v4'};}
 if(body.step==='start')return {documents:manifest.documents.length};
 if(body.step==='document'){
 const entry=manifest.documents[body.index];if(!entry)throw Object.assign(Error('Invalid document'),{statusCode:400});if(state.documents[entry.file]?.done)return {done:true};
 const bytes=await files(entry.file);if(hash(bytes)!==entry.sha256||bytes.length!==entry.byteSize)throw Error('PDF hash mismatch');
 const call=(operation,options={})=>pdf({operation,packageId:state.packageId,...options},d);
 let saved=state.documents[entry.file];if(!saved){const started=await call('pdf-start',{fileName:entry.file,kind:'background',pages:entry.pages,sha256:entry.sha256,byteSize:entry.byteSize});saved=state.documents[entry.file]={id:started.document.id};await checkpoint();}
 const status=await call('pdf-status',{documentId:saved.id});if(!status.document.verifiedAt){const uploaded=new Set(status.uploaded);for(let i=0;i<status.document.chunkCount;i++)if(!uploaded.has(i)){const chunk=bytes.subarray(i*1048576,(i+1)*1048576);await call('pdf-chunk',{documentId:saved.id,index:i,data:chunk.toString('base64'),sha256:hash(chunk)});}await call('pdf-complete',{documentId:saved.id});}
 saved.done=true;await checkpoint();return {done:true};
 }
 if(manifest.documents.some(e=>!state.documents[e.file]?.done))throw Error('PDF 등록이 완료되지 않았습니다.');
 const current=await get(project.template.remoteId);
 if(current.version.projectData.template.metadata.sampleDRemoteRevision==='sample-d-v4'){state.completed=true;await checkpoint();return {completed:true,version:current.version.versionNumber};}
 if(current.version.id!==state.baseVersionId)throw Object.assign(Error('저장본이 변경되어 자동 덮어쓰기를 중단했습니다.'),{statusCode:409});
 const ids=new Map(manifest.documents.map(e=>[e.offlineDocumentId,state.documents[e.file].id]));
 async function replace(value){if(typeof value==='string'){if(value.startsWith('data:image/')){const digest=hash(value);if(!state.assets[digest]){state.assets[digest]=(await storeAsset(value)).id;await checkpoint();}return 'acdl-asset://'+state.assets[digest];}return value;}
 if(Array.isArray(value)){const result=[];for(const x of value)result.push(await replace(x));return result;}
 if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=await replace(v);if(out.offlineRegistrationPending)delete out.offlineRegistrationPending;if(ids.has(out.documentId))out.documentId=ids.get(out.documentId);if(value.pdfSource&&ids.has(value.pdfSource.documentId)){out.packageId=state.packageId;delete out.graphicId;delete out.packageRevision;}return out;}return value;}
 const updated=await replace(project);delete updated.template.sampleDOfflineSources;updated.template.savedPagePreviews={};updated.template.metadata.sampleDRemoteRevision='sample-d-v4';updated.template.metadata.description='샘플 D 기준 28면 · 연력·학교상징·월력·플래너·뒷표지 · 원본 PDF 등록 완료';
 // Retain authored per-page backgrounds; do not regenerate the book from package mappings.
 delete updated.template.settings.graphicPackage;updated.template.settings.vectorBackgroundEnabled=false;
 const result=await save({templateId:project.template.remoteId,stableKey:project.template.remoteStableKey,name:updated.template.metadata.name,description:updated.template.metadata.description,edition:2027,state:'draft',isStandard:false,productType:'desk',templateKey:updated.settings.template,saveKind:'manual',saveNote:'샘플 D v4 · 원본 PDF 등록 및 28면 수정 저장',schemaVersion:updated.version,projectData:updated});
 state.completed=true;state.savedVersionId=result.version.id;await checkpoint();return {completed:true,templateId:result.template.id,version:result.version.versionNumber};
}
