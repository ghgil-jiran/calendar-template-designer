'use client';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {applyFieldDrafts,fieldChanged,type SchoolFieldDraft} from '@/lib/editor/card-state';
import {ColorPalette,editorThemeColors} from './color-palette';
import {Button} from '@/components/ui/button';
import {MonthlyScheduleTools,type MonthlyScheduleToolsProps} from './monthly-schedule-tools';
import {photoFrameModel,wallOptions,wallStyleName,type EditorTarget,type PhotoFit,type FrameStyle,type TextStyle} from '@/lib/editor/session';
import type {SchoolField,SchoolInput} from '@/lib/api/contracts';
import {fontChoices} from '@/lib/editor/font-catalog';
import type {NativeProject} from '@/lib/materials/native-project';

type ToolIconName='undo'|'redo'|'copy'|'paste'|'delete'|'left'|'center'|'right'|'justify'|'school'|'schedule'|'image'|'text-box'|'illustration'|'shape'|'frame';
export function ToolIcon({name}:{name:ToolIconName}){
 const paths:Record<ToolIconName,string>={illustration:'M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3zM19 3v4M17 5h4',shape:'M3 4h10v10H3zM21 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',frame:'M3 3h18v18H3zM7 7h10v10H7z',undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12',redo:'m15 5 5 5-5 5M20 10H10a6 6 0 0 0 0 12',copy:'M9 8h11v13H9zM15 8V3H4v13h5',paste:'M9 5H5v17h14V5h-4M9 3h6v5H9z',delete:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',left:'M3 5h18M3 10h12M3 15h18M3 20h12',center:'M3 5h18M6 10h12M3 15h18M6 20h12',right:'M3 5h18M9 10h12M3 15h18M9 20h12',justify:'M3 5h18M3 10h18M3 15h18M3 20h18',school:'m3 10 9-6 9 6M5 9v12h14V9M9 21v-7h6v7M12 4V1',schedule:'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 18h2','text-box':'M3 4h18v16H3zM8 9h8M12 9v7',image:'M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 8h.01'};
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}

export function TextFormattingToolbar({style,onChange,disabled=false,theme}:{style:TextStyle;theme?:string[];onChange:(patch:TextStyle)=>void;disabled?:boolean}){
 const underline=style.textDecoration?.includes('underline'),strike=style.textDecoration?.includes('line-through');
 return <div className="editor-text-toolbar" role="group" aria-label="글자 꾸미기">
  <select title="글꼴" disabled={disabled} aria-label="툴바 글꼴" value={style.fontFamily||''} onChange={e=>onChange({fontFamily:e.target.value})}><option value="">템플릿 기본 글꼴</option>{fontChoices(style.fontFamily).map(font=><option key={font}>{font}</option>)}</select>
  <input title="글자 크기" disabled={disabled} aria-label="툴바 글자 크기" type="number" min="1" max="240" step=".5" value={style.fontSize||18} onChange={e=>{if(e.target.value)onChange({fontSize:Number(e.target.value)});}}/>
  <ColorPalette allowAlpha label="툴바 글자색" disabled={disabled} value={style.color} theme={theme} onChange={color=>onChange({color})}/>
  {([['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬'],['justify','양쪽 정렬']] as const).map(([value,label])=><Button key={value} disabled={disabled} title={label} aria-label={label} aria-pressed={(style.textAlign||'left')===value} onClick={()=>onChange({textAlign:value})}><ToolIcon name={value}/></Button>)}
  <Button disabled={disabled} aria-label="굵게" title="굵게" aria-pressed={Number(style.fontWeight||400)>=700} onClick={()=>onChange({fontWeight:Number(style.fontWeight||400)>=700?400:700})}><strong>B</strong></Button>
  <Button disabled={disabled} aria-label="기울임" title="기울임" aria-pressed={style.fontStyle==='italic'} onClick={()=>onChange({fontStyle:style.fontStyle==='italic'?'normal':'italic'})}><em>I</em></Button>
  <Button disabled={disabled} aria-label="밑줄" title="밑줄" aria-pressed={!!underline} onClick={()=>onChange({textDecoration:underline?(strike?'line-through':'none'):(strike?'underline line-through':'underline')})}><span className="editor-underline-icon">U</span></Button>
 </div>;
}

