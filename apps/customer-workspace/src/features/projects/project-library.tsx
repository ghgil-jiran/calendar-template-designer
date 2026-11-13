'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {downloadReviewPdf} from './review-pdf';
import {NativePreview} from '@/features/materials/native-preview';
import type {NativeProject} from '@/lib/materials/native-project';
import {Panel} from '@/components/ui/panel';
import {deleteLocalProject,listLocalProjects,readSnapshot,hydrateSnapshot,type ProjectSummary} from '@/lib/projects/store';
export function downloadBackup(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(name.replace(/[\\/:*?"<>|]/g,'_').slice(0,80)||'학교 달력')+'.calendar-backup';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export function ProjectLibrary({onOpen,onDeleted,refresh=0}:{onOpen:(id:string)=>Promise<void>;onDeleted?:(id:string)=>void;refresh?:number}){
 const [order,setOrder]=useState<{name:string;project:NativeProject;urls:string[]}|null>(null);
 const orderRef=useRef(order);orderRef.current=order;useEffect(()=>()=>orderRef.current?.urls.forEach(url=>URL.revokeObjectURL(url)),[]);
 function closeOrder(){order?.urls.forEach(url=>URL.revokeObjectURL(url));setOrder(null);}
 const [projects,setProjects]=useState<ProjectSummary[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[failure,setFailure]=useState(''),[notice,setNotice]=useState(''),[retry,setRetry]=useState(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{let active=true;setLoading(true);setFailure('');listLocalProjects().then(rows=>{if(active)setProjects(rows);}).catch(error=>{if(active)setFailure(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[retry,refresh]);
 async function action(id:string,job:()=>Promise<void>){setBusy(id);setFailure('');setNotice('');try{await job();if(alive.current)setRetry(v=>v+1);}catch(error){if(alive.current)setFailure(error instanceof Error?error.message:'작업을 마치지 못했어요.');}finally{if(alive.current)setBusy('');}}
 return <><div className="reference-note">이 브라우저에 저장된 달력입니다. 브라우저 데이터를 삭제하면 저장 내용도 삭제될 수 있습니다.</div>
 {order&&<Panel className="order-review"><h2>{order.name} · 주문 전 확인</h2><p>저장된 달력을 확인해 주세요. 실제 주문 접수 기능은 준비 중입니다.</p><NativePreview project={order.project} pageId={order.project.book.pageInstances[0].id}/><Button onClick={closeOrder}>확인 닫기</Button></Panel>}
 {notice&&<p role="status">{notice}</p>}{failure&&<Panel><p role="alert" className="field-error">{failure}</p><Button disabled={Boolean(busy)} onClick={()=>setRetry(v=>v+1)}>다시 확인하기</Button></Panel>}
 {loading?<p role="status">저장한 프로젝트를 확인하고 있어요.</p>:projects.length?<div className="project-grid">{projects.map(project=><Panel className="project-card" key={project.id}><span className="badge">이 브라우저에 저장됨</span><h2>{project.name}</h2>{project.name!==project.templateName&&<p className="muted">{project.templateName}</p>}<dl className="project-facts"><div><dt>자료</dt><dd>일정 {project.eventCount}건 · 사진 {project.photoCount}장</dd></div><div><dt>최근 저장</dt><dd>{new Date(project.updatedAt).toLocaleString('ko-KR')}</dd></div><div><dt>보관 용량</dt><dd>{(project.byteSize/1024/1024).toFixed(1)}MB</dd></div></dl><div className="project-card-actions"><Button variant="primary" disabled={Boolean(busy)} onClick={()=>void action(project.id,async()=>{const restored=hydrateSnapshot(await readSnapshot(project.id));if(!restored.appliedProject){restored.urls.forEach(url=>URL.revokeObjectURL(url));throw Error('먼저 편집 화면에서 달력을 저장해 주세요.');}closeOrder();setOrder({name:project.name,project:restored.appliedProject,urls:restored.urls});})}>주문하기</Button><Button disabled={Boolean(busy)} onClick={()=>void action(project.id,()=>onOpen(project.id))}>편집</Button><Button disabled={Boolean(busy)} onClick={()=>void action(project.id,async()=>{await downloadReviewPdf(project.id);setNotice('인쇄 화면에서 대상을 ‘PDF로 저장’으로 선택하세요. 모양 확인용이며 인쇄 제작용이 아닙니다.');})}>확인용 PDF 다운로드</Button><Button className="project-delete" disabled={Boolean(busy)} onClick={()=>{if(window.confirm(`‘${project.name}’과 함께 보관한 사진을 이 브라우저에서 삭제할까요? 삭제 후에는 복원할 수 없어요.`))void action(project.id,async()=>{await deleteLocalProject(project.id);onDeleted?.(project.id);});}}>삭제</Button></div>{busy===project.id&&<p role="status">처리하고 있어요.</p>}</Panel>)}</div>:!failure&&<Panel className="state-panel"><h2>저장한 프로젝트가 아직 없어요</h2><p className="muted">디자인을 고르고 자료를 입력한 뒤 ‘내 프로젝트에 저장’을 눌러 주세요.</p></Panel>}
 </>;
}
