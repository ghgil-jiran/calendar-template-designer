(()=>{
  // Workspace users can add objects whenever the template/page permits editing.
  function restoreWorkspaceInsertTools(){
    if(project?.mode!=='calendar-workspace')return;
    document.querySelectorAll('.menu-root').forEach(root=>{
      const title=root.querySelector(':scope>button')?.textContent?.trim();
      if(title==='삽입')root.dataset.workspaceHidden='false';
    });
    document.querySelectorAll('[data-workspace-designer-tool]').forEach(btn=>delete btn.dataset.workspaceDesignerTool);
  }
  const priorRender=window.render;
  window.render=function(){const out=priorRender.apply(this,arguments);restoreWorkspaceInsertTools();return out};
  setTimeout(restoreWorkspaceInsertTools,0);

  // Poster wizard: hide only structurally irrelevant fields; keep 5×7/6×7 choice visible.
  function correctPosterWizard(){
    const poster=(window.selectedCalendarType||window.selectedUserTemplate?.type)==='poster';
    const hideIds=['userFrontInserts','userRearInserts','userAdjacentMini','userStartMonth'];
    hideIds.forEach(id=>document.getElementById(id)?.closest('label')?.classList.toggle('user-poster-hidden',poster));
    document.getElementById('userCalendarRows')?.closest('label')?.classList.remove('user-poster-hidden');
  }
  document.querySelectorAll('[data-calendar-type],[data-user-template]').forEach(n=>n.addEventListener('click',()=>setTimeout(correctPosterWizard,0)));
  setTimeout(correctPosterWizard,0);

  // Ensure all annual calendars inherit the selected grid rows after creation/template loading.
  const priorApplyCalendarType=window.applyCalendarType;
  if(priorApplyCalendarType)window.applyCalendarType=function(){const r=priorApplyCalendarType.apply(this,arguments);setTimeout(correctPosterWizard,0);return r};

  // Fit the full academic schedule by choosing columns first, then reducing type only to the configured minimum.
  function fitEventLists(root=document){
    root.querySelectorAll?.('.widget-event-list').forEach(widget=>{
      const list=widget.querySelector('.annual-event-items');if(!list)return;
      const count=list.querySelectorAll('.annual-event-item').length,requested=widget.dataset.eventColumns||'1';
      let cols=requested==='auto'?Math.max(1,Math.min(4,Math.ceil(count/Math.max(8,Math.floor(Number(widget.dataset.eventHeight||40)/3.2))))):Math.max(1,Math.min(4,Number(requested)||1));
      if(requested==='auto'&&Number(widget.dataset.eventWidth||20)<32)cols=Math.min(cols,2);
      let font=Math.max(5,Number(widget.dataset.eventFontSize||8)),minFont=Math.max(5,Math.min(font,Number(widget.dataset.eventMinFontSize||6)));
      widget.classList.remove('has-event-overflow');
      const layout=()=>{list.style.setProperty('--event-list-columns',String(cols));list.style.setProperty('--event-list-row-count',String(Math.max(1,Math.ceil(count/cols))));list.style.setProperty('--event-list-font-size',font+'px')};
      layout();
      if(requested==='auto')while(list.scrollHeight>list.clientHeight+1&&cols<4){cols++;layout()}
      if(widget.dataset.eventFit==='auto')while(list.scrollHeight>list.clientHeight+1&&font>minFont){font=Math.max(minFont,font-.5);layout()}
      const overflow=list.scrollHeight>list.clientHeight+1||list.scrollWidth>list.clientWidth+1;
      if(overflow){widget.classList.add('has-event-overflow');const warning=widget.querySelector('.event-list-overflow-warning');if(warning)warning.textContent=`전체 ${count}건 · 영역 초과`}
      widget.dataset.resolvedColumns=String(cols);widget.dataset.resolvedFontSize=String(font);
    });
  }
  const priorRenderPage=window.renderPage;
  window.renderPage=function(){const r=priorRenderPage.apply(this,arguments);fitEventLists(document);return r};
  const priorOpenFullPreview=window.openFullPreview;
  if(priorOpenFullPreview)window.openFullPreview=function(){const r=priorOpenFullPreview.apply(this,arguments);setTimeout(()=>fitEventLists(document.getElementById('fullPreviewGrid')),30);return r};
  document.addEventListener('change',event=>{if(event.target?.id==='eventListDisplayMode')document.getElementById('eventListMaxItemsField')?.classList.toggle('hidden',event.target.value==='all')});
})();
