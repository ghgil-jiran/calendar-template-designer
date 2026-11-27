'use client';
import {SchoolCalendarBrandMark, SchoolCalendarCaption} from '@/components/school-calendar-brand';
import {templateCalendarDisplay,resolveCalendarDisplay} from '@/lib/materials/calendar-display';
import {BindingPreview} from '@/features/materials/binding-preview';
import {SchoolFieldSections} from '@/features/materials/school-field-sections';
import {createSaveQueue} from '@/lib/editor/save-queue';
import {largePreviewUrl} from '@/lib/materials/template-preview';
import {normalizeSchoolVisibility} from '@/lib/api/school-visibility';
import {updateSchoolField,stageSchoolImages} from '@/lib/editor/materials';
import {compatibleCatalogTemplates,compatibleTemplate,templateChangeDraft} from '@/lib/editor/template-change';
import {requestProductionReceipt} from '@/lib/projects/production-receipt';
import {PhotoEditor} from '@/features/editor/photo-editor';
import {applyEditor,type EditorState} from '@/lib/editor/session';

import {useEffect, useMemo, useRef, useState} from 'react';
import type {CatalogResponse, SchoolInput, TemplateCard, ScheduleEvent, PhotoAssignment,PhotoInputMode,PhotoSelections} from '@/lib/api/contracts';
import {emptySchoolInput, validateSchoolInput} from '@/lib/api/school-input';
import {Button} from '@/components/ui/button';
import {Panel} from '@/components/ui/panel';
import {TextField} from '@/components/ui/text-field';

import {ScheduleInput} from '@/features/materials/schedule-input';
import {PhotoInput,type PhotoFile} from '@/features/materials/photo-input';
import {fetchTemplateSource} from '@/lib/materials/template-source';
import {NativePreview} from '@/features/materials/native-preview';
import {applyMaterials,assertNativeProject,photoSlotsForProject,photoPageLabel,fieldsForProject,schoolSamples,type NativeProject} from '@/lib/materials/native-project';

import {ProjectLibrary} from '@/features/projects/project-library';
import {SavePanel} from '@/features/projects/save-panel';
import {prepareSnapshot,writeSnapshot,deleteLocalProject,readSnapshot,hydrateSnapshot,type ProjectDraft,type ResumeStep} from '@/lib/projects/store';

import {draftSignature} from '@/lib/projects/signature';

const heroPhotos = [
  {src: '/images/hero/sample-a-2027.webp', name: '플라워 사진형'},
  {src: '/images/hero/sample-b-2027.webp', name: '사계절 산수 사진형'},
  {src: '/images/hero/sample-c-2027.webp', name: '사계절 일러스트형'},
  {src: '/images/hero/sample-d-2027.webp', name: '학교 전경 표지 프레임형'},
];

type Step = 'editor' | 'schedule' | 'photos' | 'catalog' | 'guide' | 'school' | 'input-review' | 'projects';

