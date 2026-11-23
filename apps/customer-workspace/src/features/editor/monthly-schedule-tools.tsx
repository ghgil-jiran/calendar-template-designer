'use client';

import {useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import type {ScheduleEvent} from '@/lib/api/contracts';
import {applyScheduleDraft, eventInMonth, sortSchedules} from '@/lib/materials/schedule-review';

export type MonthlyScheduleToolsProps = {
 month: {start: string; end: string; label: string};
 events: ScheduleEvent[];
 saving: boolean;
 onSave: (events: ScheduleEvent[]) => Promise<boolean>;
};

function shortDate(date: string, showYear: boolean) {
 const [year, month, day] = date.split('-').map(Number);
 return showYear ? `${year}.${month}.${day}` : `${month}.${day}`;
}

export function MonthlyScheduleTools({month, events, saving, onSave}: MonthlyScheduleToolsProps) {
 const [draft, setDraft] = useState<ScheduleEvent | null>(null);
 const [failure, setFailure] = useState('');
 const [busy, setBusy] = useState(false);
 const saveLock = useRef(false);
 const monthly = sortSchedules(events.filter(event => eventInMonth(event, month)));
 const locked = saving || busy;
 const editingExisting = draft && events.some(event => event.id === draft.id);

 function edit(event: ScheduleEvent | null) {
  setFailure('');
  setDraft(event);
 }

 async function commit(change: () => ScheduleEvent[]) {
  if (locked || saveLock.current) return;
  saveLock.current = true;
  setBusy(true);
  setFailure('');
  try {
   const next = change();
   if (next.length > 2000) throw Error('일정은 최대 2,000건까지 추가할 수 있어요.');
   if (!await onSave(sortSchedules(next))) throw Error('일정을 저장하지 못했어요. 다시 시도해 주세요.');
   setDraft(null);
  } catch (error) {
   setFailure(error instanceof Error ? error.message : '일정을 저장하지 못했어요.');
  } finally {
   saveLock.current = false;
   setBusy(false);
  }
 }

 return <section className="editor-tool-card monthly-schedule-card" aria-label={month.label + ' 학사 일정'}>
  <h3>{month.label} 일정 <small>{monthly.length}건</small></h3>
  {monthly.length ? <ul className="monthly-schedule-list">{monthly.map(event => {
   const crossYear = event.startDate.slice(0, 4) !== event.endDate.slice(0, 4);
   const editing = draft?.id === event.id;
   return <li key={event.id}>
    <span className="monthly-schedule-date" title={event.startDate === event.endDate ? event.startDate : event.startDate + ' ~ ' + event.endDate}>
     <time dateTime={event.startDate}>{shortDate(event.startDate, crossYear)}</time>
     {event.startDate !== event.endDate && <> ~ <time dateTime={event.endDate}>{shortDate(event.endDate, crossYear)}</time></>}
    </span>
    <div className="monthly-schedule-row">
     <span className="monthly-schedule-title">{event.title}</span>
     <Button disabled={locked || !!draft} aria-label={event.title + ' 수정'} onClick={() => edit({...event})}>수정</Button>
     <Button className="monthly-schedule-delete" disabled={locked || !!draft} aria-label={event.title + ' 삭제'} onClick={() => void commit(() => events.filter(item => item.id !== event.id))}>삭제</Button>
    </div>
    {editing && renderForm()}
   </li>;
  })}</ul> : <p className="field-hint">이 달에 등록된 일정이 없어요.</p>}
  {draft && !editingExisting && renderForm()}
  {failure && <p className="field-error" role="alert">{failure}</p>}
  <Button className="monthly-schedule-add" disabled={locked || !!draft} onClick={() => edit({id:crypto.randomUUID(), startDate:month.start, endDate:month.start, title:''})}>+ 새 일정 추가</Button>
 </section>;

 function renderForm() {
  if (!draft) return null;
  const current = draft;
  return <form className="monthly-schedule-form" onSubmit={event => {
   event.preventDefault();
   void commit(() => applyScheduleDraft(events, current));
  }}>
   <label>일정명<input autoFocus required maxLength={200} disabled={locked} value={current.title} onChange={event => setDraft({...current, title:event.target.value})}/></label>
   <div className="monthly-schedule-form-dates">
    <label>시작일<input type="date" required disabled={locked} value={current.startDate} onChange={event => {
     const startDate = event.target.value;
     const endDate = current.endDate === current.startDate || current.endDate < startDate ? startDate : current.endDate;
     setDraft({...current, startDate, endDate});
    }}/></label>
    <label>종료일<input type="date" required min={current.startDate} disabled={locked} value={current.endDate} onChange={event => setDraft({...current, endDate:event.target.value})}/></label>
   </div>
   <div className="monthly-schedule-form-actions">
    <Button disabled={locked} onClick={() => edit(null)}>취소</Button>
    <Button type="submit" variant="primary" disabled={locked}>{busy ? '저장 중…' : '저장'}</Button>
   </div>
  </form>;
 }
}
