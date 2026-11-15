import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {graphicPdfDependencies,createGraphicPackage} from './graphic-library.js';
import {pdfPackageOperation} from './graphic-pdf-package.js';
const KEY='poster-sample-a-floral-2027',STATE='template-installations/wall-sample-a-cmyk-v1.json';
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=name=>readFile(new URL('../assets/wall-sample-a/'+name,import.meta.url));
const fail=(message,statusCode=409)=>{throw Object.assign(Error(message),{statusCode});};
let pending;
export function repairWallSampleACmyk(body,deps={}){const result=(pending||Promise.resolve()).catch(()=>{}).then(()=>run(body,deps));pending=result;return result.finally(()=>{if(pending===result)pending=null;});}
export function replaceBackground(project,state,manifest){
 const copy=structuredClone(project),backgrounds=Object.values(copy.book?.elementsByPage||{}).flat().filter(e=>e.id==='wall-a.background'&&e.role==='graphic-package-background');
 if(backgrounds.length!==1)fail('샘플 A 배경 개체를 정확히 하나 찾을 수 없습니다.');
 const bg=backgrounds[0];
 bg.graphicSource={...bg.graphicSource,packageId:state.packageId,pdfSource:structuredClone(state.pdfSource),previewAssetId:state.previewAssetId};
 bg.src='acdl-asset://'+state.previewAssetId;
 copy.template.metadata={...copy.template.metadata,wallBackgroundCmykRevision:manifest.sha256};
 return copy;
}
async function run(body,{list=listTemplates,load=getTemplate,save=saveVersion,d=graphicPdfDependencies,createPackage=createGraphicPackage,pdf=pdfPackageOperation,readAsset=read}={}){
 if(!['inspect','prepare','save'].includes(body.step))fail('등록 단계를 확인해 주세요.',400);
 const manifest=JSON.parse(await readAsset('manifest-cmyk.json'));
 const item=(await list()).find(x=>x.stableKey===KEY);if(!item)fail('등록된 벽보형 샘플 A가 없습니다.',404);
 const {template,version}=await load(item.id),project=version.projectData;
 if(project.template?.metadata?.posterSample!=='wall-sample-a.v1')fail('벽보형 샘플 A인지 확인해 주세요.');
 const result={templateId:item.id,name:template.name,version:version.versionNumber,versionId:version.id};
 if(project.template.metadata.wallBackgroundCmykRevision===manifest.sha256)return {...result,completed:true,unchanged:true};
 replaceBackground(project,{pdfSource:{}},manifest);
 if(body.step==='inspect')return {...result,completed:false};
 if(body.versionId!==version.id)fail('템플릿이 변경되었습니다. 다시 확인한 후 실행해 주세요.');
 await d.ensureBucket();let state;
 try{state=await d.readJson(STATE);}catch(error){if(![400,404].includes(error.storageStatus))throw error;}
 const checkpoint=()=>d.writeJson(STATE,state);
 if(state&&state.sha256!==manifest.sha256)fail('배경 등록 자료의 버전이 다릅니다.');
 if(body.step==='prepare'){
  const bytes=await readAsset('background-cmyk.pdf');if(bytes.length!==manifest.byteSize||hash(bytes)!==manifest.sha256)fail('CMYK 배경 파일 검증에 실패했습니다.');
  if(!state){const pkg=await createPackage({name:'벽보형 샘플 A · CMYK 배경',size:'poster-a2',mode:'pdf',tags:'벽보형,A2,CMYK',source:'기존 RGB 원본에서 CMYK 변환 · 원본 해상도 유지'});state={packageId:pkg.id,sha256:manifest.sha256};await checkpoint();}
  const call=(operation,extra={})=>pdf({operation,packageId:state.packageId,...extra},d);
  if(!state.documentId){state.documentId=(await call('pdf-start',{fileName:manifest.fileName,kind:'background',pages:manifest.pages,byteSize:manifest.byteSize,sha256:manifest.sha256})).document.id;await checkpoint();}
  const status=await call('pdf-status',{documentId:state.documentId});
  if(!status.document.verifiedAt){for(let i=0;i<status.document.chunkCount;i++)if(!status.uploaded.includes(i)){const chunk=bytes.subarray(i*1048576,(i+1)*1048576);await call('pdf-chunk',{documentId:state.documentId,index:i,data:chunk.toString('base64'),sha256:hash(chunk)});}await call('pdf-complete',{documentId:state.documentId});}
  if(!state.previewAssetId){const image=await readAsset('preview-cmyk.png'),thumbnail=await readAsset('thumbnail-cmyk.webp');const preview=await call('pdf-preview',{documentId:state.documentId,pageNumber:1,width:manifest.pixelWidth,height:manifest.pixelHeight,dataUrl:'data:image/png;base64,'+image.toString('base64'),thumbnailDataUrl:'data:image/webp;base64,'+thumbnail.toString('base64')});state.previewAssetId=preview.preview.previewAssetId;await checkpoint();}
  if(!state.pdfSource){const assigned=await call('pdf-assign',{documentId:state.documentId,pageNumber:1,slot:'poster-1'});state.pdfSource=assigned.graphic.pdfSource;await checkpoint();}
  return {...result,prepared:true};
 }
 if(!state?.pdfSource||!state.previewAssetId)fail('CMYK 원본 등록을 먼저 완료해 주세요.');
 const next=replaceBackground(project,state,manifest);
 const saved=await save({templateId:item.id,stableKey:KEY,name:template.name,description:template.description,edition:template.edition,state:'draft',isStandard:template.isStandard,productType:'poster',templateKey:template.templateKey||'school-basic',saveKind:'manual',sourceVersionId:version.id,saveNote:'샘플 A 배경 PDF CMYK 교체 · 기존 개체·학교 정보·일정·배치 유지',schemaVersion:version.schemaVersion||next.version,projectData:next});
 return {...result,completed:true,version:saved.version.versionNumber};
}