export function Onboarding() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [request, setRequest] = useState(0);
  const [step, setStep] = useState<Step>('catalog');
  const [workingTemplate,setWorkingTemplate]=useState<TemplateCard|null>(null);
  const [activeProject,setActiveProject]=useState<{id:string;revision:number}|null>(null);
  const [projectName,setProjectName]=useState('');
  const [savedSignature,setSavedSignature]=useState('');
  const [saving,setSaving]=useState(false);
  const [navigationPaused,setNavigationPaused]=useState(false);
  const saveQueue=useRef(createSaveQueue());
  const saveLock=useRef(false),autoFailedSignature=useRef('');
  const [saveNotice,setSaveNotice]=useState('');
  const [saveError,setSaveError]=useState('');
  const [libraryVersion,setLibraryVersion]=useState(0);
  const templateUrls=useRef<string[]>([]);
  const resumeStep=useRef<ResumeStep>('school');
  useEffect(()=>()=>templateUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInput>({values: {}, hidden: []});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visiblePreview,setVisiblePreview]=useState<CatalogPreviewPage|null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewSource,setPreviewSource]=useState<NativeProject|null>(null);
  const [previewSourceFailed,setPreviewSourceFailed]=useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCard|null>(null);
  const [kindFilter,setKindFilter]=useState<'all'|'desk'|'poster'>('desk');
  const [editorState,setEditorState]=useState<EditorState|undefined>();
  const [events,setEvents]=useState<ScheduleEvent[]>([]);
  const [photos,setPhotos]=useState<PhotoFile[]>([]);
  const [photoPageId,setPhotoPageId]=useState('');
  const [photoSelections,setPhotoSelections]=useState<PhotoSelections>({});
  const [photoMode,setPhotoMode]=useState<PhotoInputMode>('collect');
  const [assignments,setAssignments]=useState<Record<string,PhotoAssignment>>({});
  const [nativeSource,setNativeSource]=useState<NativeProject|null>(null);
  const [nativeLoading,setNativeLoading]=useState(false);
  const [nativeFailure,setNativeFailure]=useState('');
  const [,setMaterialPage]=useState(0);
  const photosRef=useRef(photos);photosRef.current=photos;
  const selectionRequest=useRef(0);
  useEffect(()=>()=>photosRef.current.forEach(p=>URL.revokeObjectURL(p.url)),[]);
  const [playing, setPlaying] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroHover, setHeroHover] = useState(false);
  const heroPhoto = heroPhotos[heroIndex];
  const temporary=useRef<{id:string;revision:number;signature:string}|null>(null);
  const previewRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const [paperEdits,setPaperEdits]=useState<ProjectDraft['paperEdits']>();
  const selected = workingTemplate || catalog?.templates.find(template => template.id === selectedId) || null;
  if(['school','schedule','photos','input-review','editor'].includes(step))resumeStep.current=step as ResumeStep;
  const displayName=projectName.trim()||(school.values.name?.trim()?school.values.name.trim()+' 달력':selected?.name||'우리 학교 달력');
  const draft:ProjectDraft|null=selected?{id:activeProject?.id,revision:activeProject?.revision,name:displayName,template:selected,source:nativeSource,editorState,paperEdits,school,events,photos,assignments,photoMode,photoPageId,photoSelections,step:resumeStep.current}:null;
  const draftLatest=useRef(draft),activeLatest=useRef(activeProject);draftLatest.current=draft;activeLatest.current=activeProject;
  const currentSignature=draft?draftSignature(draft):'';
  const dirty=Boolean(draft)&&currentSignature!==savedSignature;
  const hasInput=Boolean(activeProject)||photos.length>0||events.length>0||Object.values(school.values).some(v=>v.trim());
  useEffect(()=>{if(!dirty||!hasInput)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,hasInput]);
  const appLoading=loading&&step==='catalog',appFailure=failure&&step==='catalog';

  const materialProject=useMemo(()=>{if(!nativeSource||!selected)return null;return applyMaterials(nativeSource,selected.fields,school,events,assignments);},[nativeSource,selected,school,events,assignments]);

  const editedProject=useMemo(()=>materialProject&&editorState?applyEditor(materialProject,editorState,photos.map(p=>({id:p.id,url:p.url}))):materialProject,[materialProject,editorState,photos]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFailure('');
    fetch('/api/workspace/catalog', {signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error('catalog unavailable');
        const result = await response.json() as CatalogResponse;
        if (!['review','published'].includes(result.mode) || !Array.isArray(result.templates)) throw new Error('invalid catalog');
        setCatalog(result);
      })
      .catch(error => {if (error.name !== 'AbortError') setFailure('디자인 목록을 불러오지 못했어요. 다시 시도해 주세요.');})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    if (started.current) {headingRef.current?.focus(); window.scrollTo({top: 0, behavior: 'instant'});}
    started.current = true;
  }, [step, photoMode]);

  useEffect(() => {
    const dialog = previewRef.current;
    if (previewTemplate && dialog && !dialog.open) dialog.showModal();
    if (!previewTemplate && dialog?.open) dialog.close();
  }, [previewTemplate]);
  useEffect(()=>{
    if(!previewTemplate?.sourceUrl)return;
    let active=true;
    void fetchTemplateSource(previewTemplate).then(source=>{if(active)setPreviewSource(source);}).catch(()=>{if(active)setPreviewSourceFailed(true);});
    return ()=>{active=false;};
  },[previewTemplate]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {if (media.matches) setPlaying(false);};
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!playing || heroHover || step !== 'catalog' || heroPhotos.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroIndex(index => (index + 1) % heroPhotos.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [playing, heroHover, step]);

  async function choose(template: TemplateCard) {
    if(saving||nativeLoading)return;
    if(selectedId!==template.id&&dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 다른 디자인으로 이동할까요?'))return;
    const requestId=++selectionRequest.current;
    if(selectedId!==template.id){
      templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=[];setActiveProject(null);setSavedSignature('');setProjectName(template.name);setSaveNotice('');setSaveError('');resumeStep.current='editor';
      photos.forEach(p=>URL.revokeObjectURL(p.url));setSchool(emptySchoolInput(template.fields));setErrors({});setEditorState(undefined);setPaperEdits(undefined);setEvents([]);setPhotos([]);setAssignments({});setPhotoMode('collect');setPhotoSelections({});setPhotoPageId('');setMaterialPage(0);setNativeSource(null);
    }
    setWorkingTemplate(template);setSelectedId(template.id);setNativeFailure('');
    if(!template.sourceUrl){setNativeFailure('편집용 템플릿을 아직 준비 중이에요.');return;}
    setNativeLoading(true);
    try{const project=(previewTemplate?.id===template.id?previewSource:null)||await fetchTemplateSource(template);if(requestId!==selectionRequest.current)return;setPreviewTemplate(null);setStep('editor');setNativeSource(project);setWorkingTemplate(current=>current?.id===template.id?{...current,fields:fieldsForProject(project),photoSlots:photoSlotsForProject(project)}:current);setSchool(current=>({...current,values:{...schoolSamples(project,fieldsForProject(project)),...Object.fromEntries(Object.entries(current.values).filter(([,v])=>v.trim()))},omitEmptyContacts:false,calendarDisplay:resolveCalendarDisplay(templateCalendarDisplay(project),current.calendarDisplay)}));}
    catch(error){if(requestId===selectionRequest.current)setNativeFailure(error instanceof Error?error.message:'템플릿을 불러오지 못했습니다.');}
    finally{if(requestId===selectionRequest.current)setNativeLoading(false);}
  }
  function catalogHome() {
    if(saving)return;
    if(dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 디자인 목록으로 이동할까요?'))return;
    resetToCatalog();
  }
  function resetToCatalog(){
    photos.forEach(p=>URL.revokeObjectURL(p.url));templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=[];
    ++selectionRequest.current;setNativeLoading(false);setNativeFailure('');setPreviewTemplate(null);setWorkingTemplate(null);setSelectedId(null);setActiveProject(null);setSavedSignature('');setProjectName('');setSchool({values:{},hidden:[]});setEditorState(undefined);setPaperEdits(undefined);setEvents([]);setPhotos([]);setAssignments({});setPhotoMode('collect');setPhotoSelections({});setPhotoPageId('');setNativeSource(null);setSaveNotice('');setSaveError('');setStep('catalog');
  }
  async function clearTemporary(){
    const draft=temporary.current;
    temporary.current=null;
    try{sessionStorage.removeItem('calendar-editor-draft');}catch{}
    if(draft)await deleteLocalProject(draft.id).catch(()=>{});
  }
  async function leaveEditor(destination:'catalog'|'projects',save:boolean,name?:string){
    if(save&&!await saveWorking('editor',{name:name||draftLatest.current?.name||displayName}))return false;
    await clearTemporary();
    resetToCatalog();
    setStep(destination);
    return true;
  }
  async function saveWorking(nextStep?:ResumeStep,overrides:Partial<ProjectDraft>={},propagateFailure=false,temporaryOnly=false){
    return saveQueue.current(async()=>{const latest=draftLatest.current;if(!latest)return false;saveLock.current=true;const target=temporaryOnly?temporary.current:activeLatest.current;const captured=structuredClone({...latest,...overrides,id:target?.id,revision:target?.revision,step:nextStep||latest.step,photos:[]}) as ProjectDraft;captured.photos=[...(overrides.photos||latest.photos)];const signature=draftSignature(captured);setSaving(true);setSaveError('');setSaveNotice('');
    try{const snapshot=await prepareSnapshot(captured),pinned=hydrateSnapshot(snapshot);let record;try{record=await writeSnapshot(snapshot,target?.revision??null,temporaryOnly);}catch(error){pinned.urls.forEach(URL.revokeObjectURL);throw error;}// Subsequent edits reuse the durable image bytes just saved, not expiring URLs.
    templateUrls.current.forEach(URL.revokeObjectURL);templateUrls.current=pinned.urls;setNativeSource(pinned.source);setWorkingTemplate(pinned.template);
    if(temporaryOnly){temporary.current={id:record.id,revision:record.revision,signature};
      try{sessionStorage.setItem('calendar-editor-draft',JSON.stringify({id:record.id,saved:activeLatest.current}));}catch{}
      autoFailedSignature.current='';return true;}
    await clearTemporary();
    activeLatest.current={id:record.id,revision:record.revision};setActiveProject(activeLatest.current);autoFailedSignature.current='';setSavedSignature(signature);setProjectName(record.name);setSaveNotice(captured.photos.length?'사진 원본을 서버에 보관하고 이 브라우저에 편집 내용을 저장했어요.':'이 브라우저에 편집 내용을 저장했어요.');setLibraryVersion(v=>v+1);void navigator.storage?.persist?.().catch(()=>false);return true;}
    catch(error){autoFailedSignature.current=signature;setSaveError(error instanceof Error?error.message:'저장하지 못했어요. 입력 내용은 그대로 유지됩니다.');if(propagateFailure)throw error;return false;}finally{saveLock.current=false;setSaving(false);}});
  }
  async function orderProject(save:boolean,name?:string){
    if(!save||!await saveWorking('editor',{name:name||displayName},true))return false;
    const projectId=activeLatest.current?.id;
    if(!projectId)throw Error('저장한 프로젝트를 찾지 못했어요.');
    await requestProductionReceipt(projectId);
    return leaveEditor('projects',false);
  }
  async function changeTemplate(template:TemplateCard,save:boolean,name?:string){
    const current=draftLatest.current;
    if(!current||!compatibleTemplate(current.template,template))throw Error('변경할 수 없는 템플릿입니다.');
    const source=await fetchTemplateSource(template);
    const next=templateChangeDraft(current,template,source);
    if(save&&!await saveWorking('editor',{name:name||current.name}))throw Error('기존 작업을 저장하지 못했습니다. 다시 시도해 주세요.');
    await clearTemporary();
    activeLatest.current=null;
    setActiveProject(null);
    setWorkingTemplate(next.template);setSelectedId(template.id);setProjectName(next.name);setNativeSource(source);
    setSchool(next.school);setEvents(next.events);setPhotos(next.photos);setAssignments(next.assignments);
    setEditorState(next.editorState);setPaperEdits(undefined);setPhotoSelections({});setPhotoMode('collect');setPhotoPageId('');
    setSavedSignature('');setSaveError('');setStep('editor');
  }
  const autoSaveLatest=useRef<()=>Promise<boolean>>(async()=>false);autoSaveLatest.current=()=>saveWorking(undefined,{},false,true);
  useEffect(()=>{
    if(navigationPaused||(step!=='editor'&&step!=='photos')||!dirty||saving||!nativeSource||(autoFailedSignature.current===currentSignature||temporary.current?.signature===currentSignature))return;
    const timer=window.setTimeout(()=>{void autoSaveLatest.current();},800);
    return()=>window.clearTimeout(timer);
  },[step,dirty,currentSignature,saving,nativeSource,navigationPaused]);
  async function openWorking(id:string,recovery?:{saved:{id:string;revision:number}|null}){
    if(!recovery&&dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 선택한 프로젝트를 열까요?'))return;
    const snapshot=await readSnapshot(id),restored=hydrateSnapshot(snapshot),r=restored.record;if(restored.source)restored.template={...restored.template,fields:fieldsForProject(restored.source),photoSlots:photoSlotsForProject(restored.source)};
    photos.forEach(p=>URL.revokeObjectURL(p.url));templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=restored.urls;
    ++selectionRequest.current;setWorkingTemplate(restored.template);setSelectedId(restored.template.id);setActiveProject(recovery?recovery.saved:{id:r.id,revision:r.revision});setProjectName(r.name);setSchool(normalizeSchoolVisibility(restored.template.fields,r.school));setEditorState(r.editorState);setPaperEdits(r.paperEdits);setEvents(r.events);setPhotos(restored.photos);setAssignments(restored.assignments);setPhotoMode(r.photoMode||'assign');setPhotoSelections(restored.photoSelections);setPhotoPageId(r.photoPageId||'');setNativeSource(restored.source);setNativeLoading(false);setNativeFailure('');setErrors({});setMaterialPage(0);setSaveError('');setSaveNotice('저장한 프로젝트를 다시 열었어요.');resumeStep.current=r.step;
    const state:ProjectDraft={id:r.id,revision:r.revision,name:r.name,template:restored.template,source:restored.source,editorState:r.editorState,paperEdits:r.paperEdits,school:normalizeSchoolVisibility(restored.template.fields,r.school),events:r.events,photos:restored.photos,assignments:restored.assignments,photoMode:r.photoMode||'assign',photoPageId:r.photoPageId||'',photoSelections:restored.photoSelections,step:r.step};
    if(recovery){temporary.current={id:r.id,revision:r.revision,signature:draftSignature(state)};setSavedSignature('');}
    else setSavedSignature(draftSignature(state));
    setStep(['school','schedule','photos','input-review'].includes(r.step)?'editor':r.step);setPhotoMode('collect');
  }
  const restoreDraft=useRef(openWorking);
  useEffect(()=>{
    try{
      const stored=sessionStorage.getItem('calendar-editor-draft');
      if(!stored)return;
      const recovery=JSON.parse(stored) as {id:string;saved:{id:string;revision:number}|null};
      void restoreDraft.current(recovery.id,recovery).catch(()=>{
        if(sessionStorage.getItem('calendar-editor-draft')===stored)sessionStorage.removeItem('calendar-editor-draft');
      });
    }catch{}
  },[]);
  function openPreview(template: TemplateCard,index=0) {if(nativeLoading)return;setNativeFailure('');setVisiblePreview(null);setPreviewIndex(Math.max(0,index));setPreviewSource(null);setPreviewSourceFailed(false);setPreviewTemplate(template);}
  function continueSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const issues = validateSchoolInput(selected.fields, school);
    setErrors(issues);
    if (Object.keys(issues).length) {
      window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
    } else setStep('schedule');
  }
  const heading = (eyebrow: string, title: string, description: string) => <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p className="muted">{description}</p></div>;

  const previewPage=previewTemplate?.pages[previewIndex];
  const previewPageId=previewSource?.book.pageInstances[previewIndex]?.id;
  // Poster previews wait for the edited page so a stored image cannot flash first.
  const waitingForPoster=previewTemplate?.calendarKind==='poster'&&previewTemplate.sourceUrl&&!previewSource&&!previewSourceFailed;
  const requestedPreview=previewTemplate&&!waitingForPoster?{
    key:JSON.stringify([previewTemplate.id,previewIndex,previewPageId]),
    index:previewIndex,
    project:previewSource,
    pageId:previewPageId,
    url:(previewPage&&largePreviewUrl(previewPage))||(!previewIndex?previewTemplate.coverUrl:null),
    label:previewPage?.label||'페이지',
  }:null;
  const displayedIndex=visiblePreview?.index??previewIndex;
  const previewLayers=[visiblePreview,requestedPreview?.key===visiblePreview?.key?null:requestedPreview];
  if(step==='editor'&&materialProject)return <PhotoEditor onOrder={orderProject} calendarDefaults={templateCalendarDisplay(nativeSource)} key={selected!.id} paperOptions={catalog?.paperPairs?.find(pair=>pair.some(item=>item.id===selected!.id))} onTemplateChange={changeTemplate} templateName={selected!.name} templates={compatibleCatalogTemplates(selected!,catalog?.templates||[],catalog?.paperPairs)} currentTemplateId={selected!.id} onNavigationPause={setNavigationPaused} onHome={(save,name)=>leaveEditor('catalog',save,name)} commonPhotoIds={Object.fromEntries((nativeSource?photoSlotsForProject(nativeSource):[]).flatMap(slot=>assignments[slot.id]?[[slot.binding||'',assignments[slot.id].photoId]]:[]))} assignedPhotoIds={Object.values(assignments).map(a=>a.photoId)} project={materialProject} photos={photos} onPhotos={next=>{setPhotos(next);setAssignments(current=>Object.fromEntries(Object.entries(current).filter(([,a])=>next.some(p=>p.id===a.photoId))));setEditorState(current=>current?{...current,edits:current.edits.filter(e=>!e.photoId||next.some(p=>p.id===e.photoId))}:current);}} initialState={editorState} onChange={setEditorState} saveFailure={saveError} onProjects={(save,name)=>leaveEditor('projects',save,name)} name={displayName} saving={saving} onSave={()=>saveWorking(undefined,{},false,true)} school={school} events={events} fields={selected!.fields} onFieldChange={(key,value)=>setSchool(p=>updateSchoolField(p,key,value))} onFieldHide={(key,hidden)=>setSchool(p=>({...p,hidden:hidden?[...new Set([...p.hidden,key])]:p.hidden.filter(k=>k!==key)}))} onSchoolPhoto={(binding,photo)=>{const slots=photoSlotsForProject(nativeSource!).filter(s=>s.binding===binding);setAssignments(p=>({...p,...Object.fromEntries(slots.map(s=>[s.id,{photoId:photo.id,url:photo.url}]))}));}} onMaterialsSave={async(nextSchool,nextEvents,images=[])=>{const staged=stageSchoolImages(photos,assignments,photoSlotsForProject(nativeSource!),editorState,images);const nextPhotos=staged.photos,nextAssignments=staged.assignments,nextEditor=staged.editorState;if(!await saveWorking('editor',{school:nextSchool,events:nextEvents,photos:nextPhotos,assignments:nextAssignments,editorState:nextEditor},true,true))return false;setSchool(nextSchool);setEvents(nextEvents);setPhotos(nextPhotos);setAssignments(nextAssignments);setEditorState(nextEditor);return true;}}/>;
  return <div className="workspace">
    <header className="site-header"><div className="header-inner"><Button variant="quiet" className="brand" onClick={catalogHome} aria-label="우리학교달력 BETA 첫 화면으로 이동"><SchoolCalendarBrandMark/></Button><SchoolCalendarCaption showInvitation/><div className="site-header-actions">{step==='projects'?<><a className="button button-secondary" href="https://schoolp.co.kr/" target="_blank" rel="noopener noreferrer">우리학교인쇄</a><a className="button button-secondary" href="https://schoolp.co.kr/me/cart/" target="_blank" rel="noopener noreferrer">장바구니</a></>:<Button disabled={saving||nativeLoading} onClick={() => setStep('projects')}>내 프로젝트</Button>}</div></div></header>
    <main className={`main ${step==='catalog'?'catalog-main':step==='projects'?'projects-main':''}`} data-motion={playing ? 'playing' : 'paused'}>
      {selected&&['school','schedule','photos','input-review','editor'].includes(step)&&<SavePanel name={projectName} onName={setProjectName} dirty={dirty} saved={Boolean(activeProject)} busy={saving||nativeLoading} notice={dirty&&activeProject?'저장하지 않은 변경사항이 있어요.':saveNotice} error={saveError} onSave={()=>void saveWorking()}/>}
      {appLoading && <Panel className="state-panel"><h1>디자인을 준비하고 있어요</h1><p className="muted" role="status">잠시만 기다려 주세요.</p></Panel>}
      {appFailure && <Panel className="state-panel"><h1>목록을 다시 불러올게요</h1><p role="alert">{failure}</p><Button variant="primary" onClick={() => setRequest(value => value + 1)}>다시 시도하기</Button></Panel>}
      {!appLoading && !appFailure && catalog && step === 'catalog' && <>
        <section className="hero catalog-hero"><div><span className="badge">2027학년도 · 우리 학교 맞춤 달력</span><h1 ref={headingRef} tabIndex={-1}>디자인은 골라주세요.<br /><em>우리 학교 달력</em>으로<br />완성해 드려요.</h1><p className="muted hero-copy">학교 정보와 학사일정, 사진을 넣으면 돼요.<br />완성된 페이지를 확인하고 주문하세요.</p><ol className="journey"><li><span>1</span>디자인 선택</li><li><span>2</span>학교 자료 입력</li><li><span>3</span>확인 후 주문</li></ol></div>
          <div className="hero-showcase hero-photo" tabIndex={0} aria-label="달력 디자인 미리보기" onMouseEnter={() => setHeroHover(true)} onMouseLeave={() => setHeroHover(false)} onFocusCapture={() => setHeroHover(true)} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setHeroHover(false);}}>
            <div className="hero-art" key={heroPhoto.src}><img src={heroPhoto.src} alt={`${heroPhoto.name} · 책상 위 탁상달력 연출 이미지`} width={1374} height={1145} fetchPriority="high" /></div>
          </div>
        </section>
        <section aria-labelledby="catalog-title"><div className="catalog-heading"><div><h2 id="catalog-title">마음에 드는 디자인을 골라보세요</h2><p className="muted">탁상형·벽보형 달력의 전체 구성을 먼저 살펴볼 수 있어요.</p></div><span className="badge">{catalog.templates.length}종 {catalog.mode==='review'?'선택 구성 검토':'템플릿'}</span></div>
          {!catalog.templates.length ? <Panel><h3>공개된 디자인을 준비 중이에요</h3><p className="muted">준비가 끝나면 이곳에서 고를 수 있어요.</p></Panel> : <><div className="catalog-filters" role="group" aria-label="달력 유형">{([["desk","탁상형 달력"],["poster","벽보형 달력"],["all","전체 달력"]] as const).map(([key,label])=><Button key={key} aria-pressed={kindFilter===key} onClick={()=>setKindFilter(key)}>{label}</Button>)}</div>{!catalog.templates.some(t=>kindFilter==='all'||(t.calendarKind||'desk')===kindFilter)&&<Panel>선택한 유형의 디자인을 준비 중이에요.</Panel>}<div className="catalog-grid">{catalog.templates.filter(t=>kindFilter==='all'||(t.calendarKind||'desk')===kindFilter).map(template => <article className="template-card" key={template.id}>
            <TemplateCardArtwork key={template.version} template={template} onPreview={number=>openPreview(template,template.pages.findIndex(page=>page.number===number))}/>
            <div className="template-copy">
              <h3>{template.name}</h3>
              <p className="muted">{template.calendarKind==='poster'?'벽보형':'탁상형'} · {template.widthMm} × {template.heightMm} mm · {template.pageCount}면{template.period&&` · ${template.period}`}</p>
              <div className="card-actions">
                <Button disabled={!template.pages.length} onClick={()=>openPreview(template)}>미리 보기</Button>
                <Button variant="primary" disabled={saving||nativeLoading||!template.sourceUrl} onClick={()=>void choose(template)}>이 템플릿으로 만들기</Button>
              </div>
              {selectedId===template.id&&!previewTemplate&&nativeLoading&&<p role="status">템플릿을 불러오고 있어요.</p>}
              {selectedId===template.id&&!previewTemplate&&nativeFailure&&<p role="alert">{nativeFailure}</p>}
            </div>
          </article>)}</div></>}
        </section>
        <section className="before-start"><div><h3>자료는 디자인을 고른 뒤 준비해도 괜찮아요.</h3><p className="muted">선택한 디자인에 필요한 자료를 안내해 드려요.</p></div><div><h3>만들던 달력이 있나요?</h3><Button variant="quiet" disabled={saving||nativeLoading} onClick={() => setStep('projects')}>내 프로젝트에서 이어하기 →</Button></div></section>
      </>}

      {!appLoading && !appFailure && selected && step === 'school' && <>
        <Progress /><MaterialStage active={1}/>{heading('우리 학교 기본 정보', '달력에 표시되는 학교 정보를 입력해 주세요.', '선택 정보를 달력에 표시하지 않을 경우 체크해 주세요.')}
        <form onSubmit={continueSchool} noValidate>
          <Panel className="form-section"><SchoolFieldSections fields={selected.fields} school={school} errors={errors} onChange={(key,value)=>{setSchool(current=>updateSchoolField(current,key,value));setErrors(current=>({...current,[key]:''}));}} onHide={(key,hidden)=>{setSchool(current=>({...current,hidden:hidden?[...new Set([...current.hidden,key])]:current.hidden.filter(k=>k!==key)}));setErrors(current=>({...current,[key]:''}));}}/></Panel>
          {Object.values(errors).some(Boolean) && <p className="field-error" role="alert">입력이 필요한 항목을 확인해 주세요.</p>}
          <div className="actions"><Button onClick={() => setStep('catalog')}>← 디자인 보기</Button><Button type="submit" variant="primary">학사일정 입력하기 →</Button></div>
        </form>
      </>}

      {!appLoading && !appFailure && selected && step==='schedule'&&<>
        <Progress/><MaterialStage active={2}/>{heading('학교 학사일정','학사일정을 한 번에 넣어 주세요','파일을 선택하거나 일정 내용을 복사해서 붙여 넣어 주세요.')}
        <ScheduleInput calendarDefaults={templateCalendarDisplay(nativeSource)} calendarDisplay={school.calendarDisplay} onCalendarDisplay={value=>setSchool(current=>({...current,calendarDisplay:value}))} year={Number(nativeSource?.settings.year||2027)} startMonth={Number(nativeSource?.settings.startMonth||3)} events={events} onChange={setEvents} required={Boolean(nativeSource?.template.publishing?.dataRequirements?.some((r:NativeProject)=>r.path==='calendar.events'&&['project-create-required','final-submit-required'].includes(r.stage)))} onBack={()=>setStep('school')} onNext={()=>{setPhotoMode('collect');setStep('photos');}}/>
      </>}
      {!appLoading && !appFailure && selected && step==='photos'&&<>
        <Progress/><MaterialStage active={3}/>
        <PhotoInput stage='prepare' onStageChange={stage=>setPhotoMode(stage==='prepare'?'collect':'assign')} usedPhotoIds={editorState?.edits.flatMap(e=>e.photoId?[e.photoId]:[])} template={selected} project={editedProject} pages={nativeSource?.book.pageInstances.map((p:NativeProject,i:number)=>({id:p.id,label:photoPageLabel(p,i)}))||[]} pageId={photoPageId} onPageId={setPhotoPageId} selections={photoSelections} onSelections={setPhotoSelections} photos={photos} onPhotos={next=>{setPhotos(next);setEditorState(current=>current?{...current,edits:current.edits.filter(e=>!e.photoId||next.some(p=>p.id===e.photoId))}:current);}} slots={nativeSource?photoSlotsForProject(nativeSource):selected.photoSlots||[]} assignments={assignments} onAssignments={next=>{if(nativeSource){const changed=photoSlotsForProject(nativeSource).filter(slot=>assignments[slot.id]?.photoId!==next[slot.id]?.photoId);setEditorState(current=>current?{...current,edits:current.edits.filter(edit=>!changed.some(slot=>slot.elementId===edit.elementId&&slot.scope===edit.scope&&(slot.pageIds||[slot.pageId]).includes(edit.pageId)))}:current);}setAssignments(next);}} minimumDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.orderMinimumDpi||200} recommendedDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.recommendedDpi||300} onBack={()=>setStep('schedule')} onNext={()=>setStep('editor')}/>
      </>}
      {step === 'projects' && <>
        <div className="project-page-heading">
          <h1 ref={headingRef} tabIndex={-1}>내 프로젝트</h1>
          <Button variant="primary" onClick={catalogHome}>새 달력 만들기</Button>
        </div>
        <ProjectLibrary onDeleted={id=>{if(activeProject?.id===id){setActiveProject(null);setSavedSignature('');setSaveNotice('저장본을 삭제했어요. 열어 둔 입력 내용은 새 프로젝트로 저장할 수 있어요.');}}} onOpen={openWorking} refresh={libraryVersion}/>
      </>}
    </main>
    {step==='catalog' ? <SchoolPrintFooter /> :
      <footer className="site-footer"><span>학교 자료만 준비하세요. 디자인은 이미 완성되어 있어요.</span><span>개발 검토용 · 실제 주문 서비스 아님</span></footer>}

    <dialog ref={previewRef} className="preview-dialog" onCancel={()=>setPreviewTemplate(null)} onClose={()=>setPreviewTemplate(null)} aria-labelledby="preview-title" onKeyDown={event=>{
      if(!previewTemplate)return;
      if(event.key==='ArrowRight')setPreviewIndex(index=>Math.min(previewTemplate.pages.length-1,index+1));
      if(event.key==='ArrowLeft')setPreviewIndex(index=>Math.max(0,index-1));
    }}>
      {previewTemplate&&<>
        <div className="preview-header">
          <div><h2 id="preview-title">{previewTemplate.name} · {previewTemplate.pages[displayedIndex]?.label}</h2></div>
          <Button onClick={()=>setPreviewTemplate(null)}>닫기 ×</Button>
        </div>
        <div className="template-preview-with-binding" ref={node=>{if(node){const ratio=previewTemplate.widthMm/previewTemplate.heightMm;node.style.aspectRatio=String(ratio);node.style.width=`min(100%, calc(62dvh * ${ratio}))`;}}}>
          {previewLayers.map(page=>page&&<CatalogPreviewLayer key={page.key} page={page} template={previewTemplate}
            pending={page.key!==visiblePreview?.key} onReady={()=>setVisiblePreview(page)}/>)}
          {!visiblePreview&&<p className="catalog-preview-loading" role="status">미리보기를 준비하고 있어요.</p>}
        </div>
        <div className="preview-controls">
          <Button disabled={previewIndex===0} onClick={()=>setPreviewIndex(index=>index-1)}>← 이전 면</Button>
          <span aria-live="polite">{displayedIndex+1} / {previewTemplate.pageCount}</span>
          <Button disabled={previewIndex===previewTemplate.pages.length-1} onClick={()=>setPreviewIndex(index=>index+1)}>다음 면 →</Button>
        </div>
        <div className="catalog-preview-actions">
          <Button variant="primary" disabled={saving||nativeLoading||!previewTemplate.sourceUrl} onClick={()=>void choose(previewTemplate)}>이 템플릿으로 만들기</Button>
          {nativeLoading&&<p role="status">템플릿을 불러오고 있어요.</p>}
          {selectedId===previewTemplate.id&&nativeFailure&&<p role="alert">{nativeFailure}</p>}
        </div>
      </>}
    </dialog>
  </div>;
}

