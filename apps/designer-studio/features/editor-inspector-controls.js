(()=>{
 const inspector=document.getElementById('inspector');
 const colorPattern=/^#[\da-f]{6}$/i;
 const standardColors=[
  '#000000','#ffffff','#e5e7eb','#9ca3af','#4b5563','#17202e',
  '#dc2626','#ea580c','#eab308','#15803d','#0891b2','#2563eb',
  '#4338ca','#7e22ce','#be185d','#92400e','#166534','#0f766e',
 ];
 const storageKey='calendar-editor-recent-colors';
 let recent=[];
 function showColors(input){
  document.getElementById('templateColorPalette')?.remove();
  try{
   const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
   if(Array.isArray(saved))recent=saved.filter(color=>colorPattern.test(color)).slice(0,6);
  }catch{/* Browser storage is optional. */}
  const theme=[...new Set(Object.values(project?.template?.resources?.colorTheme||{}).filter(color=>typeof color==='string'&&colorPattern.test(color)).map(color=>color.toLowerCase()))].slice(0,12);
  const panel=document.createElement('div');
  panel.id='templateColorPalette';
  panel.className='template-color-palette';
  panel.setAttribute('popover','auto');
  panel.setAttribute('aria-label',input.getAttribute('aria-label')||'색상 선택');
  const choose=color=>{
   if(!input.isConnected||!colorPattern.test(color))return;
   color=color.toLowerCase();
   recent=[color,...recent.filter(previous=>previous!==color)].slice(0,6);
   try{localStorage.setItem(storageKey,JSON.stringify(recent));}catch{/* Browser storage is optional. */}
   panel.hidePopover();
   input.value=color;
   input.focus();
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  };
  for(const [title,colors] of [['템플릿 색',theme],['기본 색',standardColors],['최근 사용한 색',recent]]){
   if(!colors.length)continue;
   const heading=document.createElement('div'),grid=document.createElement('div');
   heading.textContent=title;
   grid.className='template-color-grid';
   grid.setAttribute('role','group');
   grid.setAttribute('aria-label',title);
   for(const color of colors){
    const button=document.createElement('button');
    button.type='button';
    button.title=color;
    button.setAttribute('aria-label',color);
    button.setAttribute('aria-pressed',String(color===input.value));
    button.style.backgroundColor=color;
    button.onclick=()=>choose(color);
    grid.append(button);
   }
   panel.append(heading,grid);
  }
  const custom=document.createElement('details');
  custom.innerHTML='<summary>사용자 지정 색</summary><div class="template-custom-color"><input type="color" aria-label="세부 색상 선택"><input type="text" aria-label="HEX 색상값" maxlength="7"><button type="button">적용</button></div>';
  const [picker,hex,apply]=custom.querySelectorAll('input,button');
  picker.value=hex.value=input.value;
  picker.oninput=()=>{hex.value=picker.value;apply.disabled=false;};
  hex.oninput=()=>{apply.disabled=!colorPattern.test(hex.value);if(!apply.disabled)picker.value=hex.value;};
  hex.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();choose(hex.value);}};
  apply.onclick=()=>choose(hex.value);
  panel.append(custom);
  const bounds=input.getBoundingClientRect();
  panel.style.left=Math.max(8,Math.min(bounds.right-232,window.innerWidth-240))+'px';
  if(window.innerHeight-bounds.bottom<300&&bounds.top>window.innerHeight-bounds.bottom)panel.style.bottom=(window.innerHeight-bounds.top+6)+'px';
  else panel.style.top=(bounds.bottom+6)+'px';
  panel.addEventListener('toggle',event=>{if(event.newState==='closed')panel.remove();});
  document.body.append(panel);
  panel.showPopover();
  panel.querySelector('button')?.focus();
 }
 inspector?.addEventListener('click',event=>{
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='color')return;
  event.preventDefault();showColors(input);
 });

 const previousInspector=renderInspector;
 renderInspector=function(){
  const result=previousInspector.apply(this,arguments),item=sourceElement();
  if(!item||!['image','image-frame','semantic-object'].includes(item.type))return result;
  const panel=inspector?.querySelector('[data-panel="design"]');
  if(!panel)return result;
  const fit=item.image||{},contain=(fit.fit||item.fit||(['school-logo','school-song'].includes(item.role)?'contain':'cover'))==='contain';
  const group=document.createElement('div');
  group.className='inspector-group';
  group.innerHTML=`<div class="inspector-group-title"><span>이미지 맞춤</span></div>
   <label>프레임 맞춤<select data-image-fit><option value="cover" ${!contain?'selected':''}>프레임 채우기</option><option value="contain" ${contain?'selected':''}>이미지 전체 보기</option></select></label>
   <div class="grid2"><label>사진 확대<input data-image-scale type="number" min=".1" max="10" step=".05" value="${Number(fit.scale)||1}"></label>
   <label>가로 위치 (%)<input data-image-x type="number" min="-100" max="100" value="${Number(fit.offsetX)||0}"></label>
   <label>세로 위치 (%)<input data-image-y type="number" min="-100" max="100" value="${Number(fit.offsetY)||0}"></label></div>
   <button type="button" class="action">이미지 맞춤 저장</button>`;
  group.querySelector('button').onclick=()=>{
   const value=key=>group.querySelector('[data-image-'+key+']').value;
   const number=(key,min,max,fallback)=>Math.max(min,Math.min(max,Number(value(key)||fallback)));
   change(()=>{
    const target=ensureCurrentPageEditTarget().item;
    if(!target)return;
    const fitMode=value('fit');
    if(target.type==='image')target.fit=fitMode;
    target.image={...target.image,fit:fitMode,scale:number('scale',.1,10,1),offsetX:number('x',-100,100,0),offsetY:number('y',-100,100,0)};
   });
  };
  if(panel.children.length===1&&panel.firstElementChild.classList.contains('inspector-tab-empty'))panel.replaceChildren(group);
  else panel.append(group);
  return result;
 };
})();
