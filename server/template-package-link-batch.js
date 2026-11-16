import {createHash} from 'node:crypto';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {graphicPdfDependencies} from './graphic-library.js';
import {resolvePdfBackgroundPrintSources} from './pdf-background-print-source.js';
import {linkAuthoredBackgrounds} from './template-package-link-test.js';
const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,ordered(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(ordered(v))).digest('hex');
const fail=m=>{throw Object.assign(Error(m),{statusCode:409,code:'PACKAGE_LINK_BATCH_FAILED',details:m})};
export const sampleLetter=name=>String(name||'').normalize('NFKC').toUpperCase().match(/샘플\s*([ABC])(?:\b|\s|·|$)/)?.[1]||null;
const eligible=t=>t.state==='published'&&Number(t.edition)===2027&&t.productType==='desk'&&sampleLetter(t.name);
const stablePlans=plans=>plans.map(p=>({...p,layers:p.layers.map(l=>({...l,source:{...l.source,chunks:undefined}}))}));
let pending;
export function runPackageLinkBatch(body,deps={}){const next=(pending||Promise.resolve()).catch(()=>{}).then(()=>run(body,deps));pending=next;return next.finally(()=>{if(pending===next)pending=null});}
async function run(body,{list=listTemplates,load=getTemplate,save=saveVersion,d=graphicPdfDependencies,resolve=resolvePdfBackgroundPrintSources}={}){
 const records=await list();
 if(body.step==='batch-list')return {candidates:records.filter(eligible).map(t=>({templateId:t.id,name:t.name,sample:sampleLetter(t.name),version:t.latestVersionNumber,versionId:t.latestVersionId,state:t.state}))};
 if(body.step!=='batch-prepare')fail('처리 단계를 확인해 주세요.');
 const item=records.find(t=>t.id===body.templateId&&eligible(t));if(!item)fail('2027 탁상형 샘플 A·B·C의 게시본을 선택해 주세요.');
 const source=await load(item.id),{template:t,version:v}=source;
 if(t.id!==item.id||!eligible(t)||v.state!=='published'||v.id!==body.versionId)fail('선택한 게시본의 버전이 달라졌습니다. 목록을 새로고침해 주세요.');
 const project=v.projectData,before=await resolve(project,d),ids=[...new Set(before.flatMap(p=>p.layers.map(l=>l.source.packageId)))],packages=await Promise.all(ids.map(id=>d.getRecord(id)));
 if(packages.some(p=>p.schemaVersion!=='graphic-package.v1'||p.mode!=='pdf'))fail('원본 PDF 패키지를 확인할 수 없습니다.');
 const linked=linkAuthoredBackgrounds(project,packages,v.id),after=await resolve(linked.project,d);
 if(hash(stablePlans(before))!==hash(stablePlans(after)))fail('인쇄 배경 합성 계획이 달라 복제하지 않았습니다.');
 const stableKey=`package-link-test-${t.id}-${v.id}`,name=`2027학년도 · 샘플 ${sampleLetter(t.name)} · 패키지 연결 테스트`;
 const existing=records.find(r=>r.stableKey===stableKey);
 const result={sourceTemplateId:t.id,sourceVersionId:v.id,sourceName:t.name,packages:linked.packages,pages:linked.report,pageCount:linked.report.length,bookSha256:linked.bookSha256,backgroundsSha256:linked.backgroundsSha256,printPlansUnchanged:true};
 async function verify(saved,reused){const reopened=await load(saved.template.id),p=reopened.version.projectData,marker=p.template?.metadata?.packageLinkBatch;
  const checks={draft:reopened.template.state==='draft'&&reopened.version.state==='draft',book:hash(p.book)===hash(project.book),source:marker?.sourceVersionId===v.id&&marker?.sourceTemplateId===t.id,connection:hash(p.template?.settings?.graphicPackage)===hash(linked.project.template.settings.graphicPackage),printPlans:hash(stablePlans(await resolve(p,d)))===hash(stablePlans(before))};
  const failed=Object.keys(checks).filter(k=>!checks[k]);if(failed.length)fail(`복제 초안 재확인 실패: ${failed.join(', ')} · 초안 ID ${reopened.template.id}. 자동 덮어쓰기는 하지 않습니다.`);
  return {...result,templateId:reopened.template.id,name:reopened.template.name,version:reopened.version.versionNumber,reopenedVerified:true,reused,completed:true};}
 if(existing)return verify({template:existing},true);
 const copy=linked.project;copy.template.id=null;for(const k of ['remoteId','remoteStableKey','remoteVersionNumber'])delete copy.template[k];
 copy.template.publishing={...(copy.template.publishing||{})};for(const k of ['packageId','lastReviewPackage','lastPrintInspectionPackage'])delete copy.template.publishing[k];
 if(copy.template.package)copy.template.package={...copy.template.package,id:null};
 copy.template.librarySource='local';copy.template.libraryScope='custom';copy.template.derivedFromTemplateId=t.id;
 copy.template.metadata={...(copy.template.metadata||{}),name,state:'draft',isStandard:false,packageLinkBatch:{sourceTemplateId:t.id,sourceVersionId:v.id}};
 const latest=await load(t.id);if(latest.version.id!==v.id||!eligible(latest.template))fail('검사 중 게시본이 변경되어 저장하지 않았습니다.');
 let saved;
 try{saved=await save({templateId:null,stableKey,name,description:t.description,edition:t.edition,state:'draft',isStandard:false,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',sourceVersionId:v.id,schemaVersion:v.schemaVersion,saveNote:'게시본 보존 복제 · PDF 원본·Book·인쇄 합성 계획 동일 · 패키지 연결 검증',projectData:copy});}
 catch(error){const found=(await list()).find(r=>r.stableKey===stableKey);if(!found)throw error;return verify({template:found},true);}
 const output=await verify(saved,false),original=await load(t.id);if(original.version.id!==v.id)fail('초안은 저장됐지만 원본 버전이 달라졌습니다. 결과를 확인해 주세요.');return output;
}