function TextStyleFields({style,theme,onChange}:{style:Omit<TextStyle,'background'>&{background?:boolean|string};theme?:string[];onChange:(patch:TextStyle)=>void}){
 const underline=style.textDecoration?.includes('underline');
 const strike=style.textDecoration?.includes('line-through');
 const background=style.background===true||typeof style.background==='string'&&style.background!=='transparent';
 const backgroundColor=(typeof style.background==='string'&&background?style.background:style.backgroundColor)||'#ffffff';
 const toggleBackground=()=>onChange({background:!background,backgroundColor:backgroundColor==='transparent'?'#ffffff':backgroundColor});
 const decoration=(nextUnderline:boolean,nextStrike:boolean):TextStyle['textDecoration']=>
  nextUnderline?(nextStrike?'underline line-through':'underline'):(nextStrike?'line-through':'none');
 const sampleStyle:CSSProperties={fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontStyle:style.fontStyle,textDecoration:style.textDecoration};
 const weights=[100,200,300,400,500,600,700,800,900];
 const weight=Number(style.fontWeight)||400;
 if(!weights.includes(weight))weights.push(weight);
 function numberField(key:'fontSize'|'letterSpacing'|'lineHeight'|'opacity'|'strokeWidth'|'shadowX'|'shadowY'|'shadowBlur',label:string,fallback:number,min:number,max:number,step:number|'any'){
  return <label>{label}<input type="number" min={min} max={max} step={step} key={style[key]??fallback} defaultValue={style[key]??fallback} onBlur={e=>{
   const value=e.currentTarget.valueAsNumber;
   if(!Number.isFinite(value)||value<min||value>max)e.currentTarget.value=String(style[key]??fallback);
   else if(value!==(style[key]??fallback))onChange({[key]:value});
  }} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/></label>;
 }
 return <>
  <label>글꼴<select value={style.fontFamily||''} onChange={e=>onChange({fontFamily:e.target.value})}>
   <option value="">템플릿 기본 글꼴</option>
   {fontChoices(style.fontFamily).map(font=><option key={font}>{font}</option>)}
  </select></label>
  <div className="editor-font-sample" style={sampleStyle}>2027 CALENDAR · 가나다</div>
  <div className="editor-font-grid">
   {numberField('fontSize','글자 크기',18,1,240,'any')}
   <label>글자 굵기<select value={weight} onChange={e=>onChange({fontWeight:Number(e.target.value)})}>
    {weights.sort((a,b)=>a-b).map(value=><option key={value} value={value}>{value}{value===400?' · 보통':value===700?' · 굵게':''}</option>)}
   </select></label>
  </div>
  <div className="editor-font-toggles" role="group" aria-label="글자 장식">
   <Button aria-pressed={style.fontStyle==='italic'} onClick={()=>onChange({fontStyle:style.fontStyle==='italic'?'normal':'italic'})}>기울임</Button>
   <Button aria-pressed={!!underline} onClick={()=>onChange({textDecoration:decoration(!underline,!!strike)})}>밑줄</Button>
   <Button aria-pressed={!!strike} onClick={()=>onChange({textDecoration:decoration(!!underline,!strike)})}>취소선</Button>
  </div>
  <div className="editor-font-grid">
   <label>가로 정렬<select value={style.textAlign||'left'} onChange={e=>onChange({textAlign:e.target.value as TextStyle['textAlign']})}>
    <option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option><option value="justify">양쪽</option>
   </select></label>
   <label>세로 정렬<select value={style.verticalAlign||'top'} onChange={e=>onChange({verticalAlign:e.target.value as TextStyle['verticalAlign']})}>
    <option value="top">위</option><option value="middle">가운데</option><option value="bottom">아래</option>
   </select></label>
   {numberField('letterSpacing','자간(px)',0,-20,100,.1)}
   {numberField('lineHeight','행간',1.2,.5,4,.05)}
   <div className="editor-font-color">글자색<ColorPalette allowAlpha label="글자색" value={style.color} theme={theme} onChange={color=>onChange({color})}/></div>
   {numberField('opacity','불투명도',1,0,1,.05)}
  </div>
  <div className="editor-font-background">
   <div className="editor-effect-heading"><strong>배경</strong><label className="editor-style-check">배경색 없음 <input type="checkbox" checked={!background} onChange={toggleBackground}/></label></div>
   <div className="editor-font-color">배경색<ColorPalette allowAlpha label="텍스트 배경색" value={backgroundColor} theme={theme} onChange={color=>onChange({backgroundColor:color,background})}/></div>
  </div>
  <div className="editor-font-background">
   <strong>외곽선</strong>
   <div className="editor-font-grid">
    {numberField('strokeWidth','두께(px)',0,0,10,.1)}
    <div className="editor-font-color">색상<ColorPalette allowAlpha label="외곽선 색상" value={style.strokeColor||'#ffffff'} theme={theme} onChange={strokeColor=>onChange({strokeColor})}/></div>
   </div>
  </div>
  <div className="editor-font-background">
   <div className="editor-effect-heading"><strong>그림자</strong><label className="editor-style-check">그림자 없음 <input type="checkbox" checked={!style.shadow} onChange={event=>onChange({shadow:!event.target.checked})}/></label></div>
   <div className="editor-font-grid">
    {numberField('shadowX','X(px)',0,-50,50,.5)}
    {numberField('shadowY','Y(px)',0,-50,50,.5)}
    {numberField('shadowBlur','흐림(px)',0,0,50,.5)}
    <div className="editor-font-color">색상<ColorPalette allowAlpha label="그림자 색상" value={style.shadowColor||'#000000'} theme={theme} onChange={shadowColor=>onChange({shadowColor})}/></div>
   </div>
  </div>
 </>;
}

