(()=>{
  const $=id=>document.getElementById(id);
  const typeLabels={desk:'탁상형',wall:'벽걸이형',poster:'연간 포스터형',postcard:'엽서형'};
  SIZE_PRESETS.postcard=[
    {id:'postcard-148x100',label:'가로형 — 148 × 100 mm',width:148,height:100,note:'표지와 월별 사진을 넓게 구성하는 기본 엽서형',recommended:true},
    {id:'postcard-100x148',label:'세로형 — 100 × 148 mm',width:100,height:148,note:'세로 사진과 월력을 조합하는 엽서형'},
    {id:'postcard-a6',label:'A6 — 148 × 105 mm',width:148,height:105,note:'인쇄·우편 규격 활용이 쉬운 A6 엽서형'}
  ];
  SETUP_TYPE_NOTES.postcard='엽서형은 단면 페이지로 구성됩니다. 표지와 12개월 월력이 기본이며, 앞·뒤 간지와 뒷표지를 선택적으로 포함할 수 있습니다.';

  const oldMakeProject=makeProject;
  makeProject=function(opts){
    if(opts.type!=='postcard')return oldMakeProject(opts);
    const chosen=SIZE_PRESETS.postcard.find(x=>x.id===opts.sizePresetId)||SIZE_PRESETS.postcard[0];
    const base=oldMakeProject({...opts,type:'wall',sizePresetId:'wall-a4'});
    base.settings={...base.settings,...opts,type:'postcard',sizePreset:{id:chosen.id,label:chosen.label,width:chosen.width,height:chosen.height}};
    base.productType={id:'postcard-single-pages',category:'postcard',duplex:false,pageSize:{width:chosen.width,height:chosen.height,unit:'mm'}};
    base.book.id=`book.postcard.${opts.year}.${String(opts.startMonth).padStart(2,'0')}`;
    base.book.pageInstances.forEach((page,index)=>{
      page.id=`postcard.page.${index+1}`;
      page.side='front';
      page.number=index+1;
      if(page.role==='cover-front')page.masterId='master.postcard.cover';
      else if(page.role==='monthly-front')page.masterId='master.postcard.monthly.front';
      else if(page.role==='back-cover-front')page.masterId='master.postcard.back-cover';
      else if(page.role.includes('insert'))page.masterId=`master.postcard.${page.role}`;
    });
    base.book.elementsByPage={};base.book.pageInstances.forEach(p=>base.book.elementsByPage[p.id]=[]);
    base.book.sheets=[];
    return base;
  };

  const oldRenderUserSizeOptions=renderUserSizeOptions;
  renderUserSizeOptions=function(){
    const list=SIZE_PRESETS[selectedUserTemplate.type]||SIZE_PRESETS.desk;
    $('userSize').innerHTML=list.map(x=>`<option value="${x.id}" ${x.recommended?'selected':''}>${x.label}${x.recommended?' · 추천':''}</option>`).join('');
    $('userRearInsertField').classList.toggle('hidden',!['desk','postcard'].includes(selectedUserTemplate.type));
    const front=$('userFrontInserts')?.closest('label');if(front)front.classList.toggle('hidden',selectedUserTemplate.type==='poster');
  };

  const oldApplyCalendarType=typeof applyCalendarType==='function'?applyCalendarType:()=>{};
  applyCalendarType=function(type){
    oldApplyCalendarType(type);
    selectedCalendarType=type;
    const label=$('selectedTypeLabel');if(label)label.textContent=typeLabels[type]||type;
    renderUserSizeOptions();
  };

  function typeName(type){return typeLabels[type]||type}
  const oldRenderTemplateLibrary=typeof renderTemplateLibrary==='function'?renderTemplateLibrary:()=>{};
  renderTemplateLibrary=function(filter='all'){
    oldRenderTemplateLibrary(filter);
    document.querySelectorAll('.library-template-card').forEach(card=>{
      const rec=v22Library().find(x=>x.id===card.dataset.templateId);const small=card.querySelector('.library-card-body small');
      if(rec&&small)small.textContent=`${typeName(rec.type)} · 수정 ${rec.updatedAt||'-'}`;
    });
  };
  const oldRenderUserTemplateChoices=typeof renderUserTemplateChoices==='function'?renderUserTemplateChoices:()=>{};
  renderUserTemplateChoices=function(){
    oldRenderUserTemplateChoices();
    document.querySelectorAll('#userTemplateChoiceGrid [data-user-template]').forEach(card=>{
      const type=card.dataset.userType;const tag=card.querySelector('.template-tags span:first-child');if(tag)tag.textContent=typeName(type);
    });
  };

  const setupType=$('setupType');
  if(setupType&&!setupType.querySelector('option[value="postcard"]'))setupType.insertAdjacentHTML('beforeend','<option value="postcard">엽서형 · 표지 + 월력 12장</option>');
  document.querySelectorAll('.setup-field[data-types]').forEach(n=>{
    const values=new Set(n.dataset.types.split(/\s+/));
    if(['setupYear','setupMonth','setupCalendarRows','setupWeekStart','setupSize','setupTemplate'].includes(n.querySelector('input,select')?.id))values.add('postcard');
    n.dataset.types=[...values].join(' ');
  });

  const typeGrid=document.querySelector('.calendar-type-grid');
  if(typeGrid&&!typeGrid.querySelector('[data-calendar-type="postcard"]')){
    const btn=document.createElement('button');btn.className='calendar-type-choice';btn.dataset.calendarType='postcard';btn.innerHTML='<div class="type-icon">✉️</div><strong>엽서형 달력</strong><small>표지와 월력 12장을 기본으로 하며 간지와 뒷표지를 선택적으로 추가합니다.</small>';
    btn.addEventListener('click',()=>applyCalendarType('postcard'));typeGrid.appendChild(btn);
  }else typeGrid?.querySelector('[data-calendar-type="postcard"]')?.addEventListener('click',()=>applyCalendarType('postcard'));

  const oldRoleLabel=roleLabel;
  roleLabel=function(p){
    if(project?.productType?.category==='postcard'){
      if(p.role==='cover-front')return '표지';
      if(p.role==='back-cover-front')return '뒷표지';
      if(p.role==='front-insert-front')return `앞 간지 ${p.insertIndex||1}`;
      if(p.role==='rear-insert-front')return `뒤 간지 ${p.insertIndex||1}`;
      if(p.role==='monthly-front')return `${p.calendarYear}.${String(p.calendarMonth).padStart(2,'0')} · 월력`;
    }
    return oldRoleLabel(p);
  };

  const oldRenderNavigator=renderNavigator;
  renderNavigator=function(){oldRenderNavigator()};

  // Wall and postcard pages are fully editable single-sided surfaces in Workspace.
  function unlockSingleSurfaceInsert(){
    const editable=['wall','postcard','poster'].includes(project?.productType?.category);
    if(!editable)return;
    document.querySelectorAll('.menu-root').forEach(root=>{if(root.querySelector(':scope>button')?.textContent?.trim()==='삽입')root.dataset.workspaceHidden='false'});
    document.querySelectorAll('[data-open-library]').forEach(btn=>{btn.style.removeProperty('display');btn.disabled=false});
  }
  const oldRender=typeof window.render==='function'?window.render:render; if(typeof oldRender==='function')render=function(){const out=oldRender.apply(this,arguments);unlockSingleSurfaceInsert();return out};
  const oldEnterUser=typeof enterUser==='function'?enterUser:null; if(oldEnterUser)enterUser=function(){const out=oldEnterUser.apply(this,arguments);setTimeout(unlockSingleSurfaceInsert,0);return out};

  renderUserTemplateChoices();
  updateSetupFields();
})();
