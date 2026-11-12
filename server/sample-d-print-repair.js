import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {graphicPdfDependencies,createGraphicPackage} from './graphic-library.js';
import {pdfPackageOperation} from './graphic-pdf-package.js';
import {getTemplate,saveVersion} from './template-persistence.js';
const files=name=>readFile(new URL('../assets/sample-d-cmyk/'+name,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const STATE='template-installations/sample-d-cmyk-v3.json';
let pending;
export function repairSampleDPrint(body,deps={}){const run=()=>step(body,deps),result=(pending||Promise.resolve()).catch(()=>{}).then(run);pending=result;return result.finally(()=>{if(pending===result)pending=null;});}
export function replacePrintSources(project,manifest,state){
 const updated=structuredClone(project);let changed=0,remaining=0;
 function walk(v){if(!v||typeof v!=='object')return;if(v.pdfSource){const ref=v.pdfSource,entry=manifest.documents.find(e=>e.sourceSha256===ref.sha256||(e.previousSha256&&e.previousSha256!==e.sha256&&e.previousSha256===ref.sha256));if(entry){const saved=state?.documents?.[entry.file];if(!saved?.done){remaining++;}else{const page=entry.pages[ref.pageNumber-1];if(!page)throw Error('인쇄 배경 페이지 번호가 맞지 않습니다.');v.pdfSource={...ref,documentId:saved.id,sha256:entry.sha256,byteSize:entry.byteSize,widthPt:page.widthPt,heightPt:page.heightPt};v.packageId=state.packageId;delete v.graphicId;delete v.packageRevision;changed++;}}}for(const value of Object.values(v))walk(value);}
 walk(updated);return {project:updated,changed,remaining};
}
async function step(body,{d=graphicPdfDependencies,createPackage=createGraphicPackage,pdf=pdfPackageOperation,get=getTemplate,save=saveVersion}={}){
 if(!['start','document','save','verify'].includes(body.step))throw Object.assign(Error('Invalid repair step'),{statusCode:400});
 const manifest=JSON.parse(await files('manifest.json')),current=await get(manifest.templateId);
 const status=()=>{const result=replacePrintSources(current.version.projectData,manifest,null);return {templateId:manifest.templateId,version:current.version.versionNumber,versionId:current.version.id,completed:result.remaining===0&&current.version.projectData.template.metadata.sampleDPrintRepair===manifest.revision,documents:manifest.documents.length};};
 if(body.step==='verify')return status();
 if(status().completed)return status();
 await d.ensureBucket();let state;try{state=await d.readJson(STATE);}catch(e){if(![400,404].includes(e.storageStatus))throw e;}
 if(!state){const pkg=await createPackage({name:'샘플 D · CMYK 인쇄 배경',size:'desk-standard',mode:'pdf',tags:'2027,샘플D,CMYK',source:'샘플 D 원본 색상 정리'});state={packageId:pkg.id,documents:{}};await d.writeJson(STATE,state);}
 const checkpoint=()=>d.writeJson(STATE,state);
 if(body.step==='start')return status();
 if(body.step==='document'){
  const entry=manifest.documents[body.index];if(!entry)throw Object.assign(Error('Invalid document'),{statusCode:400});if(state.documents[entry.file]?.done)return {done:true};
  const bytes=await files(entry.file);if(hash(bytes)!==entry.sha256||bytes.length!==entry.byteSize)throw Error('CMYK PDF hash mismatch');
  const call=(operation,options={})=>pdf({operation,packageId:state.packageId,...options},d);
  let saved=state.documents[entry.file];if(!saved){const result=await call('pdf-start',{fileName:entry.file,kind:'background',pages:entry.pages,sha256:entry.sha256,byteSize:entry.byteSize});saved=state.documents[entry.file]={id:result.document.id};await checkpoint();}
  const receipt=await call('pdf-status',{documentId:saved.id});if(!receipt.document.verifiedAt){const uploaded=new Set(receipt.uploaded);for(let i=0;i<receipt.document.chunkCount;i++)if(!uploaded.has(i)){const chunk=bytes.subarray(i*1048576,(i+1)*1048576);await call('pdf-chunk',{documentId:saved.id,index:i,data:chunk.toString('base64'),sha256:hash(chunk)});}await call('pdf-complete',{documentId:saved.id});}
  saved.done=true;await checkpoint();return {done:true};
 }
 if(current.version.id!==body.versionId)throw Object.assign(Error('템플릿이 변경되었습니다. 다시 실행하면 최신 저장본에 적용합니다.'),{statusCode:409});
 if(manifest.documents.some(e=>!state.documents[e.file]?.done))throw Error('CMYK 배경 등록을 먼저 완료해주세요.');
 const result=replacePrintSources(current.version.projectData,manifest,state);if(!result.changed||result.remaining)throw Error('교체할 샘플 D 인쇄 원본을 확인해주세요.');
 const project=result.project;project.template.metadata.sampleDPrintRepair=manifest.revision;project.template.savedPagePreviews={};
 const t=current.template,saved=await save({templateId:t.id,stableKey:t.stableKey,name:t.name,description:t.description,edition:t.edition,state:t.state,isStandard:t.isStandard,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',saveNote:'샘플 D 인쇄 배경 CMYK 정리 · 편집 내용 유지',sourceVersionId:current.version.id,schemaVersion:current.version.schemaVersion,projectData:project});
 return {completed:true,changed:result.changed,templateId:t.id,version:saved.version.versionNumber};
}
