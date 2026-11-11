import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/native-print-authoring.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/poster-two-page-sample.js';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {listCalendarTypes} from './calendar-type-persistence.js';
export async function installPosterSample(deps={list:listTemplates,load:getTemplate,save:saveVersion,types:listCalendarTypes},pageCount=1){
 const model=pageCount===2?globalThis.ACDLPosterTwoPageSample:globalThis.ACDLPosterOnePageSample,existing=(await deps.list()).find(item=>item.stableKey===model.STABLE_KEY);
 let previous=null;if(existing){if(pageCount===2)return {templateId:existing.id,existing:true};previous=await deps.load(existing.id);if(previous.version.versionNumber!==1||previous.version.projectData.template?.metadata?.posterSample!=='one-page.v1')return {templateId:existing.id,existing:true}}
 const [source,types]=await Promise.all([previous?Promise.resolve(previous):deps.load('cd82064c-12e3-4be4-973b-352327f6568b'),deps.types()]),type=types.find(item=>item.id===(pageCount===2?'poster-two-page':'poster-standard'));
 if(!type)throw Object.assign(Error('선택한 벽보형 종류를 먼저 등록해주세요.'),{statusCode:409});
 const project=model.create(source.version.projectData,type),saved=await deps.save({...(existing?{templateId:existing.id}:{}),stableKey:model.STABLE_KEY,name:model.NAME,description:project.template.metadata.description,edition:2027,state:'draft',isStandard:false,productType:'poster',templateKey:'school-basic',saveKind:'manual',saveNote:pageCount===2?'벽보형 2페이지 샘플 · 각 6개월 2열×3행 · 날짜 칸 일정과 기간 색 띠':'벽보형 1페이지 샘플 · 12개월 3열×4행 · 기존 등록 학교 자료와 일정 재사용',schemaVersion:project.version,projectData:project});
 return {templateId:saved.template.id,version:saved.version.versionNumber,pageCount:project.book.pageInstances.length,eventCount:project.book.events.length};
}
