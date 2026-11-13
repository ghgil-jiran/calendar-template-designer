'use client';
import {Button} from '@/components/ui/button';
import type {EditorTarget,PhotoFit,TextStyle} from '@/lib/editor/session';
import type {SchoolField,SchoolInput} from '@/lib/api/contracts';
import type {NativeProject} from '@/lib/materials/native-project';

export function TextFormattingToolbar({style,onChange,disabled=false}:{style:TextStyle;onChange:(patch:TextStyle)=>void;disabled?:boolean}){
 const underline=style.textDecoration?.includes('underline'),strike=style.textDecoration?.includes('line-through');
 return <div className="editor-text-toolbar" role="group" aria-label="글자 꾸미기">
  <select disabled={disabled} aria-label="툴바 글꼴" value={style.fontFamily||'Pretendard'} onChange={e=>onChange({fontFamily:e.target.value})}>{[...new Set([style.fontFamily||'Pretendard','Pretendard','Noto Sans KR','Noto Serif KR','Arial'])].map(font=><option key={font}>{font}</option>)}</select>
  <input disabled={disabled} aria-label="툴바 글자 크기" type="number" min="1" max="240" step=".5" value={style.fontSize||18} onChange={e=>{if(e.target.value)onChange({fontSize:Number(e.target.value)});}}/>
  <input disabled={disabled} aria-label="툴바 글자색" type="color" value={/^#[0-9a-f]{6}$/i.test(style.color||'')?style.color:'#17202e'} onChange={e=>onChange({color:e.target.value})}/>
  {([['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬'],['justify','양쪽 정렬']] as const).map(([value,label])=><Button key={value} disabled={disabled} title={label} aria-label={label} aria-pressed={(style.textAlign||'left')===value} onClick={()=>onChange({textAlign:value})}>{label.replace(' 정렬','')}</Button>)}
  <Button disabled={disabled} aria-label="굵게" title="굵게" aria-pressed={Number(style.fontWeight||400)>=700} onClick={()=>onChange({fontWeight:Number(style.fontWeight||400)>=700?400:700})}><strong>B</strong></Button>
  <Button disabled={disabled} aria-label="기울임" title="기울임" aria-pressed={style.fontStyle==='italic'} onClick={()=>onChange({fontStyle:style.fontStyle==='italic'?'normal':'italic'})}><em>I</em></Button>
  <Button disabled={disabled} aria-label="밑줄" title="밑줄" aria-pressed={!!underline} onClick={()=>onChange({textDecoration:underline?(strike?'line-through':'none'):(strike?'underline line-through':'underline')})}><span className="editor-underline-icon">U</span></Button>
 </div>;
}

type Props={selection:EditorTarget|null;item:NativeProject|undefined;fields:SchoolField[];school:SchoolInput;fit:PhotoFit;hasEditableTargets:boolean;schoolImageLinked:boolean;sharing:{layout:boolean;image:boolean;layoutCount:number;imageCount:number;poster:boolean};canReset:boolean;onFieldChange:(key:string,value:string)=>void;onFieldHide:(key:string,hidden:boolean)=>void;onStyle:(patch:TextStyle)=>void;onFit:(fit:PhotoFit)=>void;onShare:(kind:'layout'|'image',checked:boolean)=>void;onReset:()=>void;onSchoolSave:()=>void;saving:boolean};
export function ObjectTools({selection,item,fields,school,fit,hasEditableTargets,schoolImageLinked,sharing,canReset,onFieldChange,onFieldHide,onStyle,onFit,onShare,onReset,onSchoolSave,saving}:Props){
 const style=item?.style||{},editable=selection&&Object.values(selection.rights).some(Boolean),textFields=selection?fields.filter(f=>f.binding===selection.binding||selection.binding==='school.contacts'&&f.binding?.startsWith('school.contacts.')):[];
 return <aside className="editor-properties" aria-label="편집도구">
  <div className="editor-inspector-heading"><h2>편집도구</h2>{selection&&<span className="editor-object-name">{selection.label}</span>}</div>
  {selection&&editable?<>
   <p className="editor-selection-tip">{selection.type==='text'?'학교 정보와 연결된 글자입니다.':schoolImageLinked?'학교 공통 이미지입니다. 연결된 페이지도 함께 바뀝니다.':'선택한 이미지를 편집합니다.'}</p>
   {selection.rights.replaceImage&&<p className="editor-photo-guide">왼쪽 사진을 끌어 놓거나 눌러 교체하세요.</p>}
   {(selection.rights.move||selection.rights.resize)&&<p className="editor-canvas-guide">{selection.rights.resize?'개체를 끌어 이동하고 모서리로 크기를 조절하세요.':'개체를 끌어 이동하세요.'}</p>}
   {selection.rights.content&&textFields.length>0&&<section className="editor-text-content">{textFields.map(field=><div className="editor-content-field" key={field.key}><div className="editor-field-heading">{field.allowHide?<label className="editor-visibility-toggle"><input type="checkbox" aria-label={field.label+' 표시'} checked={!school.hidden.includes(field.key)} onChange={e=>onFieldHide(field.key,!e.target.checked)}/>{field.label}</label>:<span>{field.label}</span>}</div><input aria-label={field.label+' 내용'} value={school.values[field.key]??''} placeholder={selection.binding==='school.contacts'?'저장된 연락처':String(item?.content||'')} maxLength={field.maxLength} disabled={school.hidden.includes(field.key)} onChange={e=>onFieldChange(field.key,e.target.value)}/></div>)}</section>}
   {selection.rights.content&&textFields.length>0&&<Button disabled={saving} onClick={onSchoolSave}>{saving?'저장 중…':'수정된 정보를 학교 정보에 저장'}</Button>}
   {selection.rights.textStyle&&<section className="editor-compact-style"><label className="editor-inline-control">글꼴<select value={style.fontFamily||'Pretendard'} onChange={e=>onStyle({fontFamily:e.target.value})}>{[...new Set([style.fontFamily||'Pretendard','Pretendard','Noto Sans KR','Noto Serif KR','Arial'])].map(font=><option key={font}>{font}</option>)}</select></label><label className="editor-inline-control">글자 크기<input aria-label="글자 크기" type="number" min="1" max="240" step=".5" value={style.fontSize||18} onChange={e=>{if(e.target.value)onStyle({fontSize:Number(e.target.value)});}}/></label><label className="editor-inline-control">글자색<input aria-label="글자색" type="color" value={/^#[0-9a-f]{6}$/i.test(style.color||'')?style.color:'#17202e'} onChange={e=>onStyle({color:e.target.value})}/></label></section>}
   {selection.rights.imageFit&&<section><h3>사진 맞춤</h3><select aria-label="사진 맞춤" value={fit.fit} onChange={e=>onFit({...fit,fit:e.target.value as PhotoFit['fit']})}><option value="cover">틀 채우기</option><option value="contain">사진 전체 보기</option></select>{(['scale','offsetX','offsetY'] as const).map(key=><label key={key}>{{scale:'사진 확대',offsetX:'사진 가로 위치',offsetY:'사진 세로 위치'}[key]}<input type="range" min={key==='scale'?.1:-100} max={key==='scale'?5:100} step={key==='scale'?.05:1} value={fit[key]} onChange={e=>onFit({...fit,[key]:Number(e.target.value)})}/></label>)}</section>}
   {(sharing.layoutCount>0||sharing.imageCount>0)&&<section className="editor-share-options"><h3>{sharing.poster?'다른 페이지에 적용':'월력 앞면에 공통 적용'}</h3>{sharing.layoutCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.layout} onChange={e=>onShare('layout',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 위치·크기 적용':'해당 개체 위치, 크기 정보를 모든 월력에 적용'}</span></label>}{sharing.imageCount>0&&<label className="editor-share-option"><input type="checkbox" checked={sharing.image} onChange={e=>onShare('image',e.target.checked)}/><span>{sharing.poster?'다른 페이지의 같은 개체에 이미지 적용':'해당 개체 이미지를 모든 월력에 저장'}</span></label>}<p className="field-hint">대응하는 개체가 있는 페이지에만 적용합니다. 체크 후 변경도 함께 반영됩니다.</p></section>}
   {(selection.rights.replaceImage||selection.rights.imageFit)&&<Button disabled={!canReset} onClick={onReset}>선택 사진 편집 되돌리기</Button>}
  </>:<div className="editor-inspector-empty"><p>{!hasEditableTargets?'이 페이지에는 수정할 수 있는 개체가 없습니다.':selection?'이 개체는 편집할 수 없습니다.':'편집할 개체를 선택해 주세요.'}</p></div>}
 </aside>;
}
