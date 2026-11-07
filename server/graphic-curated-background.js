import {createHash} from 'node:crypto';
import '../apps/designer-studio/graphic-vector-design.js';
import thumbnail from './graphic-curated-background-thumbnail.js';
const model=globalThis.ACDLGraphicVectorDesign;
const id=key=>{const h=createHash('sha256').update('calendar-ribbon-03.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export const FLOW_PACKAGE_ID=id('package'),FLOW_COVER_ID=id('cover'),FLOW_INSTALL_ID=id('installed');
export function flowCover(){return model.normalize({composition:'cover-ribbon-03',backgroundRevision:3,coverTuning:{tone:100,density:100,scale:100},palette:'teal-apricot'});}
// Install only after the authenticated admin catalog request. The marker survives
// package deletion so a deliberately removed starter is not recreated next time.
export async function installCuratedBackground({records,createRecord,storeAsset,validateSvg,validateThumbnail}){
 const existing=new Map(records.map(r=>[r.id,r]));if(existing.has(FLOW_INSTALL_ID))return [];
 const added=[],now=new Date().toISOString(),name='구성 03 · 겹쳐 흐르는 리본';
 if(!existing.has(FLOW_PACKAGE_ID)){
  let cover=existing.get(FLOW_COVER_ID);
  if(!cover){const design=flowCover(),svg=validateSvg(model.svg(design)),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
   cover=await createRecord({schemaVersion:'graphic-library.v1',id:FLOW_COVER_ID,name:name+' · 표지',category:'background',width:1300,height:900,tags:'곡선, 아이보리, 딥 틸, 살구',source:'직접 제작 · 겹쳐 흐르는 리본 03',status:'active',revision:1,design,originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbnail),mimeType:'image/svg+xml',byteSize:Buffer.byteLength(svg),fileName:'layered-ribbon-cover.svg',physicalSizeMm:{width:260,height:180},ownership:{kind:'background-package',id:FLOW_PACKAGE_ID},setInfo:null,parentGraphicId:null,generationInfo:{engine:'cover-ribbon-03',model:'parametric-vector-v1',generatedAt:now},createdAt:now,updatedAt:now});added.push(cover);
  }
  added.push(await createRecord({schemaVersion:'graphic-package.v1',id:FLOW_PACKAGE_ID,name,size:'desk-standard',tags:'곡선, 아이보리, 딥 틸, 살구',source:'직접 제작 · 표지부터 페이지별로 확장',status:'active',revision:1,pages:{cover:{graphicId:cover.id,derivedFromCoverId:null,updatedAt:now}},thumbnailDataUrl:cover.thumbnailDataUrl,createdAt:now,updatedAt:now}));
 }
 added.push(await createRecord({schemaVersion:'graphic-package-installation.v1',id:FLOW_INSTALL_ID,packageId:FLOW_PACKAGE_ID,createdAt:now}));return added;
}
