/* Common calendar annotations: authoring, Runtime and browser print share markup. */
(function(root){
 'use strict';
 const modes=['basic-1','basic-2','below','beside'];
 const labels=[['basic-1','기본형 1'],['basic-2','기본형 2'],['below','날짜 하단 정리형'],['beside','날짜 옆 정리형']];
 const clamp=(x,a,b,d)=>Number.isFinite(Number(x))?Math.max(a,Math.min(b,Number(x))):d;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const color=(s,f)=>/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(s||'')?s:f;
 function normalize(value){if(!modes.includes(value?.layout))return null;return {layout:value.layout,fontSize:clamp(value.fontSize,4,18,6),colorMode:value.colorMode==='custom'?'custom':'inherit',color:color(value.color,'#344054'),saturdayColor:color(value.saturdayColor,'#2463a6'),holidayColor:color(value.holidayColor,'#d92d20'),rightInsetMm:1.2,minScale:.8};}
 function items(refs={}){
  const seen=new Set(),result={holidays:[],anniversaries:[],solarTerms:[],lunars:[]};
  for(const kind of Object.keys(result))for(const item of refs[kind]||[]){const name=String(typeof item==='string'?item:item?.name||'').trim(),key=name.normalize('NFKC').replace(/\s+/g,'');if(!name||seen.has(key))continue;seen.add(key);result[kind].push(name);}
  return result;
 }
 function render({day,weekday=0,isHoliday=false,refs={},style,colors={}}){
  const config=normalize(style);if(!config)return '';
  const data=items(refs),holiday=isHoliday||weekday===0;
  const palette=config.colorMode==='custom'?config:{color:color(colors.color,'var(--calendar-date-color,#344054)'),saturdayColor:color(colors.saturdayColor,'var(--calendar-saturday-color,#2463a6)'),holidayColor:color(colors.holidayColor,'var(--calendar-holiday-color,#d92d20)')};
  const tone=holiday?palette.holidayColor:weekday===6?palette.saturdayColor:palette.color;
  const primary=[...data.holidays,...data.anniversaries],secondary=[...data.solarTerms,...data.lunars];
  let side=[],bottom=[];
  if(config.layout==='basic-1'){side=secondary;bottom=primary;}
  if(config.layout==='basic-2'){side=primary;bottom=secondary;}
  if(config.layout==='below')bottom=[...primary,...secondary];
  if(config.layout==='beside')side=[...primary,...secondary];
  const block=(names,where)=>names.length?'<div class="calendar-annotation-text ann-'+where+'">'+names.map(escape).join(' · ')+'</div>':'';
  return '<div class="calendar-annotations-day ann-'+config.layout+'" data-ann-base="'+config.fontSize+'" style="--ann-size:'+config.fontSize+'pt;--ann-color:'+tone+';--ann-right:'+config.rightInsetMm+'mm"><div class="ann-heading"><span class="day ann-date">'+escape(day)+'</span>'+block(side,'side')+'</div>'+block(bottom,'bottom')+'</div>';
 }
 const css='.calendar-annotations-day{box-sizing:border-box;width:100%;padding-right:var(--ann-right,1.2mm);min-width:0;font-family:inherit;line-height:1.2}.calendar-annotations-day .ann-heading{display:flex;align-items:baseline;gap:.7mm;min-width:0}.calendar-annotations-day .ann-date{flex:none}.calendar-annotations-day .calendar-annotation-text{font-family:inherit;font-size:var(--ann-size,6pt)!important;font-weight:400;line-height:1.2;letter-spacing:normal;color:var(--ann-color);white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere;word-break:normal;-webkit-line-clamp:unset!important;line-clamp:unset!important}.calendar-annotations-day .ann-side{flex:1;min-width:0}.calendar-annotations-day .ann-bottom{margin-top:.5mm}.calendar-annotations-day .ann-warning{color:#b54708;font:9px sans-serif;display:block}.calendar-annotations-day[data-ann-overflow="true"]{outline:1px dashed #d97706}@media print{.calendar-annotations-day .ann-warning{display:none!important}.calendar-annotations-day[data-ann-overflow="true"]{outline:none!important}}';
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
 root.ACDLSharedCalendarAnnotations=Object.freeze({version:'1.0.0',labels,normalize,items,render,fit,css});
})(globalThis);
