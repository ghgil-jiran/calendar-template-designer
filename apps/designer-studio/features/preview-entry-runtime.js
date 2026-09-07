(()=>{
 const $=id=>document.getElementById(id);
 function replacePreviewButton(id,handler){
  const current=$(id);if(!current)return null;
  const clean=current.cloneNode(true);
  current.replaceWith(clean);
  clean.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();handler()});
  return clean;
 }
 function bindPreviewMenuAction(action,handler){
  const button=document.querySelector(`[data-menu-action="${action}"]`);if(!button)return null;
  button.onclick=null;
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();handler()});
  return button;
 }
 function availablePreviewPages(){return window.ACDLPreviewState.pages(project)}
 function enterPagePreview(){
  const pages=availablePreviewPages();
  if(!pages.length){showEditorToast('미리보기할 페이지가 없습니다.');return}
  selectedPageId=window.ACDLPreviewState.repairPageId(project,selectedPageId);
  exitPreviewMode();preview=true;previewType='page';document.body.classList.add('preview-only');
  const button=$('previewBtn');if(button){button.textContent='편집으로 돌아가기';button.classList.add('active')}
  render();
  const page=pages.find(item=>item.id===selectedPageId);
  $('pagePreviewName').textContent=page?.label||page?.role||'';
 }
 function togglePagePreview(){
  if(previewType==='page'){exitPreviewMode();render();return}
  enterPagePreview();
 }
 function enterFullPreview(){
  const pages=availablePreviewPages();
  if(!pages.length){showEditorToast('미리보기할 페이지가 없습니다.');return}
  selectedPageId=window.ACDLPreviewState.repairPageId(project,selectedPageId);
  window.openFullPreview();
 }

 replacePreviewButton('previewBtn',togglePagePreview);
 replacePreviewButton('fullPreviewBtn',enterFullPreview);
 bindPreviewMenuAction('preview-page',togglePagePreview);
 window.ACDLPreviewEntry={availablePreviewPages,enterPagePreview,enterFullPreview};
})();
