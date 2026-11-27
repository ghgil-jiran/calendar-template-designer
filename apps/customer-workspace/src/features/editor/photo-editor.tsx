'use client';
import {SchoolCalendarBrandMark, SchoolCalendarCaption} from '@/components/school-calendar-brand';
import {memo,useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {NativePreview} from '@/features/materials/native-preview';
import {photoPageLabel,photoSlotsForProject,type NativeProject} from '@/lib/materials/native-project';
import {canvasKeyboardCommand,createEditorSession,type EditorState,type EditorTarget,type PhotoFit,type ElementLayout,type TextStyle,type PublishedIllustration} from '@/lib/editor/session';
import {academicMonths} from '@/lib/materials/schedule-review';
import {addPhotoFiles} from '@/lib/materials/photo-files';
import type {SchoolField,SchoolInput,ScheduleEvent} from '@/lib/api/contracts';
import {LeaveEditorDialog} from './leave-editor-dialog';
import {MaterialsDialog} from './materials-dialog';
import {ProductionGuideLegend,ProductionGuides} from './production-guides';
import type {SchoolImageDraft} from './materials-dialog';
import {TemplatePicker} from './template-picker';
import type {TemplateCard} from '@/lib/api/contracts';
import {editorThemeColors} from './color-palette';
import {ObjectTools,TextFormattingToolbar,ToolIcon} from './object-tools';
import {PhotoInput,type PhotoFile} from '@/features/materials/photo-input';
const documentHasOpenOverlay=(node:HTMLElement)=>node.ownerDocument.querySelector('dialog[open], :popover-open')!==null;
const defaults:PhotoFit={fit:'cover',scale:1,offsetX:0,offsetY:0};
function readFit(item:NativeProject|undefined,target:EditorTarget):PhotoFit{return {fit:item?.image?.fit||item?.fit||(target.type==='semantic-object'&&(['school-logo','school-song'].includes(target.role)||item?.layoutPreset==='image-only')?'contain':'cover'),scale:Number(item?.image?.scale||1),offsetX:Number(item?.image?.offsetX||0),offsetY:Number(item?.image?.offsetY||0)};}
const same=(a:EditorTarget|null,b:EditorTarget)=>a?.elementId===b.elementId&&a.scope===b.scope&&a.pageId===b.pageId;
const resizeDirections=['nw','n','ne','e','se','s','sw','w'] as const;
type ResizeDirection=typeof resizeDirections[number];
const textEdges=['n','e','s','w'] as const;
function dragLayout(frame:ElementLayout,dx:number,dy:number,direction?:ResizeDirection):ElementLayout{
 const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
 if(!direction)return {...frame,x:clamp(frame.x+dx,0,100-frame.width),y:clamp(frame.y+dy,0,100-frame.height)};
 const right=frame.x+frame.width,bottom=frame.y+frame.height;
 const x=direction.includes('w')?clamp(frame.x+dx,0,right-.2):frame.x;
 const y=direction.includes('n')?clamp(frame.y+dy,0,bottom-.2):frame.y;
 const nextRight=direction.includes('e')?clamp(right+dx,x+.2,100):right;
 const nextBottom=direction.includes('s')?clamp(bottom+dy,y+.2,100):bottom;
 return {x,y,width:nextRight-x,height:nextBottom-y};
}
function placeTarget(node:HTMLButtonElement|null,target:EditorTarget){if(!node)return;Object.assign(node.style,{left:target.x+'%',top:target.y+'%',width:target.width+'%',height:target.height+'%',transform:`rotate(${target.rotation}deg)`});}
const editorPageLabel=(project:NativeProject,page:NativeProject,index:number)=>project.productType.category==='poster'?`${index+1}페이지`:photoPageLabel(page,index);
const PageThumbnail=memo(function PageThumbnail({project,pageId }:{project:NativeProject;pageId:string;signature:string}){const host=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);useEffect(()=>{if(!host.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{root:host.current.closest('nav'),rootMargin:'80px'});observer.observe(host.current);return()=>observer.disconnect();},[]);return <div className="editor-mini-page" ref={host}>{visible&&<NativePreview compact project={project} pageId={pageId}/>}</div>;},(a,b)=>a.pageId===b.pageId&&a.signature===b.signature);
export function PhotoEditor({onOrder,calendarDefaults,onTemplateChange,paperOptions,templateName,templates,currentTemplateId,onHome,onNavigationPause,project,photos,onPhotos,initialState,onChange,onProjects,school,events,fields,onFieldChange,onFieldHide,onSchoolPhoto,onMaterialsSave,name,saving,onSave,assignedPhotoIds=[],commonPhotoIds={},saveFailure='' }:{onOrder:(save:boolean,name?:string)=>Promise<boolean>;calendarDefaults:NonNullable<SchoolInput['calendarDisplay']>;onTemplateChange:(template:TemplateCard,save:boolean,name?:string)=>Promise<void>;paperOptions?:[TemplateCard,TemplateCard];templateName:string;templates:TemplateCard[];currentTemplateId:string;onHome:(save:boolean,name?:string)=>Promise<boolean>;onNavigationPause:(paused:boolean)=>void;project:NativeProject;photos:PhotoFile[];onPhotos:(photos:PhotoFile[])=>void;initialState?:EditorState;onChange:(state:EditorState)=>void;onProjects:(save:boolean,name?:string)=>Promise<boolean>;school:SchoolInput;events:ScheduleEvent[];fields:SchoolField[];onFieldChange:(key:string,value:string)=>void;onFieldHide:(key:string,hidden:boolean)=>void;onSchoolPhoto:(binding:string,photo:PhotoFile)=>void;onMaterialsSave:(school:SchoolInput,events:ScheduleEvent[],images?:SchoolImageDraft[])=>Promise<boolean>;name:string;saving:boolean;onSave:()=>Promise<boolean>;assignedPhotoIds?:string[];commonPhotoIds?:Record<string,string>;saveFailure?:string}){
 const [session]=useState(()=>createEditorSession({project,state:initialState,assets:photos.map(p=>({id:p.id,url:p.url}))}));
 const [wallScheduleOverflow,setWallScheduleOverflow]=useState(false);
 const [revision,setRevision]=useState(0),[selection,setSelection]=useState<EditorTarget|null>(null),[fit,setFit]=useState<PhotoFit>(defaults),[failure,setFailure]=useState(''),[message,setMessage]=useState(''),[tab,setTab]=useState<'all'|'school'|'monthly'>('all'),[libraryOpen,setLibraryOpen]=useState(false),[hover,setHover]=useState(''),[zoom,setZoom]=useState(100),[draggingPhoto,setDraggingPhoto]=useState(false),[uploading,setUploading]=useState(false),[preview,setPreview]=useState<number|null>(null),[previewSingle,setPreviewSingle]=useState(false);
 const [templatePending,setTemplatePending]=useState(false),[fitZoom,setFitZoom]=useState(100),[fitMode,setFitMode]=useState(true);
 const [initialPosterZoom,setInitialPosterZoom]=useState(project.productType.category==='poster');

 const [leaveOpen,setLeaveOpen]=useState<'home'|'projects'|'order'|null>(null);
 const [templatePickerOpen,setTemplatePickerOpen]=useState(false);
 const [materials,setMaterials]=useState<'school'|'schedule'|null>(null);
 const [imageSaving,setImageSaving]=useState(false),[imageSaveError,setImageSaveError]=useState('');
 const [imageDialog,setImageDialog]=useState(false),[clipboard,setClipboard]=useState<EditorTarget|null>(null);
 const [pendingSchool,setPendingSchool]=useState(false);
 useEffect(()=>{onNavigationPause(Boolean(leaveOpen)||materials!==null||pendingSchool||templatePending);return()=>onNavigationPause(false);},[leaveOpen,materials,pendingSchool,templatePending,onNavigationPause]);
 const [sharing,setSharing]=useState({layout:false,image:false});
 useEffect(()=>{if(!pendingSchool)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[pendingSchool]);
 const uploadAlive=useRef(true);useEffect(()=>{uploadAlive.current=true;return()=>{uploadAlive.current=false;};},[]);
 const [objectPicker,setObjectPicker]=useState<'illustration'|'shape'|'frame'|null>(null);
 const pickerId=useId();
 const pickerTrigger=useRef<HTMLButtonElement>(null);
 const [addToolsOpen,setAddToolsOpen]=useState(false);
 const addToolsId=useId();
 const addToolsPanel=useRef<HTMLDivElement>(null);
 const addToolsButton=useRef<HTMLButtonElement>(null);
 const properties=useRef<HTMLElement>(null);
 const addImageInput=useRef<HTMLInputElement>(null);
 const strip=useRef<HTMLElement>(null);
 const stage=useRef<HTMLDivElement>(null),wrap=useRef<HTMLDivElement>(null),surface=useRef<HTMLDivElement>(null);
 const wheelAnchor=useRef<{x:number;y:number;clientX:number;clientY:number}|null>(null);
 const document=useMemo(()=>{session.setProject(project);session.setAssets(photos.map(p=>({id:p.id,url:p.url})));return session.getDocument();},[session,revision,project,photos]),state=session.getState(),pages=project.book.pageInstances as NativeProject[];
 const canAddText=session.canAddObject('text'),canAddImage=session.canAddObject('image');
 const canAddExtras=session.canAddObject('illustration')||session.canAddObject('shape')||session.canAddObject('frame');
 const showAddTools=addToolsOpen&&(canAddText||canAddImage||canAddExtras);
 function closeObjectPicker(){
  setObjectPicker(null);
  pickerTrigger.current?.focus();
 }
 function closeAddTools(){
  setObjectPicker(null);
  setAddToolsOpen(false);
  addToolsButton.current?.focus();
 }
 function addText(){
  act(()=>{
   select(session.addObject('text'));
   requestAnimationFrame(()=>{
    const field=properties.current?.querySelector<HTMLTextAreaElement>('textarea');
    field?.focus();
    field?.select();
   });
  });
 }
 const materialSignature=useMemo(()=>JSON.stringify({school:project.book.school,events:project.book.events,calendar:project.settings.calendarData}),[project]);
 const targets=session.targets(state.pageId).map(t=>({...t,...state.edits.find(e=>same(t,{...e} as EditorTarget))?.layout}));
 const editableTargets=targets.filter(t=>Object.values(t.rights).some(Boolean)&&!state.edits.some(e=>same(t,e as EditorTarget)&&e.hidden)).sort((a,b)=>a.type==='calendar-grid'?-1:b.type==='calendar-grid'?1:(Number(selectedItem(a)?.zIndex)||0)-(Number(selectedItem(b)?.zIndex)||0)),counterparts=selection?session.counterparts(selection):[],selected=selection?selectedItem(selection):undefined;
 const layoutCount=selection?.rights.move&&selection.rights.resize?counterparts.filter(t=>t.rights.move&&t.rights.resize).length:0,imageCount=selection?.binding==='school.profile.logo'?0:counterparts.filter(t=>t.rights.replaceImage).length;
 const schoolImageLinked=!!selection?.binding.startsWith('school.profile.')&&(selection.binding==='school.profile.logo'||counterparts.length===0);
 const used=new Set([...assignedPhotoIds,...state.edits.flatMap(e=>e.photoId?[e.photoId]:[])]),visiblePhotos=photos.filter(p=>tab==='all'||p.category===tab||p.category==='both'||!p.category&&tab==='monthly');
 useLayoutEffect(()=>{if(!stage.current||!wrap.current)return;const host=stage.current,pageWrap=wrap.current,fitPage=()=>{if(!host.isConnected||!pageWrap.isConnected)return;const width=Math.max(100,host.clientWidth-40),height=Math.max(180,host.clientHeight-40),ratio=Number(project.productType.pageSize.width)/Number(project.productType.pageSize.height);const fitted=Math.min(width,height*ratio);setFitZoom(Math.round(fitted/850*100));pageWrap.style.width=(fitMode?(initialPosterZoom?Math.max(fitted,595):fitted):850*zoom/100)+'px';
 const anchor=wheelAnchor.current;
 if(anchor){
  const bounds=pageWrap.getBoundingClientRect();
  host.scrollLeft+=bounds.left+bounds.width*anchor.x-anchor.clientX;
  host.scrollTop+=bounds.top+bounds.height*anchor.y-anchor.clientY;
  wheelAnchor.current=null;
 }};fitPage();const observer=new ResizeObserver(fitPage);observer.observe(host);return()=>observer.disconnect();},[zoom,fitMode,initialPosterZoom,project.productType.pageSize.width,project.productType.pageSize.height]);
 const shownZoom=fitMode?(initialPosterZoom?Math.max(fitZoom,70):fitZoom):zoom;
 useEffect(()=>{
  const host=stage.current,pageWrap=wrap.current;
  if(!host||!pageWrap)return;
  const wheel=(event:WheelEvent)=>{
   if(event.ctrlKey||event.deltaY===0||Math.abs(event.deltaX)>Math.abs(event.deltaY)||(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]')))return;
   event.preventDefault();
   const next=Math.min(Math.max(150,shownZoom),Math.max(25,shownZoom+(event.deltaY<0?5:-5)));
   if(next===shownZoom)return;
   const rect=pageWrap.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   wheelAnchor.current={x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height,clientX:event.clientX,clientY:event.clientY};
   setZoom(next);setFitMode(false);
  };
  host.addEventListener('wheel',wheel,{passive:false});
  return()=>host.removeEventListener('wheel',wheel);
 },[shownZoom]);
 const pageIndex=pages.findIndex(p=>p.id===state.pageId);
 const activePage=pages[pageIndex];
 const month=project.productType.category!=='poster'&&activePage?.calendarMonth
  ?academicMonths(Number(project.settings.year),Number(project.settings.startMonth||3)).find(period=>Number(period.key.slice(5))===Number(activePage.calendarMonth))
  :undefined;
 const pageEditingGuide=[targets.some(t=>t.rights.replaceImage)?'이미지 변경':null,targets.some(t=>t.rights.imageFit)?'사진 맞춤':null].filter(Boolean).join('과 ');

 function changed(){setRevision(v=>v+1);onChange(session.getState());setFailure('');}
 function act(job:()=>unknown){try{job();changed();}catch(error){setFailure(error instanceof Error?error.message:'편집을 적용하지 못했어요.');}}
 function selectedItem(target:EditorTarget,doc=document){const page=doc.book.pageInstances.find((p:NativeProject)=>p.id===target.pageId);return (doc.book.elementsByPage?.[target.pageId]||[]).find((e:NativeProject)=>e.id===target.elementId||target.scope==='master'&&e.shadowOfMasterElementId===target.elementId)||(doc.template.masterElements?.[page.masterId]||[]).find((e:NativeProject)=>e.id===target.elementId);}
 function select(target:EditorTarget){if(!same(selection,target))setSharing({layout:false,image:false});session.select(target);setSelection(target);setFit(readFit(selectedItem(target,session.getDocument()),target));setFailure('');}
 function assign(target:EditorTarget,photo:PhotoFile){const scope=same(selection,target)?sharing:{layout:false,image:false};select(target);if(target.binding.startsWith('school.profile.')&&(target.binding==='school.profile.logo'||session.counterparts(target).length===0)){act(()=>session.resetBoundPhotos(target.binding));onSchoolPhoto(target.binding,photo);setMessage('학교 공통 이미지를 교체했어요.');}else act(()=>{session.editPhoto({photoId:photo.id},{imageAll:scope.image});setFit(readFit(selectedItem(target,session.getDocument()),target));setMessage(`‘${photo.file.name}’ 사진을 넣었어요.`);});}
 function changeSharing(kind:'layout'|'image',checked:boolean){if(checked){try{session.applyAcrossPages({[kind]:true});changed();setSharing(p=>({...p,[kind]:true}));setMessage('대응하는 개체에 적용했어요.');}catch(error){setFailure(error instanceof Error?error.message:'공통 적용하지 못했어요.');}}else setSharing(p=>({...p,[kind]:false}));}
 function changeFit(next:PhotoFit){act(()=>{session.editPhoto({fit:next});setFit(next);});}
 function textStyle(patch:TextStyle){act(()=>session.editPhoto({textStyle:patch}));}
 function nudge(event:React.KeyboardEvent,target=selection){
  if(!target?.rights.move||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||
    documentHasOpenOverlay(event.currentTarget as HTMLElement)||
    (event.target instanceof HTMLElement&&event.target.isContentEditable))return;
  const command=canvasKeyboardCommand(event.nativeEvent,(event.target as Element).tagName,true,project.productType.pageSize);
  if(command?.type!=='nudge')return;
  event.preventDefault();
  const item=selectedItem(target,session.getDocument());
  if(!item)return;
  const frame={x:item.x,y:item.y,width:item.width,height:item.height};
  const layout=dragLayout(frame,command.deltaX,command.deltaY);
  if(layout.x===frame.x&&layout.y===frame.y)return;
  if(!same(selection,target))select(target);
  act(()=>session.editPhoto({layout},{monthlyPosition:true,layoutAll:activePage?.role!=='monthly-front'&&same(selection,target)&&sharing.layout}));
 }
 function drag(event:React.PointerEvent,target:EditorTarget,direction?:ResizeDirection){
  if(!event.isPrimary||event.button!==0||!(direction?target.rights.resize:target.rights.move))return;
  const node=event.currentTarget as HTMLElement;
  const box=node.closest<HTMLElement>('.editor-target');
  const rect=surface.current?.getBoundingClientRect();
  if(!box||!rect?.width||!rect.height)return;
  event.preventDefault();
  event.stopPropagation();
  box.focus({preventScroll:true});
  const shareLayout=same(selection,target)&&sharing.layout&&(!!direction||activePage?.role!=='monthly-front');
  select(target);
  const {clientX,clientY,pointerId}=event;
  const {x,y,width,height}=selectedItem(target);
  const frame={x,y,width,height};
  const offset=(e:PointerEvent)=>[(e.clientX-clientX)/rect.width*100,(e.clientY-clientY)/rect.height*100] as const;
  const display=(layout:ElementLayout)=>Object.assign(box.style,{left:layout.x+'%',top:layout.y+'%',width:layout.width+'%',height:layout.height+'%'});
  function cleanup(){
   node.removeEventListener('pointermove',move);
   node.removeEventListener('pointerup',finish);
   node.removeEventListener('pointercancel',cancel);
   node.removeEventListener('lostpointercapture',cancel);
   if(node.hasPointerCapture(pointerId))node.releasePointerCapture(pointerId);
  }
  function move(e:PointerEvent){
   if(e.pointerId===pointerId)display(dragLayout(frame,...offset(e),direction));
  }
  function finish(e:PointerEvent){
   if(e.pointerId!==pointerId)return;
   cleanup();
   const [dx,dy]=offset(e);
   if(Math.abs(dx)+Math.abs(dy)<.1){display(frame);return;}
   try{
    session.editPhoto({layout:dragLayout(frame,dx,dy,direction)},{layoutAll:shareLayout,monthlyPosition:!direction});
    changed();
   }catch(error){
    display(frame);
    setFailure(error instanceof Error?error.message:'배치를 반영하지 못했어요.');
   }
  }
  function cancel(e:PointerEvent){
   if(e.pointerId!==pointerId)return;
   cleanup();
   display(frame);
  }
  node.setPointerCapture(pointerId);
  node.addEventListener('pointermove',move);
  node.addEventListener('pointerup',finish);
  node.addEventListener('pointercancel',cancel);
  node.addEventListener('lostpointercapture',cancel);
 }

 async function upload(files:File[],addObject=false){if(uploading||!files.length)return;setUploading(true);setFailure('');try{const result=await addPhotoFiles(photos,files,tab==='school'?'school':'monthly');if(!uploadAlive.current){result.created.forEach(URL.revokeObjectURL);return;}session.setAssets(result.photos.map(p=>({id:p.id,url:p.url})));onPhotos(result.photos);if(addObject){const photo=result.photos.find(p=>!photos.some(existing=>existing.id===p.id));if(photo)act(()=>select(session.addObject('image',photo.id)));}setFailure(result.errors.join(' '));setMessage(`${result.created.length}장의 사진을 이미지 라이브러리에 추가했어요.`);}catch(error){if(uploadAlive.current)setFailure(error instanceof Error?error.message:'사진을 추가하지 못했어요.');}finally{if(uploadAlive.current)setUploading(false);}}
 function changePage(id:string){session.setPage(id);setSelection(null);setSharing({layout:false,image:false});setMessage('');changed();}
 const actionsDisabled=saving||uploading||pendingSchool||templatePending;
 return <div className={`editor-shell ${draggingPhoto?'dragging-photo':''}`} onKeyDown={e=>{
  if(e.key==='Escape'&&showAddTools&&!e.defaultPrevented&&!documentHasOpenOverlay(e.currentTarget)){
   e.preventDefault();
   if(objectPicker)closeObjectPicker();else closeAddTools();
  }
  if(!showAddTools&&!templatePickerOpen&&preview===null&&e.target instanceof Element&&
    !e.target.closest('input,textarea,select,button:not(.editor-target),[role="slider"],[role="menu"]'))nudge(e);

 }}>
 <header className="editor-topbar"><div className="editor-title"><h1><button type="button" className="editor-home-brand" disabled={saving||uploading} onClick={()=>setLeaveOpen('home')} aria-label="우리학교달력 BETA 첫 화면으로 이동"><SchoolCalendarBrandMark/></button></h1><SchoolCalendarCaption/></div><div className="editor-top-actions">
   <Button variant="primary" disabled={actionsDisabled} onClick={()=>setLeaveOpen('order')}>주문하기</Button>
   <Button disabled={actionsDisabled} onClick={()=>setLeaveOpen('projects')}>내 프로젝트</Button>
 </div></header>

 <div className={failure||saveFailure?'editor-feedback':'sr-only'} role={failure||saveFailure?'alert':'status'}>{failure||saveFailure||message}</div>
 <div className="editor-mobile-tools"><Button aria-expanded={libraryOpen} onClick={()=>setLibraryOpen(v=>!v)}>정보 수정</Button><span>{pageIndex+1} / {pages.length}면</span></div>
 <div className="editor-workspace">
 <aside className={`editor-library ${libraryOpen?'is-open':''}`} aria-label="이미지 라이브러리"><div className="editor-panel-heading editor-template-heading"><TemplatePicker paperOptions={paperOptions} projectName={name} open={templatePickerOpen} setOpen={setTemplatePickerOpen} title={templateName} pageId={state.pageId} templates={templates} currentId={currentTemplateId} onChange={onTemplateChange} onPendingChange={setTemplatePending} disabled={saving||pendingSchool||uploading}/></div><div className="editor-library-heading"><Button disabled={saving} onClick={()=>setMaterials('school')}><ToolIcon name="school"/><span>학교 정보</span></Button><Button disabled={saving} onClick={()=>setMaterials('schedule')}><ToolIcon name="schedule"/><span>학사 일정</span></Button><Button disabled={saving} onClick={()=>setImageDialog(true)}><ToolIcon name="image"/><span>이미지 추가</span></Button></div><div className="editor-library-tabs" role="group" aria-label="사진 종류">{([['all','전체'],['school','학교 공통'],['monthly','월별 사진']] as const).map(([key,label])=><button type="button" key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div><div className="editor-bank-heading"><span>{tab==='school'?'학교 공통 이미지':tab==='monthly'?'월별 사진':'전체 사진'}</span><small>{visiblePhotos.length}장</small></div><div className="editor-photo-bank">{visiblePhotos.map(photo=><button className="editor-photo-thumb" type="button" key={photo.id} draggable aria-label={`사진 넣기: ${photo.file.name}`} onDragEnd={()=>{setDraggingPhoto(false);setHover('');}} onDragStart={e=>{setDraggingPhoto(true);e.dataTransfer.clearData();e.dataTransfer.setData('application/x-calendar-photo',photo.id);e.dataTransfer.effectAllowed='copy';}} onClick={()=>{if(!selection?.rights.replaceImage){setMessage('달력에서 사진을 넣을 영역을 먼저 선택해 주세요.');return;}assign(selection,photo);setLibraryOpen(false);}}><img src={photo.url} alt={photo.file.name} loading="lazy" draggable={false}/>{used.has(photo.id)&&<small>사용</small>}</button>)}</div>{!visiblePhotos.length&&<p className="editor-empty">사진이 없어요. 위의 ‘이미지 추가’로 이미지를 올려 주세요.</p>}</aside>
 <main className="editor-stage" aria-label="달력 편집 작업 공간"> <div className="editor-commandbar" role="toolbar" aria-label="편집 도구">{(canAddText||canAddImage||canAddExtras)&&<div className="editor-command-group">
  <button type="button" ref={addToolsButton} className="button button-secondary editor-add-tools-toggle" aria-expanded={showAddTools} aria-controls={showAddTools?addToolsId:undefined} onClick={()=>{
   if(showAddTools){closeAddTools();return;}
   setAddToolsOpen(true);
   requestAnimationFrame(()=>addToolsPanel.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());
  }}>개체 추가</button>
  {canAddImage&&<input ref={addImageInput} type="file" accept="image/*" hidden onChange={e=>{void upload(Array.from(e.target.files||[]),true);e.target.value='';}}/>}
 </div>}
 {selection?.rights.layer&&<div className="editor-command-group" role="group" aria-label="레이어 순서">{(['forward','backward','front','back'] as const).map((direction,index)=><Button key={direction} title={['앞으로','뒤로','맨 앞으로','맨 뒤로'][index]} aria-label={['앞으로','뒤로','맨 앞으로','맨 뒤로'][index]} onClick={()=>act(()=>session.moveLayer(direction))}>{['↑','↓','⇈','⇊'][index]}</Button>)}</div>}
 <div className="editor-command-group"><Button title="실행 취소" disabled={!session.canUndo()} onClick={()=>act(()=>{session.undo();setSelection(null);})}><ToolIcon name="undo"/><span className="sr-only">실행 취소</span></Button><Button title="다시 실행" disabled={!session.canRedo()} onClick={()=>act(()=>{session.redo();setSelection(null);})}><ToolIcon name="redo"/><span className="sr-only">다시 실행</span></Button></div><div className="editor-command-group"><Button title="복사" aria-label="복사" disabled={!selection||!!selection.rights.calendarStyle||!!selection.rights.scheduleStyle||!selection.rights.duplicate} onClick={()=>{setClipboard(selection);setMessage('개체를 복사했어요.');}}><ToolIcon name="copy"/></Button><Button title="붙여넣기" aria-label="붙여넣기" disabled={!clipboard} onClick={()=>act(()=>{session.select(clipboard);const target=session.duplicate();setSelection(target);})}><ToolIcon name="paste"/></Button><Button title="삭제" aria-label="삭제" disabled={!selection?.rights.visibility} onClick={()=>act(()=>{session.remove();setSelection(null);})}><ToolIcon name="delete"/></Button></div>{selection?.rights.textStyle&&<TextFormattingToolbar theme={editorThemeColors(document.template.resources?.colorTheme)} disabled={!selection.rights.textStyle} style={selected?.style||{}} onChange={textStyle}/>}<div className="editor-command-actions">{selection?.rights.replaceImage&&<Button title="사진 교체" aria-label="사진 교체" onClick={()=>{setLibraryOpen(true);}}><ToolIcon name="image"/></Button>}<div className="editor-zoom-control" role="group" aria-label="캔버스 확대 축소"><Button aria-label="화면 축소" title="화면 축소" disabled={(shownZoom)<=25} onClick={()=>{setZoom(Math.max(25,(shownZoom)-5));setFitMode(false);}}>−</Button><input type="range" aria-label="화면 배율" min="25" max="150" step="1" value={Math.max(25,Math.min(150,shownZoom))} onChange={e=>{setZoom(Number(e.target.value));setFitMode(false);}}/><Button aria-label="화면 확대" title="화면 확대" disabled={(shownZoom)>=150} onClick={()=>{setZoom(Math.min(150,(shownZoom)+5));setFitMode(false);}}>＋</Button><Button className="editor-zoom-percent" title="화면 맞춤으로 전환" onClick={()=>{setInitialPosterZoom(false);setFitMode(true);}}>{shownZoom}%</Button><Button className="editor-zoom-fit" aria-pressed={fitMode&&!initialPosterZoom} onClick={()=>{setInitialPosterZoom(false);setFitMode(true);}}>화면 맞춤</Button></div><details className="editor-preview-menu"><summary>미리보기 ▾</summary><div><Button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setPreviewSingle(true);setPreview(pageIndex);}}>현재 페이지 미리보기</Button><Button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setPreviewSingle(false);setPreview(0);}}>전체 페이지 미리보기</Button></div></details></div></div><div className="editor-stage-viewport">
 {showAddTools&&<div className="editor-add-popover"><div ref={addToolsPanel} id={addToolsId} className="editor-add-tools" role="group" aria-label="추가할 개체">
  {canAddImage&&<Button disabled={uploading} onClick={()=>addImageInput.current?.click()}><ToolIcon name="image"/>그림</Button>}
  {(['illustration','shape','frame'] as const).map(kind=>session.canAddObject(kind)&&
   <Button key={kind} aria-expanded={objectPicker===kind} aria-controls={objectPicker===kind?pickerId:undefined} onClick={e=>{
    pickerTrigger.current=e.currentTarget;
    setObjectPicker(current=>current===kind?null:kind);
   }}><ToolIcon name={kind}/>{{illustration:'일러스트',shape:'도형',frame:'프레임'}[kind]}</Button>)}
  {canAddText&&<Button onClick={addText}><ToolIcon name="text-box"/>텍스트 상자</Button>}
  <Button className="editor-add-tools-close" aria-label="개체 추가 닫기" onClick={closeAddTools}>×</Button>
 </div>
 {objectPicker&&<PageObjectPicker key={objectPicker} id={pickerId} kind={objectPicker} onClose={closeObjectPicker} onPick={value=>{
  act(()=>select(session.addObject(objectPicker,value)));
  closeObjectPicker();
 }}/>}
 </div>}
 <div className="editor-stage-scroll" ref={stage}><div className="editor-page-wrap" ref={wrap}><div className="editor-canvas" ref={surface} onClick={e=>{if(!(e.target as HTMLElement).closest('.editor-target')){session.select(null);setSelection(null);}}}><NativePreview compact guides project={document} pageId={state.pageId} onWallScheduleOverflow={setWallScheduleOverflow}/><ProductionGuides project={document} pageId={state.pageId}/><div className="editor-targets">{editableTargets.map((target,i)=><button key={`${target.scope}:${target.elementId}`} type="button" aria-label={`${target.type==='calendar-grid'?'날짜 격자':target.type==='text'?'글자':'사진'} 영역 ${i+1} 선택: ${target.label}`} aria-pressed={same(selection,target)} className={`editor-target ${target.rights.replaceImage?'can-drop':''} ${target.type==='text'?'text-target':''} ${target.type!=='text'&&target.type!=='calendar-grid'&&target.rights.move?'movable-image':''} ${hover===target.elementId?'drop-active':''}`} ref={node=>placeTarget(node,target)} onClick={()=>select(target)} onPointerDown={e=>{if(target.type!=='text')drag(e,target);}} onKeyDown={e=>{if(!showAddTools&&!templatePickerOpen&&preview===null)nudge(e,target);}} onDragOver={e=>{if(target.rights.replaceImage&&e.dataTransfer.types.includes('application/x-calendar-photo')){e.preventDefault();e.dataTransfer.dropEffect='copy';setHover(target.elementId);}}} onDragLeave={()=>setHover('')} onDrop={e=>{e.preventDefault();setDraggingPhoto(false);setHover('');const photo=photos.find(p=>p.id===e.dataTransfer.getData('application/x-calendar-photo'));if(photo&&target.rights.replaceImage)assign(target,photo);}}><span className="sr-only">{target.label}</span>{target.type==='text'&&target.rights.move&&textEdges.map(edge=><span key={edge} className={`editor-text-edge ${edge}`} onPointerDown={e=>drag(e,target)} aria-hidden="true"/>)}{same(selection,target)&&<><span className="editor-object-tag">{target.label}</span>{target.rights.resize&&resizeDirections.map(direction=><span key={direction} className={`editor-resize-handle ${direction}`} onPointerDown={e=>drag(e,target,direction)} aria-hidden="true"/>)}</>}{hover===target.elementId&&<span className="editor-drop-label">여기에 사진 놓기</span>}</button>)}</div></div></div></div></div> <ProductionGuideLegend/><div className="editor-page-navigation"><Button aria-label="이전 페이지" disabled={pageIndex<=0} onClick={()=>{changePage(pages[pageIndex-1].id);strip.current?.children[pageIndex-1]?.scrollIntoView({block:'nearest',inline:'nearest'});}}>‹</Button><nav ref={strip} className="editor-page-strip" aria-label="달력 페이지 목록" onWheel={e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX))e.currentTarget.scrollLeft+=e.deltaY;}}>{pages.map((page,i)=><button type="button" key={page.id} aria-current={page.id===state.pageId?'page':undefined} aria-label={`${document.productType.category==='poster'?editorPageLabel(document,page,i):`${i+1}면 ${photoPageLabel(page,i)}`} 편집`} onClick={()=>changePage(page.id)}><PageThumbnail project={document} pageId={page.id} signature={materialSignature+state.logoMode+JSON.stringify(state.copies)+JSON.stringify(state.edits.filter(e=>e.pageId===page.id))}/><span>{document.productType.category==='poster'?editorPageLabel(document,page,i):`${i+1}. ${photoPageLabel(page,i)}`}</span></button>)}</nav><Button aria-label="다음 페이지" disabled={pageIndex>=pages.length-1} onClick={()=>{changePage(pages[pageIndex+1].id);strip.current?.children[pageIndex+1]?.scrollIntoView({block:'nearest',inline:'nearest'});}}>›</Button></div></main>
 <aside ref={properties} className="editor-properties" aria-label="편집 도구"><ObjectTools monthlySchedule={month?{month,events,saving,onSave:async nextEvents=>{
  const ok=await onMaterialsSave(school,nextEvents);
  if(ok)setMessage('학사 일정에 반영했어요.');
  return ok;
 }}:undefined} onFreeText={text=>act(()=>session.editPhoto({text}))} onFill={fill=>act(()=>session.editPhoto({fill}))} themeColors={editorThemeColors(document.template.resources?.colorTheme)} wallScheduleOverflow={wallScheduleOverflow} scheduleSizing={document.template.masters.calendar?.rangeEventStyle} onScheduleSizing={patch=>act(()=>session.setDeskScheduleSizing(patch))} scheduleStyle={document.template.masters.calendar?.rangeEventStyle?.displayMode} onScheduleStyle={mode=>act(()=>session.setDeskScheduleStyle(mode))} pageName={editorPageLabel(document,pages[pageIndex],pageIndex)} posterTemplateName={templateName} posterProject={document.productType.category==='poster'?document:undefined} editableTargets={editableTargets} onSelect={select} onCalendar={(calendarSettings,allPages)=>{
 const {includeHolidays,includeLunar,...style}=calendarSettings;
 if(typeof includeHolidays==='boolean'||typeof includeLunar==='boolean'){
  const calendarDisplay={...calendarDefaults,...school.calendarDisplay,
   ...(typeof includeHolidays==='boolean'?{includeHolidays}:{}),...(typeof includeLunar==='boolean'?{includeLunar}:{})};
  void onMaterialsSave({...school,calendarDisplay},events);
 }else act(()=>session.editPhoto({calendarSettings:style},{calendarAll:allPages}));
}} onPendingChange={setPendingSchool} logoMode={state.logoMode||'split'} onLogoMode={mode=>act(()=>{session.setLogoMode(mode);const target=session.targets(state.pageId).find(t=>same(selection,t))||null;setSelection(target);if(target)setFit(readFit(selectedItem(target,session.getDocument()),target));setMessage('모든 연결 페이지의 로고 구성을 변경했어요.');})} saving={saving} onReplaceImage={()=>{setLibraryOpen(true);setTab('all');setMessage('왼쪽 사진을 선택하거나 끌어 놓아 교체해 주세요.');}} onSchoolSave={async nextSchool=>{const ok=await onMaterialsSave(nextSchool,events);if(ok)setMessage('수정된 정보를 학교 정보에 저장했어요.');return ok;}} selection={selection} item={selected?.academicPoster?{...selected,wallCalendarSettings:{...project.template.calendarTypeSnapshot?.definition?.wallCalendarDefaults,...selected.wallCalendarSettings}}:selected} fields={fields} school={school} fit={fit} hasEditableTargets={editableTargets.length>0} schoolImageLinked={schoolImageLinked} sharing={{...sharing,layoutCount,imageCount,poster:project.productType.category==='poster'}} canReset={state.edits.some(e=>same(selection,e as EditorTarget)&&!!(e.photoId||e.photoCopy||e.fit))} onFieldChange={onFieldChange} onFieldHide={onFieldHide} onStyle={textStyle} onFrameStyle={frameStyle=>act(()=>session.editPhoto({frameStyle}))} onFit={changeFit} onShare={changeSharing} onReset={()=>act(()=>{session.resetPhoto({imageAll:sharing.image});if(selection)select(selection);})}/></aside>
 </div>
 {imageDialog&&<ImageLibraryDialog busy={imageSaving||saving} error={imageSaveError} onClose={()=>{setImageDialog(false);setImageSaveError('');}}><PhotoInput embedded stage="prepare" onStageChange={()=>{}} template={{} as never} project={project} pages={[]} pageId="" onPageId={()=>{}} selections={{}} onSelections={()=>{}} photos={photos} onPhotos={onPhotos} slots={photoSlotsForProject(project)} assignments={Object.fromEntries(photoSlotsForProject(project).flatMap(slot=>{const photo=photos.find(p=>p.id===commonPhotoIds[slot.binding||'']);return photo?[[slot.id,{photoId:photo.id,url:photo.url}]]:[];}))} onCommonPhoto={(binding,photo)=>{act(()=>session.resetBoundPhotos(binding));onSchoolPhoto(binding,photo);}} onAssignments={()=>{}} onBack={()=>{}} onNext={()=>{if(imageSaving||saving)return;setImageSaving(true);setImageSaveError('');void onSave().then(ok=>{if(ok)setImageDialog(false);else setImageSaveError('저장하지 못했어요. 이미지는 유지됩니다. 다시 저장해 주세요.');}).catch(()=>setImageSaveError('저장하지 못했어요. 이미지는 유지됩니다. 다시 저장해 주세요.')).finally(()=>setImageSaving(false));}}/></ImageLibraryDialog>}
 {leaveOpen&&<LeaveEditorDialog defaultName={name}
  title={leaveOpen==='home'?'첫 화면으로 이동할까요?':leaveOpen==='projects'?'내 프로젝트로 이동할까요?':'주문하기'}
  onLeave={leaveOpen==='home'?onHome:leaveOpen==='projects'?onProjects:onOrder}
  saveLabel={leaveOpen==='order'?'저장하고 주문하기':undefined}
  discardLabel={leaveOpen==='order'?'':undefined}
  onClose={()=>setLeaveOpen(null)}>
  {leaveOpen==='order'&&<p>현재 편집본과 사진 원본을 제작 검수에 접수합니다. 접수번호는 내 프로젝트에서 확인할 수 있어요.</p>}
 </LeaveEditorDialog>}
 {materials&&<MaterialsDialog calendarDefaults={calendarDefaults} photos={photos} commonPhotoIds={commonPhotoIds} slots={photoSlotsForProject(project)} kind={materials} school={school} events={events} fields={fields} year={Number(project.settings.year)} startMonth={Number(project.settings.startMonth||3)} onSave={async(nextSchool,nextEvents,images=[])=>{if(!await onMaterialsSave(nextSchool,nextEvents,images))return false;for(const image of images)session.resetBoundPhotos(image.binding);if(images.length){setSelection(null);changed();}return true;}} onClose={()=>setMaterials(null)}/>}
 {preview!==null&&<EditorPreview single={previewSingle} project={document} index={preview} onIndex={setPreview} onClose={()=>setPreview(null)}/>}

 </div>;
}

