import { createHash } from 'node:crypto';
import { supabaseRequest } from './template-persistence.js';
export const BUCKET='calendar-correction-assets',MAX_BYTES=25*1024*1024;
const types=new Set(['image/jpeg','image/png','image/webp']);
export function validateUpload(body){if(typeof body.name!=='string'||!body.name.trim()||body.name.length>200||!types.has(body.mimeType)||!Number.isInteger(body.byteSize)||body.byteSize<=0||body.byteSize>MAX_BYTES)throw new Error('JPEG·PNG·WebP 이미지(최대 25MB)를 선택해 주세요.');}
export function inspectRaster(b){
 let width,height,mimeType;
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR'){width=b.readUInt32BE(16);height=b.readUInt32BE(20);mimeType='image/png';}
 else if(b.length>=4&&b[0]===255&&b[1]===216){let p=2;while(p+4<=b.length){if(b[p++]!==255)continue;while(b[p]===255)p++;const marker=b[p++];if(marker===0xda||marker===0xd9)break;if(marker===0x01||marker>=0xd0&&marker<=0xd8)continue;const length=b.readUInt16BE(p);if(length<2||p+length>b.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=7){height=b.readUInt16BE(p+3);width=b.readUInt16BE(p+5);mimeType='image/jpeg';break;}p+=length;}}
 else if(b.length>=30&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){
  const chunk=b.toString('ascii',12,16);
  if(chunk==='VP8X'){width=b.readUIntLE(24,3)+1;height=b.readUIntLE(27,3)+1;}
  else if(chunk==='VP8 '&&b[23]===0x9d&&b[24]===1&&b[25]===0x2a){width=b.readUInt16LE(26)&0x3fff;height=b.readUInt16LE(28)&0x3fff;}
  else if(chunk==='VP8L'&&b[20]===0x2f){const bits=b.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
  mimeType='image/webp';
 }
 if(!width||!height||width>100000||height>100000)throw new Error('이미지 형식과 픽셀 크기를 확인하지 못했습니다. 다른 원본을 선택해 주세요.');
 return {width,height,mimeType,contentHash:createHash('sha256').update(b).digest('hex')};
}
export async function storage(path,options={}){
 const url=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Storage configuration missing');
 const response=await fetch(`${url}/storage/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,...options.headers},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Object.assign(new Error('교정 이미지를 보관소에서 처리하지 못했습니다.'),{statusCode:502});
 return response;
}
export async function signedAsset(asset){
 const r=await storage(`object/sign/${BUCKET}/${asset.path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})}),v=await r.json(),path=v.signedURL||v.signedUrl;
 if(typeof path!=='string')throw new Error('Signed asset URL missing');
 const base=process.env.SUPABASE_URL.replace(/\/$/,'');return {...asset,url:path.startsWith('http')?path:`${base}${path.startsWith('/storage/v1/')?'':'/storage/v1'}${path}`};
}
export async function correctionAssets(requestId){return supabaseRequest(`calendar_production_correction_assets?request_id=eq.${requestId}&status=eq.ready&select=id,request_id,path,name,mime_type,byte_size,width,height,content_hash,created_at&order=created_at.asc`);}
