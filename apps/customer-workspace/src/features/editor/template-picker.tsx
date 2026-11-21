'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {LeaveEditorDialog} from './leave-editor-dialog';
import type {TemplateCard} from '@/lib/api/contracts';
export function TemplatePicker({projectName,templates,currentId,onChange,onPendingChange,disabled=false,pageId,title,open,setOpen,paperOptions,onPaperChange}:{projectName:string;templates:TemplateCard[];currentId:string;pageId:string;onChange:(template:TemplateCard,save:boolean,name?:string)=>Promise<void>;onPendingChange:(pending:boolean)=>void;disabled?:boolean;title:string;open:boolean;setOpen:(open:boolean)=>void;paperOptions?:[TemplateCard,TemplateCard];onPaperChange:(id:string)=>Promise<void>}){
 const host=useRef<HTMLDivElement>(null);
 const [paperBusy,setPaperBusy]=useState(false),[paperError,setPaperError]=useState('');
 const currentPaper=paperOptions?.find(item=>item.id===currentId);
 const sizeLabel=(item:TemplateCard)=>item.calendarKind==='poster'?(item.widthMm===420?'A2':'A3'):(item.widthMm===297?'확대형':'기본형');
 async function selectPaper(id:string){
  if(id===currentId||paperBusy||disabled)return;
  setPaperBusy(true);setPaperError('');onPendingChange(true);
  try{await onPaperChange(id);setOpen(false);}
  catch(error){setPaperError(error instanceof Error?error.message:'판형을 변경하지 못했어요.');}
  finally{setPaperBusy(false);onPendingChange(false);}
 }
 const [candidate,setCandidate]=useState<TemplateCard|null>(null);
 useEffect(()=>{onPendingChange(candidate!==null);return()=>onPendingChange(false);},[candidate,onPendingChange]);
 useEffect(()=>{setOpen(false);},[pageId,setOpen]);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!host.current?.contains(e.target as Node)&&!candidate&&!paperBusy)setOpen(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!candidate&&!paperBusy)setOpen(false);};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);};},[open,candidate,paperBusy,setOpen]);
 const displayedTemplates=templates.some(t=>t.id===currentId)||!currentPaper?[...templates]:[currentPaper,...templates];
 return <div className="editor-template-picker" ref={host}>
  <div className="editor-template-title">
   <h2 title={title}>{title}</h2>
   <button type="button" className="editor-template-trigger" disabled={disabled||paperBusy} aria-expanded={open} aria-controls="editor-template-options" onClick={()=>setOpen(!open)}>템플릿 변경</button>
  </div>
  {open&&<div id="editor-template-options" ref={node=>{if(node&&host.current){const rect=host.current.getBoundingClientRect();node.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-Math.min(640,window.innerWidth*.8)-8))+'px';node.style.top=(rect.bottom+4)+'px';}}} className="editor-template-options" role="group" aria-label="템플릿 선택">
   {displayedTemplates.map(t=><button type="button" key={t.id} title={t.name} aria-pressed={currentId===t.id} disabled={paperBusy} onClick={()=>{if(t.id!==currentId)setCandidate(t);}}>
    {t.coverUrl&&<img src={t.coverUrl} alt="" loading="lazy"/>}<span>{t.name}{t.id===currentId&&<small>사용 중</small>}</span>
   </button>)}
   {currentPaper&&<fieldset className="editor-paper-options" aria-busy={paperBusy} disabled={paperBusy||disabled}>
    <legend>판형 선택</legend>
    <p className="editor-paper-current">현재 판형 <strong>{sizeLabel(currentPaper)}</strong></p>
    <div className="editor-paper-choices">
     {paperOptions?.map(item=><label key={item.id} className="editor-paper-choice">
      <input type="radio" name="editor-paper-size" checked={item.id===currentId} onChange={()=>void selectPaper(item.id)}/>
      <span className="editor-paper-check" aria-hidden="true">{item.id===currentId?'✓':''}</span>
      <strong>{sizeLabel(item)}</strong><span>{item.widthMm} × {item.heightMm} mm</span>
     </label>)}
    </div>
    {paperBusy&&<p role="status">판형을 변경하고 있어요.</p>}
    {paperError&&<p role="alert">{paperError}</p>}
   </fieldset>}
   <Button className="editor-template-close" disabled={paperBusy} onClick={()=>setOpen(false)}>닫기</Button>
  </div>}
  {candidate&&<LeaveEditorDialog title="이 템플릿으로 변경할까요?" defaultName={projectName}
  onLeave={async(save,name)=>{await onChange(candidate,save,name);return true;}}
  onClose={()=>setCandidate(null)} saveLabel="기존 작업을 저장하고 변경" discardLabel="저장하지 않고 변경">
  <p><strong>{candidate.name}</strong></p>
  <p>학교 정보, 학사 일정, 등록 사진을 새 템플릿에 가져옵니다. 월별 사진 배치는 새 디자인에 맞게 다시 설정해 주세요.</p>
 </LeaveEditorDialog>}</div>;
}
