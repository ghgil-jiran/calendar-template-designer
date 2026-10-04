import {productionImagePlan,applyProductionImageLayouts} from './production-print-images.js';
export function validateJobInspection(revision,requestId,inspection){
 let plan=productionImagePlan(revision);
 if(inspection?.schemaVersion!=='production-image-inspection.v1'||inspection.requestId!==requestId||inspection.revisionId!==revision.id||inspection.documentHash!==revision.document_hash||inspection.plan?.contentHash!==plan.contentHash)throw Error('저장 버전과 같은 원본·배치 검사 기록이 필요합니다.');
 const layouts=(inspection.plan.uses||[]).filter(u=>u.layoutBasis==='common-editor-dom.v1').map(u=>({pageId:u.pageId,objectId:u.objectId,source:u.source,basis:u.layoutBasis,frameMm:u.frameMm,fit:u.fit,scale:u.scale}));
 if(layouts.length)plan=applyProductionImageLayouts(plan,layouts);
 if(plan.uses.some(u=>!u.measurable)||plan.sources.some(s=>!/^production-asset:\/\/[a-f0-9-]{36}$/i.test(s)))throw Error('이미지 배치를 확인할 수 없는 항목은 먼저 해결해 주세요.');
 const results=inspection.results;if(!Array.isArray(results)||results.length!==plan.sources.length)throw Error('모든 원본의 검사 기록이 필요합니다.');
 for(const source of plan.sources){const rows=results.filter(r=>r.source===source),r=rows[0];if(rows.length!==1||r.message||r.revisionId!==revision.id||r.documentHash!==revision.document_hash||r.contentHash!==plan.contentHash||!/^[a-f0-9]{64}$/.test(r.sourceHash||'')||!Number.isInteger(r.byteSize)||r.byteSize<=0)throw Error('미검사 원본이나 다른 버전의 기록은 사용할 수 없습니다.');}
 return {...inspection,plan,finalApproved:false};
}
export function publicImageJob(row){return {id:row.id,requestId:row.request_id,revisionId:row.revision_id,documentHash:row.document_hash,contentHash:row.content_hash,status:row.status,progress:row.progress,result:row.result,error:row.error,createdAt:row.created_at,updatedAt:row.updated_at,finalApproved:false};}
