(()=>{
 const $=id=>document.getElementById(id);
 function bytesFromDataUrl(url){if(!url||typeof url!=='string')return 0;const comma=url.indexOf(',');return comma<0?0:Math.round((url.length-comma-1)*.75)}
 window.renderUserCustomAssets=function(){
  const n=$('userCustomAssetPreview');if(!n)return;
  n.className='user-custom-asset-list';
  const items=(window.userImages?.customAssets||[]);
  n.innerHTML=items.length?items.map((a,i)=>`<div class="user-custom-asset-row"><div class="user-custom-asset-thumb"><img src="${a.image}" alt="${v21Escape(a.name||'사용자 이미지')}"></div><div class="user-custom-asset-meta"><strong title="${v21Escape(a.name||'사용자 이미지')}">${v21Escape(a.name||'사용자 이미지')}</strong><small>${Math.max(1,Math.round(bytesFromDataUrl(a.image)/1024))} KB · 사용자 지정 이미지</small></div><button type="button" class="user-custom-asset-remove" data-remove-user-custom="${i}">삭제</button></div>`).join(''):'<div class="user-custom-asset-empty">등록된 이미지가 없습니다.</div>';
  n.querySelectorAll('[data-remove-user-custom]').forEach(b=>b.onclick=()=>{window.userImages.customAssets.splice(Number(b.dataset.removeUserCustom),1);window.renderUserCustomAssets()});
 };
 function ensurePostcardModel(){
  if(!window.project||project?.productType?.category!=='postcard')return;
  project.template.masters.calendar.calendarRegionsByType ||= {};
  project.template.masters.calendar.calendarRegionsByType.postcard ||= {x:6,y:60,width:88,height:35};
  project.template.masterElements ||= {};
  const mid='master.postcard.monthly.front';
  const arr=project.template.masterElements[mid] ||= [];
  project.book.pageInstances.filter(p=>p.role==='monthly-front').forEach(p=>p.masterId=mid);
  if(!arr.some(x=>x.role==='postcard-month-image'))arr.unshift({id:'element.postcard.month-image.default',type:'image-frame',role:'postcard-month-image',x:6,y:6,width:88,height:49,zIndex:1,image:{binding:'calendar.monthlyImages.current',src:'',fit:'cover'},src:'',fit:'cover',style:{borderRadius:2,border:false}});
  if(!arr.some(x=>x.binding==='calendar.year'))arr.push({id:'element.postcard.year.default',type:'text',role:'year',binding:'calendar.year',content:String(project.settings.year||2027),x:7,y:56,width:20,height:7,zIndex:3,style:{fontSize:14,textAlign:'left',background:false,color:'#17202e'}});
  if(!arr.some(x=>x.binding==='calendar.month'))arr.push({id:'element.postcard.month.default',type:'text',role:'month',binding:'calendar.month',content:'1월',x:75,y:56,width:18,height:7,zIndex:3,style:{fontSize:14,textAlign:'right',background:false,color:'#17202e'}});
 }
 const priorMake=makeProject;
 makeProject=function(opts){const p=priorMake(opts);if(opts.type==='postcard'){project=p;ensurePostcardModel();project=p}return p};
 function refreshTypeEditing(){
  if(!window.project&&!project)return;const type=project?.productType?.category;document.body.dataset.calendarProduct=type||'';
  const page=selectedPage?.();const monthly=page?.role==='monthly-front';
  if(['postcard','wall'].includes(type)&&monthly){$('editCalendarBtn')?.classList.remove('hidden');$('editCalendarBtn').disabled=false}
  if(['postcard','wall','poster'].includes(type)){
   $('openObjectDrawerBtn')?.classList.remove('hidden');$('openObjectDrawerBtn')?.removeAttribute('disabled');
   document.querySelectorAll('[data-open-library],[data-semantic-add],[data-school-text-add],[data-basic-add],[data-widget-add]').forEach(b=>{b.disabled=false;b.style.removeProperty('display');b.style.pointerEvents='auto'});
  }
  ensurePostcardModel();
  const pageNode=$('page');if(pageNode)pageNode.dataset.productType=type||'';
 }
 const prevRender=typeof window.render==='function'?window.render:render; if(typeof prevRender==='function')render=function(){const r=prevRender.apply(this,arguments);requestAnimationFrame(refreshTypeEditing);return r};
 $('openObjectDrawerBtn')?.addEventListener('click',()=>{refreshTypeEditing();$('objectDrawer')?.classList.remove('hidden');renderObjectRecommendations?.();renderRegisteredAssetLibrary?.()},true);
 // Existing projects loaded from JSON also receive the full postcard model.
 const oldNormalize=normalizeElementData;normalizeElementData=function(){const r=oldNormalize.apply(this,arguments);ensurePostcardModel();return r};
 setTimeout(()=>{window.renderUserCustomAssets?.();refreshTypeEditing()},200);
})();
