import {createHash} from 'node:crypto';
import '../apps/designer-studio/graphic-vector-design.js';
import '../apps/designer-studio/graphic-package-model.js';
import thumbnails from './graphic-arch-background-thumbnails.js';
const model=globalThis.ACDLGraphicVectorDesign,packages=globalThis.ACDLGraphicPackageModel;
const id=key=>{const h=createHash('sha256').update('calendar-arch-05.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
export const ARCH_PACKAGE_ID=id('package'),ARCH_COVER_ID=id('cover'),ARCH_INSTALL_ID=id('installed');
export const ARCH_PAGES=['cover','cover-inside','interleaf-front','interleaf-back','month-front','month-back','rear-interleaf-front','rear-interleaf-back','back-cover','year','symbols'];
export function archCover(){return model.normalize({composition:'cover-arch-05',backgroundRevision:5,coverTuning:{tone:100,density:100,scale:100},palette:'navy-copper'});}
export function archDesign(page,cover=archCover()){const d=packages.derive({design:cover},page);return model.normalize({...d,variation:page.startsWith('month-')?'monthly':'same'});}
// Called only by the authenticated admin catalog. Existing records, including
// partial installation and intentional deletion, retain their identity.
export async function installArchBackground({records,createRecord,storeAsset,validateSvg,validateThumbnail}){
 const existing=new Map(records.map(r=>[r.id,r]));if(existing.has(ARCH_INSTALL_ID))return [];
 const added=[],now=new Date().toISOString(),name='구성 05 · 아치 에디토리얼';
 if(!existing.has(ARCH_PACKAGE_ID)){
  const pages={};let cover=existing.get(ARCH_COVER_ID);
  for(const page of ARCH_PAGES){
   const graphicId=page==='cover'?ARCH_COVER_ID:id(page);let graphic=existing.get(graphicId);
   if(!graphic){const design=archDesign(page,cover?.design||archCover()),svg=validateSvg(model.svg(design)),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
    graphic=await createRecord({schemaVersion:'graphic-library.v1',id:graphicId,name:name+' · '+model.pages[page],category:'background',width:1300,height:900,tags:'아치, 선, 네이비, 구리색',source:'승인 표지 시안 기반 · 순수 벡터 배경',status:'active',revision:1,design,originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbnails[page]),mimeType:'image/svg+xml',byteSize:Buffer.byteLength(svg),fileName:'arch-editorial-'+page+'.svg',physicalSizeMm:{width:260,height:180},ownership:{kind:'background-package',id:ARCH_PACKAGE_ID},setInfo:model.setInfo(design),parentGraphicId:page==='cover'?null:ARCH_COVER_ID,generationInfo:{engine:'cover-arch-05',model:'parametric-vector-v1',generatedAt:now},createdAt:now,updatedAt:now});added.push(graphic);existing.set(graphicId,graphic);
   }
   if(page==='cover')cover=graphic;
   pages[page]={graphicId:graphic.id,derivedFromCoverId:page==='cover'?null:ARCH_COVER_ID,updatedAt:now};
  }
  added.push(await createRecord({schemaVersion:'graphic-package.v1',id:ARCH_PACKAGE_ID,name,size:'desk-standard',tags:'아치, 선, 네이비, 구리색',source:'표지·월력·간지·연력·학교상징의 통일된 선 구성',status:'active',revision:1,pages,thumbnailDataUrl:cover.thumbnailDataUrl,createdAt:now,updatedAt:now}));
 }
 added.push(await createRecord({schemaVersion:'graphic-package-installation.v1',id:ARCH_INSTALL_ID,packageId:ARCH_PACKAGE_ID,createdAt:now}));return added;
}
