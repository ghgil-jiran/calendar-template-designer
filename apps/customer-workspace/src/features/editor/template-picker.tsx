'use client';
import {useState} from 'react';
import type {TemplateCard} from '@/lib/api/contracts';
export function TemplatePicker({templates,currentId}:{templates:TemplateCard[];currentId:string}){
 const [open,setOpen]=useState(false),[candidate,setCandidate]=useState(currentId);
 return <div className="editor-template-picker"><button type="button" className="editor-template-trigger" aria-expanded={open} aria-controls="editor-template-options" onClick={()=>setOpen(v=>!v)}>템플릿 변경 <span aria-hidden="true">{open?'⌃':'⌄'}</span></button>{open&&<div id="editor-template-options" className="editor-template-options" role="group" aria-label="템플릿 선택">{templates.map(t=><button type="button" key={t.id} aria-pressed={candidate===t.id} onClick={()=>setCandidate(t.id)}>{t.coverUrl&&<img src={t.coverUrl} alt="" loading="lazy"/>}<span>{t.name}{t.id===currentId&&<small>현재 템플릿</small>}</span></button>)}</div>}</div>;
}
