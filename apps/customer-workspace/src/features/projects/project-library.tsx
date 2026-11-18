'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {downloadReviewPdf} from './review-pdf';
import {NativePreview} from '@/features/materials/native-preview';
import {Panel} from '@/components/ui/panel';
import {deleteLocalProject,listLocalProjects,readSnapshot,hydrateSnapshot,type ProjectSummary} from '@/lib/projects/store';
export function downloadBackup(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(name.replace(/[\\/:*?"<>|]/g,'_').slice(0,80)||'학교 달력')+'.calendar-backup';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export function ProjectLibrary({onOpen,onDeleted,refresh=0}:{onOpen:(id:string)=>Promise<void>;onDeleted?:(id:string)=>void;refresh?:number}){
 const [order,setOrder]=useState(false);const orderDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(order)orderDialog.current?.showModal();},[order]);
 const [projects,setProjects]=useState<ProjectSummary[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[failure,setFailure]=useState(''),[notice,setNotice]=useState(''),[retry,setRetry]=useState(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{let active=true;setLoading(true);setFailure('');listLocalProjects().then(rows=>{if(active)setProjects(rows);}).catch(error=>{if(active)setFailure(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[retry,refresh]);
 async function action(id:string,job:()=>Promise<void>){setBusy(id);setFailure('');setNotice('');try{await job();if(alive.current)setRetry(v=>v+1);}catch(error){if(alive.current)setFailure(error instanceof Error?error.message:'작업을 마치지 못했어요.');}finally{if(alive.current)setBusy('');}}
 return <>
  <dialog ref={orderDialog} className="template-change-dialog" aria-labelledby="project-order-title" onClose={()=>setOrder(false)}>
    <h2 id="project-order-title">주문 안내</h2>
    <p>주문 기능은 아직 제공하지 않습니다. 추후 ‘우리학교인쇄’ 장바구니로 이동합니다.</p>
    <div className="actions"><Button onClick={()=>orderDialog.current?.close()}>닫기</Button></div>
  </dialog>
  {notice&&<p role="status">{notice}</p>}
  {failure&&<Panel><p role="alert" className="field-error">{failure}</p><Button disabled={Boolean(busy)} onClick={()=>setRetry(v=>v+1)}>다시 확인하기</Button></Panel>}
  {loading?<p role="status">저장한 프로젝트를 확인하고 있어요.</p>:projects.length?<div className="project-grid">
    {projects.map(project=><Panel className="project-card" key={project.id}>
      <ProjectCover id={project.id} revision={project.revision}/>
      <div className="project-card-heading">
        <h2>{project.templateName}</h2>
        <span className="badge">저장됨</span>
        <details className="project-card-menu">
          <summary aria-label={`${project.name} 더보기`}>⋯</summary>
          <Button disabled={Boolean(busy)} onClick={()=>{if(window.confirm(`‘${project.name}’과 함께 보관한 사진을 이 브라우저에서 삭제할까요? 삭제 후에는 복원할 수 없어요.`))void action(project.id,async()=>{await deleteLocalProject(project.id);onDeleted?.(project.id);});}}>삭제</Button>
        </details>
      </div>
      {project.name!==project.templateName&&<p className="muted">{project.name}</p>}
      <p className="muted">마지막 저장 <time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleString('ko-KR')}</time></p>
      <div className="project-card-actions">
        <Button variant="primary" disabled={Boolean(busy)} onClick={()=>void action(project.id,()=>onOpen(project.id))}>편집하기</Button>
        <Button disabled={Boolean(busy)} onClick={()=>setOrder(true)}>주문하기</Button>
        <Button disabled={Boolean(busy)} onClick={()=>void action(project.id,async()=>{await downloadReviewPdf(project.id,count=>setNotice(`${count}면 확인용 PDF를 준비했어요. 인쇄 화면에서 ‘PDF로 저장’을 선택하세요. 인쇄 제작용이 아닙니다.`));})}>확인용 PDF 다운로드</Button>
      </div>
      {busy===project.id&&<p role="status">처리하고 있어요.</p>}
    </Panel>)}
  </div>:!failure&&<Panel className="state-panel"><p>현재 저장된 달력이 없습니다.</p></Panel>}
 </>;
}

function ProjectCover({id,revision}:{id:string;revision:number}){
 const [saved,setSaved]=useState<ReturnType<typeof hydrateSnapshot>|null>(null);
 useEffect(()=>{
  let active=true;
  let urls:string[]=[];
  setSaved(null);
  void readSnapshot(id).then(snapshot=>{
   if(!active)return;
   const restored=hydrateSnapshot(snapshot);
   urls=restored.urls;
   setSaved(restored);
  }).catch(()=>{});
  return ()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
 },[id,revision]);
 const project=saved?.appliedProject;
 const pages=project?.book.pageInstances;
 const page=pages?.find((entry:{role?:string})=>entry.role==='cover-front')||pages?.[0];
 const cover=saved?.template.coverUrl||saved?.template.pages[0]?.imageUrl;
 return <div className="project-cover">
   {project&&page?<NativePreview project={project} pageId={page.id} compact/>:cover?<img src={cover} alt="저장한 달력 표지"/>:<p className="muted">표지 미리보기</p>}
 </div>;
}