type CatalogPreviewPage={
  key:string;
  index:number;
  project:NativeProject|null;
  pageId?:string;
  url?:string|null;
  label:string;
};

function CatalogPreviewLayer({page,template,pending,onReady}:{page:CatalogPreviewPage;template:TemplateCard;pending:boolean;onReady:()=>void}) {
  const native=Boolean(page.project&&page.pageId);
  useEffect(()=>{
    if(pending&&!native&&!page.url)onReady();
  },[pending,native,page.url,onReady]);
  return <div className={`catalog-preview-layer${pending?' is-pending':''}`} inert={pending} aria-hidden={pending||undefined}>
    {page.project&&page.pageId
      ? <NativePreview project={page.project} pageId={page.pageId} onReady={onReady}/>
      : <PreviewImage className="preview-image" url={page.url} label={page.label} eager onReady={onReady}/>}
    {!native&&page.url&&<BindingPreview width={template.widthMm} height={template.heightMm} enabled={template.calendarKind!=='poster'}/>}
  </div>;
}

function Progress({active=2}:{active?:2|3}) {return <ol className="journey progress" aria-label="달력 제작 과정"><li className="progress-complete"><span aria-label="완료">✓</span>디자인 선택</li><li className={active===3?'progress-complete':undefined} aria-current={active===2?'step':undefined}><span aria-label={active===3?'완료':undefined}>{active===3?'✓':'2'}</span>학교 자료 입력</li><li aria-current={active===3?'step':undefined}><span>3</span>달력 편집</li></ol>;}
function PreviewImage({url, label, className = '', decorative = false, eager = false, onReady}: {url?: string | null; label: string; className?: string; decorative?: boolean; eager?: boolean; onReady?:()=>void}) {
  return url ? <img className={className} src={url} alt={decorative ? '' : `${label} 미리보기`} loading={eager?'eager':'lazy'} onLoad={onReady?event=>{
    const image=event.currentTarget;
    void image.decode().catch(()=>{}).then(()=>{if(image.isConnected)onReady();});
  }:undefined} onError={onReady}/> : <div className={`preview-placeholder ${className}`} role="img" aria-label={`${label}: 이미지 연결 대기`}><strong>{label}</strong><span>미리보기 연결 대기</span></div>;
}

