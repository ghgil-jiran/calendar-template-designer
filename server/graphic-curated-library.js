import data from './graphic-curated-data.js';
import students from './graphic-student-data.js';
import {createHash} from 'node:crypto';
import '../apps/designer-studio/graphic-illustration-model.js';
export const RETIRED_STUDENT_KEYS=["school","reading","presentation","art","basketball","recorder","wave","together"].map(key=>"student-"+key);
const model=globalThis.ACDLGraphicIllustrationModel;
export const CURATED_EDITION=data.edition;
export const CURATED_CATALOG_REVISION=data.catalogRevision||1;
export function curatedId(key){const hex=createHash('sha256').update(CURATED_EDITION+':'+key).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;}
export function curatedThemes(){return ['stationery','seasons','traditional','plants','animals','music','sports','students'].map(themeKind=>{const items=[...data.items,...students].filter(i=>i.themeKind===themeKind);return {themeKind,items,catalogRevision:themeKind==='students'?3:CURATED_CATALOG_REVISION,id:curatedId('theme:'+themeKind),name:model.themeProfiles[themeKind].label+' · 직접 제작 01',category:items[0].recipe.category,count:items.length,plan:{subjects:items.map(i=>({name:i.name,description:i.description})),colors:items[0].recipe.colors,styleDescription:'또렷한 윤곽과 절제된 색상으로 직접 제작한 달력용 일러스트',strokeMm:.28}};});}
// Create-only writes and deterministic identities preserve edited/archived records,
// prevent duplicate imports, and allow interrupted imports to resume.
export async function installCuratedIllustrations({records,createRecord,updateRecord,storeAsset,validateSvg,validateThumbnail,deleteRecord}){
 const existing=new Map(records.map(r=>[r.id,r])),added=[];
 for(const entry of curatedThemes()){
  const current=existing.get(entry.id),retiredIds=new Set(RETIRED_STUDENT_KEYS.map(key=>curatedId('asset:'+key)));
  async function removeRetired(){if(entry.themeKind!=='students')return;for(const id of retiredIds){const old=existing.get(id);if(!old||old.curatedEdition!==CURATED_EDITION||old.generationInfo?.engine!=='direct-authored-vector')continue;if(!deleteRecord)throw new Error('CURATED_STUDENT_DELETE_REQUIRED');await deleteRecord(id);existing.delete(id);const index=records.findIndex(r=>r.id===id);if(index>=0)records.splice(index,1);}}
  const studentSlotsComplete=entry.themeKind!=='students'||entry.items.every((item,slot)=>current?.assets?.[slot]?.graphicId===curatedId('asset:'+item.key)&&existing.has(curatedId('asset:'+item.key)));
  if(current&&((current.status!=='active'&&entry.themeKind!=='students')||current.curatedCatalogRevision>=entry.catalogRevision&&studentSlotsComplete)){await removeRetired();continue;}
  const now=new Date().toISOString(),assets={...current?.assets};
  if(entry.themeKind==='students')for(const [slot,value] of Object.entries(assets))if(retiredIds.has(value.graphicId)||!existing.has(value.graphicId))delete assets[slot];
  const slots=Array.from(entry.items.entries());
  async function installSlot([slot,item]){
   if(assets[slot])return;
   const id=curatedId('asset:'+item.key);let record=existing.get(id);
   if(!record){const recipe=model.normalize(item.recipe),svg=validateSvg(model.svg(recipe)),asset=await storeAsset('data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'));
    record=await createRecord({schemaVersion:'graphic-library.v1',id,name:item.name,category:'illustration',width:100,height:100,tags:entry.name+', '+item.name,source:'직접 제작 · 달력용 벡터 기준 시안 01',illustrationCategory:entry.category,themeId:entry.id,themeName:entry.name,illustrationRecipe:recipe,vectorObject:model.definition(recipe),printQuality:{structure:'passed',output:'not_run',referenceSizeMm:40,strokeMm:recipe.strokeMm,colorSpace:'sRGB',notes:'실제 배치와 최종 CMYK PDF에서 검증 필요'},originalAssetId:asset.id,previewAssetId:asset.id,thumbnailDataUrl:validateThumbnail(item.thumbnailDataUrl),mimeType:'image/svg+xml',byteSize:Buffer.byteLength(svg),fileName:item.key+'.svg',physicalSizeMm:{width:40,height:40},generationInfo:{engine:'direct-authored-vector',edition:CURATED_EDITION,generatedAt:now},curatedEdition:CURATED_EDITION,status:'active',parentGraphicId:null,revision:1,createdAt:now,updatedAt:now});existing.set(id,record);added.push(record);
   }
   assets[slot]={graphicId:id,name:record.name};
  }
  for(let i=0;i<slots.length;i+=4){const results=await Promise.allSettled(slots.slice(i,i+4).map(installSlot)),failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;}
  let theme;if(current){if(!updateRecord)throw new Error('CURATED_THEME_UPDATE_REQUIRED');const count=Math.max(current.count,entry.count),subjects=current.plan?Array.from({length:count},(_,slot)=>current.plan.subjects[slot]||entry.plan.subjects[slot]):null;theme=await updateRecord({...current,count,assets,plan:entry.themeKind==='students'?entry.plan:subjects?.every(Boolean)?{...current.plan,subjects}:null,curatedCatalogRevision:entry.catalogRevision,revision:current.revision+1,updatedAt:now},current.revision);}else theme=await createRecord({schemaVersion:'graphic-illustration-theme.v1',id:entry.id,generationMode:'ai',themeKind:entry.themeKind,name:entry.name,category:entry.category,count:entry.count,style:'clean',brief:'대상의 특징이 또렷한 개별 달력용 일러스트',colorHint:'',tags:'직접 제작 01',plan:entry.plan,assets,curatedEdition:CURATED_EDITION,curatedCatalogRevision:entry.catalogRevision,status:'active',revision:1,createdAt:now,updatedAt:now});existing.set(theme.id,theme);added.push(theme);await removeRetired();
 }
 return added;
}
