import { createHash } from 'node:crypto';
import { supabaseRequest } from './template-persistence.js';
export const BUCKET='calendar-correction-assets',MAX_BYTES=25*1024*1024;
const types=new Set(['image/jpeg','image/png','image/webp']);
export function validateUpload(body){if(typeof body.name!=='string'||!body.name.trim()||body.name.length>200||!types.has(body.mimeType)||!Number.isInteger(body.byteSize)||body.byteSize<=0||body.byteSize>MAX_BYTES)throw new Error('JPEG·PNG·WebP 이미지(최대 25MB)를 선택해 주세요.');}
// TIFF orientation may also be carried by PNG eXIf and WebP EXIF chunks.
function rasterOrientation(b){
 const tiff=(start,length)=>{try{
  if(length<8||start+length>b.length)return 1;
  const le=b.toString('ascii',start,start+2)==='II',be=b.toString('ascii',start,start+2)==='MM';if(!le&&!be)return 1;
  const u16=p=>le?b.readUInt16LE(start+p):b.readUInt16BE(start+p),u32=p=>le?b.readUInt32LE(start+p):b.readUInt32BE(start+p);
  if(u16(2)!==42)return 1;const offset=u32(4);if(offset<8||offset+2>length)return 1;const count=u16(offset);
  if(count>1024||offset+2+count*12>length)return 1;
  for(let i=0;i<count;i++){const p=offset+2+i*12;if(u16(p)===0x112&&u16(p+2)===3&&u32(p+4)===1){const value=u16(p+8);return value>=1&&value<=8?value:1;}}
 }catch{}return 1;};
 if(b[0]===255&&b[1]===216){let p=2;while(p+4<=b.length){if(b[p++]!==255)continue;while(b[p]===255)p++;const marker=b[p++];if(marker===0xda||marker===0xd9)break;if(marker===0x01||marker>=0xd0&&marker<=0xd8)continue;const len=b.readUInt16BE(p);if(len<2||p+len>b.length)break;if(marker===0xe1&&len>=8&&b.toString('ascii',p+2,p+8)==='Exif\0\0')return tiff(p+8,len-8);p+=len;}}
 else if(b.length>=8&&b.toString('ascii',1,4)==='PNG'){for(let p=8;p+12<=b.length;){const len=b.readUInt32BE(p);if(p+12+len>b.length)break;if(b.toString('ascii',p+4,p+8)==='eXIf')return tiff(p+8,len);p+=len+12;}}
 else if(b.length>=12&&b.toString('ascii',8,12)==='WEBP'){for(let p=12;p+8<=b.length;){const len=b.readUInt32LE(p+4);if(p+8+len>b.length)break;if(b.toString('ascii',p,p+4)==='EXIF'){const prefix=b.toString('ascii',p+8,p+14)==='Exif\0\0'?6:0;return tiff(p+8+prefix,len-prefix);}p+=8+len+(len%2);}}
 return 1;
}
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
 if([5,6,7,8].includes(rasterOrientation(b)))[width,height]=[height,width];
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
