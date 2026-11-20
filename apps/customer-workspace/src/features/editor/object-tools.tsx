'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {applyFieldDrafts,fieldChanged,type SchoolFieldDraft} from '@/lib/editor/card-state';
import {Button} from '@/components/ui/button';
import {wallOptions,wallStyleName,type EditorTarget,type PhotoFit,type TextStyle} from '@/lib/editor/session';
import type {SchoolField,SchoolInput} from '@/lib/api/contracts';
import {fontChoices} from '@/lib/editor/font-catalog';
import type {NativeProject} from '@/lib/materials/native-project';

type ToolIconName='undo'|'redo'|'copy'|'paste'|'delete'|'left'|'center'|'right'|'justify'|'school'|'schedule'|'image';
export function ToolIcon({name}:{name:ToolIconName}){
 const paths:Record<ToolIconName,string>={undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',redo:'m15 5 5 5-5 5M20 10H10a6 6 0 0 0 0 12',copy:'M9 8h11v13H9zM15 8V3H4v13h5',paste:'M9 5H5v17h14V5h-4M9 3h6v5H9z',delete:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',left:'M3 5h18M3 10h12M3 15h18M3 20h12',center:'M3 5h18M6 10h12M3 15h18M6 20h12',right:'M3 5h18M9 10h12M3 15h18M9 20h12',justify:'M3 5h18M3 10h18M3 15h18M3 20h18',school:'m3 10 9-6 9 6M5 9v12h14V9M9 21v-7h6v7M12 4V1',schedule:'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 18h2',image:'M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 8h.01'};
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}

