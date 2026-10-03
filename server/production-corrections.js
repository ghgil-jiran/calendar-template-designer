import { createHash } from 'node:crypto';
export const uuid = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function applyCorrections(document,patches,assets){
 if(!Array.isArray(patches)||patches.length>1000)throw new Error('교정 항목을 확인해 주세요.');
 const copy=JSON.parse(JSON.stringify(document)),allowed=new Set(assets.map(a=>a.id));
 for(const patch of patches){
  const page=copy.template?.pages?.find(p=>p.id===patch.pageId),object=page?.objects?.find(o=>o.id===patch.objectId);
  if(!object)throw new Error('교정할 개체를 찾지 못했습니다.');
  if(patch.frame){const f=patch.frame;if(!['x','y','width','height'].every(k=>typeof f[k]==='number'&&Number.isFinite(f[k])&&Math.abs(f[k])<=2000)||f.width<=0||f.height<=0)throw new Error('개체 위치와 크기를 확인해 주세요.');object.frame={...object.frame,x:f.x,y:f.y,width:f.width,height:f.height};}
  if(patch.text!==undefined){if(object.type==='image'||typeof object.payload!=='string'||typeof patch.text!=='string'||patch.text.length>10000)throw new Error('이 개체는 단순 텍스트 교정을 지원하지 않습니다.');object.payload=patch.text;}
  if(patch.assetId!==undefined){if(object.type!=='image'||!allowed.has(patch.assetId))throw new Error('접수된 원본 이미지를 선택해 주세요.');let replaced=0;function replace(v){if(typeof v==='string'&&v.startsWith('production-asset://')){replaced++;return `production-asset://${patch.assetId}`;}if(Array.isArray(v))return v.map(replace);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,c])=>[k,replace(c)]));return v;}object.payload=replace(object.payload);if(!replaced)throw new Error('이 이미지의 원본 연결을 확인하지 못했습니다.');}
 }
 return copy;
}
export const documentHash = document => createHash('sha256').update(JSON.stringify(document)).digest('hex');
