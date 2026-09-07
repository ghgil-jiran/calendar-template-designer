"use strict";

function exitPreviewMode({clearFull=true}={}){
 preview=false;previewType=null;document.body.classList.remove("preview-only");
 const previewBtn=el("previewBtn");if(previewBtn){previewBtn.textContent="현재 페이지 미리보기";previewBtn.classList.remove("active");}
 const overlay=el("fullPreviewOverlay");if(overlay)overlay.classList.add("hidden");
 if(clearFull&&el("fullPreviewGrid"))el("fullPreviewGrid").innerHTML="";
}

function pageQualityIssues(pageInfo){
 const issues=[];const arr=[...(project.book.elementsByPage?.[pageInfo.id]||[]),...(project.book.elementsByMaster?.[pageInfo.masterId]||[])];
 for(const item of arr){const b=item.binding||item.image?.binding;if(b&&!resolveBindingValue?.(b))issues.push(`${bindingLabel?.(b)||b} 미입력`);if(item.type==="image"&&item.src==="")issues.push("이미지 미입력")}
 if(pageInfo.role==="monthly-front"){const prefix=`${pageInfo.calendarYear}-${String(pageInfo.calendarMonth).padStart(2,"0")}`;const count=(project.book.events||[]).filter(e=>(e.startDate||"").startsWith(prefix)||(e.endDate||"").startsWith(prefix)).length;if(count>35)issues.push(`일정 ${count}건 · 혼잡 확인`)}
 return [...new Set(issues)].slice(0,3)
}
function fitFullPreviewPage(source,stage,zoomPct=100){
 if(!source||!stage)return;
 const sw=Number(source.dataset.previewWidth)||source.offsetWidth||960;
 const sh=Number(source.dataset.previewHeight)||source.offsetHeight||680;
 const ratio=sw/sh;
 const availableWidth=Math.max(120,stage.clientWidth||stage.parentElement?.clientWidth||410);
 const baseScale=availableWidth/sw;
 const scale=Math.max(.05,baseScale*(Number(zoomPct||100)/100));
 const renderedWidth=sw*scale,renderedHeight=sh*scale;
 stage.style.aspectRatio='auto';
 stage.style.height=`${Math.max(160,renderedHeight)}px`;
 stage.style.minHeight='0';
 source.style.zoom='1';
 source.style.width=`${sw}px`;
 source.style.height=`${sh}px`;
 source.style.left=`${Math.max(0,(availableWidth-renderedWidth)/2)}px`;
 source.style.top='0px';
 source.style.transformOrigin='top left';
 source.style.transform=`scale(${scale})`;
}
function openPreviewFocus(card){const src=card.querySelector('.preview-only-page')?.cloneNode(true);if(!src)return;src.style.zoom='1';src.style.transform='none';src.style.left='auto';src.style.top='auto';el('previewFocusBody').innerHTML='';el('previewFocusBody').appendChild(src);el('previewFocusTitle').textContent=card.querySelector('.full-preview-card-title span')?.textContent||'페이지 원본 보기';el('previewFocusModal').classList.remove('hidden')}
function openFullPreview(){
 if(!project?.book?.pageInstances?.length){showEditorToast('미리보기할 페이지가 없습니다.');return}
 exitPreviewMode();
 const previousPageId=selectedPageId,previousSelectedElement=selectedElementId,previousScope=selectedElementScope;
 const grid=el('fullPreviewGrid');
 grid.innerHTML='';
 grid.style.setProperty('--preview-card-min',(el('previewCardSize')?.value||410)+'px');
 preview=true;previewType='template';selectedElementId=null;selectedElementScope=null;
 try{
  for(const pageInfo of project.book.pageInstances){
   selectedPageId=pageInfo.id;
   renderPage();applyThemeTokens();
   const live=el('page');
   const rect=live.getBoundingClientRect();
   const naturalWidth=live.offsetWidth||Math.round(rect.width)||960;
   const naturalHeight=live.offsetHeight||Math.round(rect.height)||680;
   const source=live.cloneNode(true);
   source.removeAttribute('id');
   source.classList.add('preview-only-page');
   source.dataset.previewWidth=String(naturalWidth);
   source.dataset.previewHeight=String(naturalHeight);
   source.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));source.querySelectorAll('img').forEach(img=>{img.loading='lazy';img.decoding='async'});
   source.querySelectorAll('.editor-only,.non-output,.resize-handle,.elem-handle,.elem-label,.semantic-role-badge,.binding-status-badge,.workspace-binding-badge').forEach(n=>n.remove());
   source.querySelectorAll('.selected,.element-selected,.workspace-locked,.binding-missing').forEach(n=>n.classList.remove('selected','element-selected','workspace-locked','binding-missing'));
   const issues=pageQualityIssues(pageInfo);
   const card=document.createElement('section');card.className='full-preview-card';
   const title=document.createElement('div');title.className='full-preview-card-title';
   title.innerHTML=`<span>${roleLabel(pageInfo)}</span><small>${issues.length?`⚠ ${issues.join(' · ')}`:(pageInfo.calendarYear&&pageInfo.calendarMonth?`${pageInfo.calendarYear}.${String(pageInfo.calendarMonth).padStart(2,'0')}`:pageInfo.id)}</small><button type="button">원본 보기</button>`;
   const stage=document.createElement('div');stage.className='full-preview-stage';stage.appendChild(source);
   card.append(title,stage);grid.appendChild(card);
   title.querySelector('button').onclick=()=>openPreviewFocus(card);
   stage.ondblclick=()=>openPreviewFocus(card);
  }
 }catch(err){
  console.error(err);grid.innerHTML='<div style="padding:24px;background:#fff;border-radius:10px">전체 미리보기를 생성하지 못했습니다. 현재 페이지로 돌아가 다시 시도해 주세요.</div>';
 }finally{
  selectedPageId=previousPageId;selectedElementId=previousSelectedElement;selectedElementScope=previousScope;
  preview=false;render();preview=true;previewType='template';
 }
 el('fullPreviewSummary').textContent=`${project.book.pageInstances.length}개 페이지 · 실제 페이지 렌더링 미리보기 · ${project.template.metadata?.name||project.book.id}`;
 el('fullPreviewOverlay').classList.remove('hidden');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  grid.querySelectorAll('.full-preview-card').forEach(card=>fitFullPreviewPage(card.querySelector('.preview-only-page'),card.querySelector('.full-preview-stage'),Number(el('previewZoom')?.value||100)));
 }));
}
function closeFullPreview(){exitPreviewMode();const g=el("fullPreviewGrid");if(g)g.replaceChildren();el("previewFocusBody")?.replaceChildren();render();window.__acdlUpdateMemoryMonitor?.()}