function FrameStyleFields({item,theme,onChange}:{item:NativeProject|undefined;theme?:string[];onChange:(patch:FrameStyle)=>void}){
 const style=item?.style||{};
 const background=photoFrameModel.background(style);
 const shadowColor=style.shadowColor||'#000000';
 const fields={
  strokeWidth:{label:'테두리 두께',max:20,defaultValue:item?.role==='school-logo'||item?.image?.binding==='school.profile.logo'||item?.binding==='school.profile.logo'?0:3},
  softEdgePt:{label:'부드러운 가장자리 크기 (pt)',max:50,defaultValue:0},
  shadowBlur:{label:'흐림',max:50,defaultValue:0},
 };
 function numberField(key:keyof typeof fields){
  const {label,max,defaultValue}=fields[key];
  const current=style[key]??defaultValue;
  return <label>{label}<input type="number" min={0} max={max} step=".1" key={current} defaultValue={current} onBlur={event=>{
   const input=event.currentTarget,value=input.valueAsNumber;
   if(!Number.isFinite(value)||value<0||value>max)input.value=String(current);
   else if(value!==current)onChange({[key]:value});
  }} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/></label>;
 }
 return <>
  <label className="editor-frame-form">프레임 형태<select value={photoFrameModel.catalog.some(option=>option.id===item?.frameType)?item?.frameType:'rect'} onChange={event=>onChange({frameType:event.target.value})}>
   {photoFrameModel.catalog.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
  </select></label>
  <div className="editor-frame-grid">
   <div className="editor-frame-color-field">배경색<ColorPalette allowAlpha allowNone label="프레임 배경색" value={background} theme={theme} onChange={color=>onChange({background:color==='transparent'?false:color})}/></div>
   <label className="editor-style-check">배경색 없음 <input type="checkbox" checked={background==='transparent'} onChange={event=>onChange({background:event.target.checked?false:style.backgroundColor||'#eef2f7'})}/></label>
  </div>
  <div className="editor-frame-section">
   <div className="editor-frame-grid">
    <div className="editor-frame-color-field">테두리 색<ColorPalette allowAlpha label="테두리 색" value={style.stroke||'#ffffff'} theme={theme} onChange={stroke=>onChange({stroke})}/></div>
    {numberField('strokeWidth')}
   </div>
   {numberField('softEdgePt')}
   <p className="field-hint">0pt는 효과 없음입니다.</p>
  </div>
  <div className="editor-frame-section">
   <div className="editor-frame-grid">
    <div className="editor-frame-color-field">그림자 색<ColorPalette allowAlpha allowNone label="그림자 색" value={shadowColor} theme={theme} onChange={color=>onChange(color==='transparent'?{shadow:false}:{shadowColor:color,shadow:true})}/></div>
    {numberField('shadowBlur')}
   </div>
   <label className="editor-style-check">그림자 없음 <input type="checkbox" checked={!style.shadow||shadowColor==='transparent'} onChange={event=>onChange(event.target.checked?{shadow:false}:{shadow:true,shadowColor:shadowColor==='transparent'?'#000000':shadowColor})}/></label>
  </div>
 </>;
}

type Props={onFrameStyle?:(patch:FrameStyle)=>void;monthlySchedule?:MonthlyScheduleToolsProps;onFreeText?:(text:string)=>void;onFill?:(fill:string)=>void;themeColors?:string[];wallScheduleOverflow?:boolean;scheduleSizing?:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean;bullet?:boolean;showVacationBackground?:boolean;vacationBackgroundColor?:string};onScheduleSizing?:(patch:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean;bullet?:boolean;showVacationBackground?:boolean;vacationBackgroundColor?:string})=>void;scheduleStyle?:string;onScheduleStyle?:(mode:'bar'|'text'|'line')=>void;pageName?:string;posterProject?:NativeProject;posterTemplateName?:string;editableTargets?:EditorTarget[];onSelect?:(target:EditorTarget)=>void;selection:EditorTarget|null;item:NativeProject|undefined;fields:SchoolField[];school:SchoolInput;fit:PhotoFit;hasEditableTargets:boolean;schoolImageLinked:boolean;sharing:{layout:boolean;image:boolean;layoutCount:number;imageCount:number;poster:boolean};canReset:boolean;onFieldChange:(key:string,value:string)=>void;onFieldHide:(key:string,hidden:boolean)=>void;onStyle:(patch:TextStyle)=>void;onFit:(fit:PhotoFit)=>void;onShare:(kind:'layout'|'image',checked:boolean)=>void;onReset:()=>void;onSchoolSave:(school:SchoolInput)=>Promise<boolean>;saving:boolean;logoMode?:'split'|'combined';onLogoMode?:(mode:'split'|'combined')=>void;onReplaceImage?:()=>void;onCalendar?:(patch:Record<string,string|boolean|number>,allPages:boolean)=>void;onPendingChange?:(pending:boolean)=>void};
export function ObjectTools({onFrameStyle,monthlySchedule,onFreeText,onFill,themeColors,wallScheduleOverflow,scheduleSizing,onScheduleSizing,scheduleStyle,onScheduleStyle,pageName='현재 페이지',posterProject,posterTemplateName,editableTargets=[],onSelect,selection,item,fields,school,fit,hasEditableTargets,schoolImageLinked,sharing,canReset,onStyle,onFit,onShare,onReset,onSchoolSave,saving,logoMode='split',onLogoMode,onReplaceImage,onCalendar,onPendingChange}:Props){
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
  selection.rights.frameStyle,
  sharing.layoutCount>0||sharing.imageCount>0,
 ].filter(Boolean).length>1;
 return <section className="editor-object-tools" aria-label="페이지 편집">
  <div className="editor-page-heading"><h2>{pageName}</h2></div>{selection&&<h3 className="editor-selected-object-name">{posterProject&&selection.rights.calendarStyle?'전체 월력':selection.label}</h3>}
  {selection&&editable?<div className={posterProject?"editor-inspector-body poster-inspector-body":"editor-inspector-body"}>
   {selection.rights.scheduleStyle&&<section className="editor-tool-card schedule-style-card"><h3>일정 표시 <small>전체 월력 적용</small></h3><div className="schedule-style-options">{([['bar','색상 막대'],['text','텍스트만'],['line','가는 선']] as const).map(([mode,label])=><Button key={mode} aria-pressed={scheduleStyle===mode} onClick={()=>onScheduleStyle?.(mode)}><span className={'schedule-style-example '+mode} aria-hidden="true"><span>학교 일정</span></span><span>{label}</span></Button>)}</div> {scheduleStyle==='text'&&<>
     <label className="schedule-text-option"><span>일정을 '/'로 이어서 표시</span><input type="checkbox" checked={scheduleSizing?.joinText===true} onChange={e=>onScheduleSizing?.({joinText:e.target.checked})}/></label>
     <label className="schedule-text-option"><span>구간 일정을 날짜별 표시</span><input type="checkbox" checked={scheduleSizing?.rangeEachDay===true} onChange={e=>onScheduleSizing?.({rangeEachDay:e.target.checked})}/></label>
   </>}<label className="schedule-text-option"><span>일정 앞 불릿 표시</span><input type="checkbox" checked={scheduleSizing?.bullet===true} onChange={e=>onScheduleSizing?.({bullet:e.target.checked})}/></label><div className="vacation-background-options"><label className="schedule-text-option"><span>방학 배경색 표시</span><input type="checkbox" checked={scheduleSizing?.showVacationBackground===true} onChange={e=>onScheduleSizing?.({showVacationBackground:e.target.checked})}/></label>{scheduleSizing?.showVacationBackground&&<VacationBackgroundColor value={scheduleSizing.vacationBackgroundColor} theme={themeColors} onChange={vacationBackgroundColor=>onScheduleSizing?.({vacationBackgroundColor})}/>}</div><div className="schedule-sizing-fields"><label>일정 글자 크기(pt)<input type="number" min="3" max="18" step="0.5" value={scheduleSizing?.fontSizePt??''} placeholder="자동" onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&value>=3&&value<=18)onScheduleSizing?.({fontSizePt:value});}}/></label><label>{scheduleStyle==='text'?'일정 줄 높이(px)':'일정 영역 높이(px)'}<input type="number" min="1" max="24" step="1" value={scheduleSizing?.barHeight??14} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&value>=1&&value<=24)onScheduleSizing?.({barHeight:value});}}/></label></div><p className="field-hint">일정이 숨겨지면 글자 크기와 영역 높이를 줄여 보세요. 날짜 칸 높이에 따라 표시 개수가 달라집니다.</p></section>}
   {selection.rights.scheduleStyle&&monthlySchedule&&<MonthlyScheduleTools key={monthlySchedule.month.start} {...monthlySchedule}/>}
   {selection.rights.calendarStyle&&posterProject&&<PosterCalendarTools key={posterProject.book.pageInstances.length} project={posterProject} item={item} templateName={posterTemplateName} onChange={onCalendar} scheduleOverflow={wallScheduleOverflow}/>} 
   {selection.logoGroupId&&selection.logoPart==='image'&&<ToolGroup collapsible={!!collapsible} className="editor-logo-configuration" title="로고 구성"><label><input type="radio" name="logo-configuration" checked={logoMode==='split'} onChange={()=>onLogoMode?.('split')}/>교표만</label><label><input type="radio" name="logo-configuration" checked={logoMode==='combined'} onChange={()=>onLogoMode?.('combined')}/>학교명 포함 로고</label></ToolGroup>}
   {selection.rights.content&&textFields.length>0&&<ToolGroup collapsible={!!collapsible} className="editor-text-content" title="내용 수정" ariaLabel="학교 정보 내용 수정">{textFields.map(field=><div className="editor-content-field" key={field.key}><div className="editor-field-heading">{field.allowHide?<label className="editor-visibility-toggle"><input type="checkbox" aria-label={field.label+' 표시'} disabled={applying} checked={!value(field.key).hidden} onChange={e=>change(field.key,{hidden:!e.target.checked})}/>{field.label}</label>:<label htmlFor={'editor-field-'+field.key}>{field.label}</label>}</div><input id={'editor-field-'+field.key} aria-label={field.label+' 내용'} value={value(field.key).value} placeholder={selection.binding==='school.contacts'?'저장된 연락처':String(item?.content||'')} maxLength={field.maxLength} disabled={applying||value(field.key).hidden} onChange={e=>change(field.key,{value:e.target.value})}/></div>)}<Button className="editor-card-apply" variant={changed?'primary':'secondary'} disabled={!changed||saving||applying} onClick={()=>void save()}>{applying?'저장 중…':'수정된 정보를 학교 정보에 저장'}</Button>{saveError&&<p className="field-error" role="alert">{saveError}</p>}</ToolGroup>}
   {selection.rights.freeText&&<ToolGroup collapsible={false} className="editor-compact-style" title="텍스트 내용"><label>문구<textarea value={String(item?.content??'')} maxLength={2000} onChange={e=>onFreeText?.(e.target.value)}/></label></ToolGroup>}
   {selection.rights.fill&&<ToolGroup collapsible={false} className="editor-compact-style" title="도형 모양"><div className="editor-inline-control">{item?.shapeType==='line'?'선 색':'채우기'}<ColorPalette label={item?.shapeType==='line'?'선 색':'채우기 색'} allowNone value={item?.shapeType==='line'?style.stroke:style.fill} theme={themeColors} onChange={color=>onFill?.(color)}/></div></ToolGroup>}
   {selection.rights.textStyle&&<ToolGroup collapsible={!!collapsible} className="editor-font-style" title="글꼴과 글자"><TextStyleFields key={JSON.stringify([selection.pageId,selection.scope,selection.elementId])} style={style} theme={themeColors} onChange={onStyle}/></ToolGroup>}
   {(selection.rights.replaceImage||selection.rights.imageFit)&&<ToolGroup collapsible={!!collapsible} className="editor-image-content" title="사진 맞춤">{selection.rights.replaceImage&&<><Button className="editor-image-replace" onClick={onReplaceImage}><ToolIcon name="image"/>이미지 교체</Button></>}{selection.rights.imageFit&&<div className="editor-image-fit"><label>맞춤 방식<select aria-label="사진 맞춤" value={fit.fit} onChange={e=>onFit({...fit,fit:e.target.value as PhotoFit['fit']})}><option value="cover">틀 채우기</option><option value="contain">사진 전체 보기</option></select></label>{(['scale','offsetX','offsetY'] as const).map(key=>{
    const percent=key==='scale'?Math.round(fit.scale*100):fit[key];
    const display=(key!=='scale'&&percent>0?'+':'')+percent+'%';
    return <label key={key}><span>{{scale:'사진 확대',offsetX:'사진 가로 위치',offsetY:'사진 세로 위치'}[key]} <strong aria-hidden="true">{display}</strong></span><input type="range" aria-valuetext={display} min={key==='scale'?.1:-100} max={key==='scale'?5:100} step={key==='scale'?.05:1} value={fit[key]} onChange={e=>onFit({...fit,[key]:Number(e.target.value)})}/></label>;
   })}</div>}<Button disabled={!canReset} onClick={onReset}>선택 사진 편집 되돌리기</Button></ToolGroup>}
   {selection.rights.frameStyle&&onFrameStyle&&<ToolGroup collapsible={!!collapsible} className="editor-frame-style" title="프레임 스타일">
    <FrameStyleFields key={JSON.stringify([selection.pageId,selection.scope,selection.elementId])} item={item} theme={themeColors} onChange={onFrameStyle}/>
   </ToolGroup>}
   {(sharing.layoutCount>0||sharing.imageCount>0)&&<ToolGroup collapsible={!!collapsible} className="editor-share-options" title={sharing.poster?'다른 페이지에 적용':'월력 앞면에 공통 적용'}>{sharing.layoutCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.layout} onChange={e=>onShare('layout',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 위치·크기 적용':'해당 개체 위치, 크기 정보를 모든 월력에 적용'}</span></label>}{sharing.imageCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.image} onChange={e=>onShare('image',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 이미지 적용':'해당 개체 이미지를 모든 월력에 저장'}</span></label>}</ToolGroup>}
  </div>:<div className="editor-inspector-empty"><p>{!hasEditableTargets?'이 페이지에는 편집할 수 있는 개체가 없습니다.':selection?'이 개체는 편집할 수 없습니다.':editableTargets.some(t=>t.rights.replaceImage)&&editableTargets.some(t=>t.rights.content)?'텍스트 개체를 수정하고 이미지를 편집할 수 있습니다.':editableTargets.some(t=>t.rights.replaceImage)?'이미지를 교체할 수 있습니다.':editableTargets.some(t=>t.rights.content)?'텍스트를 변경할 수 있습니다.':'개체의 배치와 표시 설정을 변경할 수 있습니다.'}</p></div>}
 </section>;
}