export function TextFormattingToolbar({style,onChange,disabled=false}:{style:TextStyle;onChange:(patch:TextStyle)=>void;disabled?:boolean}){
 const underline=style.textDecoration?.includes('underline'),strike=style.textDecoration?.includes('line-through');
 return <div className="editor-text-toolbar" role="group" aria-label="글자 꾸미기">
  <select title="글꼴" disabled={disabled} aria-label="툴바 글꼴" value={style.fontFamily||''} onChange={e=>onChange({fontFamily:e.target.value})}><option value="">템플릿 기본 글꼴</option>{fontChoices(style.fontFamily).map(font=><option key={font}>{font}</option>)}</select>
  <input title="글자 크기" disabled={disabled} aria-label="툴바 글자 크기" type="number" min="1" max="240" step=".5" value={style.fontSize||18} onChange={e=>{if(e.target.value)onChange({fontSize:Number(e.target.value)});}}/>
  <input title="글자색" disabled={disabled} aria-label="툴바 글자색" type="color" value={/^#[0-9a-f]{6}$/i.test(style.color||'')?style.color:'#17202e'} onChange={e=>onChange({color:e.target.value})}/>
  {([['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬'],['justify','양쪽 정렬']] as const).map(([value,label])=><Button key={value} disabled={disabled} title={label} aria-label={label} aria-pressed={(style.textAlign||'left')===value} onClick={()=>onChange({textAlign:value})}><ToolIcon name={value}/></Button>)}
  <Button disabled={disabled} aria-label="굵게" title="굵게" aria-pressed={Number(style.fontWeight||400)>=700} onClick={()=>onChange({fontWeight:Number(style.fontWeight||400)>=700?400:700})}><strong>B</strong></Button>
  <Button disabled={disabled} aria-label="기울임" title="기울임" aria-pressed={style.fontStyle==='italic'} onClick={()=>onChange({fontStyle:style.fontStyle==='italic'?'normal':'italic'})}><em>I</em></Button>
  <Button disabled={disabled} aria-label="밑줄" title="밑줄" aria-pressed={!!underline} onClick={()=>onChange({textDecoration:underline?(strike?'line-through':'none'):(strike?'underline line-through':'underline')})}><span className="editor-underline-icon">U</span></Button>
 </div>;
}

type Props={scheduleSizing?:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean};onScheduleSizing?:(patch:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean})=>void;scheduleStyle?:string;onScheduleStyle?:(mode:'bar'|'text'|'line')=>void;pageName?:string;posterProject?:NativeProject;editableTargets?:EditorTarget[];onSelect?:(target:EditorTarget)=>void;selection:EditorTarget|null;item:NativeProject|undefined;fields:SchoolField[];school:SchoolInput;fit:PhotoFit;hasEditableTargets:boolean;schoolImageLinked:boolean;sharing:{layout:boolean;image:boolean;layoutCount:number;imageCount:number;poster:boolean};canReset:boolean;onFieldChange:(key:string,value:string)=>void;onFieldHide:(key:string,hidden:boolean)=>void;onStyle:(patch:TextStyle)=>void;onFit:(fit:PhotoFit)=>void;onShare:(kind:'layout'|'image',checked:boolean)=>void;onReset:()=>void;onSchoolSave:(school:SchoolInput)=>Promise<boolean>;saving:boolean;logoMode?:'split'|'combined';onLogoMode?:(mode:'split'|'combined')=>void;onReplaceImage?:()=>void;onCalendar?:(patch:Record<string,string|boolean|number>,allPages:boolean)=>void;onPendingChange?:(pending:boolean)=>void};
export function ObjectTools({scheduleSizing,onScheduleSizing,scheduleStyle,onScheduleStyle,pageName='현재 페이지',posterProject,editableTargets=[],onSelect,selection,item,fields,school,fit,hasEditableTargets,schoolImageLinked,sharing,canReset,onStyle,onFit,onShare,onReset,onSchoolSave,saving,logoMode='split',onLogoMode,onReplaceImage,onCalendar,onPendingChange}:Props){
 const [drafts,setDrafts]=useState<Record<string,SchoolFieldDraft>>({}),[applying,setApplying]=useState(false),[saveError,setSaveError]=useState('');
 const style=item?.style||{},editable=selection&&Object.values(selection.rights).some(Boolean),textFields=selection?fields.filter(f=>f.binding===selection.binding||selection.binding==='school.contacts'&&f.binding?.startsWith('school.contacts.')):[];
 const value=(key:string)=>drafts[key]||{value:school.values[key]??'',hidden:school.hidden.includes(key)};
 const pending=Object.entries(drafts).some(([key,draft])=>fieldChanged(school,key,draft));
 useEffect(()=>{onPendingChange?.(pending);},[pending,onPendingChange]);
 const changed=textFields.some(f=>drafts[f.key]&&fieldChanged(school,f.key,drafts[f.key]));
 function change(key:string,patch:Partial<SchoolFieldDraft>){setDrafts(current=>({...current,[key]:{...value(key),...patch}}));setSaveError('');}
 async function save(){if(!changed||applying||saving)return;const keys=textFields.map(f=>f.key),captured=Object.fromEntries(keys.filter(k=>drafts[k]).map(k=>[k,{...drafts[k]}]));setApplying(true);setSaveError('');try{if(await onSchoolSave(applyFieldDrafts(school,captured,keys))){setDrafts(current=>Object.fromEntries(Object.entries(current).filter(([key,draft])=>!captured[key]||JSON.stringify(draft)!==JSON.stringify(captured[key]))));}else setSaveError('저장하지 못했어요. 수정 내용은 유지됩니다.');}catch{setSaveError('저장하지 못했어요. 다시 저장해 주세요.');}finally{setApplying(false);}}
 const collapsible=!!posterProject&&selection&&[
  !!(selection.logoGroupId&&selection.logoPart==='image'),
  selection.rights.content&&textFields.length>0,
  selection.rights.textStyle,
  selection.rights.replaceImage||selection.rights.imageFit,
  sharing.layoutCount>0||sharing.imageCount>0,
 ].filter(Boolean).length>1;
 return <section className="editor-object-tools" aria-label="페이지 편집">
  <div className="editor-page-heading"><h2>{pageName}</h2></div>{selection&&<h3 className="editor-selected-object-name">{posterProject&&selection.rights.calendarStyle?'전체 월력':selection.label}</h3>}
  {selection&&editable?<div className={posterProject?"editor-inspector-body poster-inspector-body":"editor-inspector-body"}>
   {selection.rights.scheduleStyle&&<section className="editor-tool-card schedule-style-card"><h3>일정 표시 <small>전체 월력 적용</small></h3><div className="schedule-style-options">{([['bar','색상 막대'],['text','텍스트만'],['line','가는 선']] as const).map(([mode,label])=><Button key={mode} aria-pressed={scheduleStyle===mode} onClick={()=>onScheduleStyle?.(mode)}><span className={'schedule-style-example '+mode} aria-hidden="true"><span>학교 일정</span></span><span>{label}</span></Button>)}</div> {scheduleStyle==='text'&&<>
     <label className="schedule-text-option"><span>일정을 '/'로 이어서 표시</span><input type="checkbox" checked={scheduleSizing?.joinText===true} onChange={e=>onScheduleSizing?.({joinText:e.target.checked})}/></label>
     <label className="schedule-text-option"><span>구간 일정을 날짜별 표시</span><input type="checkbox" checked={scheduleSizing?.rangeEachDay===true} onChange={e=>onScheduleSizing?.({rangeEachDay:e.target.checked})}/></label>
   </>}<div className="schedule-sizing-fields"><label>일정 글자 크기(pt)<input type="number" min="3" max="18" step="0.5" value={scheduleSizing?.fontSizePt??''} placeholder="자동" onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&value>=3&&value<=18)onScheduleSizing?.({fontSizePt:value});}}/></label><label>{scheduleStyle==='text'?'일정 줄 높이(px)':'일정 영역 높이(px)'}<input type="number" min="1" max="24" step="1" value={scheduleSizing?.barHeight??14} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&value>=1&&value<=24)onScheduleSizing?.({barHeight:value});}}/></label></div><p className="field-hint">일정이 숨겨지면 글자 크기와 영역 높이를 줄여 보세요. 날짜 칸 높이에 따라 표시 개수가 달라집니다.</p></section>}
   {selection.rights.calendarStyle&&posterProject&&<PosterCalendarTools key={posterProject.book.pageInstances.length} project={posterProject} item={item} onChange={onCalendar}/>} 
   {selection.logoGroupId&&selection.logoPart==='image'&&<ToolGroup collapsible={!!collapsible} className="editor-logo-configuration" title="로고 구성"><label><input type="radio" name="logo-configuration" checked={logoMode==='split'} onChange={()=>onLogoMode?.('split')}/>교표만</label><label><input type="radio" name="logo-configuration" checked={logoMode==='combined'} onChange={()=>onLogoMode?.('combined')}/>학교명 포함 로고</label></ToolGroup>}
   {selection.rights.content&&textFields.length>0&&<ToolGroup collapsible={!!collapsible} className="editor-text-content" title="내용 수정" ariaLabel="학교 정보 내용 수정">{textFields.map(field=><div className="editor-content-field" key={field.key}><div className="editor-field-heading">{field.allowHide?<label className="editor-visibility-toggle"><input type="checkbox" aria-label={field.label+' 표시'} disabled={applying} checked={!value(field.key).hidden} onChange={e=>change(field.key,{hidden:!e.target.checked})}/>{field.label}</label>:<label htmlFor={'editor-field-'+field.key}>{field.label}</label>}</div><input id={'editor-field-'+field.key} aria-label={field.label+' 내용'} value={value(field.key).value} placeholder={selection.binding==='school.contacts'?'저장된 연락처':String(item?.content||'')} maxLength={field.maxLength} disabled={applying||value(field.key).hidden} onChange={e=>change(field.key,{value:e.target.value})}/></div>)}<Button className="editor-card-apply" variant={changed?'primary':'secondary'} disabled={!changed||saving||applying} onClick={()=>void save()}>{applying?'저장 중…':'수정된 정보를 학교 정보에 저장'}</Button>{saveError&&<p className="field-error" role="alert">{saveError}</p>}</ToolGroup>}
   {selection.rights.textStyle&&<ToolGroup collapsible={!!collapsible} className="editor-compact-style" title="글자 모양"><label className="editor-inline-control">글꼴<select value={style.fontFamily||''} onChange={e=>onStyle({fontFamily:e.target.value})}><option value="">템플릿 기본 글꼴</option>{fontChoices(style.fontFamily).map(font=><option key={font}>{font}</option>)}</select></label><label className="editor-inline-control">글자 크기<input aria-label="글자 크기" type="number" min="1" max="240" step=".5" value={style.fontSize||18} onChange={e=>{if(e.target.value)onStyle({fontSize:Number(e.target.value)});}}/></label><label className="editor-inline-control">글자색<input aria-label="글자색" type="color" value={/^#[0-9a-f]{6}$/i.test(style.color||'')?style.color:'#17202e'} onChange={e=>onStyle({color:e.target.value})}/></label></ToolGroup>}
   {(selection.rights.replaceImage||selection.rights.imageFit)&&<ToolGroup collapsible={!!collapsible} className="editor-image-content" title="이미지 수정">{selection.rights.replaceImage&&<><Button className="editor-image-replace" onClick={onReplaceImage}><ToolIcon name="image"/>이미지 교체</Button></>}{selection.rights.imageFit&&<div className="editor-image-fit"><label>사진 맞춤<select aria-label="사진 맞춤" value={fit.fit} onChange={e=>onFit({...fit,fit:e.target.value as PhotoFit['fit']})}><option value="cover">틀 채우기</option><option value="contain">사진 전체 보기</option></select></label>{(['scale','offsetX','offsetY'] as const).map(key=>{
    const percent=key==='scale'?Math.round(fit.scale*100):fit[key];
    const display=(key!=='scale'&&percent>0?'+':'')+percent+'%';
    return <label key={key}><span>{{scale:'사진 확대',offsetX:'사진 가로 위치',offsetY:'사진 세로 위치'}[key]} <strong aria-hidden="true">{display}</strong></span><input type="range" aria-valuetext={display} min={key==='scale'?.1:-100} max={key==='scale'?5:100} step={key==='scale'?.05:1} value={fit[key]} onChange={e=>onFit({...fit,[key]:Number(e.target.value)})}/></label>;
   })}</div>}<Button disabled={!canReset} onClick={onReset}>선택 사진 편집 되돌리기</Button></ToolGroup>}
   {(sharing.layoutCount>0||sharing.imageCount>0)&&<ToolGroup collapsible={!!collapsible} className="editor-share-options" title={sharing.poster?'다른 페이지에 적용':'월력 앞면에 공통 적용'}>{sharing.layoutCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.layout} onChange={e=>onShare('layout',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 위치·크기 적용':'해당 개체 위치, 크기 정보를 모든 월력에 적용'}</span></label>}{sharing.imageCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.image} onChange={e=>onShare('image',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 이미지 적용':'해당 개체 이미지를 모든 월력에 저장'}</span></label>}</ToolGroup>}
  </div>:<div className="editor-inspector-empty"><p>{!hasEditableTargets?'이 페이지에는 편집할 수 있는 개체가 없습니다.':selection?'이 개체는 편집할 수 없습니다.':editableTargets.some(t=>t.rights.replaceImage)&&editableTargets.some(t=>t.rights.content)?'텍스트 개체를 수정하고 이미지를 편집할 수 있습니다.':editableTargets.some(t=>t.rights.replaceImage)?'이미지를 교체할 수 있습니다.':editableTargets.some(t=>t.rights.content)?'텍스트를 변경할 수 있습니다.':'개체의 배치와 표시 설정을 변경할 수 있습니다.'}</p></div>}
 </section>;
}



