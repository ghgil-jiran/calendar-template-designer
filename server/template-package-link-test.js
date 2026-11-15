import {createHash} from 'node:crypto';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {graphicPdfDependencies} from './graphic-library.js';
import {resolvePdfBackgroundPrintSources} from './pdf-background-print-source.js';
export const TARGET_NAME='2027학년도 · 샘플 D · 패키지 연결 테스트';
export const matchesTestName=name=>String(name||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9가-힣]/g,'').includes('샘플d패키지연결테스트');
const fail=(message,statusCode=409)=>{throw Object.assign(Error(message),{statusCode,code:'PACKAGE_LINK_TEST_FAILED',details:message})};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function linkAuthoredBackgrounds(project,packages,sourceVersionId){
 const copy=structuredClone(project),pages=copy.book?.pageInstances||[],entries={},overrides={},used=new Set(),report=[];
 for(const page of pages){const backgrounds=(copy.book.elementsByPage?.[page.id]||[]).filter(e=>e.role==='graphic-package-background'&&e.graphicSource?.pdfSource);if(backgrounds.length!==1)fail(`${page.label||page.id}: PDF 배경 개체가 정확히 하나여야 합니다.`);const bg=backgrounds[0],g=bg.graphicSource,ref=g.pdfSource,pkg=packages.find(p=>p.id===g.packageId);if(!pkg)fail('배경의 패키지를 찾을 수 없습니다.');used.add(pkg.id);const key='authored-'+page.id;entries[key]={name:ref.fileName||page.label||page.id,previewAssetId:g.previewAssetId||null,previewSrc:bg.src,pdfSource:structuredClone(ref),physicalSizeMm:{width:ref.widthPt*25.4/72,height:ref.heightPt*25.4/72},preservedBackground:structuredClone(bg)};overrides[page.id]=key;report.push({pageId:page.id,label:page.label||page.role,packageId:pkg.id,packageName:pkg.name,fileName:ref.fileName,pageNumber:ref.pageNumber,documentId:ref.documentId,sha256:ref.sha256});}
 if(!pages.length||used.size!==1)fail('검증용 연결은 하나의 패키지에 속한 모든 페이지가 확인된 경우에만 저장합니다.');const pkg=packages.find(p=>used.has(p.id));
 copy.template.settings||={};copy.template.settings.graphicPackage={schemaVersion:'template-graphic-package.v1',id:pkg.id,name:pkg.name,revision:pkg.revision,size:pkg.size,mode:'pdf',bindingMode:'preserve-authored',entries,overrides,sourceVersionId};copy.template.settings.vectorBackgroundEnabled=true;
 if(hash(project.book)!==hash(copy.book))fail('배경·개체·학교 자료가 변경되어 중단했습니다.');
 const strip=p=>{const value=structuredClone(p);if(value.template.settings){delete value.template.settings.graphicPackage;delete value.template.settings.vectorBackgroundEnabled;}return value};if(hash(strip(project))!==hash(strip(copy)))fail('패키지 연결 외 문서 내용이 변경되었습니다.');
 return {project:copy,report,backgroundsSha256:hash(project.book.elementsByPage),bookSha256:hash(project.book),packageId:pkg.id,packageName:pkg.name};
}
let pending;
export function runPackageLinkTest(body,deps={}){const result=(pending||Promise.resolve()).catch(()=>{}).then(()=>run(body,deps));pending=result;return result.finally(()=>{if(pending===result)pending=null});}
async function run(body,{list=listTemplates,load=getTemplate,save=saveVersion,d=graphicPdfDependencies,resolve=resolvePdfBackgroundPrintSources}={}){
 if(!['list','inspect','save'].includes(body.step))fail('검증 단계를 확인해 주세요.',400);
 const records=await list(),candidates=records.filter(t=>t.state==='draft'&&Number(t.edition)===2027&&t.productType==='desk');
 if(body.step==='list')return {candidates:candidates.map(t=>({templateId:t.id,name:t.name,edition:t.edition,state:t.state,version:t.latestVersionNumber,preferred:matchesTestName(t.name)}))};
 if(!body.templateId)fail('검증할 초안을 목록에서 선택해 주세요.',400);const item=candidates.find(t=>t.id===body.templateId);if(!item)fail('선택한 항목이 2027 탁상형 초안인지 확인해 주세요. 게시본은 처리하지 않습니다.');const current=await load(item.id),t=current.template,v=current.version;
 if(t.id!==item.id||t.state!=='draft'||v.state!=='draft')fail('검증용 초안만 처리할 수 있습니다. 게시본은 수정하지 않습니다.');
 const metadata=v.projectData.template?.metadata||{};if(!matchesTestName(t.name)&&!matchesTestName(metadata.name)&&!metadata.sampleDPrintRepair&&!metadata.sampleDRemoteRevision)fail('선택한 초안이 샘플 D 복제본인지 확인할 수 없습니다. 원본을 확인해 주세요.');
 const project=v.projectData,settings=project.template?.settings||{},existing=settings.graphicPackage;
 if(v.versionNumber!==1&&existing?.bindingMode!=='preserve-authored')fail('v1 검증용 초안이 아닙니다. 현재 버전을 먼저 확인해 주세요.');
 // Validate immutable manifests/chunk receipts using the existing print-source resolver.
 const plansBefore=await resolve(project,d),ids=[...new Set(plansBefore.flatMap(p=>p.layers.map(l=>l.source.packageId)))];
 const packages=await Promise.all(ids.map(id=>d.getRecord(id)));for(const p of packages)if(p.schemaVersion!=='graphic-package.v1'||p.mode!=='pdf')fail('PDF 배경 패키지 원본을 확인할 수 없습니다.');
 const linked=linkAuthoredBackgrounds(project,packages,existing?.sourceVersionId||v.id),plansAfter=await resolve(linked.project,d);
 // Signed URLs can differ; compare immutable sources, placement and rendering intent.
 const stable=plans=>plans.map(p=>({...p,layers:p.layers.map(l=>({...l,source:{...l.source,chunks:undefined}}))}));
 if(hash(stable(plansBefore))!==hash(stable(plansAfter)))fail('인쇄 배경 합성 계획이 달라 저장하지 않았습니다.');
 const result={templateId:item.id,name:t.name,version:v.versionNumber,versionId:v.id,pageCount:linked.report.length,packageId:linked.packageId,packageName:linked.packageName,backgroundsSha256:linked.backgroundsSha256,bookSha256:linked.bookSha256,printPlansUnchanged:true,pages:linked.report};
 if(existing?.bindingMode==='preserve-authored'&&hash(existing.entries)===hash(linked.project.template.settings.graphicPackage.entries))return {...result,completed:true,unchanged:true};
 if(body.step==='inspect')return {...result,completed:false};if(body.versionId!==v.id||body.backgroundsSha256!==linked.backgroundsSha256)fail('검사 후 초안이 변경되었습니다. 다시 확인해 주세요.');
 const latest=await load(item.id);if(latest.version.id!==v.id||latest.template.state!=='draft')fail('최신 초안이 달라 저장하지 않았습니다.');
 const saved=await save({templateId:item.id,stableKey:t.stableKey,name:t.name,description:t.description,edition:t.edition,state:'draft',isStandard:false,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',sourceVersionId:v.id,schemaVersion:v.schemaVersion,saveNote:'패키지 연결 검증 · 원본 PDF·배치·전체 Book 및 인쇄 합성 계획 동일 확인',projectData:linked.project});
 const reopened=await load(item.id);if(reopened.version.id!==saved.version.id||hash(reopened.version.projectData.book)!==linked.bookSha256)fail('저장 후 문서 일치 확인에 실패했습니다. 결과를 확인해 주세요.');
 return {...result,completed:true,version:saved.version.versionNumber,savedVersionId:saved.version.id,reopenedVerified:true};
}
