import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../apps/designer-studio/wall-calendar-policy.js';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/native-print-authoring.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/wall-sample-a.js';
import {listTemplates,getTemplate,saveVersion,storeTemplateAsset} from './template-persistence.js';
import {listCalendarTypes} from './calendar-type-persistence.js';
import {graphicPdfDependencies,createGraphicPackage} from './graphic-library.js';
import {pdfPackageOperation} from './graphic-pdf-package.js';
const model=globalThis.ACDLWallSampleA,STATE='template-installations/wall-sample-a-v1.json';
const hash=b=>createHash('sha256').update(b).digest('hex'),file=name=>readFile(new URL('../assets/wall-sample-a/'+name,import.meta.url));
let pending;
export function installWallSampleA(body,deps={}){const run=()=>step(body,deps),result=(pending||Promise.resolve()).catch(()=>{}).then(run);pending=result;return result.finally(()=>{if(pending===result)pending=null;});}
async function step(body,{list=listTemplates,load=getTemplate,save=saveVersion,types=listCalendarTypes,d=graphicPdfDependencies,createPackage=createGraphicPackage,pdf=pdfPackageOperation,store=storeTemplateAsset,read=file}={}){
 if(!['prepare','save','upgrade-inspect','upgrade-save'].includes(body.step))throw Object.assign(Error('등록 단계를 확인해 주세요.'),{statusCode:400});
 const existing=(await list()).find(x=>x.stableKey===model.STABLE_KEY);
 if(body.step.startsWith('upgrade-')){if(!existing)throw Object.assign(Error('등록된 벽보형 샘플 A가 없습니다.'),{statusCode:404});const current=await load(existing.id),version=current.version,record=current.template;if(version.projectData.template.metadata?.wallListStyleRevision===model.LIST_REVISION)return {completed:true,unchanged:true,templateId:existing.id,version:version.versionNumber};if(body.step==='upgrade-inspect')return {completed:false,templateId:existing.id,versionId:version.id};if(body.versionId!==version.id)throw Object.assign(Error('샘플 A가 변경되었습니다. 최신 상태에서 다시 실행해 주세요.'),{statusCode:409});const project=model.upgrade(version.projectData),result=await save({templateId:existing.id,stableKey:model.STABLE_KEY,name:record.name,description:record.description,edition:record.edition,state:'draft',isStandard:record.isStandard,productType:'poster',templateKey:record.templateKey||'school-basic',saveKind:'manual',sourceVersionId:version.id,saveNote:'벽보형 목록형 스타일 적용 · 날짜 칸 숫자만 · 24절기·음력 기본 제외 · 배경·학교 정보·일정·배치 유지',schemaVersion:version.schemaVersion||project.version,projectData:project});return {completed:true,templateId:existing.id,version:result.version.versionNumber};}
 if(existing)return {completed:true,existing:true,templateId:existing.id};
 const definitions=await types(),type=definitions.find(t=>t.id==='poster-standard');
 if(!type||Number(type.finishedSize?.width)!==420||Number(type.finishedSize?.height)!==594)throw Object.assign(Error('벽보형 A2 420 × 594mm 종류를 먼저 확인해 주세요.'),{statusCode:409});
 await d.ensureBucket();let state;try{state=await d.readJson(STATE);}catch(e){if(![400,404].includes(e.storageStatus))throw e;}
 const checkpoint=()=>d.writeJson(STATE,state),manifest=JSON.parse(await read('manifest.json'));
 if(!state){if(body.step!=='prepare')throw Object.assign(Error('배경 원본 등록을 먼저 완료해 주세요.'),{statusCode:409});const pkg=await createPackage({name:'벽보형 샘플 A · 플라워 · A2 배경 PDF',size:'poster-a2',mode:'pdf',tags:'벽보형,A2,플라워,1면형',source:'사용자가 선택한 AI 수채화 배경 · 원본 해상도 유지'});state={revision:model.REVISION,packageId:pkg.id};await checkpoint();}
 if(state.revision!==model.REVISION)throw Error('등록 자료 버전이 다릅니다.');
 if(body.step==='prepare'){
  const bytes=await read('background.pdf');if(bytes.length!==manifest.byteSize||hash(bytes)!==manifest.sha256)throw Error('배경 PDF 원본 검증에 실패했습니다.');
  const call=(operation,extra={})=>pdf({operation,packageId:state.packageId,...extra},d);
  if(!state.documentId){state.documentId=(await call('pdf-start',{fileName:manifest.fileName,kind:'background',pages:manifest.pages,byteSize:manifest.byteSize,sha256:manifest.sha256})).document.id;await checkpoint();}
  const status=await call('pdf-status',{documentId:state.documentId});
  if(!status.document.verifiedAt){for(let i=0;i<status.document.chunkCount;i++)if(!status.uploaded.includes(i)){const chunk=bytes.subarray(i*1048576,(i+1)*1048576);await call('pdf-chunk',{documentId:state.documentId,index:i,data:chunk.toString('base64'),sha256:hash(chunk)});}await call('pdf-complete',{documentId:state.documentId});}
  if(!state.pdfSource){const image=await readFile(new URL('../apps/designer-studio/assets/wall-sample-a/background.png',import.meta.url)),thumbnail=await read('thumbnail.webp'),preview=await call('pdf-preview',{documentId:state.documentId,pageNumber:1,width:manifest.pixelWidth,height:manifest.pixelHeight,dataUrl:'data:image/png;base64,'+image.toString('base64'),thumbnailDataUrl:'data:image/webp;base64,'+thumbnail.toString('base64')});const assigned=await call('pdf-assign',{documentId:state.documentId,pageNumber:1,slot:'poster-1'});state.pdfSource=assigned.graphic.pdfSource;state.previewAssetId=preview.preview.previewAssetId;await checkpoint();}
  return {prepared:true,effectiveDpi:manifest.effectiveDpi};
 }
 if(!state.pdfSource||!state.previewAssetId)throw Object.assign(Error('배경 원본 등록을 먼저 완료해 주세요.'),{statusCode:409});
 const source=await load('cd82064c-12e3-4be4-973b-352327f6568b');
 if(!state.logoAssetId){const bytes=await readFile(new URL('../assets/sample-c/school-logo.png',import.meta.url));state.logoAssetId=(await store('data:image/png;base64,'+bytes.toString('base64'))).id;await checkpoint();}
 const project=model.create(source.version.projectData,type,{background:'acdl-asset://'+state.previewAssetId,logo:'acdl-asset://'+state.logoAssetId,packageId:state.packageId,pdfSource:state.pdfSource,previewAssetId:state.previewAssetId,effectiveDpi:manifest.effectiveDpi});
 const result=await save({stableKey:model.STABLE_KEY,name:model.NAME,description:project.template.metadata.description,edition:2027,state:'draft',isStandard:false,productType:'poster',templateKey:'school-basic',saveKind:'manual',saveNote:'수채화 배경 원본 PDF 등록 · A2 1면 · 연결 학교 정보·12개월 개체 구성 · 인쇄 품질 미검증',schemaVersion:project.version,projectData:project});
 state.completed=true;state.templateId=result.template.id;await checkpoint();return {completed:true,templateId:result.template.id,version:result.version.versionNumber,pageCount:1,effectiveDpi:manifest.effectiveDpi};
}