function EditorPreview({project,index,onIndex,onClose,single}:{single:boolean;project:NativeProject;index:number;onIndex:(index:number)=>void;onClose:()=>void}){const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{dialog.current?.showModal();},[]);const pages=project.book.pageInstances as NativeProject[];return <dialog className="editor-preview-dialog" ref={dialog} onCancel={e=>{e.preventDefault();onClose();}} aria-label="달력 미리보기"><div className="editor-preview-heading"><h2>{editorPageLabel(project,pages[index],index)} · {index+1} / {pages.length}면</h2><Button onClick={onClose}>미리보기 닫기 ×</Button></div><div className="editor-preview-page"><NativePreview project={project} pageId={pages[index].id}/></div>{!single&&<div className="editor-preview-navigation"><Button disabled={index===0} onClick={()=>onIndex(index-1)}>← 이전 면</Button><span>편집 결과 미리보기</span><Button disabled={index===pages.length-1} onClick={()=>onIndex(index+1)}>다음 면 →</Button></div>}</dialog>;}

function ImageLibraryDialog({children,onClose,busy,error}:{children:React.ReactNode;onClose:()=>void;busy:boolean;error:string}){const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{dialog.current?.showModal();},[]);return <dialog ref={dialog} className="editor-materials-dialog editor-image-library-dialog" aria-label="이미지를 라이브러리에 등록하기" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><header><h2>이미지 추가</h2><Button disabled={busy} onClick={onClose}>닫기 ×</Button></header><div className="editor-materials-body" inert={busy}>{children}</div>{busy&&<p role="status">저장 중…</p>}{error&&<p className="field-error" role="alert">{error}</p>}</dialog>;}


