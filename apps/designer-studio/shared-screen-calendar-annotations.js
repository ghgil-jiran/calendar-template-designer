/* Common calendar annotations: authoring, Runtime and browser print share markup. */
(function(root){
 'use strict';
 const modes=['basic-1','basic-2','below','beside'];
 const labels=[['basic-1','기본형 1'],['basic-2','기본형 2'],['below','날짜 하단 정리형'],['beside','날짜 옆 정리형']];
 const clamp=(x,a,b,d)=>Number.isFinite(Number(x))?Math.max(a,Math.min(b,Number(x))):d;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const color=(s,f)=>/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(s||'')?s:f;
 function normalize(value){if(!modes.includes(value?.layout))return null;return {layout:value.layout,fontSize:clamp(value.fontSize,4,18,6),colorMode:value.colorMode==='custom'?'custom':'inherit',color:color(value.color,'#344054'),saturdayColor:color(value.saturdayColor,'#2463a6'),holidayColor:color(value.holidayColor,'#d92d20'),rightInsetMm:1.2,minScale:.8};}
 const categoryDefaults={anniversaries:'#344054',solarTerms:'#667085',lunars:'#98a2b3'};
 function normalizeColors(value={}){
  const result={schemaVersion:'calendar-reference-colors.v1'};
  for(const [kind,fallback] of Object.entries(categoryDefaults)){const entry=value?.[kind]||{};result[kind]={mode:entry.mode==='custom'?'custom':'inherit',color:color(entry.color,fallback)};}
  return result;
 }
 function normalizeProject(project){
  if(!project?.template||project.productionCorrection)return project;
  const calendar=project.template.masters?.calendar;
  if(calendar){calendar.calendarLayout||={};calendar.calendarLayout.referenceColors=normalizeColors(calendar.calendarLayout.referenceColors);}
  const arrays=[...Object.values(project.template.masterElements||{}),...Object.values(project.book?.elementsByPage||{})];
  for(const arr of arrays)for(const item of Array.isArray(arr)?arr:[])if(item.style?.calendarLayout?.referenceColors)item.style.calendarLayout.referenceColors=normalizeColors(item.style.calendarLayout.referenceColors);
  return project;
 }
 function entries(refs={}){
  const seen=new Set(),result=[];
  for(const kind of ['holidays','anniversaries','solarTerms','lunars'])for(const item of refs[kind]||[]){const name=String(typeof item==='string'?item:item?.name||'').trim(),key=name.normalize('NFKC').replace(/\s+/g,'');if(!name||seen.has(key))continue;seen.add(key);result.push({name,kind:kind==='holidays'&&item?.isHoliday===false?'anniversaries':kind});}
  return result;
 }
 function items(refs={}){const result={holidays:[],anniversaries:[],solarTerms:[],lunars:[]};for(const item of entries(refs))result[item.kind].push(item.name);return result;}
 function context({weekday=0,isHoliday=false,style,colors={},referenceColors}={}){
  const config=normalize(style),palette=!referenceColors&&config?.colorMode==='custom'?config:{color:color(colors.color,'var(--calendar-date-color,#344054)'),saturdayColor:color(colors.saturdayColor,'var(--calendar-saturday-color,#2463a6)'),holidayColor:color(colors.holidayColor,'var(--calendar-holiday-color,#d92d20)')};
  const tone=isHoliday||weekday===0?palette.holidayColor:weekday===6?palette.saturdayColor:palette.color;
  const policy=normalizeColors(referenceColors);
  return {tone,colorFor:kind=>kind==='holidays'?palette.holidayColor:policy[kind]?.mode==='custom'?policy[kind].color:tone};
 }
 function renderEntries(list,ctx,separator=' · '){return list.map(item=>'<span data-reference-kind="'+item.kind+'" style="color:'+ctx.colorFor(item.kind)+'">'+escape(item.name)+'</span>').join(separator);}
 function renderLegacy(refs,options={},kinds=['holidays','anniversaries']){const all=entries(refs),list=kinds.flatMap(kind=>all.filter(item=>item.kind===kind));return renderEntries(list,context(options),kinds.includes('lunars')?' / ':' · ');}
 function render({day,weekday=0,isHoliday=false,refs={},style,colors={},referenceColors}){
  const config=normalize(style);if(!config)return '';
  const data=entries(refs),ctx=context({weekday,isHoliday,style,colors,referenceColors});
  const primary=data.filter(item=>['holidays','anniversaries'].includes(item.kind)),secondary=data.filter(item=>['solarTerms','lunars'].includes(item.kind));
  let side=[],bottom=[];
  if(config.layout==='basic-1'){side=secondary;bottom=primary;}
  if(config.layout==='basic-2'){side=primary;bottom=secondary;}
  if(config.layout==='below')bottom=[...primary,...secondary];
  if(config.layout==='beside')side=[...primary,...secondary];
  const block=(list,where)=>list.length?'<div class="calendar-annotation-text ann-'+where+'">'+renderEntries(list,ctx)+'</div>':'';
  return '<div class="calendar-annotations-day ann-'+config.layout+'" data-ann-base="'+config.fontSize+'" style="--ann-size:'+config.fontSize+'pt;--ann-color:'+ctx.tone+';--ann-right:'+config.rightInsetMm+'mm"><div class="ann-heading"><span class="day ann-date">'+escape(day)+'</span>'+block(side,'side')+'</div>'+block(bottom,'bottom')+'</div>';
 }
 const css='.calendar-annotations-day{box-sizing:border-box;width:100%;padding-right:var(--ann-right,1.2mm);min-width:0;font-family:inherit;line-height:1.2}.calendar-annotations-day .ann-heading{display:flex;align-items:center;gap:.7mm;min-width:0}.calendar-annotations-day .ann-date{flex:none;align-self:flex-start}.calendar-annotations-day .calendar-annotation-text{font-family:inherit;font-size:var(--ann-size,6pt)!important;font-weight:400;line-height:1.2;letter-spacing:normal;color:var(--ann-color);white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere;word-break:normal;-webkit-line-clamp:unset!important;line-clamp:unset!important}.calendar-annotations-day .ann-side{flex:1;min-width:0}.calendar-annotations-day .ann-bottom{margin-top:.5mm}.calendar-annotations-day .ann-warning{color:#b54708;font:9px sans-serif;display:block}.calendar-annotations-day[data-ann-overflow="true"]{outline:1px dashed #d97706}@media print{.calendar-annotations-day .ann-warning{display:none!important}.calendar-annotations-day[data-ann-overflow="true"]{outline:none!important}}';
 function fit(scope){
  if(!scope?.querySelectorAll)return;
  const bars=[...scope.querySelectorAll('.range-event-bar,.shared-month-range-grid .absolute')].map(n=>n.getBoundingClientRect()).filter(r=>r.height>0);
  for(const node of scope.querySelectorAll('.calendar-annotations-day')){
   node.querySelector('.ann-warning')?.remove();
   const cell=node.closest('.cell,.shared-month-day-cell,[data-annotation-cell]')||node.parentElement;
   if(!cell)continue;
   const base=Number(node.dataset.annBase)||6;node.style.setProperty('--ann-size',base+'pt');
   const cellRect=cell.getBoundingClientRect(),rect=node.getBoundingClientRect();if(!(cellRect.height>0&&rect.width>0))continue;
   let available=cellRect.bottom-rect.top-2;
   for(const bar of bars)if(bar.right>rect.left&&bar.left<rect.right&&bar.bottom>rect.top&&bar.top<cellRect.bottom)available=Math.min(available,bar.top-rect.top-2);
   const minimum=Math.max(4,base*.8);let size=base;
   while(node.scrollHeight>available+.5&&size>minimum+.01){size=Math.max(minimum,size-.25);node.style.setProperty('--ann-size',size+'pt');}
   const overflow=node.scrollHeight>available+.5;node.dataset.annOverflow=String(overflow);
   if(overflow){const warning=node.ownerDocument.createElement('span');warning.className='ann-warning editor-only non-output';warning.textContent='부가정보 공간 부족';node.appendChild(warning);}
  }
 }
 function install(){if(!root.document||root.document.getElementById('shared-calendar-annotations-css'))return;const style=root.document.createElement('style');style.id='shared-calendar-annotations-css';style.textContent=css;root.document.head.appendChild(style);}
 install();
 root.ACDLSharedCalendarAnnotations=Object.freeze({version:'1.1.0',labels,normalize,normalizeColors,normalizeProject,items,entries,context,renderLegacy,render,fit,css});
})(globalThis);