function MaterialStage({active}:{active:1|2|3}){return <div className="input-stage">{["학교 정보","학사일정","사진"].map((label,index)=><span className={index+1===active?"input-stage-current":""} key={label} aria-current={index+1===active?"step":undefined}>{label}</span>)}</div>;}

function CardPreviewPage({template,number,decorative=false,project,loading=false}:{template:TemplateCard;number:number;decorative?:boolean;project?:NativeProject|null;loading?:boolean}) {
  const frame=useRef<HTMLDivElement>(null);
  useEffect(()=>{frame.current?.style.setProperty('--preview-ratio',String(template.widthMm/template.heightMm));},[template.widthMm,template.heightMm]);
  const page=template.pages.find(page=>page.number===number);
  const url=page?.imageUrl||(number===1?template.coverUrl:null);
  const pageId=project?.book.pageInstances[number-1]?.id;
  return <div ref={frame} className="card-preview-page" aria-hidden={decorative||undefined}><div className="card-preview-content">{project&&pageId?<NativePreview project={project} pageId={pageId} compact showAssetWarning={false}/>:loading?<div className="preview-placeholder" role="status">미리보기를 준비하고 있어요.</div>:url?<PreviewImage url={url} label={page?.label||`${number}면`} decorative={decorative}/>:<div className="preview-placeholder" role="img" aria-label="저장된 미리보기 준비 중"><strong>미리보기 준비 중</strong><span>미리 보기에서 확인해 주세요.</span></div>}</div></div>;
}

