(()=>{
 const $=id=>document.getElementById(id),KEY='acdl.calendarTypeDefinitions.v37',DESK_SAMPLE_MIGRATION_KEY='acdl.deskSamples.v2';
 const starterCatalog=[
  {id:'desk-sample-6',name:'탁상형 6번 · 월별 플래너형'},
  {id:'desk-sample-3',name:'탁상형 3번 · 이미지 미니월력형'},
  {id:'desk-sample-2',name:'탁상형 2번 · 이미지 콜라주형'},
  {id:'school-basic',name:'학교 기본형'},
  {id:'minimal',name:'미니멀형'},
  {id:'photo',name:'사진형'},
  {id:'illustration',name:'일러스트형'},
  {id:'blank',name:'빈 템플릿'}
 ];
 const builtinSizes={
  desk:[
   {id:'desk-compact',name:'Compact',width:210,height:150,unit:'mm',recommended:false,note:'공간 효율을 중시한 소형 규격'},
   {id:'desk-standard',name:'Standard',width:260,height:180,unit:'mm',recommended:true,note:'학교용 탁상 달력 권장 규격'},
   {id:'desk-large',name:'Large',width:297,height:210,unit:'mm',recommended:false,note:'사진과 일정을 크게 보여주는 대형 규격'}
  ],
  wall:[
   {id:'wall-a4',name:'A4',width:210,height:297,unit:'mm',recommended:false,note:'교실과 개인 공간용 소형 규격'},
   {id:'wall-b4',name:'B4',width:257,height:364,unit:'mm',recommended:false,note:'가독성과 공간의 균형이 좋은 중형 규격'},
   {id:'wall-a3',name:'A3',width:297,height:420,unit:'mm',recommended:true,note:'학교 벽걸이 달력 권장 규격'}
  ],
  poster:[
   {id:'poster-a3',name:'A3',width:297,height:420,unit:'mm',recommended:true,note:'교실 게시용'},
   {id:'poster-a2',name:'A2',width:420,height:594,unit:'mm',recommended:false,note:'복도·교무실 게시용'}
  ],
  postcard:[
   {id:'postcard-148x100',name:'가로형',width:148,height:100,unit:'mm',recommended:true,note:'표지와 월별 사진을 넓게 구성'},
   {id:'postcard-100x148',name:'세로형',width:100,height:148,unit:'mm',recommended:false,note:'세로 사진과 월력을 조합'},
   {id:'postcard-a6',name:'A6',width:148,height:105,unit:'mm',recommended:false,note:'인쇄와 우편 규격 활용'}
  ]
 };
 function readDefs(){
  try{
   const stored=JSON.parse(localStorage.getItem(KEY)||'null');
   if(Array.isArray(stored)&&stored.length)return stored;
   const runtime=Array.isArray(window.ACDLCalendarTypeDefinitions)?window.ACDLCalendarTypeDefinitions:[];
   if(runtime.length){localStorage.setItem(KEY,JSON.stringify(runtime));return runtime}
   return []
  }catch{return Array.isArray(window.ACDLCalendarTypeDefinitions)?window.ACDLCalendarTypeDefinitions:[]}
 }
 function normalizeDef(d){
  const sizes=(Array.isArray(d.sizes)&&d.sizes.length?d.sizes:builtinSizes[d.id]||[{id:`${d.id}-default`,name:`${d.name} 기본`,width:Number(d.width||148),height:Number(d.height||100),unit:'mm',recommended:true,note:'달력 유형 기본 크기'}]).map((s,i)=>({id:s.id||`${d.id}-size-${i+1}`,name:s.name||s.label||`크기 ${i+1}`,width:Number(s.width),height:Number(s.height),unit:s.unit||'mm',recommended:!!s.recommended,note:s.note||''}));
  if(!sizes.some(s=>s.recommended)&&sizes[0])sizes[0].recommended=true;
  const rec=sizes.find(s=>s.recommended)||sizes[0];
  const savedStarters=Array.isArray(d.starterTemplates)&&d.starterTemplates.length?d.starterTemplates:['school-basic','minimal','blank'];
  const requiredStarters=d.id==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2']:[];
  const starterTemplates=[...requiredStarters,...savedStarters.filter(id=>!requiredStarters.includes(id))];
  return {...d,width:rec?.width||d.width,height:rec?.height||d.height,sizes,starterTemplates};
 }
 function saveDefs(defs){localStorage.setItem(KEY,JSON.stringify(defs.map(normalizeDef)));window.ACDLCalendarTypeDefinitions=defs.map(normalizeDef);syncRuntimeFromDefinitions()}
 function migrate(){
  const defs=readDefs();
  if(!defs.length)return;
  if(!localStorage.getItem(DESK_SAMPLE_MIGRATION_KEY)){
   const desk=defs.find(d=>d.id==='desk');
   if(desk){
    const current=Array.isArray(desk.starterTemplates)?desk.starterTemplates:[];
    desk.starterTemplates=['desk-sample-6','desk-sample-3','desk-sample-2',...current.filter(id=>!['desk-sample-6','desk-sample-3','desk-sample-2'].includes(id))]
   }
   localStorage.setItem(DESK_SAMPLE_MIGRATION_KEY,'1')
  }
  saveDefs(defs)
 }
 function activeDefinition(){return readDefs().map(normalizeDef).find(d=>d.id===$('tmId')?.value)||null}
 function sizeLabel(s){return `${s.name} — ${s.width} × ${s.height} ${s.unit||'mm'}`}
 function syncRuntimeFromDefinitions(){
  const defs=readDefs().map(normalizeDef);window.ACDLCalendarTypeDefinitions=defs;
  defs.forEach(d=>{SIZE_PRESETS[d.id]=d.sizes.map(s=>({id:s.id,label:sizeLabel(s),width:s.width,height:s.height,note:s.note||`${d.name} 유형에서 관리되는 크기`,recommended:s.recommended}))});
  updateStarterTemplateOptions($('setupType')?.value);
  if($('setupType')?.value)renderSizeOptions();
 }
 function ensureManagerSections(){
  const editor=document.querySelector('.type-manager-editor');if(!editor||$('tmSizeEditor'))return;
  const allowed=[...editor.querySelectorAll('.type-form-section')].find(s=>s.querySelector('#tmAllowedObjects'));
  if(!allowed)return;
  const sizes=document.createElement('section');sizes.className='type-form-section';sizes.innerHTML='<h3>기본 크기 프리셋</h3><p class="resource-description">이 유형을 선택했을 때 표시할 제작 크기를 관리합니다. 추천 크기는 한 개만 지정합니다.</p><div id="tmSizeEditor" class="type-size-editor"></div><button id="tmAddSizeBtn" type="button" class="type-add-row">+ 크기 추가</button>';
  const starters=document.createElement('section');starters.className='type-form-section';starters.innerHTML='<h3>시작 템플릿</h3><p class="resource-description">새 템플릿을 만들 때 선택할 수 있는 기본 디자인 시작점을 지정합니다.</p><div id="tmStarterEditor" class="type-starter-grid"></div>';
  allowed.before(sizes,starters);
  $('tmAddSizeBtn').addEventListener('click',()=>addSizeRow({name:'새 크기',width:Number($('tmWidth').value||148),height:Number($('tmHeight').value||100),unit:'mm',recommended:false,note:''}));
 }
 function addSizeRow(s){
  const row=document.createElement('div');row.className='type-size-row';row.innerHTML=`<label>이름<input data-size-name value="${escapeAttr(s.name||'')}"></label><label>너비<input data-size-width type="number" min="20" value="${Number(s.width||148)}"></label><label>높이<input data-size-height type="number" min="20" value="${Number(s.height||100)}"></label><label>단위<select data-size-unit><option value="mm" ${(s.unit||'mm')==='mm'?'selected':''}>mm</option><option value="px" ${s.unit==='px'?'selected':''}>px</option></select></label><label class="inline-recommended"><input data-size-recommended type="radio" name="tmRecommendedSize" ${s.recommended?'checked':''}>추천</label><button type="button" class="type-row-delete">삭제</button><input data-size-id type="hidden" value="${escapeAttr(s.id||'')}"><label style="grid-column:1/-1">설명<input data-size-note value="${escapeAttr(s.note||'')}"></label>`;
  row.querySelector('.type-row-delete').onclick=()=>{if($('tmSizeEditor').children.length<=1)return alert('크기는 한 개 이상 필요합니다.');row.remove();if(!$('tmSizeEditor').querySelector('[data-size-recommended]:checked'))$('tmSizeEditor').querySelector('[data-size-recommended]').checked=true};
  $('tmSizeEditor').appendChild(row)
 }
 function fillEnhancements(d){
  ensureManagerSections();d=normalizeDef(d||activeDefinition()||{});$('tmSizeEditor').innerHTML='';d.sizes.forEach(addSizeRow);
  $('tmStarterEditor').innerHTML=starterCatalog.map(x=>`<label><input type="checkbox" data-starter-id="${x.id}" ${d.starterTemplates.includes(x.id)?'checked':''}>${x.name}</label>`).join('');
 }
 function readEnhancedForm(){
  const sizes=[...$('tmSizeEditor').querySelectorAll('.type-size-row')].map((r,i)=>({id:r.querySelector('[data-size-id]').value||`${$('tmId').value}-size-${i+1}`,name:r.querySelector('[data-size-name]').value.trim()||`크기 ${i+1}`,width:Number(r.querySelector('[data-size-width]').value),height:Number(r.querySelector('[data-size-height]').value),unit:r.querySelector('[data-size-unit]').value,recommended:r.querySelector('[data-size-recommended]').checked,note:r.querySelector('[data-size-note]').value.trim()}));
  if(!sizes.some(s=>s.recommended)&&sizes[0])sizes[0].recommended=true;
  return {sizes,starterTemplates:[...$('tmStarterEditor').querySelectorAll('[data-starter-id]:checked')].map(x=>x.dataset.starterId)}
 }
 function persistEnhanced(){
  const defs=readDefs().map(normalizeDef),id=$('tmId')?.value;if(!id||!$('tmSizeEditor'))return;
  const idx=defs.findIndex(d=>d.id===id);if(idx<0)return;const enhanced=readEnhancedForm();defs[idx]=normalizeDef({...defs[idx],...enhanced});saveDefs(defs);fillEnhancements(defs[idx]);showEditorToast('달력 유형의 크기와 시작 템플릿을 저장했습니다.')
 }
 function closeToDesigner(){
  $('typeManagerOverlay')?.classList.add('hidden');$('designerHome')?.classList.add('hidden');$('entryScreen')?.classList.remove('hidden');$('setup')?.classList.add('hidden');$('templateLibraryModal')?.classList.add('hidden')
 }
 function updateStarterTemplateOptions(typeId){
  const select=$('setupTemplate');if(!select)return;const d=readDefs().map(normalizeDef).find(x=>x.id===typeId);const fallback=typeId==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2','school-basic','minimal']:['school-basic','minimal'];const ids=d?.starterTemplates?.length?d.starterTemplates:fallback;const required=typeId==='desk'?['desk-sample-6','desk-sample-3','desk-sample-2']:[];const visibleIds=[...required,...ids.filter(id=>!required.includes(id))];const current=select.value;select.innerHTML=starterCatalog.filter(x=>visibleIds.includes(x.id)).map(x=>`<option value="${x.id}">${x.name}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current
 }
 migrate();ensureManagerSections();syncRuntimeFromDefinitions();
 $('designerHomeTypes')?.addEventListener('click',()=>setTimeout(()=>fillEnhancements(activeDefinition()),0));
 $('typeDefinitionList')?.addEventListener('click',e=>{const card=e.target.closest('[data-type-def]');if(card)setTimeout(()=>fillEnhancements(readDefs().map(normalizeDef).find(d=>d.id===card.dataset.typeDef)),0)});
 $('addTypeDefinitionBtn')?.addEventListener('click',()=>setTimeout(()=>fillEnhancements(activeDefinition()),0));
 $('resetTypeDefinitionsBtn')?.addEventListener('click',()=>setTimeout(()=>{migrate();fillEnhancements(activeDefinition());syncRuntimeFromDefinitions()},0));
 $('saveTypeDefinitionBtn')?.addEventListener('click',()=>setTimeout(persistEnhanced,0));
 $('closeTypeManagerBtn')?.addEventListener('click',closeToDesigner);
 $('typeManagerOverlay')?.addEventListener('click',e=>{if(e.target===$('typeManagerOverlay'))closeToDesigner()});
 $('setupType')?.addEventListener('change',()=>{syncRuntimeFromDefinitions();updateStarterTemplateOptions($('setupType').value)});
 const previousMake=makeProject;makeProject=function(opts){const result=previousMake(opts),defs=readDefs().map(normalizeDef),d=defs.find(x=>x.id===opts.type),preset=d?.sizes?.find(s=>s.id===opts.sizePresetId)||d?.sizes?.find(s=>s.recommended)||d?.sizes?.[0];if(d){result.settings.typeDefinition=structuredClone(d);result.template.typeDefinitionId=d.id;result.template.starterTemplateId=opts.template;if(preset){result.settings.sizePreset={id:preset.id,label:sizeLabel(preset),width:preset.width,height:preset.height};result.productType.pageSize={width:preset.width,height:preset.height,unit:preset.unit||'mm'}}}return result};
 updateStarterTemplateOptions($('setupType')?.value||'desk');
})();
