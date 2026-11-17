import {createHash,timingSafeEqual} from 'node:crypto';
const BUCKET='calendar-customer-originals',MAX_FILE=25*1048576,MAX_PROJECT=350*1048576;
const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const mimeTypes=new Set(['image/jpeg','image/png','image/webp']);
type Config={url:string;key:string;fetcher?:typeof fetch};
export function createOriginalStorage({url,key,fetcher=fetch}:Config){
 if(!url||!key)throw Error('원본 보관 연결이 준비되지 않았어요.');
 const base=url.replace(/\/$/,'');
 async function call(path:string,init:RequestInit={}){const r=await fetcher(`${base}/storage/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,...init.headers},signal:AbortSignal.timeout(60000)});if(!r.ok)throw Object.assign(Error('사진 원본을 서버에 보관하지 못했어요. 다시 저장해 주세요.'),{status:r.status});return r;}
 async function ensureBucket(){let r=await fetcher(`${base}/storage/v1/bucket/${BUCKET}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});if(r.status===404||r.status===400){await call('bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:BUCKET,name:BUCKET,public:false,file_size_limit:MAX_FILE,allowed_mime_types:['image/jpeg','image/png','image/webp','application/octet-stream','application/json']})}).catch(error=>{if(![400,409].includes((error as {status:number}).status))throw error;});r=await call(`bucket/${BUCKET}`);}if(!r.ok||(await r.json()).public!==false)throw Error('사진 원본의 비공개 보관 설정을 확인해 주세요.');}
 function namespace(token:string){if(!SHA.test(token))throw Object.assign(Error('프로젝트 원본 접근 정보가 올바르지 않아요.'),{status:401});return hash('customer-originals.v1:'+token);}
 function metadata(body:Record<string,unknown>){if(!SHA.test(String(body.sha256))||!Number.isInteger(body.byteSize)||Number(body.byteSize)<1||Number(body.byteSize)>MAX_FILE||!mimeTypes.has(String(body.mimeType)))throw Error('사진 원본 정보를 확인해 주세요.');return {sha256:String(body.sha256),byteSize:Number(body.byteSize),mimeType:String(body.mimeType)};}
 async function receipt(ns:string,sha:string){if(!SHA.test(sha))throw Error('사진 원본 정보를 확인해 주세요.');try{return await (await call(`object/${BUCKET}/${ns}/receipts/${sha}.json`)).json() as {sha256:string;byteSize:number;mimeType:string};}catch(error){if((error as {status?:number}).status===404||(error as {status?:number}).status===400)return null;throw error;}}
 async function operation(token:string,body:Record<string,unknown>){const ns=namespace(token),meta=metadata(body);await ensureBucket();
  let known=await receipt(ns,meta.sha256);if(known){try{const exists=await call(`object/${BUCKET}/${ns}/files/${meta.sha256}`,{method:'HEAD'});if(Number(exists.headers.get('content-length'))!==meta.byteSize)known=null;}catch(error){if([400,404].includes((error as {status:number}).status))known=null;else throw error;}}if(known){if(known.sha256!==meta.sha256||known.byteSize!==meta.byteSize||known.mimeType!==meta.mimeType)throw Error('저장된 원본 정보가 일치하지 않아요.');return {stored:true,...known};}
  const total=Math.ceil(meta.byteSize/1048576);
  if(body.operation==='chunk'){const index=Number(body.index),data=String(body.data||'');if(!Number.isInteger(index)||index<0||index>=total||data.length>1398104||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw Error('원본 전송 정보를 확인해 주세요.');const bytes=Buffer.from(data,'base64'),expected=Math.min(1048576,meta.byteSize-index*1048576);if(bytes.length!==expected)throw Error('원본 전송 길이가 일치하지 않아요.');await call(`object/${BUCKET}/${ns}/uploads/${meta.sha256}/${index}`,{method:'POST',headers:{'Content-Type':'application/octet-stream','x-upsert':'true'},body:bytes});return {stored:false,index};}
  if(body.operation==='status')return {stored:false};
  if(body.operation!=='complete')throw Error('원본 보관 요청을 확인해 주세요.');
  const listing=await (await call(`object/list/${BUCKET}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix:`${ns}/files`,limit:1000})})).json();const used=(Array.isArray(listing)?listing:[]).reduce((sum:number,item:{name?:string;metadata?:{size?:number}})=>sum+(item.name===meta.sha256?0:Number(item.metadata?.size||0)),0);if(used+meta.byteSize>MAX_PROJECT)throw Error('프로젝트 원본 보관 용량이 350MB를 초과해요.');
  const chunks:Buffer[]=[];for(let i=0;i<total;i++)chunks.push(Buffer.from(await (await call(`object/${BUCKET}/${ns}/uploads/${meta.sha256}/${i}`)).arrayBuffer()));const bytes=Buffer.concat(chunks);if(bytes.length!==meta.byteSize||!timingSafeEqual(Buffer.from(hash(bytes)),Buffer.from(meta.sha256)))throw Error('사진 원본 검증에 실패했어요. 다시 저장해 주세요.');
  await call(`object/${BUCKET}/${ns}/files/${meta.sha256}`,{method:'POST',headers:{'Content-Type':meta.mimeType,'x-upsert':'true'},body:bytes});
  // Read back exact stored bytes before recording successful preservation.
  const stored=Buffer.from(await (await call(`object/${BUCKET}/${ns}/files/${meta.sha256}`)).arrayBuffer());if(stored.length!==meta.byteSize||hash(stored)!==meta.sha256)throw Error('저장된 사진 원본이 업로드 파일과 일치하지 않아요.');
  await call(`object/${BUCKET}/${ns}/receipts/${meta.sha256}.json`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify(meta)});
  await call(`object/${BUCKET}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:Array.from({length:total},(_,i)=>`${ns}/uploads/${meta.sha256}/${i}`)})}).catch(()=>{});return {stored:true,...meta};
 }
 async function read(token:string,sha:string){const ns=namespace(token),meta=await receipt(ns,sha);if(!meta)throw Error('보관된 사진 원본을 찾지 못했어요.');const bytes=Buffer.from(await (await call(`object/${BUCKET}/${ns}/files/${sha}`)).arrayBuffer());if(bytes.length!==meta.byteSize||hash(bytes)!==sha)throw Error('보관된 사진 원본의 무결성을 확인하지 못했어요.');return {bytes,mimeType:meta.mimeType};}
 return {operation,read};
}