function TemplateCardArtwork({template,onPreview}:{template:TemplateCard;onPreview:(number:number)=>void}) {
  const poster=template.calendarKind==='poster';
  const artwork=useRef<HTMLDivElement>(null);
  const [source,setSource]=useState<NativeProject|null>(null);
  const [sourceFailed,setSourceFailed]=useState(false);
  const livePoster=poster&&Boolean(template.sourceUrl);
  const loading=livePoster&&!source&&!sourceFailed;
  useEffect(()=>{
    if(!livePoster||!artwork.current)return;
    let active=true;
    const load=()=>void fetchTemplateSource(template).then(project=>{if(active)setSource(project);}).catch(()=>{if(active)setSourceFailed(true);});
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load();}
    });
    observer.observe(artwork.current);
    return ()=>{active=false;observer.disconnect();};
  },[livePoster,template]);
  const topPages=poster&&template.pageCount===2?[1,2]:[1];
  const smallPages=poster?template.pages.map(page=>page.number):template.representativePages;
  return <div className="template-art" ref={artwork}>
    <div className={`card-main-preview${topPages.length===2?' card-main-pair':''}`}>
      {topPages.map(number=><button type="button" className="card-preview-trigger" key={number} onClick={()=>onPreview(number)} disabled={!template.pages.some(page=>page.number===number)}><CardPreviewPage template={template} number={number} project={source} loading={loading}/></button>)}
    </div>
    {poster?<div className="poster-mini-previews" aria-label={`${template.name} 전체 ${template.pageCount}면`}>
      {smallPages.map(number=><button type="button" className="card-preview-trigger" key={number} onClick={()=>onPreview(number)} disabled={!template.pages.some(page=>page.number===number)}><CardPreviewPage template={template} number={number} project={source} loading={loading}/></button>)}
    </div>:<div className="mini-previews" tabIndex={0} aria-label={`${template.name} 대표 ${smallPages.length}면 · 마우스를 올리거나 초점을 두면 멈춥니다`}><div className="mini-track">
      {[...smallPages,...smallPages].map((number,index)=><div className="card-mini-slot" key={index}>{index<smallPages.length?<button type="button" className="card-preview-trigger" onClick={()=>onPreview(number)} disabled={!template.pages.some(page=>page.number===number)}><CardPreviewPage template={template} number={number}/></button>:<CardPreviewPage template={template} number={number} decorative/>}</div>)}
    </div></div>}
  </div>;
}

function SchoolPrintFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--canvas))] text-[13px] leading-[22px] text-[hsl(var(--muted-foreground))]">
      <div className="mx-auto grid max-w-[980px] gap-x-9 gap-y-5 px-6 py-9 [&_p]:mb-0 md:grid-cols-[1fr_1.55fr_1.3fr]">
        <a className="w-fit self-start" href="https://www.jirantech.com/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://schoolp.co.kr/95866aee35a49cc091fdf38a4f505c33.png" alt="JIRANTECH" width={135} className="h-auto" />
        </a>
        <div>
          <p>상호명 : (주)지란지교테크 | 대표이사 : 길기현</p>
          <p>사업자등록번호 : 120-87-92843</p>
          <p>통신판매업신고번호 : 제2016-서울강남-00117호</p>
          <p>주소 : 경기도 성남시 금토로80번길 37 인피니티타워 WEST 3층</p>
          <p>문의 : <a className="hover:underline" href="tel:031-608-9735">031-608-9735</a> | <a className="hover:underline" href="mailto:schoolp@jiran.com">schoolp@jiran.com</a></p>
        </div>
        <div>
          <a className="text-[hsl(var(--foreground))] hover:underline" href="https://schoolp.co.kr/contact/privacy">개인정보처리방침</a>
          <p>JIRANTECH All rights reserved.</p>
          <p className="mt-5">본 사이트는 Chrome 브라우저에 최적화 되어있습니다.</p>
          <a className="text-[hsl(var(--foreground))] hover:underline" href="https://www.google.com/intl/ko/chrome/">[Chrome 브라우저 다운로드]</a>
        </div>
      </div>
    </footer>
  );
}