function PosterCalendarTools({project,item,onChange}:{project:NativeProject;item?:NativeProject;onChange:Props['onCalendar']}){
 const [allPages,setAllPages]=useState(false);
 const multiple=project.book.pageInstances.length>1;
 const settings=wallOptions(item,project);
 const update=(patch:Record<string,string|boolean|number>)=>onChange?.(patch,multiple&&allPages);
 const styleName=wallStyleName(settings);
 const styleLabels:Record<string,string>={custom:'사용자 설정',minimal:'간결형 · 날짜와 목록',grid:'격자형 · 격자와 목록',schedule:'일정형 · 날짜 칸에 표시','basic-1-1':'기본형 1-1','basic-1-2':'기본형 1-2','basic-2-1':'기본형 2-1','basic-2-2':'기본형 2-2'};
 const font=String(settings.scheduleFontFamily||settings.listFontFamily||settings.fontFamily||item?.style?.fontFamily||'');
 const size=Number(settings.schedulePt??(settings.schedulePlacement==='cells'?settings.eventPt:settings.listPt));
 const color=String(settings.scheduleColor||settings.listColor||settings.dateColor||'#17202e');
 return <div className="poster-calendar-tools">
  <details className="editor-tool-card" open>
   <summary>공통</summary>
   <label>적용 스타일<select disabled value={styleName}><option value={styleName}>{styleLabels[styleName]||styleName}</option></select></label>
  </details>
  <details className="editor-tool-card" open>
   <summary>일정</summary>
   <label>목록 단수<select value={String(settings.cellListLayout||settings.listLayout)} onChange={e=>update({listLayout:e.target.value,cellListLayout:e.target.value})}><option value="auto">자동</option><option value="one">1단</option><option value="two">2단</option><option value="three">3단</option></select></label>
   <label>글꼴<select value={font} onChange={e=>update({scheduleFontFamily:e.target.value})}>{!font&&<option value="">템플릿 기본 글꼴</option>}{fontChoices(font).map(name=><option key={name}>{name}</option>)}</select></label>
   <label>글자 크기 (pt)<input type="number" min="5" max="24" step="0.5" value={size} onChange={e=>{const n=e.target.valueAsNumber;if(n>=5&&n<=24)update({schedulePt:n});}}/></label>
   <label>일정 자간 (em)<input type="number" min="-0.1" max="0.2" step="0.01" value={Number(settings.scheduleTracking??0)} onChange={e=>{const n=e.target.valueAsNumber;if(n>=-0.1&&n<=0.2)update({scheduleTracking:n});}}/></label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.cellAutoFit===true} onChange={e=>update({cellAutoFit:e.target.checked})}/>날짜 칸 일정 자동 맞춤</label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.listAutoFit===true} onChange={e=>update({listAutoFit:e.target.checked})}/>월별 일정 목록 자동 맞춤</label>
   <label>글자색<input type="color" value={color} onChange={e=>update({scheduleColor:e.target.value})}/></label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.scheduleWeekday===true||(settings.scheduleWeekday==null&&settings.listDateFormat==='weekday')} onChange={e=>update({scheduleWeekday:e.target.checked})}/>날짜에 요일 표시</label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.includeHolidays!==false} onChange={e=>update({scheduleHolidays:e.target.checked})}/>공휴일 포함</label>
  </details>
  <label className="editor-tool-card poster-calendar-checkbox"><input type="checkbox" disabled={!multiple} checked={multiple&&allPages} onChange={e=>setAllPages(e.target.checked)}/>다른 페이지의 전체 월력에도 적용</label>
 </div>;
}

function ToolGroup({collapsible,className,title,ariaLabel,children}:{collapsible:boolean;className:string;title:string;ariaLabel?:string;children:ReactNode}){
 const classes='editor-tool-card '+className;
 return collapsible?<details open className={classes} aria-label={ariaLabel}><summary>{title}</summary>{children}</details>:<section className={classes} aria-label={ariaLabel}><h3>{title}</h3>{children}</section>;
}
