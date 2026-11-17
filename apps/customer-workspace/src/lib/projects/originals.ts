// Project access keys stay in the local record/backup and never appear in image URLs.
export type OriginalEntry={sha256:string;byteSize:number;mimeType:string};
export type OriginalReference={key:string;files:Record<string,OriginalEntry>};
type OriginalFile={id:string;kind:string;blob:Blob;type:string};
const SHA=/^[a-f0-9]{64}$/;
const hashes=new WeakMap<Blob,Promise<string>>(),verified=new Set<string>();
async function digest(blob:Blob){let pending=hashes.get(blob);if(!pending){pending=(async()=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join(''))();hashes.set(blob,pending);}return pending;}
function capability(){return crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');}
async function request(key:string,body:Record<string,unknown>){const response=await fetch('/api/workspace/originals',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});const result=await response.json();if(!response.ok||!result)throw Error(result?.error||'사진 원본을 서버에 보관하지 못했어요.');return result;}
function base64(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);}
export async function preserveOriginals(files:OriginalFile[],previous?:OriginalReference):Promise<OriginalReference>{
 const photos=files.filter(f=>f.kind==='photo'),key=previous?.key||capability();if(!SHA.test(key))throw Error('프로젝트 원본 접근 정보를 확인해 주세요.');const entries:Record<string,OriginalEntry>={},pending=new Map<string,Promise<void>>();
 for(const file of photos){const meta={sha256:await digest(file.blob),byteSize:file.blob.size,mimeType:file.type};entries[file.id]=meta;
  if(!pending.has(meta.sha256))pending.set(meta.sha256,(async()=>{const identity=key+':'+meta.sha256;if(verified.has(identity))return;const status=await request(key,{operation:'status',...meta});if(status.stored===true){if(status.sha256!==meta.sha256||status.byteSize!==meta.byteSize||status.mimeType!==meta.mimeType)throw Error('보관된 사진 원본 정보가 일치하지 않아요.');verified.add(identity);return;}
   for(let index=0;index<Math.ceil(file.blob.size/1048576);index++){const bytes=new Uint8Array(await file.blob.slice(index*1048576,(index+1)*1048576).arrayBuffer());await request(key,{operation:'chunk',...meta,index,data:base64(bytes)});}
   const done=await request(key,{operation:'complete',...meta});if(done.stored!==true||done.sha256!==meta.sha256||done.byteSize!==meta.byteSize||done.mimeType!==meta.mimeType)throw Error('서버에 보관된 사진 원본이 업로드 파일과 일치하지 않아요.');verified.add(identity);
  })());await pending.get(meta.sha256);
 }
 return {key,files:entries};
}
export async function restoreOriginal(reference:OriginalReference,fileId:string):Promise<Blob>{const meta=reference.files[fileId];if(!SHA.test(reference.key)||!meta||!SHA.test(meta.sha256))throw Error('사진 원본 복구 정보를 확인해 주세요.');const response=await fetch(`/api/workspace/originals?sha256=${meta.sha256}`,{headers:{Authorization:`Bearer ${reference.key}`},signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('서버에 보관한 사진 원본을 불러오지 못했어요.');const blob=await response.blob();if(blob.size!==meta.byteSize||blob.type!==meta.mimeType||await digest(blob)!==meta.sha256)throw Error('복구한 사진 원본이 저장 당시 파일과 일치하지 않아요.');return blob;}
