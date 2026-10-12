/* Dedicated annual/schedule styles, including a page-level annual inspector. */
(()=>{
 const $=id=>document.getElementById(id),escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function target(){
  const selected=sourceElement();if(selected)return selected;
  const annual=allVisibleElements().find(e=>e.type==='year-calendar');if(!annual)return null;
  return (project.book.elementsByPage[selectedPage().id]||[]).find(e=>e.id===annual.id)||(project.template.masterElements[selectedPage().masterId]||[]).find(e=>e.id===annual.id)||null;
 }
 const input=(key,label,type,value)=>`<label>${label}<input data-page-style="${key}" type="${type}" ${type==='number'?'min="0" max="96" step=".5"':''} value="${escape(value)}"></label>`;
 const select=(key,label,value,options)=>`<label>${label}<select data-page-style="${key}">${options.map(([id,name])=>`<option value="${id}" ${String(value)===String(id)?'selected':''}>${name}</option>`).join('')}</select></label>`;
 const fonts=['','Pretendard','Noto Sans KR','Noto Serif KR','Nanum Gothic','Nanum Myeongjo','Arial','Times New Roman','Playfair Display'].map(font=>[font,font||'템플릿 기본 글꼴']);
 const previous=renderInspector;
 renderInspector=function(){
  const result=previous.apply(this,arguments),item=target(),panel=$('inspector')?.querySelector('[data-panel="design"]');
  if(!item||!panel||!['year-calendar','event-list','monthly-schedule'].includes(item.type))return result;
  const s=item.style||{},annual=item.type==='year-calendar';
  const section=document.createElement('div');section.className='section element-inspector';section.id='pageWidgetStyles';
  let html=`<strong>${annual?'연력 · 월 영역 스타일':'학사일정 · 글자와 월 영역 스타일'}</strong><p class="hint">${annual?'요일·날짜 색과 날짜 격자를 이 연력 개체에 저장합니다.':'저장한 글꼴·색·크기는 사용자 서비스와 출력에도 동일하게 전달됩니다.'}</p>`;
  html+=select('fontFamily','글꼴',s.fontFamily||'',fonts);
  if(annual){
   html+=input('dateSize','날짜 글자 크기 (px)','number',s.dateSize??7)+input('titleSize','월 제목 크기 (px)','number',s.titleSize??10);
   html+=select('dayGridStyle','날짜 격자',s.dayGridStyle||'none',[['boxes','독립 박스'],['underline','독립 밑줄'],['none','무선']]);
   html+=input('dateColor','평일 날짜색','color',s.dateColor||'#293878')+input('sunday','일요일·공휴일색','color',s.sunday||'#ef3340')+input('saturday','토요일색','color',s.saturday||'#4777bd')+input('lineColor','격자 선색','color',s.lineColor||'#d8dbe2');
  }else{
   html+=input('fontSize','일정 글자 크기 (px)','number',s.fontSize??item.fontSize??8)+select('fontWeight','글자 굵기',s.fontWeight||400,[[400,'보통'],[500,'중간'],[700,'굵게']])+input('color','일정 글자색','color',s.color||'#17202e')+input('lineHeight','행간','number',s.lineHeight??1.3);
   html+=input('titleSize','각 월 제목 크기 (px)','number',s.titleSize??10)+input('titleColor','각 월 제목 글자색','color',s.titleColor||'#173b63')+select('titleAlign','각 월 제목 정렬',s.titleAlign||'left',[['left','왼쪽'],['center','가운데'],['right','오른쪽']])+select('titlePosition','각 월 제목 위치',s.titlePosition||'top',[['top','내용 위'],['bottom','내용 아래']]);
   for(const [key,label] of [['titleBackground','월 제목 배경'],['contentBackground','월 내용 배경'],['monthBackground','각 월 전체 영역 배경'],['containerBackground','전체 일정 영역 배경']])html+=`<label class="inline-check"><input type="checkbox" data-page-background="${key}" ${s[key]&&s[key]!=='transparent'?'checked':''}><span>${label} 사용</span></label>`+input(key,label,'color',s[key]&&s[key]!=='transparent'?s[key]:'#ffffff');
   html+=input('monthBorderWidth','각 월 사각 테두리 두께 (px)','number',s.monthBorderWidth??0)+input('lineColor','각 월 테두리색','color',s.lineColor||'#d8dbe2')+input('containerBorderWidth','전체 영역 사각 테두리 두께 (px)','number',s.containerBorderWidth??0)+input('containerBorderColor','전체 영역 테두리색','color',s.containerBorderColor||'#d8dbe2');
  }
  section.innerHTML=html+'<button id="savePageWidgetStyles" type="button" class="action" disabled>스타일 저장</button>';panel.append(section);
  const controls=[...section.querySelectorAll('[data-page-style]')],baseline=controls.map(e=>e.value),modes=[...section.querySelectorAll('[data-page-background]')],modeBaseline=modes.map(e=>e.checked),button=$('savePageWidgetStyles');
  const refresh=()=>{modes.forEach(mode=>{const color=controls.find(e=>e.dataset.pageStyle===mode.dataset.pageBackground);if(color)color.disabled=!mode.checked;});button.disabled=!controls.some((e,i)=>e.value!==baseline[i])&&!modes.some((e,i)=>e.checked!==modeBaseline[i]);inspectorDirty=!button.disabled;};
  [...controls,...modes].forEach(control=>{control.addEventListener('input',refresh);control.addEventListener('change',refresh);});refresh();
  button.onclick=()=>{
   if(button.disabled)return;
   const values=Object.fromEntries(controls.map(e=>[e.dataset.pageStyle,e.type==='number'?Number(e.value):e.value]));
   modes.forEach(mode=>{if(!mode.checked)values[mode.dataset.pageBackground]='transparent';});
   for(const key of ['titleBackground','contentBackground','monthBackground','containerBackground'])if(values[key]&&!/^(#[0-9a-f]{3,8}|transparent)$/i.test(values[key])){showEditorToast('배경색은 #RRGGBB 또는 transparent로 입력해 주세요.');return;}
   change(()=>{item.style={...item.style,...values};if(values.fontSize!==undefined){item.fontSize=values.fontSize;item.minFontSize=Math.min(item.minFontSize||values.fontSize,values.fontSize);}syncMonthlySharedFields(item,['style','fontSize','minFontSize']);});
  };
  return result;
 };
})();
