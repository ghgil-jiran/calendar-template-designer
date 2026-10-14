import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../assets/learning-garden-illustrations/',import.meta.url);
export const gardenIllustrationId=key=>{const h=createHash('sha256').update('learning-garden-illustrations.v1:'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`};
export function gardenIllustrationManifest(){return JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'))}
export async function installGardenIllustrations({records,createRecord,storeAsset,validateSvg,validateThumbnail}){
 const ids=new Set(records.map(r=>r.id)),markerId=gardenIllustrationId('installed');if(ids.has(markerId))return [];
 const thumbnails=JSON.parse(readFileSync(new URL('thumbnails.json',root),'utf8')),added=[],now=new Date().toISOString();
 for(const item of gardenIllustrationManifest()){
  const id=gardenIllustrationId(item.slug);if(ids.has(id))continue;
  const svg=validateSvg(readFileSync(new URL(item.fileName,root),'utf8')),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
  added.push(await createRecord({schemaVersion:'graphic-library.v1',id,name:'배움의 정원 · '+item.name,category:'illustration',subjectId:item.subjectId,width:item.width,height:item.height,mimeType:'image/svg+xml',fileName:item.fileName,byteSize:Buffer.byteLength(svg),originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(thumbnails[item.slug]),tags:'배움의 정원, 학사달력, 독립 벡터, 투명 배경, '+item.name,source:'배움의 정원 원본 스타일 기반 · 개별 AI 시안 · 상세 보존 벡터 추적',usageNotes:'페이지별 독립 배치용 SVG. 크기와 위치는 템플릿 편집에서 조정합니다. 최종 CMYK 인쇄는 별도 확인.',generationInfo:{engine:'imagegen-vtracer',model:'detail-preserving',prompt:item.prompt,generatedAt:now},printQuality:{structure:'passed',output:'not_run',colorSpace:'sRGB'},status:'active',registrationMethod:'curated-vector',revision:1,createdAt:now,updatedAt:now}));
 }
 added.push(await createRecord({schemaVersion:'graphic-asset-installation.v1',id:markerId,series:'learning-garden-illustrations',createdAt:now}));return added;
}
