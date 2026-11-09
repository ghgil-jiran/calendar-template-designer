'use client';
import {PhotoEditor} from '@/features/editor/photo-editor';
import {applyEditor,type EditorState} from '@/lib/editor/session';

import {useEffect, useMemo, useRef, useState} from 'react';
import type {CatalogResponse, SchoolInput, TemplateCard, ScheduleEvent, PhotoAssignment,PhotoInputMode,PhotoSelections} from '@/lib/api/contracts';
import {emptySchoolInput, validateSchoolInput, visibleSchoolValues} from '@/lib/api/school-input';
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
  const [materialPage,setMaterialPage]=useState(0);
  const photosRef=useRef(photos);photosRef.current=photos;
  const selectionRequest=useRef(0);
  useEffect(()=>()=>photosRef.current.forEach(p=>URL.revokeObjectURL(p.url)),[]);
  const [playing, setPlaying] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroHover, setHeroHover] = useState(false);
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
    if (!playing || heroHover || step !== 'catalog' || !catalog?.templates.length) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroIndex(index => (index + 1) % catalog.templates.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [playing, heroHover, step, catalog]);

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
    try{const project=await fetchTemplateSource(template);if(requestId!==selectionRequest.current)return;setNativeSource(project);setSchool(current=>({...current,calendarDisplay:current.calendarDisplay||{includeHolidays:project.settings.calendarData?.includeHolidays!==false,includeAnniversaries:project.settings.calendarData?.includeAnniversaries!==false,includeSolarTerms:project.settings.calendarData?.includeSolarTerms!==false,includeLunar:project.settings.calendarData?.includeLunar!==false}}));}
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
    setStep(r.step==='input-review'&&Object.keys(validateSchoolInput(restored.template.fields,r.school)).length?'school':r.step);
  }
  function openPreview(index: number) {setPreviewIndex(index); setPreviewOpen(true);}
  function continueSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const issues = validateSchoolInput(selected.fields, school);
    if(nativeSource?.template.publishing?.dataRequirements?.some((r:NativeProject)=>r.path==='school.contacts'&&r.stage==='project-create-required')){const contacts=selected.fields.filter(f=>f.binding?.startsWith('school.contacts.')||f.binding==='school.phone');if(contacts.length&&!contacts.some(f=>!school.hidden.includes(f.key)&&school.values[f.key]?.trim()))issues[contacts[0].key]='학교 연락처를 한 곳 이상 입력해 주세요.';}
    setErrors(issues);
    if (Object.keys(issues).length) {
      window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
    } else setStep('schedule');
  }
  const heading = (eyebrow: string, title: string, description: string) => <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p className="muted">{description}</p></div>;

  if(step==='editor'&&materialProject)return <PhotoEditor assignedPhotoIds={Object.values(assignments).map(a=>a.photoId)} project={materialProject} photos={photos} onPhotos={setPhotos} initialState={editorState} onChange={setEditorState} saveFailure={saveError} onComplete={async()=>{if(await saveWorking('input-review')){setMaterialPage(0);setStep('input-review');}}} name={displayName} dirty={dirty} saving={saving} notice={saveError||(!dirty?saveNotice:'')} onSave={()=>void saveWorking()}/>;
  return <div className="workspace">
    <header className="site-header"><div className="header-inner"><Button variant="quiet" className="brand" onClick={catalogHome}>우리학교<span>달력</span></Button><p className="header-caption">우리 학교의 일 년을 담아요</p><Button disabled={saving} onClick={() => setStep('projects')}>내 프로젝트</Button></div></header>
    <main className="main" data-motion={playing ? 'playing' : 'paused'}>
      {selected&&['school','schedule','photos','input-review','editor'].includes(step)&&<SavePanel name={projectName} onName={setProjectName} dirty={dirty} saved={Boolean(activeProject)} busy={saving||nativeLoading} notice={dirty&&activeProject?'저장하지 않은 변경사항이 있어요.':saveNotice} error={saveError} onSave={()=>void saveWorking()}/>}
      {appLoading && <Panel className="state-panel"><h1>디자인을 준비하고 있어요</h1><p className="muted" role="status">잠시만 기다려 주세요.</p></Panel>}
      {appFailure && <Panel className="state-panel"><h1>목록을 다시 불러올게요</h1><p role="alert">{failure}</p><Button variant="primary" onClick={() => setRequest(value => value + 1)}>다시 시도하기</Button></Panel>}
      {!appLoading && !appFailure && catalog && step === 'catalog' && <>
        <section className="hero"><div><span className="badge">2027학년도 · 우리 학교 맞춤 달력</span><h1 ref={headingRef} tabIndex={-1}>디자인은 골라주세요.<br /><em>우리 학교 달력</em>으로<br />완성해 드려요.</h1><p className="muted hero-copy">학교 정보와 학사일정, 사진을 넣으면 돼요.<br />완성된 페이지를 확인하고 주문하세요.</p><ol className="journey"><li><span>1</span>디자인 선택</li><li><span>2</span>학교 자료 입력</li><li><span>3</span>확인 후 주문</li></ol></div>
          {catalog.templates[heroIndex] && <div className="hero-showcase" tabIndex={0} aria-label="달력 디자인 미리보기" onMouseEnter={() => setHeroHover(true)} onMouseLeave={() => setHeroHover(false)} onFocusCapture={() => setHeroHover(true)} onBlurCapture={event => {if (!event.currentTarget.contains(event.relatedTarget)) setHeroHover(false);}}>
            <div className="hero-art" key={heroIndex}><PreviewImage eager url={catalog.templates[heroIndex].coverUrl} label={catalog.templates[heroIndex].name} /><PreviewImage className="hero-interior" url={catalog.templates[heroIndex].pages[(catalog.templates[heroIndex].representativePages[1]||1)-1]?.imageUrl} label="대표 페이지" /></div>
          </div>}
        </section>
        <section aria-labelledby="catalog-title"><div className="catalog-heading"><div><h2 id="catalog-title">마음에 드는 디자인을 골라보세요</h2><p className="muted">학사달력 · 탁상형 · 전체 구성을 먼저 살펴볼 수 있어요.</p></div><span className="badge">{catalog.templates.length}종 {catalog.mode==='review'?'선택 구성 검토':'템플릿'}</span></div>
          {!catalog.templates.length ? <Panel><h3>공개된 디자인을 준비 중이에요</h3><p className="muted">준비가 끝나면 이곳에서 고를 수 있어요.</p></Panel> : <div className="catalog-grid">{catalog.templates.map(template => <article className="template-card" key={template.id}>
            <div className="template-art"><PreviewImage url={template.coverUrl} label={template.name} /><span className="image-label">{template.previewKind === 'reference' ? '샘플 A 참고' : template.previewKind==='published'?'게시 템플릿':'시안용 공통 이미지'}</span><div className="mini-previews" tabIndex={0} aria-label={`${template.name} 대표 4면 · 마우스를 올리거나 초점을 두면 멈춥니다`}><div className="mini-track">{[...template.representativePages, ...template.representativePages].map((number, index) => <PreviewImage key={index} className="mini-placeholder" url={template.pages[number - 1].imageUrl} label={template.pages[number - 1].label} decorative={index >= template.representativePages.length} />)}</div></div></div>
            <div className="template-copy"><h3>{template.name}</h3><p>{template.description}</p><small>{template.note}</small><div className="card-actions"><span>{template.widthMm} × {template.heightMm} mm · {template.pageCount}면</span><Button onClick={() => choose(template)} aria-label={`${template.name} 전체면 살펴보기`}>전체면 살펴보기 →</Button></div></div>
          </article>)}</div>}
        </section>
        <section className="before-start"><div><h3>자료는 디자인을 고른 뒤 준비해도 괜찮아요.</h3><p className="muted">선택한 디자인에 필요한 자료를 안내해 드려요.</p></div><div><h3>만들던 달력이 있나요?</h3><Button variant="quiet" disabled={saving} onClick={() => setStep('projects')}>내 프로젝트에서 이어하기 →</Button></div></section>
      </>}

      {!appLoading && !appFailure && selected && step === 'detail' && <>
        <Button className="navigation-button" onClick={catalogHome}>← 이전 디자인 보기</Button>
        {heading(selected.name, '표지부터 마지막 장까지 살펴보세요', '크게 보고 싶은 페이지를 누르세요. 아직 프로젝트는 생성하지 않습니다.')}
        <div className="detail-grid"><Panel>{nativeSource?<div className="large-preview"><NativePreview project={nativeSource} pageId={nativeSource.book.pageInstances[0].id}/><Button onClick={()=>openPreview(0)}>전체 페이지 크게 보기 ↗</Button></div>:<button className="large-preview" onClick={()=>openPreview(0)} aria-label="전체 페이지 크게 보기"><PreviewImage url={selected.pages[0].imageUrl} label="표지"/><span>전체 페이지 크게 보기 ↗</span></button>}</Panel><Panel><span className="badge">학사달력 · 탁상형</span><h2>{selected.name}</h2><p className="muted">{selected.description}</p><dl className="facts"><div><dt>규격</dt><dd>{selected.widthMm} × {selected.heightMm} mm</dd></div><div><dt>전체 면수</dt><dd>{selected.pageCount}면</dd></div><div><dt>사용 기간</dt><dd>{selected.period}</dd></div></dl><p>{selected.note}</p><Button variant="primary" className="wide-button" disabled={nativeLoading||Boolean(nativeFailure)} onClick={() => setStep('guide')}>이 디자인으로 만들기</Button></Panel></div>
        {nativeLoading&&<p role="status">실제 템플릿을 불러오고 있어요.</p>}{nativeFailure&&<div role="alert"><p>{nativeFailure}</p><Button onClick={()=>void choose(selected)}>다시 불러오기</Button></div>}{!nativeSource&&catalog?.mode==='review'&&<div className="reference-note">전체면은 샘플 A의 기존 확인용 PDF 참고 이미지입니다. 다른 카드의 실제 디자인 또는 최종 인쇄 품질을 의미하지 않습니다.</div>}
        <section className="all-pages" aria-labelledby="all-pages-title"><h2 id="all-pages-title">전체 {selected.pageCount}면 구성</h2><p className="muted">{selected.composition.map(item => `${item.label} ${item.count}면`).join(' · ')}</p><div className="page-grid">{selected.pages.map((page, index) => <button className="page-thumbnail" key={page.number} onClick={() => openPreview(index)} aria-label={`${page.number}면 ${page.label} 크게 보기`}>{nativeSource?<TemplatePagePreview template={selected} number={page.number} project={nativeSource}/>:<PreviewImage url={page.imageUrl} label={`${page.number}면`} />}<span>{page.number}면 · {page.label}</span></button>)}</div></section>
      </>}

      {!appLoading && !appFailure && selected && step === 'guide' && <>
        <Progress />{heading(`선택한 디자인 · ${selected.name}`, '학교 자료를 넣어볼까요?', '필요한 자료를 먼저 안내해 드릴게요.')}
        <div className="guide-list"><GuideRow number="1" title="학교 정보" text={`${selected.fields.filter(field => field.required).map(field => field.label).join(', ')}은 필수예요. 나머지 항목은 표시 여부를 고를 수 있어요.`} /><GuideRow number="2" title="학사일정" text="가지고 계신 일정 파일을 올리고 날짜와 내용을 확인해요." /><GuideRow number="3" title="학교 사진" text={selected.photoGuide} /></div>
        <div className="reference-note">학교 정보 → 학사일정 → 사진 순서로 입력하고 확인해요. 입력 자료의 서버 저장은 아직 연결 전이에요.</div>
        <div className="actions"><Button className="navigation-button" onClick={() => setStep('detail')}>← 디자인 다시 보기</Button><Button variant="primary" onClick={() => setStep('school')}>학교 정보부터 넣기</Button></div>
      </>}

      {!appLoading && !appFailure && selected && step === 'school' && <>
        <Progress /><MaterialStage active={1}/>{heading('우리 학교 기본 정보', '학교 정보를 한 번만 입력해 주세요', '달력에 사용할 정보와 표시 여부를 입력해 보세요. 선택 정보를 달력에 표시하지 않을 경우 체크해 주세요. 정보를 입력하지 않으면 템플릿의 샘플 정보가 표시될 수 있어요.')}
        <form onSubmit={continueSchool} noValidate>
          {(['basic', 'contact'] as const).filter(group=>selected.fields.some(field=>field.group===group)).map(group => <Panel className="form-section" key={group}><h2>{group === 'basic' ? '학교 기본 정보' : '학교 연락처'}</h2>{group==='basic'&&<p className="reference-note school-binding-note">입력한 정보는 ‘내 프로젝트에 저장’을 누르면 보관됩니다. 달력에는 템플릿에 연결된 항목만 반영됩니다. 배경 이미지에 포함된 글자는 변경되지 않습니다.</p>}{group==='contact'&&<p className="muted">{school.omitEmptyContacts?'연락처를 입력하지 않으면 해당 정보는 달력에 표시하지 않아요. 필수로 표시된 연락처는 입력해 주세요.':'이전에 저장한 프로젝트는 빈칸일 때 템플릿 기본값을 유지해요. 표시하지 않으려면 해당 항목을 체크해 주세요.'}</p>}<div className="form-grid">{(group==='basic'?['general','tree','flower']:['general']).filter(section=>section==='general'||selected.fields.some(f=>f.group===group&&f.key.startsWith(section))).map(section=><div className={section==='general'?'school-field-group':'school-field-group school-symbol-group'} key={section}>{section!=='general'&&<><h3>{section==='tree'?'교목':'교화'}</h3><p className="field-hint">빈칸은 샘플을 유지합니다. 전체를 숨기면 연결된 이름·설명·이미지를 함께 표시하지 않습니다.</p>{selected.fields.filter(f=>f.key.startsWith(section)).every(f=>f.allowHide&&!f.required)&&<label className="checkbox"><input type="checkbox" checked={selected.fields.filter(f=>f.key.startsWith(section)).every(f=>school.hidden.includes(f.key))} onChange={event=>{const keys=selected.fields.filter(f=>f.key.startsWith(section)).map(f=>f.key);const hidden=event.target.checked;setSchool(current=>({...current,hidden:[...current.hidden.filter(key=>!keys.includes(key)),...(hidden?keys:[])]}));setErrors({});}} />{section==='tree'?'교목':'교화'} 전체를 달력에 표시하지 않음</label>}</>}<div className="form-grid">{selected.fields.filter(field=>field.group===group&&(section==='general'?!['treeName','treeDescription','flowerName','flowerDescription'].includes(field.key):section==='tree'?['treeName','treeDescription'].includes(field.key):['flowerName','flowerDescription'].includes(field.key))).map(field=><TextField key={field.key} label={field.label} value={school.values[field.key] || ''} required={field.required} hidden={school.hidden.includes(field.key)} allowHide={section==='general'&&field.allowHide} maxLength={field.maxLength} hint={field.hint?.includes('연결된 글자 개체')?undefined:field.hint} error={errors[field.key]}
            onChange={value => {setSchool(current => ({...current, values: {...current.values, [field.key]: value}})); setErrors(current => ({...current, [field.key]: ''}));}}
            onHide={hidden => {setSchool(current => ({...current, hidden: hidden ? [...current.hidden.filter(key => key !== field.key), field.key] : current.hidden.filter(key => key !== field.key)})); setErrors(current => ({...current, [field.key]: ''}));}} />)}</div></div>)}</div></Panel>)}
          <div className="reference-note">계속 작업하려면 위의 ‘내 프로젝트에 저장’을 눌러 주세요. 학교 상징 이미지는 다음 사진 단계에서 선택할 수 있어요.</div>
          {Object.values(errors).some(Boolean) && <p className="field-error" role="alert">입력이 필요한 항목을 확인해 주세요.</p>}
          <div className="actions"><Button onClick={() => setStep('guide')}>← 준비 자료 안내</Button><Button type="submit" variant="primary">학사일정 입력하기 →</Button></div>
        </form>
      </>}

      {!appLoading && !appFailure && selected && step==='schedule'&&<>
        <Progress/><MaterialStage active={2}/>{heading('학교 학사일정','학사일정을 한 번에 넣어 주세요','파일을 선택하거나 일정 내용을 복사해서 붙여 넣어 주세요.')}
        <ScheduleInput calendarDisplay={school.calendarDisplay||{includeHolidays:nativeSource?.settings.calendarData?.includeHolidays!==false,includeAnniversaries:nativeSource?.settings.calendarData?.includeAnniversaries!==false,includeSolarTerms:nativeSource?.settings.calendarData?.includeSolarTerms!==false,includeLunar:nativeSource?.settings.calendarData?.includeLunar!==false}} onCalendarDisplay={value=>setSchool(current=>({...current,calendarDisplay:value}))} year={Number(nativeSource?.settings.year||2027)} startMonth={Number(nativeSource?.settings.startMonth||3)} events={events} onChange={setEvents} required={Boolean(nativeSource?.template.publishing?.dataRequirements?.some((r:NativeProject)=>r.path==='calendar.events'&&['project-create-required','final-submit-required'].includes(r.stage)))} onBack={()=>setStep('school')} onNext={()=>{setPhotoMode('collect');setStep('photos');}}/>
      </>}
      {!appLoading && !appFailure && selected && step==='photos'&&<>
        <Progress/><MaterialStage active={3}/><PhotoSubsteps active={photoMode==='collect'?1:2}/>
        <PhotoInput stage={photoMode==='collect'?'prepare':'assign'} onStageChange={stage=>setPhotoMode(stage==='prepare'?'collect':'assign')} usedPhotoIds={editorState?.edits.flatMap(e=>e.photoId?[e.photoId]:[])} template={selected} project={editedProject} pages={nativeSource?.book.pageInstances.map((p:NativeProject,i:number)=>({id:p.id,label:photoPageLabel(p,i)}))||[]} pageId={photoPageId} onPageId={setPhotoPageId} selections={photoSelections} onSelections={setPhotoSelections} photos={photos} onPhotos={next=>{setPhotos(next);setEditorState(current=>current?{...current,edits:current.edits.filter(e=>!e.photoId||next.some(p=>p.id===e.photoId))}:current);}} slots={nativeSource?photoSlotsForProject(nativeSource):selected.photoSlots||[]} assignments={assignments} onAssignments={next=>{if(nativeSource){const changed=photoSlotsForProject(nativeSource).filter(slot=>assignments[slot.id]?.photoId!==next[slot.id]?.photoId);setEditorState(current=>current?{...current,edits:current.edits.filter(edit=>!changed.some(slot=>slot.elementId===edit.elementId&&slot.scope===edit.scope&&(slot.pageIds||[slot.pageId]).includes(edit.pageId)))}:current);}setAssignments(next);}} minimumDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.orderMinimumDpi||200} recommendedDpi={nativeSource?.template.resources?.exportSettings?.imageQualityPolicy?.recommendedDpi||300} onBack={()=>setStep('schedule')} onNext={()=>{setMaterialPage(0);setStep('input-review');}}/>
      </>}
      {!appLoading && !appFailure && selected && step === 'input-review' && <>
        <Progress active={3}/><PhotoSubsteps active={3}/>{heading('달력 확인','입력한 자료 최종 확인하기',nativeSource?'아래 달력에서 학교 정보와 학사일정, 사진 및 편집 결과를 전체 면에 걸쳐 확인해 주세요.':'학교 정보·학사일정·사진 입력을 확인할 수 있어요. 실제 템플릿 반영은 연결 전이에요.')}
        <div className="material-review"><Panel><h2>{school.values.name||'우리 학교'}</h2><dl className="facts">{selected.fields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{school.hidden.includes(field.key)?'달력에 표시하지 않음':visibleSchoolValues(selected.fields,school)[field.key]||(field.group==='contact'&&school.omitEmptyContacts?'달력에 표시하지 않음':'템플릿 기본값 유지')}</dd></div>)}<div><dt>학사일정</dt><dd>{events.length}건</dd></div><div><dt>선택한 사진</dt><dd>{photos.length}장 · {Object.keys(assignments).length}곳 배정</dd></div></dl></Panel>
        {nativeSource&&photoSlotsForProject(nativeSource).some(s=>s.required&&!assignments[s.id]&&!editorState?.edits.some(e=>e.photoId&&e.elementId===s.elementId&&(s.pageIds||[s.pageId]).includes(e.pageId)&&e.scope===(s.scope==='school'?'page':s.scope)))&&<Panel><p className="photo-warning">아직 배정하지 않은 필수 사진이 있어요. 현재 화면에는 템플릿 기본 사진이 남을 수 있으며 최종 완료 전 확인이 필요해요.</p></Panel>}{photos.some(p=>!Object.values(assignments).some(a=>a.photoId===p.id)&&!editorState?.edits.some(e=>e.photoId===p.id))&&<Panel><p>올린 사진 중 {photos.filter(p=>!Object.values(assignments).some(a=>a.photoId===p.id)&&!editorState?.edits.some(e=>e.photoId===p.id)).length}장은 아직 달력에 배정하지 않았어요. 사진 수정에서 나중에 배정할 수 있어요.</p></Panel>}{editedProject&&<Panel><h2>템플릿 반영 확인</h2><p className="muted">입력한 학교 정보·일정·배정 사진을 반영했어요. 저장하면 반영된 달력 문서도 함께 보관해요. 사진 편집기에서 조정한 결과도 함께 표시됩니다.</p><div className="calendar-page-controls"><Button disabled={materialPage===0} onClick={()=>setMaterialPage(v=>v-1)}>← 이전 면</Button><span>{materialPage+1} / {editedProject.book.pageInstances.length}면</span><Button disabled={materialPage>=editedProject.book.pageInstances.length-1} onClick={()=>setMaterialPage(v=>v+1)}>다음 면 →</Button></div><NativePreview project={editedProject} pageId={editedProject.book.pageInstances[materialPage].id}/></Panel>}
        </div><div className="reference-note">‘내 프로젝트에 저장’을 누르면 입력 자료와 사진 원본을 이 브라우저에서 다시 열 수 있어요. 다른 PC에서 사용하거나 브라우저 데이터를 지울 때는 백업 파일을 따로 보관해 주세요.</div>
        <div className="actions">{materialProject&&<Button variant="primary" onClick={()=>setStep('editor')}>편집기에서 사진 조정하기</Button>}<Button onClick={()=>setStep('school')}>학교 정보 수정</Button><Button onClick={()=>setStep('schedule')}>일정 수정</Button><Button onClick={()=>{setPhotoMode('assign');setStep('photos');}}>← 페이지별 사진 배정하기</Button><Button variant="primary" disabled={saving||!dirty} onClick={()=>void saveWorking()}>{saving?'저장 중…':!dirty&&activeProject?'저장됨':'내 프로젝트에 저장'}</Button></div>
      </>}

      {step === 'projects' && <>
        {heading('내 프로젝트','저장한 달력을 이어서 만드세요','로그인 없이 이 브라우저에 저장한 프로젝트를 다시 열 수 있어요.')}
        <ProjectLibrary onDeleted={id=>{if(activeProject?.id===id){setActiveProject(null);setSavedSignature('');setSaveNotice('저장본을 삭제했어요. 열어 둔 입력 내용은 새 프로젝트로 저장할 수 있어요.');}}} onOpen={openWorking} hasWorking={Boolean(selected)} onResume={()=>setStep(resumeStep.current)} refresh={libraryVersion}/>
        <div className="actions"><Button onClick={catalogHome}>새 달력 만들기</Button></div>
      </>}
    </main>
    <footer className="site-footer"><span>학교 자료만 준비하세요. 디자인은 이미 완성되어 있어요.</span><span>개발 검토용 · 실제 주문 서비스 아님</span></footer>

    <dialog ref={previewRef} className="preview-dialog" onCancel={() => setPreviewOpen(false)} onClose={() => setPreviewOpen(false)} aria-labelledby="preview-title" onKeyDown={event => {
      if (event.key === 'ArrowRight' && selected) setPreviewIndex(index => Math.min(selected.pages.length - 1, index + 1));
      if (event.key === 'ArrowLeft') setPreviewIndex(index => Math.max(0, index - 1));
    }}>
      {selected && previewOpen && <><div className="preview-header"><div><h2 id="preview-title">{selected.pages[previewIndex]?.label}</h2><p className="muted">{nativeSource?'템플릿 원본':'공통 참고 이미지'} · {previewIndex + 1} / {selected.pageCount}면</p></div><Button onClick={() => setPreviewOpen(false)}>닫기 ×</Button></div>{nativeSource?<NativePreview project={nativeSource} pageId={nativeSource.book.pageInstances[previewIndex].id}/>:<PreviewImage className="preview-image" url={selected.pages[previewIndex]?.imageUrl ? selected.pages[previewIndex].largeImageUrl||(selected.pages[previewIndex].imageUrl!.startsWith('blob:')?selected.pages[previewIndex].imageUrl!:`${selected.pages[previewIndex].imageUrl}?size=large`) : null} label={selected.pages[previewIndex]?.label || '페이지'} />}<div className="preview-controls"><Button disabled={previewIndex === 0} onClick={() => setPreviewIndex(index => index - 1)}>← 이전 면</Button><span aria-live="polite">{previewIndex + 1} / {selected.pageCount}</span><Button disabled={previewIndex === selected.pages.length - 1} onClick={() => setPreviewIndex(index => index + 1)}>다음 면 →</Button></div></>}
    </dialog>
  </div>;
}

