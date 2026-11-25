import {resolveCalendarDisplay,templateCalendarDisplay} from '../materials/calendar-display.ts';
import type {TemplateCard,PhotoAssignment} from '../api/contracts';
import type {ProjectDraft} from '../projects/store';
import {fieldsForProject,photoSlotsForProject,type NativeProject} from '../materials/native-project.ts';
import {createEditorSession} from './session.ts';
export function compatibleTemplate(current:TemplateCard,next:TemplateCard){return (current.calendarKind||'desk')===(next.calendarKind||'desk')&&Math.abs(current.widthMm-next.widthMm)<.01&&Math.abs(current.heightMm-next.heightMm)<.01&&current.period===next.period;}
export function compatibleCatalogTemplates(current:TemplateCard,templates:TemplateCard[],paperPairs: [TemplateCard,TemplateCard][]=[]){
 const pairsById=new Map(paperPairs.flatMap(pair=>pair.map(item=>[item.id,pair] as const)));
 return templates.flatMap(card=>{
  if(compatibleTemplate(current,card))return [card];
  const linked=pairsById.get(card.id)?.find(item=>compatibleTemplate(current,item));
  return linked?[{...linked,coverUrl:linked.coverUrl||card.coverUrl}]:[];
 });
}
export function templateChangeDraft(current:ProjectDraft,next:TemplateCard,source:NativeProject,paperPair?:[TemplateCard,TemplateCard]):ProjectDraft{
 const paperChange=Boolean(paperPair&&current.template.id!==next.id&&paperPair.some(t=>t.id===current.template.id)&&paperPair.some(t=>t.id===next.id));
 if(!current.source||!paperChange&&!compatibleTemplate(current.template,next))throw Error('같은 유형·규격·사용 기간의 템플릿만 변경할 수 있습니다.');
 if(Number(current.source.settings.year)!==Number(source.settings.year)||Number(current.source.settings.startMonth||1)!==Number(source.settings.startMonth||1))throw Error('달력의 연도와 시작 월이 달라 변경할 수 없습니다.');
 const slots=photoSlotsForProject(current.source),common=new Map<string,string>(),photos=new Map(current.photos.map(p=>[p.id,p]));
 for(const slot of slots){const id=current.assignments[slot.id]?.photoId;if(slot.binding?.startsWith('school.profile.')&&id&&photos.has(id))common.set(slot.binding,id);}
 // Only explicit user photo choices are transferred, never embedded sample image URLs.
 if(current.editorState){const session=createEditorSession({project:current.source,state:current.editorState,assets:current.photos.map(p=>({id:p.id,url:p.url}))});for(const edit of current.editorState.edits){const target=session.targets(edit.pageId).find(t=>t.scope===edit.scope&&t.elementId===edit.elementId);if(target?.binding.startsWith('school.profile.')&&edit.photoId&&photos.has(edit.photoId))common.set(target.binding,edit.photoId);}}
 const template={...next,fields:fieldsForProject(source),photoSlots:photoSlotsForProject(source)},assignments:Record<string,PhotoAssignment>={};
 for(const slot of template.photoSlots){const id=(slot.binding&&common.get(slot.binding))||(paperChange?current.assignments[slot.id]?.photoId:undefined),photo=id&&photos.get(id);if(photo)assignments[slot.id]={photoId:photo.id,url:photo.url};}
 const previous=paperChange?current.paperEdits?.[next.id]:undefined;
 const state:ProjectDraft['editorState']={version:1,pageId:source.book.pageInstances[0].id,edits:[],logoMode:current.editorState?.logoMode||'split'};
 if(paperChange){
  const photoIds=new Set(current.photos.map(p=>p.id));
  const restored=previous?.version===next.version&&previous.state;
  const editorState=restored?{...restored,edits:restored.edits.filter(edit=>!edit.photoId||photoIds.has(edit.photoId))}:state;
  return {...current,template,source,assignments,editorState,photoSelections:{},photoPageId:'',
   paperEdits:{...current.paperEdits,[current.template.id]:{version:current.template.version,state:current.editorState}}};
 }
 return {name:`${current.school.values.name?.trim()||'우리 학교'} · ${next.name}`.slice(0,120),template,source,school:{...structuredClone(current.school),calendarDisplay:resolveCalendarDisplay(templateCalendarDisplay(source,next.name),
  {...current.school.calendarDisplay,...(/샘플\s*[EF]\b/i.test(next.name)?{includeLunar:false}:{})})},events:structuredClone(current.events),photos:[...current.photos],assignments,step:'editor',photoMode:'collect',photoSelections:{},editorState:state};
}
