'use client';
import {Button} from '@/components/ui/button';
export function SavePanel({name,onName,dirty,saved,busy,notice,error,onSave,onBackup}:{name:string;onName:(name:string)=>void;dirty:boolean;saved:boolean;busy:boolean;notice:string;error:string;onSave:()=>void;onBackup:()=>void}){
 return <aside className="project-save-panel" aria-label="프로젝트 저장"><div><label>프로젝트 이름<input value={name} onChange={e=>onName(e.target.value)} maxLength={120} disabled={busy} /></label><p className="field-hint">학교 정보·일정·사진 원본을 이 브라우저에 함께 보관해요.</p></div><div className="project-save-actions"><Button variant="primary" disabled={busy||!dirty} onClick={onSave}>{busy?'보관 중…':saved&&!dirty?'저장됨':'내 프로젝트에 저장'}</Button><Button disabled={busy} onClick={onBackup}>백업 다운로드</Button></div>{notice&&<p className="save-notice" role="status">{notice}</p>}{error&&<p className="field-error" role="alert">{error}</p>}</aside>;
}
