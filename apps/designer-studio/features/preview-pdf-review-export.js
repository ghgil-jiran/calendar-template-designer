(()=>{
 const $=id=>document.getElementById(id);
 const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const safeFilePart=value=>String(value||'template').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-').slice(0,80)||'template';
 function waitForImages(root){
  return Promise.all([...root.querySelectorAll('img')].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})})));
 }
 async function optimizeReviewBackgrounds(root){
  const images=[...root.querySelectorAll('[data-element-role="ai-design-background"] img')];
  await Promise.all(images.map(async image=>{
   try{
    if(!image.complete)await new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})});
    const sourceWidth=image.naturalWidth||0,sourceHeight=image.naturalHeight||0;if(!sourceWidth||!sourceHeight)return;
    const maxWidth=1400,scale=Math.min(1,maxWidth/sourceWidth),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sourceWidth*scale));canvas.height=Math.max(1,Math.round(sourceHeight*scale));
    const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);image.src=canvas.toDataURL('image/jpeg',.72);image.removeAttribute('style');image.dataset.reviewOptimized='true';
   }catch(error){console.warn('review background optimization skipped',error)}
  }));
 }
 async function exportReviewPdf(){
  const pages=window.ACDLPreviewState?.pages(project)||[];
  if(!pages.length){showEditorToast('검토용 PDF로 저장할 페이지가 없습니다.');return}
  const size=project?.productType?.pageSize||{};
  const width=Number(size.width),height=Number(size.height);
  if(!(width>0&&height>0)){showEditorToast('페이지 규격을 확인할 수 없습니다.');return}
  const button=$('reviewPdfBtn');if(button)button.disabled=true;
  $('templateMenuDropdown')?.classList.add('hidden');
  showEditorToast(`${pages.length}면 검토용 PDF를 준비하고 있습니다.`);
  const saved=window.ACDLPreviewState.capture({pageId:selectedPageId,elementId:selectedElementId,scope:selectedElementScope,calendarEditing,preview,previewType});
  const root=document.createElement('main');root.className='review-pdf-root';root.setAttribute('aria-hidden','true');
  let failed=null;
  try{
   selectedElementId=null;selectedElementScope=null;calendarEditing=false;preview=false;previewType=null;
   for(const pageInfo of pages){
    selectedPageId=pageInfo.id;renderPage();applyThemeTokens();
    const live=$('page');if(!live)throw new Error(`${roleLabel(pageInfo)} 렌더링 결과가 없습니다.`);
    const clone=window.ACDLPreviewState.clonePage(live,pageInfo);
    clone.classList.remove('editor-bleed-visible','export-crop-marks','export-guides-visible');clone.classList.add('review-pdf-page');clone.style.width='100%';clone.style.height='100%';
    clone.querySelectorAll('.empty-frame').forEach(node=>{const element=node.closest('.free-element');if(element)element.remove();else node.remove()});
    const sheet=document.createElement('section');sheet.className='review-pdf-sheet';sheet.dataset.pageId=pageInfo.id;sheet.setAttribute('aria-label',roleLabel(pageInfo));sheet.style.width=`${width}mm`;sheet.style.height=`${height}mm`;sheet.appendChild(clone);root.appendChild(sheet);
   }
  }catch(error){failed=error;console.error('review PDF render failed',error)}
  const restored=window.ACDLPreviewState.restore(project,saved);selectedPageId=restored.pageId;selectedElementId=restored.elementId;selectedElementScope=restored.scope;calendarEditing=restored.calendarEditing;preview=restored.preview;previewType=restored.previewType;
  try{render()}catch(error){console.error('editor restore failed',error)}
  if(failed){if(button)button.disabled=false;showEditorToast(`검토용 PDF를 만들지 못했습니다: ${failed.message||failed}`);return}
  const pageStyle=document.createElement('style');pageStyle.id='reviewPdfPageStyle';pageStyle.textContent=`@page{size:${width}mm ${height}mm;margin:0}`;document.head.appendChild(pageStyle);document.body.appendChild(root);
  const originalTitle=document.title;
  const metadata=project?.template?.metadata||{};document.title=`${safeFilePart(metadata.name||project?.book?.id)}-review-${safeFilePart(metadata.version||'draft')}`;
  const cleanup=()=>{document.body.classList.remove('review-pdf-printing');root.remove();pageStyle.remove();document.title=originalTitle;if(button)button.disabled=false};
  try{
   if(document.fonts?.ready)await document.fonts.ready;await optimizeReviewBackgrounds(root);await waitForImages(root);await nextFrame();
   document.body.classList.add('review-pdf-printing');await nextFrame();
   showEditorToast('인쇄 화면에서 대상을 “PDF로 저장”으로 선택하세요. 이 파일은 검토용이며 인쇄 원고가 아닙니다.');
   window.print();
  }finally{setTimeout(cleanup,0)}
 }
 $('reviewPdfBtn')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();exportReviewPdf()},true);
 window.ACDLReviewPdf=Object.freeze({export:exportReviewPdf});
})();
