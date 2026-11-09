'use client';
import {useEffect,useRef} from 'react';
import {Button} from '@/components/ui/button';
import type {UploadPhoto} from '@/lib/materials/photo-files';
export function PhotoPicker({label,photos,selectedId,usedIds,onChoose,onClose}:{label:string;photos:UploadPhoto[];selectedId?:string;usedIds:Set<string>;onChoose:(photo?:UploadPhoto)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog className="photo-picker-dialog" ref={dialog} aria-labelledby="photo-picker-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="photo-picker-header"><div><h2 id="photo-picker-title">{label}에 넣을 사진</h2><p className="field-hint">직접 등록한 사진 중에서 선택해 주세요. 사용 중인 사진도 다시 선택할 수 있어요.</p></div><Button onClick={onClose}>닫기 ×</Button></div>
  <div className="photo-picker-grid">{photos.map(photo=><button type="button" className="photo-picker-item" key={photo.id} aria-pressed={selectedId===photo.id} aria-label={`사진 선택: ${photo.file.name}${usedIds.has(photo.id)?' · 사용 중':''}`} onClick={()=>{onChoose(photo);onClose();}}><img src={photo.url} alt="" loading="lazy"/><strong title={photo.file.name}>{photo.file.name}</strong><span className="photo-picker-state">{selectedId===photo.id?'현재 선택':usedIds.has(photo.id)?'사용 중':'선택 가능'}</span></button>)}</div>
  {!photos.length&&<p className="empty-material">아직 올린 사진이 없어요. 이 창을 닫고 ‘새 사진 올리기’로 사진을 추가해 주세요.</p>}
  <div className="photo-picker-footer"><Button onClick={()=>{onChoose(undefined);onClose();}}>사진 선택 해제</Button><span className="field-hint">{photos.length}장 · 원본 파일은 그대로 보관됩니다.</span></div>
 </dialog>;
}
