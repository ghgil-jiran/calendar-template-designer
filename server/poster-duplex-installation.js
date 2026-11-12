import '../apps/designer-studio/calendar-type-domain.js';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {listCalendarTypes,saveCalendarType} from './calendar-type-persistence.js';
const domain=globalThis.ACDLCalendarTypeDomain;
export const DUPLEX_KEY='poster-duplex-academic-2027';
export const TWO_PAGE_KEY='poster-two-page-academic-2027';
export function createPosterDuplex(source,definition){
 const original=source.version.projectData,p=structuredClone(original);
 if(p.productType?.category!=='poster'||p.book?.pageInstances?.length!==2||domain.compatibleTypeId(p)!=='poster-two-page')throw Object.assign(Error('등록된 벽보형 2페이지 템플릿을 선택해주세요.'),{statusCode:409});
 if(Number(p.productType.pageSize.width)!==Number(definition.finishedSize.width)||Number(p.productType.pageSize.height)!==Number(definition.finishedSize.height))throw Object.assign(Error('기준 템플릿과 양면형의 규격이 다릅니다. 자동 확대 없이 중단합니다.'),{statusCode:409});
 p.template.id=null;for(const key of ['remoteId','remoteStableKey','remoteVersionNumber'])delete p.template[key];
 p.template.publishing={...(p.template.publishing||{})};for(const key of ['packageId','lastReviewPackage','lastPrintInspectionPackage'])delete p.template.publishing[key];
 if(p.template.package)p.template.package={...p.template.package,id:null};
 p.template.librarySource='local';p.template.libraryScope='custom';p.template.derivedFromTemplateId=source.template.id;
 p.template.cloneProvenance={sourceTemplateId:source.template.id,sourceVersion:source.version.versionNumber,sourceVersionId:source.version.id,clonedAt:new Date().toISOString(),designPreserved:true};
 const name=`${p.settings.year}학년도 · 벽보형 · 양면 일정형`;
 p.settings.name=name;p.settings.posterPageCount=2;p.productType.id='poster-annual-duplex';
 p.template.metadata={...p.template.metadata,name,state:'draft',isStandard:false,posterSample:'duplex.v1',description:'기존 2페이지형 최신 저장본 복제 · 한 장 앞뒤 양면 · 디자인과 월 구성 유지'};
 domain.attachSnapshot(p,definition);domain.applyProjectSize(p,definition);
 const validation=domain.validateProject(p,definition);if(!validation.valid)throw Object.assign(Error(validation.errors.join(' ')),{statusCode:409});return p;
}
let pending;
export function installPosterDuplex(options={},deps={list:listTemplates,load:getTemplate,save:saveVersion,types:listCalendarTypes,saveType:saveCalendarType}){
 const run=()=>install(options,deps),result=(pending||Promise.resolve()).catch(()=>{}).then(run);pending=result;return result.finally(()=>{if(pending===result)pending=null});
}
async function install({sourceTemplateId},deps){
 const records=await deps.list(),existing=records.find(t=>t.stableKey===DUPLEX_KEY);
 if(existing)return {existing:true,templateId:existing.id};
 const record=sourceTemplateId?records.find(t=>t.id===sourceTemplateId):records.find(t=>t.stableKey===TWO_PAGE_KEY);
 if(!record)throw Object.assign(Error('먼저 2페이지형 템플릿을 라이브러리에 저장해주세요.'),{statusCode:409});
 const source=await deps.load(record.id),types=await deps.types();
 let type=types.find(t=>t.id==='poster-duplex');
 if(!type){const original=source.version.projectData,snapshot=original.template?.calendarTypeSnapshot?.definition||domain.definition('poster-two-page');type=domain.normalize({...snapshot,id:'poster-duplex',name:'양면형',printSides:'duplex',status:'active',summary:'한 장 앞뒤 양면 · 6개월씩 앞면/뒷면',finishedSize:{...original.productType.pageSize},productionSize:{...(original.productType.productionSize||snapshot.productionSize)}});}
 const project=createPosterDuplex(source,type);
 if(!types.some(t=>t.id===type.id))await deps.saveType(type);
 const edition=Number(project.settings.year),saved=await deps.save({stableKey:DUPLEX_KEY,name:project.template.metadata.name,description:project.template.metadata.description,edition,state:'draft',isStandard:false,productType:'poster',templateKey:project.settings.template||'school-basic',saveKind:'manual',saveNote:`2페이지형 v${source.version.versionNumber}에서 양면형 복제 · 원본 유지`,schemaVersion:project.version,projectData:project});
 const reopened=await deps.load(saved.template.id);
 if(reopened.version.projectData.template?.calendarTypeSnapshot?.definition?.id!=='poster-duplex'||reopened.version.projectData.book?.sheets?.length!==1||reopened.version.projectData.book?.pageInstances?.[1]?.side!=='back')throw Object.assign(Error('양면형 저장본 재열기 검증에 실패했습니다.'),{statusCode:409});
 return {templateId:saved.template.id,version:saved.version.versionNumber,sourceTemplateId:source.template.id,sourceVersion:source.version.versionNumber,pageCount:2,sheetCount:1,verified:true};
}
