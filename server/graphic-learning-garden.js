import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const id=key=>{const h=createHash('sha256').update('learning-garden.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`};
export const GARDEN_ASSET_ID=id('illustration'),GARDEN_COVER_ID=id('cover'),GARDEN_PACKAGE_ID=id('package'),GARDEN_INSTALL_ID=id('installed');
export const GARDEN_ZONES=[{type:'text',label:'연도 · CALENDAR',x:43,y:5,w:49,h:10},{type:'photo',label:'학교 전경 사진',x:49.1,y:17.3,w:43.7,h:68.9,shape:'ellipse'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:5,y:86,w:40,h:10}];
export function gardenAssetSvg(cover=false){return readFileSync(new URL(`../assets/learning-garden/learning-garden${cover?'-cover':''}.svg`,import.meta.url),'utf8')}
export async function installLearningGarden({records,createRecord,storeAsset,validateSvg,validateThumbnail}){
 const existing=new Map(records.map(r=>[r.id,r]));if(existing.has(GARDEN_INSTALL_ID))return [];
 const thumbs=JSON.parse(readFileSync(new URL('../assets/learning-garden/thumbnails.json',import.meta.url),'utf8')),added=[],now=new Date().toISOString();
 for(const [graphicId,cover] of [[GARDEN_ASSET_ID,false],[GARDEN_COVER_ID,true]]){
  if(existing.has(graphicId))continue;
  const svg=validateSvg(gardenAssetSvg(cover)),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
  const graphic={schemaVersion:'graphic-library.v1',id:graphicId,name:cover?'배움의 정원 · 표지':'배움의 정원 · 학생과 책',category:cover?'background':'illustration',subjectId:'books',width:cover?1300:2460,height:cover?900:2556,mimeType:'image/svg+xml',fileName:cover?'learning-garden-cover.svg':'learning-garden.svg',byteSize:Buffer.byteLength(svg),originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbs[cover?'learning-garden-cover':'learning-garden']),status:'active',revision:1,registrationMethod:cover?'authored-cover':'curated-vector',source:'사용자 승인 AI 시안 · 상세 보존 벡터 추적 · 2026-10-14',tags:'학교, 학생, 책, 독서, 성장, 나무, 배움의 정원',generationInfo:{engine:'authored-vector',model:'vtracer-detail-preserving',generatedAt:now},printQuality:{structure:'passed',output:'not_run',colorSpace:'sRGB'},createdAt:now,updatedAt:now};
  if(cover)Object.assign(graphic,{physicalSizeMm:{width:260,height:180},ownership:{kind:'background-package',id:GARDEN_PACKAGE_ID},assetComposition:{kind:'authored-svg',sourceGraphicId:GARDEN_ASSET_ID,zones:GARDEN_ZONES},design:{schemaVersion:'graphic-vector-design.v1',kind:'background',page:'cover',style:'curve',palette:'spring',colors:['#F7F3E8','#385D47','#DBB795','#34434B'],referenceBackground:true,gradient:0,density:25,scale:100}});
  added.push(await createRecord(graphic));existing.set(graphicId,graphic);
 }
 if(!existing.has(GARDEN_PACKAGE_ID)){const cover=existing.get(GARDEN_COVER_ID);added.push(await createRecord({schemaVersion:'graphic-package.v1',id:GARDEN_PACKAGE_ID,name:'배움의 정원 · 학교 이야기',size:'desk-standard',status:'active',revision:1,tags:'학생, 독서, 성장, 세이지, 아이보리',source:'배움의 정원 벡터 자산 기반 · 나머지 페이지는 후속 제작',pages:{cover:{graphicId:GARDEN_COVER_ID,derivedFromCoverId:null,updatedAt:now}},thumbnailDataUrl:cover.thumbnailDataUrl,createdAt:now,updatedAt:now}))}
 added.push(await createRecord({schemaVersion:'graphic-asset-installation.v1',id:GARDEN_INSTALL_ID,graphicId:GARDEN_ASSET_ID,packageId:GARDEN_PACKAGE_ID,createdAt:now}));return added;
}
