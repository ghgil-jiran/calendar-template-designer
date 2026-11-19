'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Button} from '@/components/ui/button';

export function LeaveEditorDialog({title,defaultName,onLeave,onClose,children,saveDisabled=false,saveLabel='저장하고 이동',discardLabel='저장하지 않고 이동'}:{
 title:string;defaultName:string;onLeave:(save:boolean,name?:string)=>Promise<boolean>;onClose:()=>void;
 children?:ReactNode;saveDisabled?:boolean;saveLabel?:string;discardLabel?:string;
}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [name,setName]=useState(defaultName),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{dialog.current?.showModal();},[]);
 async function leave(save:boolean){
  if(busy||(save&&saveDisabled))return;
  setBusy(true);setError('');
  try{if(!await onLeave(save,name.trim()))setError('저장하지 못했습니다. 편집 내용을 유지했어요.');}
  catch(error){setError(error instanceof Error?error.message:'작업을 완료하지 못했습니다.');}
  finally{setBusy(false);}
 }
 return <dialog ref={dialog} className="editor-leave-dialog" aria-labelledby="leave-editor-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <h2 id="leave-editor-title">{title}</h2>
  {children}
  <form onSubmit={event=>{event.preventDefault();void leave(true);}}>
   <label className="project-name-field">프로젝트명<input required maxLength={120} disabled={busy} value={name} onChange={event=>setName(event.target.value)}/></label>
   {error&&<p className="field-error" role="alert">{error}</p>}
   <div className="actions">
    <Button type="submit" variant="primary" disabled={busy||saveDisabled||!name.trim()}>{busy?'처리 중…':saveLabel}</Button>
    {discardLabel&&<Button disabled={busy} onClick={()=>void leave(false)}>{discardLabel}</Button>}
    <Button disabled={busy} onClick={onClose}>취소</Button>
   </div>
  </form>
 </dialog>;
}
