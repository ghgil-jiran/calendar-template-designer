import '../apps/designer-studio/photo-frame-model.js';
import {createHash} from 'node:crypto';
const model=globalThis.ACDLPhotoFrameModel;
const id=key=>{const h=createHash('sha256').update('authored-photo-frames.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export const PHOTO_FRAME_INSTALL_ID=id('installed');
export async function installPhotoFrames({records,createRecord,storeAsset,validateSvg}){
 const existing=new Set(records.map(r=>r.id));if(existing.has(PHOTO_FRAME_INSTALL_ID))return [];
 const added=[],now=new Date().toISOString();
 for(const frame of model.catalog){const graphicId=id(frame.id);if(existing.has(graphicId))continue;
  const svg=validateSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400"><path d="${frame.path}" transform="translate(5 5) scale(.9)" fill="#E5EDF5" stroke="#4777BD" stroke-width="2"/></svg>`),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
  added.push(await createRecord({schemaVersion:'graphic-library.v1',id:graphicId,name:frame.name,category:'illustration',subjectId:'frames',illustrationCategory:'frame',frameType:frame.id,tags:'사진 프레임, 직접 제작, 도형',source:'직접 제작한 공통 사진 프레임',registrationMethod:'curated-vector',curatedEdition:true,status:'active',revision:1,width:400,height:400,mimeType:'image/svg+xml',originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'),byteSize:Buffer.byteLength(svg),fileName:`photo-frame-${frame.id}.svg`,createdAt:now,updatedAt:now}));
 }
 added.push(await createRecord({schemaVersion:'graphic-asset-installation.v1',id:PHOTO_FRAME_INSTALL_ID,createdAt:now}));return added;
}
