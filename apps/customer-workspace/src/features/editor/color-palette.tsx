'use client';

import {useId,useRef,useState,type CSSProperties} from 'react';

const standardColors=[
 '#000000','#ffffff','#e5e7eb','#9ca3af','#4b5563','#17202e',
 '#dc2626','#ea580c','#eab308','#15803d','#0891b2','#2563eb',
 '#4338ca','#7e22ce','#be185d','#92400e','#166534','#0f766e',
];
const isColor=(value:unknown):value is string=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value);
const swatchStyle=(color:string):CSSProperties=>({backgroundColor:color});
const storageKey='calendar-editor-recent-colors';
let recentColors:string[]=[];

export function editorThemeColors(theme?:Record<string,unknown>){
 return [...new Set(Object.values(theme??{}).filter(isColor).map(color=>color.toLowerCase()))].slice(0,12);
}

export function ColorPalette({label,value,onChange,theme=[],disabled=false,allowNone=false,allowAlpha=false}:{
 label:string;value?:string;onChange:(color:string)=>void;theme?:string[];disabled?:boolean;allowNone?:boolean;allowAlpha?:boolean;
}){
 const id=useId(),panel=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [recent,setRecent]=useState<string[]>([]),[custom,setCustom]=useState(false),[draft,setDraft]=useState('#17202e');
 const [transparency,setTransparency]=useState(0);
 const alphaColor=allowAlpha&&typeof value==='string'&&/^#[\da-f]{8}$/i.test(value);
 const color=(isColor(value)||alphaColor)?value.toLowerCase():value==='transparent'&&allowNone?'transparent':'#17202e';
 function open(){
  const popup=panel.current,button=trigger.current;
  if(!popup||!button)return;
  if(popup.matches(':popover-open'))return;
  try{
   const saved:unknown=JSON.parse(localStorage.getItem(storageKey)||'null');
   if(Array.isArray(saved))recentColors=saved.filter(isColor).slice(0,6);
  }catch{/* Retain session colors if browser storage is unavailable. */}
  setRecent(recentColors);
  setCustom(false);
  setDraft(color==='transparent'?'#17202e':color.slice(0,7));
  setTransparency(color==='transparent'?100:alphaColor?Math.round((1-parseInt(color.slice(7),16)/255)*100):0);
  const bounds=button.getBoundingClientRect();
  popup.style.setProperty('--palette-left',`${Math.max(8,Math.min(bounds.right-232,window.innerWidth-240))}px`);
  popup.style.setProperty('--palette-top',`${bounds.bottom+6}px`);
  popup.style.setProperty('--palette-bottom',`${window.innerHeight-bounds.top+6}px`);
  popup.dataset.above=String(window.innerHeight-bounds.bottom<300&&bounds.top>window.innerHeight-bounds.bottom);
 }
 function apply(next:string){
  if(isColor(next)){
   next=next.toLowerCase();
   recentColors=[next,...recentColors.filter(color=>color!==next)].slice(0,6);
   try{localStorage.setItem(storageKey,JSON.stringify(recentColors));}catch{/* Storage is optional. */}
  }
  panel.current?.hidePopover();
  trigger.current?.focus();
  const opacity=Math.round((100-transparency)*255/100).toString(16).padStart(2,'0');
  onChange(allowAlpha&&isColor(next)&&transparency>0?next+opacity:next);
 }
 function swatches(title:string,colors:string[]){
  return colors.length>0&&<div className="editor-palette-section">
   <div>{title}</div>
   <div className="editor-palette-grid" role="group" aria-label={title}>
    {colors.map(hex=><button key={hex} type="button" className="editor-palette-swatch" aria-label={hex} aria-pressed={color===hex} title={hex} style={swatchStyle(hex)} onClick={()=>apply(hex)}/>)}
   </div>
  </div>;
 }
 return <div className="editor-palette">
  <button ref={trigger} type="button" className="editor-palette-trigger" disabled={disabled} title={label} aria-label={label} aria-controls={id} popoverTarget={id} onClick={open}>
   <span className="editor-palette-current" style={swatchStyle(color)}/><span className="editor-palette-chevron" aria-hidden="true"/>
  </button>
  <div ref={panel} id={id} popover="auto" className="editor-palette-panel" aria-label={label}>
   {swatches('템플릿 색',theme)}
   {swatches('기본 색',standardColors)}
   {swatches('최근 사용한 색',recent)}
   {allowAlpha&&<div className="editor-palette-alpha"><label>투명도 {transparency}%<input aria-label="투명도" type="range" min="0" max="100" value={transparency} onChange={e=>setTransparency(Number(e.target.value))}/></label><button type="button" className="editor-palette-action" onClick={()=>apply(color==='transparent'?draft:color.slice(0,7))}>투명도 적용</button></div>}
   {allowNone&&<button type="button" className="editor-palette-action" onClick={()=>apply('transparent')}>색 없음</button>}
   <button type="button" className="editor-palette-action" aria-expanded={custom} onClick={()=>setCustom(!custom)}>사용자 지정 색</button>
   {custom&&<div className="editor-palette-custom">
    <input type="color" aria-label="세부 색상 선택" value={isColor(draft)?draft:'#17202e'} onChange={e=>setDraft(e.target.value)}/>
    <input type="text" aria-label="HEX 색상값" value={draft} maxLength={7} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&isColor(draft)){e.preventDefault();apply(draft);}}}/>
    <button type="button" disabled={!isColor(draft)} onClick={()=>apply(draft)}>적용</button>
   </div>}
  </div>
 </div>;
}
