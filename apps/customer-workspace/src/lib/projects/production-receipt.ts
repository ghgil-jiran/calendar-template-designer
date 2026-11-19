import {readSnapshot,saveReceiptNumber} from './store';

export async function requestProductionReceipt(id:string){
 const {record}=await readSnapshot(id);
 if(record.template.previewKind!=='published')throw Error('게시된 템플릿으로 만든 프로젝트만 접수할 수 있어요.');
 if(!record.originals)throw Error('편집 화면에서 프로젝트를 다시 저장한 뒤 접수해 주세요.');
 const {key,files}=record.originals;
 const photos=record.photos.map(photo=>{
  const original=files[photo.fileId];
  if(!original)throw Error('보관한 사진 원본을 확인해 주세요.');
  return {id:photo.id,name:photo.name,sha256:original.sha256};
 });
 const response=await fetch('/api/workspace/production-receipts',{
  method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
  body:JSON.stringify({
   id:record.id,name:record.name,templateId:record.template.id,templateVersion:record.template.version,
   school:record.school,events:record.events,assignments:record.assignments,editorState:record.editorState,bindingVersion:record.bindingVersion,photos,
  }),
 });
 const result=await response.json();
 if(!response.ok||!/^CAL-\d{6,}$/.test(result?.receiptNumber))throw Error(result?.error||'제작 검수 접수를 확인하지 못했어요.');
 await saveReceiptNumber(id,record.revision,result.receiptNumber);
 return result.receiptNumber as string;
}
