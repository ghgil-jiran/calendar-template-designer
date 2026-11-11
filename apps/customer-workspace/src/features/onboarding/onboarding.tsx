'use client';
import {largePreviewUrl,majorPageNumbers} from '@/lib/materials/template-preview';
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
import {TemplatePagePreview} from '@/features/materials/template-page-preview';
import {fetchTemplateSource} from '@/lib/materials/template-source';
import {NativePreview} from '@/features/materials/native-preview';
import {applyMaterials,assertNativeProject,photoSlotsForProject,photoPageLabel,fieldsForProject,type NativeProject} from '@/lib/materials/native-project';

import {ProjectLibrary} from '@/features/projects/project-library';
import {SavePanel} from '@/features/projects/save-panel';
import {prepareSnapshot,writeSnapshot,readSnapshot,hydrateSnapshot,type ProjectDraft,type ResumeStep} from '@/lib/projects/store';

function draftSignature(draft:ProjectDraft){return JSON.stringify({name:draft.name.trim(),templateId:draft.template.id,version:draft.template.version,school:draft.school,editorState:draft.editorState,events:draft.events,step:draft.step,photoMode:draft.photoMode||'assign',photoPageId:draft.photoPageId||'',photoSelections:Object.entries(draft.photoSelections||{}).sort(([a],[b])=>a.localeCompare(b)).map(([id,a])=>[id,a?.photoId||null]),photos:draft.photos.map(p=>[p.id,p.file.name,p.file.type,p.file.size,p.file.lastModified,p.width,p.height,p.category]),assignments:Object.entries(draft.assignments).sort(([a],[b])=>a.localeCompare(b)).map(([slot,a])=>[slot,a.photoId])});}
const heroPhotos: Record<string, string> = {
  '5c3eee14-3b66-4990-894d-d95d56d6d0f3': '/images/hero/flower-2027.webp',
  '00ccd75a-3223-40dc-a942-480913e5394b': '/images/hero/landscape-2027.webp',
  '5f8d091b-4072-432b-88a6-b528052c5dba': '/images/hero/fabric-2027.webp',
};

