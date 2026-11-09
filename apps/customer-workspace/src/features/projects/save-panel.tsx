'use client';
import {Button} from '@/components/ui/button';
export function SavePanel({name,onName,dirty,saved,busy,notice,error,onSave}:{name:string;onName:(name:string)=>void;dirty:boolean;saved:boolean;busy:boolean;notice:string;error:string;onSave:()=>void}){
 return <aside className="project-save-panel" aria-label="프로젝트 저장"><label className="project-name-field"><span>프로젝트 이름</span><input value={name} onChange={e=>onName(e.target.value)} maxLength={120} disabled={busy} /></label><div className="project-save-actions">{notice&&<span className="save-notice" role="status" title={notice}>{dirty?'변경 사항 있음':notice}</span>}<Button variant="primary" disabled={busy||!dirty} onClick={onSave}>{busy?'보관 중…':saved&&!dirty?'저장됨':'내 프로젝트에 저장'}</Button></div>{error&&<p className="field-error" role="alert">{error}</p>}</aside>;
}
