import '../../../../designer-studio/shared-page-object-model.js';
import '../../../../designer-studio/persistence-project.js';
import type {SchoolField, SchoolInput, ScheduleEvent, PhotoSlot, PhotoAssignment} from '@/lib/api/contracts';
// The native authoring document stays opaque except for fields needed by input binding.
// Unknown object properties are always preserved by structuredClone.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NativeProject = Record<string, any>;
const textFields = [
 ['school.name','name','학교명','basic'],['school.englishName','englishName','학교 영문명','basic'],
 ['school.slogan','slogan','학교 슬로건','basic'],['school.address','address','학교 주소','contact'],
 ['school.phone','phone','학교 전화','contact'],['school.academicPhone','academicPhone','교무실 전화','contact'],
 ['school.adminPhone','adminPhone','행정실 전화','contact'],['school.fax','fax','팩스','contact'],['school.website','website','학교 홈페이지','contact'],
 ['school.profile.tree.name','treeName','교목 이름','basic'],['school.profile.flower.name','flowerName','교화 이름','basic'],
 ['school.profile.motto.description','motto','교훈','basic'],['school.profile.tree.description','treeDescription','교목 설명','basic'],
 ['school.profile.flower.description','flowerDescription','교화 설명','basic']
] as const;
export function assertNativeProject(value: unknown): asserts value is NativeProject {
 const p=value as NativeProject;
 if(!p||p.format!=='acdl-project'||!Array.isArray(p.book?.pageInstances)||!p.book.pageInstances.length||p.book.pageInstances.length>100||!p.template?.masters||!p.productType?.pageSize||!p.settings)throw Error('사용할 수 있는 템플릿 원본이 아닙니다.');
 const ids=p.book.pageInstances.map((page:NativeProject)=>page.id);if(new Set(ids).size!==ids.length)throw Error('페이지 식별자가 중복되었습니다.');
}
function requirements(project:NativeProject):NativeProject[]{return project.template.publishing?.dataRequirements||[];}
function requiredFor(project:NativeProject,path:string){return requirements(project).some(r=>(r.path===path||path.startsWith(r.path+'.'))&&['project-create-required','final-submit-required'].includes(r.stage));}
function authoredElements(project:NativeProject):NativeProject[]{return [...Object.values(project.template.masterElements||{}),...Object.values(project.book.elementsByPage||{})].flat() as NativeProject[];}
function normalizeSymbols(project:NativeProject){return (globalThis as unknown as {ACDLPageObjectModel:{normalizeProject:(project:NativeProject)=>NativeProject}}).ACDLPageObjectModel.normalizeProject(project);}
export function fieldsForProject(project:NativeProject):SchoolField[]{
 project=normalizeSymbols(structuredClone(project));
 const bindings=authoredElements(project).filter(e=>e.bindingEnabled!==false).map(e=>String(e.binding||''));
 const fields:SchoolField[]=textFields.filter(([path])=>['school.name','school.englishName','school.address'].includes(path)||bindings.some(b=>b===path||b.startsWith('school.profile.')&&path.startsWith(b+'.')||b==='school.contacts'&&['school.phone','school.fax'].includes(path))||requirements(project).some(r=>r.path===path||path.startsWith(r.path+'.'))).map(([binding,key,label,group])=>({key,binding,label,group,required:key==='address'||group!=='contact'&&requiredFor(project,binding),allowHide:group==='contact'||!requiredFor(project,binding),maxLength:binding.endsWith('description')?3000:200}));
 if(Array.isArray(project.book.school?.contacts)&&bindings.includes('school.contacts')){
  const contacts:SchoolField[]=project.book.school.contacts.flatMap((row:NativeProject,index:number)=>['phone','fax'].filter(key=>row[key]).map(key=>({key:`contact-${index}-${key}`,binding:`school.contacts.${index}.${key}`,label:`${row.label||'학교'} ${key==='fax'?'팩스':'전화'}`,group:'contact' as const,required:false,allowHide:true,maxLength:40})));
  const merged=[...fields.filter(f=>!['phone','fax'].includes(f.key)),...contacts];for(const f of merged)if(['name','englishName'].includes(f.key)&&!bindings.includes(f.binding!))f.hint='입력값은 보관돼요. 이 템플릿에 연결된 글자 개체가 없으면 달력의 글씨는 바뀌지 않아요.';return merged;
 }
 for(const f of fields)if(['name','englishName'].includes(f.key)&&!bindings.includes(f.binding!))f.hint='입력값은 보관돼요. 이 템플릿에 연결된 글자 개체가 없으면 달력의 글씨는 바뀌지 않아요.';
 return fields;
}
function getAt(project:NativeProject,path:string):unknown{return path.split('.').reduce((v,k)=>v?.[k],project.book);}
function setAt(project:NativeProject,path:string,value:unknown){const keys=path.split('.');let target=project.book;for(const k of keys.slice(0,-1)){target[k]||={};target=target[k];}target[keys.at(-1)!]=value;}
export function schoolSamples(project:NativeProject,fields:SchoolField[]):Record<string,string>{return Object.fromEntries(fields.map(f=>[f.key,String(getAt(project,f.binding||`school.${f.key}`)||'')]))}
function imageBinding(e:NativeProject){return e.image?.binding||e.binding||({'school-logo':'school.profile.logo','school-image':'school.profile.building','school-building':'school.profile.building','school-song':'school.profile.song','school-tree':'school.profile.tree','school-flower':'school.profile.flower'} as Record<string,string>)[e.role];}
export function photoPageLabel(page:NativeProject,index=0):string{if(page.label)return page.label;if(page.calendarMonth)return `${page.calendarMonth}월 ${String(page.role).endsWith('front')?'앞면':'뒷면'}`;const role=page.semanticPageRole||page.role;return ({'cover-front':'표지','cover-back':'표지 안쪽','back-cover-front':'뒷표지','back-cover-back':'뒷표지 안쪽','school-symbols':'학교 상징','yearly-calendar':'연력','annual-calendar':'연력'} as Record<string,string>)[role]||`${page.number||index+1}면`;}
export function photoSlotsForProject(project:NativeProject):PhotoSlot[]{
 const result:PhotoSlot[]=[];
 const policy=(globalThis as unknown as {ACDLUserEditingPolicy:{effectivePermissions:(project:NativeProject,page:NativeProject,e:NativeProject)=>Record<string,boolean>}}).ACDLUserEditingPolicy;
 for(const page of project.book.pageInstances){
  let photoNumber=0;
  const locals=project.book.elementsByPage?.[page.id]||[],masters=project.template.masterElements?.[page.masterId]||[];
  for(const [scope,items] of [['master',masters],['page',locals]] as const){for(const e of items){
   const image=['image-frame','image'].includes(e.type)||e.type==='semantic-object'&&['school-logo','school-building','school-song','school-tree','school-flower'].includes(e.role);
   const binding=imageBinding(e);
   const schoolInput=binding?.startsWith('school.profile.')&&!requirements(project).some(r=>r.path===binding&&r.stage==='excluded');
   if(!image||e.visible===false||(!schoolInput&&policy.effectivePermissions(project,page,e).replaceImage!==true))continue;
   if(!binding?.startsWith('school.profile.'))photoNumber++;const id=schoolInput?`school:${binding}`:binding==='calendar.monthlyImages.current'?`${page.id}:${e.id}:monthly`:`${scope}:${scope==='master'?page.masterId:page.id}:${e.id}`;const existing=result.find(s=>s.id===id);if(existing){existing.pageIds||=[existing.pageId];if(!existing.pageIds.includes(page.id))existing.pageIds.push(page.id);continue;}
   result.push({id,pageId:page.id,pageIds:[page.id],pageLabel:schoolInput?'학교 공통':photoPageLabel(page,project.book.pageInstances.indexOf(page)),elementId:e.id,masterId:scope==='master'?page.masterId:undefined,scope,label:e.label||({'school-logo':'교표','school-image':'표지·학교 전경','school-building':'표지·학교 전경','school-song':'교가 악보','school-tree':'교목','school-flower':'교화'} as Record<string,string>)[e.role]||e.alt||`사진 ${photoNumber}`,binding,required:Boolean(binding&&requiredFor(project,binding)),widthMm:Number(e.width||0)/100*Number(project.productType.pageSize.width),heightMm:Number(e.height||0)/100*Number(project.productType.pageSize.height)});
  }}
 }
 // Keep requested school data available even when this particular template has no replaceable frame.
 const common=[['school.profile.logo','교표'],['school.profile.building','표지·학교 전경'],['school.profile.song','교가 이미지'],['school.profile.tree','교목'],['school.profile.flower','교화']];
 for(const [binding,label] of common){const requirement=requirements(project).find(r=>r.path===binding);if(requirement?.stage==='excluded'||result.some(s=>s.binding===binding))continue;if(!requirement&&binding!=='school.profile.building')continue;result.push({id:`school:${binding}`,pageId:project.book.pageInstances[0].id,pageIds:[],pageLabel:'학교 공통',elementId:'',scope:'school',label,binding,required:requiredFor(project,binding),widthMm:0,heightMm:0});}
 return result;
}
export function applyMaterials(source:NativeProject,fields:SchoolField[],school:SchoolInput,events:ScheduleEvent[],assignments:Record<string,PhotoAssignment>,bindingVersion:2|3=3):NativeProject{
 assertNativeProject(source);const project=normalizeSymbols(structuredClone(source));project.mode='calendar-workspace';
 const all=authoredElements(project);
 for(const field of fields){const path=field.binding||`school.${field.key}`,hidden=school.hidden.includes(field.key);if(hidden&&!field.allowHide)throw Error(`${field.label}은 제외할 수 없습니다.`);
  if(hidden){for(const e of all){const binding=e.binding||(bindingVersion===3?e.image?.binding:undefined);if(e.bindingEnabled!==false&&(binding===path||path.startsWith(String(binding||'__')+'.')))e.visible=false;}setAt(project,path,'');}
  else if(school.cleared?.includes(field.key))setAt(project,path,'');
  else if(school.values[field.key]?.trim())setAt(project,path,school.values[field.key].trim());
  else if(school.omitEmptyContacts&&field.group==='contact'){setAt(project,path,'');for(const e of all)if(e.bindingEnabled!==false&&e.binding===path)e.visible=false;}
 }
 for(const key of bindingVersion===3?['tree','flower']:[]){
  const symbolFields=fields.filter(f=>f.binding?.startsWith(`school.profile.${key}.`));
  if(!symbolFields.length||!symbolFields.every(f=>school.hidden.includes(f.key)))continue;
  const path=`school.profile.${key}`,ids=new Set(all.filter(e=>e.bindingEnabled!==false&&(imageBinding(e)===path||e.binding?.startsWith(path+'.'))).map(e=>e.id));
  for(const e of all)if(e.bindingEnabled!==false&&(imageBinding(e)===path||e.binding?.startsWith(path+'.')||ids.has(e.metadata?.parentObjectId)))e.visible=false;
 }
 if(school.calendarDisplay)project.settings.calendarData={...project.settings.calendarData,...school.calendarDisplay};
 if(school.omitEmptyContacts){for(const field of fields.filter(f=>f.binding?.match(/^school\.contacts\.\d+\.phone$/))){const row=project.book.school.contacts?.[Number(field.binding!.split('.')[2])];if(row&&!row.phone)row.value='';}const contacts=project.book.school?.contacts||[];if(!contacts.some((r:NativeProject)=>r.phone||r.value))project.book.school.phone='';if(!contacts.some((r:NativeProject)=>r.fax))project.book.school.fax='';if(!contacts.some((r:NativeProject)=>r.phone||r.value||r.fax)&&!project.book.school.phone&&!project.book.school.fax)for(const e of all)if(e.bindingEnabled!==false&&e.binding==='school.contacts')e.visible=false;}
 if(school.hidden.some(key=>fields.find(f=>f.key===key)?.binding?.startsWith('school.contacts.'))){const contacts=project.book.school.contacts||[];if(!contacts.some((r:NativeProject)=>r.phone||r.value))project.book.school.phone='';if(!contacts.some((r:NativeProject)=>r.fax))project.book.school.fax='';}
 project.book.events=[...(project.book.events||[]).filter((e:NativeProject)=>e.source!=='user'),...events.map(e=>({...e,category:'school',source:'user'}))];
 const slots=photoSlotsForProject(source);
 for(const [slotId,a] of Object.entries(assignments)){const slot=slots.find(s=>s.id===slotId);if(!slot)throw Error('교체할 수 없는 사진 영역입니다.');if(slot.scope==='school'&&slot.binding){setAt(project,slot.binding,{...(getAt(project,slot.binding) as object||{}),image:a.url,src:a.url,assetId:a.photoId});continue;}const list=slot.scope==='master'?project.template.masterElements[slot.masterId!]:project.book.elementsByPage[slot.pageId],e=list.find((item:NativeProject)=>item.id===slot.elementId);if(!e)throw Error('사진 영역을 찾을 수 없습니다.');
  if(slot.binding?.startsWith('school.profile.')){setAt(project,slot.binding,{...(getAt(project,slot.binding) as object||{}),image:a.url,assetId:a.photoId});for(const linked of all){if(linked.bindingEnabled===false||imageBinding(linked)!==slot.binding)continue;if(linked.type==='image')linked.src=a.url;else if(linked.type==='image-frame')linked.image={...linked.image,src:a.url,scale:1,offsetX:0,offsetY:0};}}
  if(slot.binding?.startsWith('calendar.monthlyImages.')){const page=project.book.pageInstances.find((p:NativeProject)=>p.id===slot.pageId),month=slot.binding.endsWith('.current')?page.calendarMonth:Number(slot.binding.split('.').at(-1)),year=page.calendarYear||project.settings.year;project.book.monthlyImages||={};project.book.monthlyImages[`${year}-${String(month).padStart(2,'0')}`]=a.url;}
  if(e.type==='image-frame')e.image={...e.image,src:a.url,scale:1,offsetX:0,offsetY:0};else if(e.type==='semantic-object'&&slot.binding){setAt(project,slot.binding,{...(getAt(project,slot.binding) as object||{}),src:a.url,image:a.url,assetId:a.photoId});e.sampleAssetId=a.photoId;project.template.resources||={};project.template.resources.sampleAssets||=[];project.template.resources.sampleAssets.push({id:a.photoId,name:'사용자 사진',src:a.url,image:a.url,role:e.role});}else e.src=a.url;
 }
 return project;
}
