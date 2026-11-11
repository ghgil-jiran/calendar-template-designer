import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/native-print-authoring.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import {listTemplates,getTemplate,saveVersion} from './template-persistence.js';
import {listCalendarTypes} from './calendar-type-persistence.js';
export async function installPosterSample(deps={list:listTemplates,load:getTemplate,save:saveVersion,types:listCalendarTypes}){
 const model=globalThis.ACDLPosterOnePageSample,existing=(await deps.list()).find(item=>item.stableKey===model.STABLE_KEY);
 let previous=null;if(existing){previous=await deps.load(existing.id);if(previous.version.versionNumber!==1||previous.version.projectData.template?.metadata?.posterSample!=='one-page.v1')return {templateId:existing.id,existing:true}}
 const [source,types]=await Promise.all([previous?Promise.resolve(previous):deps.load('cd82064c-12e3-4be4-973b-352327f6568b'),deps.types()]),type=types.find(item=>item.id==='poster-standard');
 if(!type)throw Object.assign(Error('벽보형 1페이지형을 먼저 등록해주세요.'),{statusCode:409});
 const project=model.create(source.version.projectData,type),saved=await deps.save({...(existing?{templateId:existing.id}:{}),stableKey:model.STABLE_KEY,name:model.NAME,description:project.template.metadata.description,edition:2027,state:'draft',isStandard:false,productType:'poster',templateKey:'school-basic',saveKind:'manual',saveNote:'벽보형 1페이지 샘플 · 12개월 3열×4행 · 기존 등록 학교 자료와 일정 재사용',schemaVersion:project.version,projectData:project});
 return {templateId:saved.template.id,version:saved.version.versionNumber,pageCount:1,eventCount:project.book.events.length};
}