function VacationBackgroundColor({value,theme,onChange}:{value?:unknown;theme?:string[];onChange:(color:string)=>void}){
 return <div className="vacation-background-color"><span>배경 색</span><ColorPalette label="방학 배경 색" value={typeof value==='string'?value:'#e6f0fb'} theme={theme} onChange={onChange}/></div>;
}

type PosterToolsProps={project:NativeProject;item?:NativeProject;onChange:Props['onCalendar'];templateName?:string;scheduleOverflow?:boolean};
const posterArrangements=[
 ['poster-bottom','3×4 · 하단 일정형'],
 ['poster-right','2×6 · 오른쪽 일정형'],
 ['poster-cells','3×4 · 날짜 칸 일정형'],
] as const;

function PosterCalendarTools({project,item,onChange,templateName,scheduleOverflow}:PosterToolsProps){
 const sample=templateName?.match(/샘플\s*([EFG])\b/i)?.[1].toUpperCase();
 if(!sample)return <LegacyPosterCalendarTools project={project} item={item} onChange={onChange}/>;

 const isG=sample==='G';
 const settings=wallOptions(item,project);
 const cells=isG||settings.schedulePlacement==='cells';
 const arrangement=cells?'poster-cells':settings.listPosition==='right'?'poster-right':'poster-bottom';
 const mode=settings.scheduleDisplayMode??(isG&&settings.rangeMode!=='bars'?'text':'legacy');
 const textOnly=mode==='text';
 const minimumSize=cells?3:5;
 const size=Math.max(minimumSize,Number(settings.schedulePt??(cells?settings.autoSchedulePt??settings.eventPt:settings.listPt)));
 const update=(patch:Record<string,string|boolean|number>)=>onChange?.(!cells&&('schedulePt' in patch||'listLayout' in patch||'scheduleTracking' in patch)?{...patch,listAutoFit:false}:patch,isG);
 const color=String(settings.scheduleColor||settings.listColor||settings.dateColor||'#17202e');
 const cellAutoFit=settings.cellAutoFit===true||(settings.cellAutoFit==null&&mode==='text');
 function checkbox(label:string,key:string,checked:boolean,disabled=false){
  return <label className="schedule-text-option"><span>{label}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={e=>update({[key]:e.target.checked})}/></label>;
 }
 const bullet=checkbox(cells?'일정 앞 불릿 표시':'날짜 앞 불릿 표시','scheduleBullet',settings.scheduleBullet===true);
 return <div className="poster-calendar-tools poster-calendar-refined">
  <details className="editor-tool-card" open>
   <summary>공통</summary>
   <label>연력 프레임 구성{isG
    ? <select disabled value="custom"><option value="custom">사용자 설정</option></select>
    : <select value={arrangement} onChange={e=>update({scheduleStylePreset:e.target.value})}>{posterArrangements.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>}
   </label>
  </details>
  <details className="editor-tool-card schedule-style-card" open>
   <summary>일정 표시 {isG&&<small>두 페이지에 적용</small>}</summary>
   {scheduleOverflow&&<p className="editor-feedback wall-schedule-warning" role="alert">
    일정이 많아 일부 일정이 제대로 표시되지 않았습니다. {!cells?'글자 크기나 자간을 줄이거나 목록 단수를 조정해 주세요.':textOnly?'글자 크기나 줄 높이를 줄여 주세요.':'글자 크기를 줄이거나 ‘텍스트만’으로 바꿔 주세요.'}
   </p>}
   {cells?<div className="schedule-style-options" role="group" aria-label="날짜 칸 일정 표시">
    {([['bar','색상 막대'],['text','텍스트만'],['line','가는 선']] as const).map(([value,label])=><Button key={value} aria-pressed={mode===value} onClick={()=>update({scheduleDisplayMode:value})}>
     <span className={'schedule-style-example '+value} aria-hidden="true"><span>학교 일정</span></span><span>{label}</span>
    </Button>)}
   </div>:<label className="poster-list-columns">목록 단수<select value={String(settings.listLayout)} onChange={e=>update({listLayout:e.target.value})}><option value="auto">자동</option><option value="one">1단</option><option value="two">2단</option><option value="three">3단</option></select></label>}
   {cells&&textOnly&&<>
    {checkbox("일정을 '/'로 이어서 표시",'scheduleJoinText',settings.scheduleJoinText===true)}
    {checkbox('구간 일정을 날짜별 표시','scheduleRangeEachDay',settings.scheduleRangeEachDay===true)}
   </>}
   {!cells&&<>
    <label>목록 구분<select value={String(settings.listGrouping)} onChange={e=>update({listGrouping:e.target.value})}><option value="merged">날짜순 통합</option><option value="separate">공휴일·기념일 / 학교 일정 구분</option></select></label>
    <label>목록 줄 높이 (px)<input type="number" min="8" max="48" step="0.1" value={Number(settings.listLineHeight??16)} onChange={e=>{const n=e.target.valueAsNumber;if(n>=8&&n<=48)update({listLineHeight:n,listAutoFit:false});}}/></label>
    <fieldset><legend>목록 안쪽 여백 (mm)</legend>{([['listPaddingTop','위'],['listPaddingRight','오른쪽'],['listPaddingBottom','아래'],['listPaddingLeft','왼쪽']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min="0" max="15" step="0.1" value={Number(settings[key]??2)} onChange={e=>{const n=e.target.valueAsNumber;if(n>=0&&n<=15)update({[key]:n,listAutoFit:false});}}/></label>)}</fieldset>
   </>}
   {bullet}
   {project.book.pageInstances.length===2&&Number(item?.monthCount)===6&&<><div className="vacation-background-options"><label className="schedule-text-option"><span>방학 배경색 표시</span><input type="checkbox" checked={settings.showVacationBackground===true} onChange={e=>onChange?.({showVacationBackground:e.target.checked},true)}/></label>{settings.showVacationBackground===true&&<VacationBackgroundColor value={settings.vacationBackgroundColor} theme={editorThemeColors(project.template.resources?.colorTheme)} onChange={vacationBackgroundColor=>onChange?.({vacationBackgroundColor},true)}/>}</div></>}
   {!cells&&<>
    {checkbox('단 구분선 표시','listColumnColors',settings.listColumnColors===true)}
    {checkbox('날짜에 요일 표시','scheduleWeekday',settings.scheduleWeekday===true||(settings.scheduleWeekday==null&&settings.listDateFormat==='weekday'))}
   </>}
   {checkbox('공휴일 표시','includeHolidays',settings.includeHolidays!==false)}
   {checkbox('음력 표시','includeLunar',settings.includeLunar!==false)}
   <div className="schedule-sizing-fields">
    <label>일정 글자 크기(pt)<input type="number" min={minimumSize} max="24" step="0.1" value={Number(size.toFixed(3))} onChange={e=>{const n=e.target.valueAsNumber;if(n>=minimumSize&&n<=24)update({schedulePt:n});}}/></label>
    {cells?<label>{textOnly?'일정 줄 높이(px)':'일정 영역 높이(px)'}<input type="number" min="1" max="24" step="0.1" placeholder={settings.autoScheduleHeight!=null?`자동 (${settings.autoScheduleHeight})`:"자동"} value={Number(settings.scheduleBarHeight)||''} onChange={e=>{const n=e.target.valueAsNumber;if(n>=1&&n<=24)update({scheduleBarHeight:n});}}/></label>
     :<label>일정 자간(em)<input type="number" min="-0.1" max="0.2" step="0.01" value={Number(settings.scheduleTracking??0)} onChange={e=>{const n=e.target.valueAsNumber;if(n>=-0.1&&n<=0.2)update({scheduleTracking:n});}}/></label>}
   </div>
   <div className="poster-calendar-color"><span>글자색</span><ColorPalette label="일정 글자색" value={color} theme={editorThemeColors(project.template.resources?.colorTheme)} onChange={scheduleColor=>update({scheduleColor})}/></div>
   {checkbox('날짜 칸 일정 자동 맞춤','cellAutoFit',cellAutoFit,!cells)}
   {!isG&&checkbox('월별 일정 목록 자동 맞춤','listAutoFit',settings.listAutoFit===true,cells||settings.listLayout==='auto')}
   {cells&&<p className="schedule-sizing-help">일정이 잘리면 글자 크기나 {textOnly?'줄 높이':'영역 높이'}를 줄여 보세요.</p>}
  </details>
 </div>;
}

function LegacyPosterCalendarTools({project,item,onChange}:{project:NativeProject;item?:NativeProject;onChange:Props['onCalendar']}){
 const [allPages,setAllPages]=useState(false);
 const multiple=project.book.pageInstances.length>1;
 const settings=wallOptions(item,project);
 const update=(patch:Record<string,string|boolean|number>)=>onChange?.(patch,multiple&&allPages);
 const arrangements=[['poster-bottom','3×4 · 하단 일정형'],['poster-right','2×6 · 오른쪽 일정형'],['poster-cells','3×4 · 날짜 칸 일정형']] as const;
 const canChangeArrangement=!multiple&&Number(item?.monthCount)===12;
 const arrangement=settings.schedulePlacement==='cells'&&Number(item?.columns)===3?'poster-cells':settings.schedulePlacement==='list'&&settings.listPosition==='right'&&Number(item?.columns)===2?'poster-right':settings.schedulePlacement==='list'&&settings.listPosition==='bottom'&&Number(item?.columns)===3?'poster-bottom':'';
 const styleName=wallStyleName(settings);
 const styleLabels:Record<string,string>={custom:'사용자 설정',minimal:'간결형 · 날짜와 목록',grid:'격자형 · 격자와 목록',schedule:'일정형 · 날짜 칸에 표시','basic-1-1':'기본형 1-1','basic-1-2':'기본형 1-2','basic-2-1':'기본형 2-1','basic-2-2':'기본형 2-2'};
 const font=String(settings.scheduleFontFamily||settings.listFontFamily||settings.fontFamily||item?.style?.fontFamily||'');
 const size=Number(settings.schedulePt??(settings.schedulePlacement==='cells'?settings.eventPt:settings.listPt));
 const color=String(settings.scheduleColor||settings.listColor||settings.dateColor||'#17202e');
 return <div className="poster-calendar-tools">
  <details className="editor-tool-card" open>
   <summary>공통</summary>
   <label>적용 스타일{canChangeArrangement?<select value={arrangement} onChange={e=>e.target.value&&update({scheduleStylePreset:e.target.value})}><option value="" disabled>사용자 설정</option>{arrangements.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>:<select disabled value={styleName}><option value={styleName}>{styleLabels[styleName]||styleName}</option></select>}</label>
  </details>
  <details className="editor-tool-card" open>
   <summary>일정</summary>
   {settings.schedulePlacement!=='list'&&<label>날짜 칸 일정 표시<select value={String(settings.scheduleDisplayMode??(multiple&&settings.rangeMode!=='bars'?'text':'legacy'))} onChange={e=>update({scheduleDisplayMode:e.target.value})}><option value="legacy">기존 방식</option><option value="bar">색상 막대</option><option value="text">텍스트만</option><option value="line">가는 선</option></select></label>}
   {(settings.scheduleDisplayMode==='text'||(multiple&&!settings.scheduleDisplayMode&&settings.rangeMode!=='bars'&&settings.schedulePlacement==='cells'))&&<>
    <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.scheduleRangeEachDay===true} onChange={e=>update({scheduleRangeEachDay:e.target.checked})}/>기간 일정을 날짜마다 표시</label>
    <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.scheduleJoinText===true} onChange={e=>update({scheduleJoinText:e.target.checked})}/>텍스트 일정을 한 줄로 연결</label>
   </>}
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.scheduleBullet===true} onChange={e=>update({scheduleBullet:e.target.checked})}/>{settings.schedulePlacement==='list'?'날짜 앞 불릿 표시':'일정 앞 불릿 표시'}</label>
   {project.book.pageInstances.length===2&&Number(item?.monthCount)===6&&<><div className="vacation-background-options"><label className="schedule-text-option"><span>방학 배경색 표시</span><input type="checkbox" checked={settings.showVacationBackground===true} onChange={e=>onChange?.({showVacationBackground:e.target.checked},true)}/></label>{settings.showVacationBackground===true&&<VacationBackgroundColor value={settings.vacationBackgroundColor} theme={editorThemeColors(project.template.resources?.colorTheme)} onChange={vacationBackgroundColor=>onChange?.({vacationBackgroundColor},true)}/>}</div></>}
   {settings.schedulePlacement!=='list'&&<label>일정 영역 높이 (px)<input type="number" min="1" max="24" placeholder="자동" value={Number(settings.scheduleBarHeight)||''} onChange={e=>{const n=e.target.valueAsNumber;if(n>=1&&n<=24)update({scheduleBarHeight:n});}}/></label>}
   {canChangeArrangement&&settings.schedulePlacement!=='cells'&&<label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.listColumnColors===true} onChange={e=>update({listColumnColors:e.target.checked})}/>단 구분선 표시</label>}
   <label>목록 단수<select value={String(settings.cellListLayout||settings.listLayout)} onChange={e=>update({listLayout:e.target.value,cellListLayout:e.target.value})}><option value="auto">자동</option><option value="one">1단</option><option value="two">2단</option><option value="three">3단</option></select></label>
   <label>글꼴<select value={font} onChange={e=>update({scheduleFontFamily:e.target.value})}>{!font&&<option value="">템플릿 기본 글꼴</option>}{fontChoices(font).map(name=><option key={name}>{name}</option>)}</select></label>
   <label>글자 크기 (pt)<input type="number" min="5" max="24" step="0.5" value={size} onChange={e=>{const n=e.target.valueAsNumber;if(n>=5&&n<=24)update({schedulePt:n});}}/></label>
   <label>일정 자간 (em)<input type="number" min="-0.1" max="0.2" step="0.01" value={Number(settings.scheduleTracking??0)} onChange={e=>{const n=e.target.valueAsNumber;if(n>=-0.1&&n<=0.2)update({scheduleTracking:n});}}/></label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.cellAutoFit===true||(settings.cellAutoFit==null&&(settings.scheduleDisplayMode==='text'||(!settings.scheduleDisplayMode&&multiple&&settings.schedulePlacement==='cells'&&settings.rangeMode!=='bars')))} onChange={e=>update({cellAutoFit:e.target.checked})}/>날짜 칸 일정 자동 맞춤</label>
   <label className="poster-calendar-checkbox"><input type="checkbox" checked={settings.listAutoFit===true} onChange={e=>update({listAutoFit:e.target.checked})}/>월별 일정 목록 자동 맞춤</label>
   <div className="poster-calendar-color">글자색<ColorPalette label="일정 글자색" value={color} theme={editorThemeColors(project.template.resources?.colorTheme)} onChange={scheduleColor=>update({scheduleColor})}/></div>
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
