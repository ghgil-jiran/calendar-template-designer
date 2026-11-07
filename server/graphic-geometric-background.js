import {createHash} from 'node:crypto';
import '../apps/designer-studio/graphic-vector-design.js';
import thumbnail from './graphic-geometric-background-thumbnail.js';
const model=globalThis.ACDLGraphicVectorDesign;
const id=key=>{const h=createHash('sha256').update('calendar-geometric-04.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export const GEOMETRY_PACKAGE_ID=id('package'),GEOMETRY_COVER_ID=id('cover'),GEOMETRY_INSTALL_ID=id('installed');
export function geometryCover(){return model.normalize({composition:'cover-geometry-04',backgroundRevision:4,coverTuning:{tone:100,density:100,scale:100},palette:'navy-copper'});}
// Install only after the authenticated admin catalog request. The marker survives
// package deletion so a deliberately removed starter is not recreated next time.
export async function installGeometricBackground({records,createRecord,storeAsset,validateSvg,validateThumbnail}){
 const existing=new Map(records.map(r=>[r.id,r]));if(existing.has(GEOMETRY_INSTALL_ID))return [];
 const added=[],now=new Date().toISOString(),name='구성 04 · 기하학적 선';
 if(!existing.has(GEOMETRY_PACKAGE_ID)){
  let cover=existing.get(GEOMETRY_COVER_ID);
  if(!cover){const design=geometryCover(),svg=validateSvg(model.svg(design)),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
   cover=await createRecord({schemaVersion:'graphic-library.v1',id:GEOMETRY_COVER_ID,name:name+' · 표지',category:'background',width:1300,height:900,tags:'기하학, 선, 네이비, 구리색',source:'승인된 AI 시안 기반 · 순수 벡터 재구성',status:'active',revision:1,design,originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbnail),mimeType:'image/svg+xml',byteSize:Buffer.byteLength(svg),fileName:'geometric-lines-cover.svg',physicalSizeMm:{width:260,height:180},ownership:{kind:'background-package',id:GEOMETRY_PACKAGE_ID},setInfo:null,parentGraphicId:null,generationInfo:{engine:'cover-geometry-04',model:'parametric-vector-v1',generatedAt:now},createdAt:now,updatedAt:now});added.push(cover);
  }
  added.push(await createRecord({schemaVersion:'graphic-package.v1',id:GEOMETRY_PACKAGE_ID,name,size:'desk-standard',tags:'기하학, 선, 네이비, 구리색',source:'직접 제작 · 표지부터 페이지별로 확장',status:'active',revision:1,pages:{cover:{graphicId:cover.id,derivedFromCoverId:null,updatedAt:now}},thumbnailDataUrl:cover.thumbnailDataUrl,createdAt:now,updatedAt:now}));
 }
 added.push(await createRecord({schemaVersion:'graphic-package-installation.v1',id:GEOMETRY_INSTALL_ID,packageId:GEOMETRY_PACKAGE_ID,createdAt:now}));return added;
}