function Progress({active=2}:{active?:2|3}) {return <ol className="journey progress" aria-label="달력 제작 과정"><li className="progress-complete"><span aria-label="완료">✓</span>디자인 선택</li><li className={active===3?'progress-complete':undefined} aria-current={active===2?'step':undefined}><span aria-label={active===3?'완료':undefined}>{active===3?'✓':'2'}</span>학교 자료 입력</li><li aria-current={active===3?'step':undefined}><span>3</span>달력 확인</li></ol>;}
function GuideRow({number, title, text}: {number: string; title: string; text: string}) {return <Panel className="guide-row"><span className="guide-number">{number}</span><div><h2>{title}</h2><p className="muted">{text}</p></div></Panel>;}

function PreviewImage({url, label, className = '', decorative = false, eager = false}: {url?: string | null; label: string; className?: string; decorative?: boolean; eager?: boolean}) {
  return url ? <img className={className} src={url} alt={decorative ? '' : `${label} 미리보기`} loading={eager?'eager':'lazy'} /> : <div className={`preview-placeholder ${className}`} role="img" aria-label={`${label}: 이미지 연결 대기`}><strong>{label}</strong><span>미리보기 연결 대기</span></div>;
}

function MaterialStage({active}:{active:1|2|3}){return <div className="input-stage">{["학교 정보","학사일정","사진"].map((label,index)=><span className={index+1===active?"input-stage-current":""} key={label} aria-current={index+1===active?"step":undefined}>{label}</span>)}</div>;}

function PhotoSubsteps({active}:{active:1|2|3}){return <div className="photo-workflow"><ol className="photo-substeps" aria-label="사진 입력 및 자료 확인 단계">{['사진을 라이브러리에 미리 등록하기','페이지별 사진 배정하기','입력한 자료 최종 확인하기'].map((label,index)=><li key={label} className={active===index+1?'is-current':active>index+1?'is-complete':''} aria-current={active===index+1?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol></div>;}
