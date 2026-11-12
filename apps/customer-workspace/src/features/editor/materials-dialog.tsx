'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {TextField} from '@/components/ui/text-field';
import {ScheduleInput,validSchedule} from '@/features/materials/schedule-input';
import {updateSchoolField} from '@/lib/editor/materials';
import {validateSchoolInput} from '@/lib/api/school-input';
import type {SchoolField,SchoolInput,ScheduleEvent} from '@/lib/api/contracts';

export function MaterialsDialog({kind,school,events,fields,year,startMonth,onSave,onClose}:{kind:'school'|'schedule';school:SchoolInput;events:ScheduleEvent[];fields:SchoolField[];year:number;startMonth:number;onSave:(school:SchoolInput,events:ScheduleEvent[])=>Promise<boolean>;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[draftSchool,setSchool]=useState(()=>structuredClone(school)),[draftEvents,setEvents]=useState(()=>structuredClone(events)),[busy,setBusy]=useState(false),[reading,setReading]=useState(false),[error,setError]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{dialog.current?.showModal();},[]);
 async function save(){const issues=kind==='school'?validateSchoolInput(fields,draftSchool):{};setErrors(issues);if(Object.keys(issues).length){setError('필수 항목과 입력 내용을 확인해주세요.');return;}if(kind==='schedule'&&!validSchedule(draftEvents)){setError('일정의 날짜와 내용을 확인해주세요.');return;}setBusy(true);setError('');try{if(await onSave(draftSchool,draftEvents))onClose();else setError('저장하지 못했어요. 수정 내용은 유지됩니다. 다시 저장해주세요.');}catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요.');}finally{setBusy(false);}}
 return <dialog ref={dialog} className="editor-materials-dialog" aria-labelledby="materials-dialog-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
 <header><div><h2 id="materials-dialog-title">{kind==='school'?'학교 정보 수정':'일정 수정'}</h2><p className="field-hint">현재 프로젝트의 저장된 내용을 불러왔어요. 저장하기를 누르면 달력에 반영됩니다.</p></div><Button disabled={busy} onClick={onClose} aria-label="수정 취소하고 닫기">닫기 ×</Button></header>
 <div className="editor-materials-body" inert={busy}>{kind==='school'?<>{(['basic','contact'] as const).map(group=><section key={group}><h3>{group==='basic'?'학교 기본 정보':'학교 연락처'}</h3><div className="form-grid">{fields.filter(f=>f.group===group).map(field=><TextField {...field} key={field.key} value={draftSchool.values[field.key]||''} hidden={draftSchool.hidden.includes(field.key)} error={errors[field.key]} onChange={value=>setSchool(p=>updateSchoolField(p,field.key,value))} onHide={hidden=>setSchool(p=>({...p,hidden:hidden?[...new Set([...p.hidden,field.key])]:p.hidden.filter(k=>k!==field.key)}))}/>)}</div></section>)}<label className="checkbox"><input type="checkbox" checked={draftSchool.omitEmptyContacts===true} onChange={e=>setSchool(p=>({...p,omitEmptyContacts:e.target.checked}))}/>입력하지 않은 연락처는 표시하지 않음</label></>:<ScheduleInput embedded year={year} startMonth={startMonth} events={draftEvents} onChange={setEvents} onCalendarDisplay={calendarDisplay=>setSchool(p=>({...p,calendarDisplay}))} calendarDisplay={draftSchool.calendarDisplay} onBusyChange={setReading} onBack={()=>{}} onNext={()=>{}}/>}</div>
 {error&&<p className="field-error" role="alert">{error}</p>}<footer><Button disabled={busy} onClick={onClose}>취소하기</Button><Button variant="primary" disabled={busy||reading} onClick={()=>void save()}>{busy?'저장 중…':'저장하기'}</Button></footer></dialog>;
}