type Step = 'editor' | 'schedule' | 'photos' | 'catalog' | 'detail' | 'guide' | 'school' | 'input-review' | 'projects';

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
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSingle,setPreviewSingle]=useState(false);
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
  const heroTemplates = useMemo(() => {
    const templates = catalog?.templates || [];
    const prepared = templates.filter(template => heroPhotos[template.id]);
    return prepared.length ? prepared : templates;
  }, [catalog]);
  const heroTemplate = heroTemplates[heroIndex % (heroTemplates.length || 1)];
  const heroPhoto = heroTemplate && heroPhotos[heroTemplate.id];
  const previewRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const selected = workingTemplate || catalog?.templates.find(template => template.id === selectedId) || null;
  if(['school','schedule','photos','input-review','editor'].includes(step))resumeStep.current=step as ResumeStep;
  const displayName=projectName.trim()||(school.values.name?.trim()?school.values.name.trim()+' 달력':selected?.name||'우리 학교 달력');
  const draft:ProjectDraft|null=selected?{id:activeProject?.id,revision:activeProject?.revision,name:displayName,template:selected,source:nativeSource,editorState,school,events,photos,assignments,photoMode,photoPageId,photoSelections,step:resumeStep.current}:null;
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
    if (previewOpen && dialog && !dialog.open) dialog.showModal();
    if (!previewOpen && dialog?.open) dialog.close();
  }, [previewOpen]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {if (media.matches) setPlaying(false);};
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!playing || heroHover || step !== 'catalog' || heroTemplates.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroIndex(index => (index + 1) % heroTemplates.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [playing, heroHover, step, heroTemplates]);

  async function choose(template: TemplateCard) {
    if(saving)return;
    const requestId=++selectionRequest.current;
    if(selectedId!==template.id){
      if(dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 다른 디자인으로 이동할까요?'))return;
      templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=[];setActiveProject(null);setSavedSignature('');setProjectName(template.name);setSaveNotice('');setSaveError('');resumeStep.current='school';
      photos.forEach(p=>URL.revokeObjectURL(p.url));setSchool(emptySchoolInput(template.fields));setErrors({});setEditorState(undefined);setEvents([]);setPhotos([]);setAssignments({});setPhotoMode('collect');setPhotoSelections({});setPhotoPageId('');setMaterialPage(0);setNativeSource(null);
    }
    setWorkingTemplate(template);setSelectedId(template.id);setStep('detail');setNativeFailure('');
    if(!template.sourceUrl){setNativeLoading(false);return;}
    setNativeLoading(true);
    try{const project=await fetchTemplateSource(template);if(requestId!==selectionRequest.current)return;setNativeSource(project);setSchool(current=>({...current,calendarDisplay:current.calendarDisplay||{includeHolidays:true,includeAnniversaries:true,includeSolarTerms:true,includeLunar:true}}));}
    catch(error){if(requestId===selectionRequest.current)setNativeFailure(error instanceof Error?error.message:'템플릿을 불러오지 못했습니다.');}
    finally{if(requestId===selectionRequest.current)setNativeLoading(false);}
  }
  function catalogHome() {
    if(saving)return;
    if(dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 디자인 목록으로 이동할까요?'))return;
    photos.forEach(p=>URL.revokeObjectURL(p.url));templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=[];
    ++selectionRequest.current;setWorkingTemplate(null);setSelectedId(null);setActiveProject(null);setSavedSignature('');setProjectName('');setSchool({values:{},hidden:[]});setEditorState(undefined);setEvents([]);setPhotos([]);setAssignments({});setPhotoMode('collect');setPhotoSelections({});setPhotoPageId('');setNativeSource(null);setSaveNotice('');setSaveError('');setStep('catalog');
  }
  async function saveWorking(nextStep?:ResumeStep){
    if(!draft||saveLock.current)return false;saveLock.current=true;const captured=structuredClone({...draft,step:nextStep||draft.step,photos:[]}) as ProjectDraft;captured.photos=[...draft.photos];const signature=draftSignature(captured);setSaving(true);setSaveError('');setSaveNotice('');
    try{const snapshot=await prepareSnapshot(captured),record=await writeSnapshot(snapshot,activeProject?.revision??null);setActiveProject({id:record.id,revision:record.revision});autoFailedSignature.current='';setSavedSignature(signature);setProjectName(record.name);setSaveNotice('이 브라우저에 저장했어요. 재배포 후에도 같은 주소에서 다시 열 수 있어요.');setLibraryVersion(v=>v+1);void navigator.storage?.persist?.().catch(()=>false);return true;}
    catch(error){autoFailedSignature.current=signature;setSaveError(error instanceof Error?error.message:'저장하지 못했어요. 입력 내용은 그대로 유지됩니다.');return false;}finally{saveLock.current=false;setSaving(false);}
  }
  const autoSaveLatest=useRef<()=>Promise<boolean>>(async()=>false);autoSaveLatest.current=()=>saveWorking();
  useEffect(()=>{
    if(step!=='editor'||!dirty||saving||!nativeSource||autoFailedSignature.current===currentSignature)return;
    const timer=window.setTimeout(()=>{void autoSaveLatest.current();},800);
    return()=>window.clearTimeout(timer);
  },[step,dirty,currentSignature,saving,nativeSource]);
  async function openWorking(id:string){
    if(dirty&&hasInput&&!window.confirm('저장하지 않은 변경사항이 있어요. 저장본은 유지하고 선택한 프로젝트를 열까요?'))return;
    const snapshot=await readSnapshot(id),restored=hydrateSnapshot(snapshot),r=restored.record;if(restored.source)restored.template={...restored.template,fields:fieldsForProject(restored.source),photoSlots:photoSlotsForProject(restored.source)};
    photos.forEach(p=>URL.revokeObjectURL(p.url));templateUrls.current.forEach(url=>URL.revokeObjectURL(url));templateUrls.current=restored.urls;
    ++selectionRequest.current;setWorkingTemplate(restored.template);setSelectedId(restored.template.id);setActiveProject({id:r.id,revision:r.revision});setProjectName(r.name);setSchool(r.school);setEditorState(r.editorState);setEvents(r.events);setPhotos(restored.photos);setAssignments(restored.assignments);setPhotoMode(r.photoMode||'assign');setPhotoSelections(restored.photoSelections);setPhotoPageId(r.photoPageId||'');setNativeSource(restored.source);setNativeLoading(false);setNativeFailure('');setErrors({});setMaterialPage(0);setSaveError('');setSaveNotice('저장한 프로젝트를 다시 열었어요.');resumeStep.current=r.step;
    const state:ProjectDraft={id:r.id,revision:r.revision,name:r.name,template:restored.template,source:restored.source,editorState:r.editorState,school:r.school,events:r.events,photos:restored.photos,assignments:restored.assignments,photoMode:r.photoMode||'assign',photoPageId:r.photoPageId||'',photoSelections:restored.photoSelections,step:r.step};setSavedSignature(draftSignature(state));
    setStep(r.step==='input-review'?'editor':r.step==='photos'?'photos':r.step);setPhotoMode('collect');
  }
  function openPreview(index: number,single=false) {setPreviewSingle(single);setPreviewIndex(index); setPreviewOpen(true);}
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

  if(step==='editor'&&materialProject)return <PhotoEditor assignedPhotoIds={Object.values(assignments).map(a=>a.photoId)} project={materialProject} photos={photos} onPhotos={setPhotos} initialState={editorState} onChange={setEditorState} saveFailure={saveError} onComplete={async()=>{if(await saveWorking('editor')){setStep('projects');}}} name={displayName} dirty={dirty} saving={saving} notice={saveError||(!dirty?saveNotice:'')} onSave={()=>void saveWorking()} onMaterials={()=>setStep('school')}/>;
  return <div className="workspace">
    <header className="site-header"><div className="header-inner"><Button variant="quiet" className="brand" onClick={catalogHome}>우리학교<span>달력</span></Button><p className="header-caption">우리 학교의 일 년을 담아요</p><Button disabled={saving} onClick={() => setStep('projects')}>내 프로젝트</Button></div></header>
    <main className="main" data-motion={playing ? 'playing' : 'paused'}>
      {selected&&['school','schedule','photos','input-review','editor'].includes(step)&&<SavePanel name={projectName} onName={setProjectName} dirty={dirty} saved={Boolean(activeProject)} busy={saving||nativeLoading} notice={dirty&&activeProject?'저장하지 않은 변경사항이 있어요.':saveNotice} error={saveError} onSave={()=>void saveWorking()}/>}
      {appLoading && <Panel className="state-panel"><h1>디자인을 준비하고 있어요</h1><p className="muted" role="status">잠시만 기다려 주세요.</p></Panel>}
      {appFailure && <Panel className="state-panel"><h1>목록을 다시 불러올게요</h1><p role="alert">{failure}</p><Button variant="primary" onClick={() => setRequest(value => value + 1)}>다시 시도하기</Button></Panel>}
      {!appLoading && !appFailure && catalog && step === 'catalog' && <>
        <section className="hero"><div><span className="badge">2027학년도 · 우리 학교 맞춤 달력</span><h1 ref={headingRef} tabIndex={-1}>디자인은 골라주세요.<br /><em>우리 학교 달력</em>으로<br />완성해 드려요.</h1><p className="muted hero-copy">학교 정보와 학사일정, 사진을 넣으면 돼요.<br />완성된 페이지를 확인하고 주문하세요.</p><ol className="journey"><li><span>1</span>디자인 선택</li><li><span>2</span>학교 자료 입력</li><li><span>3</span>확인 후 주문</li></ol></div>
          {heroTemplate && <div className={`hero-showcase${heroPhoto ? ' hero-photo' : ''}`} tabIndex={0} aria-label="달력 디자인 미리보기" onMouseEnter={() => setHeroHover(true)} onMouseLeave={() => setHeroHover(false)} onFocusCapture={() => setHeroHover(true)} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setHeroHover(false);}}>
            <div className="hero-art" key={heroTemplate.id}>{heroPhoto ? <img src={heroPhoto} alt={`${heroTemplate.name} · 책상 위 탁상달력 연출 이미지`} width={1536} height={1024} fetchPriority="high" /> : <><PreviewImage eager url={heroTemplate.coverUrl} label={heroTemplate.name} /><PreviewImage className="hero-interior" url={heroTemplate.pages[(heroTemplate.representativePages[1]||1)-1]?.imageUrl} label="대표 페이지" /></>}</div>
          </div>}
        </section>
        <section aria-labelledby="catalog-title"><div className="catalog-heading"><div><h2 id="catalog-title">마음에 드는 디자인을 골라보세요</h2><p className="muted">탁상형·벽보형 달력의 전체 구성을 먼저 살펴볼 수 있어요.</p></div><span className="badge">{catalog.templates.length}종 {catalog.mode==='review'?'선택 구성 검토':'템플릿'}</span></div>
          {!catalog.templates.length ? <Panel><h3>공개된 디자인을 준비 중이에요</h3><p className="muted">준비가 끝나면 이곳에서 고를 수 있어요.</p></Panel> : <><div className="catalog-filters" role="group" aria-label="달력 유형">{([["desk","탁상형 달력"],["poster","벽보형 달력"],["all","전체 달력"]] as const).map(([key,label])=><Button key={key} aria-pressed={kindFilter===key} onClick={()=>setKindFilter(key)}>{label}</Button>)}</div>{!catalog.templates.some(t=>kindFilter==='all'||(t.calendarKind||'desk')===kindFilter)&&<Panel>선택한 유형의 디자인을 준비 중이에요.</Panel>}<div className="catalog-grid">{catalog.templates.filter(t=>kindFilter==='all'||(t.calendarKind||'desk')===kindFilter).map(template => <article className="template-card" key={template.id}>
            <div className="template-art">{template.coverUrl?<PreviewImage url={template.coverUrl} label={template.name}/>:<TemplatePagePreview template={template} number={1}/>} <div className="mini-previews" tabIndex={0} aria-label={`${template.name} 대표 4면 · 마우스를 올리거나 초점을 두면 멈춥니다`}><div className="mini-track">{[...template.representativePages, ...template.representativePages].map((number, index) => template.pages[number-1].imageUrl?<PreviewImage key={index} className="mini-placeholder" url={template.pages[number-1].imageUrl} label={template.pages[number-1].label} decorative={index>=template.representativePages.length}/>:<TemplatePagePreview key={index} template={template} number={number} decorative={index>=template.representativePages.length}/>)}</div></div></div>
            <div className="template-copy"><h3>{template.name}</h3><div className="card-actions"><span>{template.widthMm} × {template.heightMm} mm · {template.pageCount}면</span><Button onClick={() => choose(template)} aria-label={`${template.name} 전체면 살펴보기`}>전체면 살펴보기 →</Button></div></div>
          </article>)}</div></>}
        </section>
        <section className="before-start"><div><h3>자료는 디자인을 고른 뒤 준비해도 괜찮아요.</h3><p className="muted">선택한 디자인에 필요한 자료를 안내해 드려요.</p></div><div><h3>만들던 달력이 있나요?</h3><Button variant="quiet" disabled={saving} onClick={() => setStep('projects')}>내 프로젝트에서 이어하기 →</Button></div></section>
      </>}

      {!appLoading && !appFailure && selected && step === 'detail' && <>
        <Button className="navigation-button" onClick={catalogHome}>← 이전 디자인 보기</Button>

        <div className="detail-grid"><Panel><div className="large-preview">{selected.pages[0].imageUrl||selected.coverUrl?<PreviewImage url={selected.pages[0].imageUrl||selected.coverUrl} label="표지"/>:nativeSource?<NativePreview project={nativeSource} pageId={nativeSource.book.pageInstances[0].id}/>:<PreviewImage url={null} label="표지"/>}<Button className="all-pages-button" onClick={()=>openPreview(0)}>전체 페이지 보기</Button></div></Panel><Panel><span className="badge">학사달력 · {selected.calendarKind==='poster'?'벽보형':'탁상형'}</span><h2>{selected.name}</h2><p className="muted">{selected.description}</p><dl className="facts"><div><dt>규격</dt><dd>{selected.widthMm} × {selected.heightMm} mm</dd></div><div><dt>전체 면수</dt><dd>{selected.pageCount}면</dd></div><div><dt>사용 기간</dt><dd>{selected.period}</dd></div></dl><p>{selected.note}</p><Button variant="primary" className="wide-button" disabled={nativeLoading||Boolean(nativeFailure)} onClick={() => setStep('school')}>이 디자인으로 만들기</Button></Panel></div>
        {nativeLoading&&<p role="status">실제 템플릿을 불러오고 있어요.</p>}{nativeFailure&&<div role="alert"><p>{nativeFailure}</p><Button onClick={()=>void choose(selected)}>다시 불러오기</Button></div>}{!nativeSource&&catalog?.mode==='review'&&<div className="reference-note">전체면은 샘플 A의 기존 확인용 PDF 참고 이미지입니다. 다른 카드의 실제 디자인 또는 최종 인쇄 품질을 의미하지 않습니다.</div>}
        <section className="all-pages" aria-labelledby="all-pages-title"><h2 id="all-pages-title">주요 페이지 보기</h2><div className="page-grid">{(selected.majorPages||majorPageNumbers(nativeSource?.book.pageInstances||[])).map(number=>({page:selected.pages[number-1],index:number-1})).filter(({page})=>Boolean(page)).map(({page,index}) => <button className="page-thumbnail" key={page.number} onClick={() => openPreview(index,true)} aria-label={`${page.number}면 ${page.label} 크게 보기`}>{page.imageUrl?<PreviewImage url={page.imageUrl} label={`${page.number}면`}/>:nativeSource?<TemplatePagePreview template={selected} number={page.number} project={nativeSource}/>:<PreviewImage url={null} label={`${page.number}면`}/>}<span>{page.number}면 · {page.label}</span></button>)}</div></section>
      </>}

      {!appLoading && !appFailure && selected && step === 'school' && <>
        <Progress /><MaterialStage active={1}/>{heading('우리 학교 기본 정보', '달력에 표시되는 학교 정보를 입력해 주세요.', '선택 정보를 달력에 표시하지 않을 경우 체크해 주세요.')}
        <form onSubmit={continueSchool} noValidate>
          {(['basic', 'contact'] as const).filter(group=>selected.fields.some(field=>field.group===group)).map(group => <Panel className="form-section" key={group}><h2>{group === 'basic' ? '학교 기본 정보' : '학교 연락처'}</h2><div className="form-grid">{(group==='basic'?['general','tree','flower']:['general']).filter(section=>section==='general'||selected.fields.some(f=>f.group===group&&f.key.startsWith(section))).map(section=><div className={section==='general'?'school-field-group':'school-field-group school-symbol-group'} key={section}>{section!=='general'&&<><div className="field-heading"><h3>{section==='tree'?'교목':'교화'}</h3></div><p className="field-hint">빈칸은 샘플을 유지합니다. 전체를 숨기면 연결된 이름·설명·이미지를 함께 표시하지 않습니다.</p></>}<div className="form-grid">{selected.fields.filter(field=>field.group===group&&(section==='general'?!['treeName','treeDescription','flowerName','flowerDescription'].includes(field.key):section==='tree'?['treeName','treeDescription'].includes(field.key):['flowerName','flowerDescription'].includes(field.key))).map(field=><TextField key={field.key} label={field.label} value={school.values[field.key] || ''} required={field.required} hidden={school.hidden.includes(field.key)} allowHide={!field.required&&field.allowHide} maxLength={field.maxLength} hint={field.hint?.includes('연결된 글자 개체')?undefined:field.hint} error={errors[field.key]}
            onChange={value => {setSchool(current => ({...current, values: {...current.values, [field.key]: value}})); setErrors(current => ({...current, [field.key]: ''}));}}
            onHide={hidden => {setSchool(current => ({...current, hidden: hidden ? [...current.hidden.filter(key => key !== field.key), field.key] : current.hidden.filter(key => key !== field.key)})); setErrors(current => ({...current, [field.key]: ''}));}} />)}</div></div>)}</div></Panel>)}

          {Object.values(errors).some(Boolean) && <p className="field-error" role="alert">입력이 필요한 항목을 확인해 주세요.</p>}
          <div className="actions"><Button onClick={() => setStep('detail')}>← 디자인 보기</Button><Button type="submit" variant="primary">학사일정 입력하기 →</Button></div>
        </form>
      </>}

      {!appLoading && !appFailure && selected && step==='schedule'&&<>
        <Progress/><MaterialStage active={2}/>{heading('학교 학사일정','학사일정을 한 번에 넣어 주세요','파일을 선택하거나 일정 내용을 복사해서 붙여 넣어 주세요.')}
        <ScheduleInput calendarDisplay={school.calendarDisplay||{includeHolidays:true,includeAnniversaries:true,includeSolarTerms:true,includeLunar:true}} onCalendarDisplay={value=>setSchool(current=>({...current,calendarDisplay:value}))} year={Number(nativeSource?.settings.year||2027)} startMonth={Number(nativeSource?.settings.startMonth||3)} events={events} onChange={setEvents} required={Boolean(nativeSource?.template.publishing?.dataRequirements?.some((r:NativeProject)=>r.path==='calendar.events'&&['project-create-required','final-submit-required'].includes(r.stage)))} onBack={()=>setStep('school')} onNext={()=>{setPhotoMode('collect');setStep('photos');}}/>
      </>}
      {!appLoading && !appFailure && selected && step==='photos'&&<>
        <Progress/><MaterialStage active={3}/>
        <PhotoInput stage='prepare' onStageChange={stage=>setPhotoMode(stage==='prepare'?'collect':'assign')} usedPhotoIds={editorState?.edits.flatMap(e=>e.photoId?[e.photoId]:[])} template={selected} project={editedProject} pages={nativeSource?.book.pageInstances.map((p:NativeProject,i:number)=>({id:p.id,label:photoPageLabel(p,i)}))||[]} pageId={photoPageId} onPageId={setPhotoPageId} selections={photoSelections} onSelections={setPhotoSelections} photos={photos} onPhotos={next=>{setPhotos(next);setEditorState(current=>current?{...current,edits:current.edits.filter(e=>!e.photoId||next.some(p=>p.id===e.photoId))}:current);}} slots={nativeSource?photoSlotsForProject(nativeSource):selected.photoSlots||[]} assignments={assignments} onAssignments={next=>{if(nativeSource){const changed=photoSlotsForProject(nativeSource).filter(slot=>assignments[slot.id]?.photoId!==next[slot.id]?.photoId);setEditorState(current=>current?{...current,edits:current.edits.filter(edit=>!changed.some(slot=>slot.elementId===edit.elementId&&slot.scope===edit.scope&&(slot.pageIds||[slot.pageId]).includes(edit.pageId)))}:current);}setAssignments(next);}} minimumDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.orderMinimumDpi||200} recommendedDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.recommendedDpi||300} onBack={()=>setStep('schedule')} onNext={()=>setStep('editor')}/>
      </>}
      {step === 'projects' && <>
        {heading('내 프로젝트','저장한 달력을 이어서 만드세요','로그인 없이 이 브라우저에 저장한 프로젝트를 다시 열 수 있어요.')}
        <ProjectLibrary onDeleted={id=>{if(activeProject?.id===id){setActiveProject(null);setSavedSignature('');setSaveNotice('저장본을 삭제했어요. 열어 둔 입력 내용은 새 프로젝트로 저장할 수 있어요.');}}} onOpen={openWorking} hasWorking={Boolean(selected)} onResume={()=>setStep(resumeStep.current)} refresh={libraryVersion}/>
        <div className="actions"><Button onClick={catalogHome}>새 달력 만들기</Button></div>
      </>}
    </main>
    <footer className="site-footer"><span>학교 자료만 준비하세요. 디자인은 이미 완성되어 있어요.</span><span>개발 검토용 · 실제 주문 서비스 아님</span></footer>

    <dialog ref={previewRef} className="preview-dialog" onCancel={() => setPreviewOpen(false)} onClose={() => setPreviewOpen(false)} aria-labelledby="preview-title" onKeyDown={event => {
      if (!previewSingle && event.key === 'ArrowRight' && selected) setPreviewIndex(index => Math.min(selected.pages.length - 1, index + 1));
      if (!previewSingle && event.key === 'ArrowLeft') setPreviewIndex(index => Math.max(0, index - 1));
    }}>
      {selected && previewOpen && <><div className="preview-header"><div><h2 id="preview-title">{selected.pages[previewIndex]?.label}</h2><p className="muted">{selected.previewKind==='published'?'템플릿 미리보기':'공통 참고 이미지'} · {previewIndex + 1} / {selected.pageCount}면</p></div><Button onClick={() => setPreviewOpen(false)}>닫기 ×</Button></div>{nativeSource?<NativePreview project={nativeSource} pageId={nativeSource.book.pageInstances[previewIndex].id}/>:selected.pages[previewIndex]?.imageUrl||selected.pages[previewIndex]?.largeImageUrl?<PreviewImage className="preview-image" url={largePreviewUrl(selected.pages[previewIndex])} label={selected.pages[previewIndex]?.label||'페이지'}/>:<PreviewImage className="preview-image" url={null} label={selected.pages[previewIndex]?.label||'페이지'}/>}{!previewSingle&&<div className="preview-controls"><Button disabled={previewIndex === 0} onClick={() => setPreviewIndex(index => index - 1)}>← 이전 면</Button><span aria-live="polite">{previewIndex + 1} / {selected.pageCount}</span><Button disabled={previewIndex === selected.pages.length - 1} onClick={() => setPreviewIndex(index => index + 1)}>다음 면 →</Button></div>}</>}
    </dialog>
  </div>;
}

function Progress({active=2}:{active?:2|3}) {return <ol className="journey progress" aria-label="달력 제작 과정"><li className="progress-complete"><span aria-label="완료">✓</span>디자인 선택</li><li className={active===3?'progress-complete':undefined} aria-current={active===2?'step':undefined}><span aria-label={active===3?'완료':undefined}>{active===3?'✓':'2'}</span>학교 자료 입력</li><li aria-current={active===3?'step':undefined}><span>3</span>달력 편집</li></ol>;}
function PreviewImage({url, label, className = '', decorative = false, eager = false}: {url?: string | null; label: string; className?: string; decorative?: boolean; eager?: boolean}) {
  return url ? <img className={className} src={url} alt={decorative ? '' : `${label} 미리보기`} loading={eager?'eager':'lazy'} /> : <div className={`preview-placeholder ${className}`} role="img" aria-label={`${label}: 이미지 연결 대기`}><strong>{label}</strong><span>미리보기 연결 대기</span></div>;
}

function MaterialStage({active}:{active:1|2|3}){return <div className="input-stage">{["학교 정보","학사일정","사진"].map((label,index)=><span className={index+1===active?"input-stage-current":""} key={label} aria-current={index+1===active?"step":undefined}>{label}</span>)}</div>;}