const objectPresets={
 shape:[['rect','사각형'],['rounded','둥근 사각형'],['circle','원'],['ellipse','타원'],['triangle','삼각형'],['diamond','마름모'],['pentagon','오각형'],['hexagon','육각형'],['octagon','팔각형'],['star','별'],['heart','하트'],['cross','십자'],['speech','말풍선'],['ribbon','리본'],['cloud','구름'],['arch','아치'],['line','실선'],['line-dashed','파선'],['line-dotted','점선'],['line-bold','굵은 실선']],
 frame:[['rect','사각 프레임'],['rounded','둥근 프레임'],['circle','원형 프레임'],['ellipse','타원 프레임']],
};
function PageObjectPicker({id,kind,onPick,onClose}:{id:string;kind:'illustration'|'shape'|'frame';onPick:(value:string|PublishedIllustration)=>void;onClose:()=>void}){
 const [items,setItems]=useState<PublishedIllustration[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  if(kind!=='illustration')return;
  const controller=new AbortController();
  void fetch('/api/workspace/illustrations',{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error();
   const catalog=await response.json();
   setItems(catalog.items);
  }).catch(()=>{if(!controller.signal.aborted)setError('일러스트 게시 목록에 연결하지 못했습니다. 잠시 후 다시 열어 주세요.');});
  return()=>controller.abort();
 },[kind]);
 const title={illustration:'일러스트',shape:'도형과 선',frame:'사진 프레임'}[kind];
 const svg=(item:PublishedIllustration)=>{
  if(item.image)return `/api/workspace/illustrations?id=${encodeURIComponent(item.id)}&version=${encodeURIComponent(item.image.version)}`;
  try{
   const renderer=(globalThis as typeof globalThis & {ACDLGraphicVectorObject?:{svg:(value:unknown)=>string}}).ACDLGraphicVectorObject;
   return renderer?`data:image/svg+xml,${encodeURIComponent(renderer.svg(item.vectorObject))}`:null;
  }catch{return null;}
 };
 return <section id={id} className="editor-object-picker" aria-label={title}>
  <header><h2>{title}</h2><Button aria-label={title+' 목록 닫기'} onClick={onClose}>×</Button></header>
  {error?<p role="alert">{error}</p>:kind==='illustration'?
   items===null?<p role="status">일러스트를 불러오는 중입니다.</p>:items.length===0?<p>아직 게시된 일러스트가 없습니다.</p>:
   <div className="editor-object-options">{items.map(item=>{const src=svg(item);return <Button key={item.id} disabled={!src} onClick={()=>onPick(item)}>{src&&<img src={src} alt="" loading="lazy"/>}{item.name}</Button>;})}</div>:
   <div className="editor-object-options">{objectPresets[kind].map(([preset,label])=><Button key={preset} onClick={()=>onPick(preset)}><span aria-hidden="true" className={`editor-object-sample ${kind} ${preset}`}/>{label}</Button>)}</div>}
 </section>;
}
