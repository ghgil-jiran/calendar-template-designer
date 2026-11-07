import '../apps/designer-studio/shared-screen-composition.js';
import '../apps/designer-studio/production-editor-adapter.js';
import {randomUUID} from 'node:crypto';
import {supabaseRequest} from './template-persistence.js';
import {productionImagePlan,applyProductionImageLayouts} from './production-print-images.js';
import {freezeProductionPackage,productionIdentity} from './production-print-package.js';
import {correctionAssets} from './production-correction-assets.js';
import {sealProductionDocument} from './production-corrections.js';
export const UPSCALE_KIND='production-image-upscale';
export function upscaleCandidates(reports,policy){return reports.filter(item=>!item.vector&&item.placements?.length&&item.placements.every(p=>p.measurable&&Number.isFinite(p.effectiveDpi)&&p.effectiveDpi>0)&&item.placements.some(p=>p.effectiveDpi<policy.upscaleTargetDpi));}
export async function upscaleJobs(requestId,revisionId){const rows=await supabaseRequest(`template_print_preflight_jobs?payload->>kind=eq.${UPSCALE_KIND}&payload->production->>requestId=eq.${requestId}&payload->production->>revisionId=eq.${revisionId}&select=*&order=created_at.desc&limit=20`);return rows;}
export async function requestUpscale(receipt,revision,adminId,origin,layouts){
 const plan=applyProductionImageLayouts(productionImagePlan(revision),layouts||[]);
 const jobs=await upscaleJobs(receipt.id,revision.id),active=jobs.find(job=>['queued','processing'].includes(job.status));if(active)return active;
 const pkg=await freezeProductionPackage(receipt,revision,{purpose:'upscale'});
 const job={id:randomUUID(),template_id:pkg.template_id,template_version:pkg.version,package_sha256:pkg.package_sha256,package_storage_path:pkg.package_storage_path,requested_by:adminId,payload:{kind:UPSCALE_KIND,production:{...productionIdentity(receipt.id,revision),pipelineVersion:'2026-10-06-image-upscale-v1'},editorPrintOrigin:origin,plan,allowBelowMinimum:true}};
 const rows=await supabaseRequest('template_print_preflight_jobs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(job)});return rows[0];
}
export function replaceImageReferences(document,replacements){
 function map(value){if(typeof value==='string')return replacements.get(value)||value;if(Array.isArray(value))return value.map(map);if(value&&typeof value==='object'){if(value.ref==='package'&&replacements.has(`package-asset://${value.id}`))return {ref:'url',src:replacements.get(`package-asset://${value.id}`)};return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,map(v)]));}return value;}
 const doc=globalThis.ACDLProductionEditorAdapter.withoutEditor(document);doc.template.pages=map(doc.template.pages);return doc;
}
export async function applyUpscale(receipt,revision,job,selected,adminId,id){
 if(job.status!=='done'||job.payload?.production?.documentHash!==revision.document_hash||!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length)throw Error('완료된 결과와 선택한 교정 버전을 확인하세요.');
 const replacements=new Map(),assets=await correctionAssets(receipt.id);
 for(const source of selected){const result=job.report?.results?.find(item=>item.source===source&&item.status==='completed'),asset=assets.find(a=>a.id===result?.assetId);if(!asset||asset.content_hash!==result.resultHash)throw Error('보정 결과의 보관 기록이 일치하지 않습니다.');replacements.set(source,`production-asset://${asset.id}`);}
 const updated=replaceImageReferences(revision.document,replacements),project=globalThis.ACDLProductionEditorAdapter.createProject(revision.document.editorProject,updated,receipt.id);
 // Replacements are server-selected immutable assets, not a client editing draft.
 const document=globalThis.ACDLProductionEditorAdapter.toDocument(project);document.editorProject=project;document.productionUpscale={jobId:job.id,baseRevisionId:revision.id,selectedSources:selected,results:job.report.results.filter(r=>selected.includes(r.source)),confirmedBy:adminId,confirmedAt:new Date().toISOString(),finalApproved:false};
 document.editorProject.productionCorrection.baseDocument=globalThis.ACDLProductionEditorAdapter.withoutEditor(document);const hash=sealProductionDocument(document);const rows=await supabaseRequest('rpc/save_calendar_production_revision',{method:'POST',body:JSON.stringify({p_id:id,p_request_id:receipt.id,p_base_revision_id:revision.id,p_document:document,p_document_hash:hash,p_note:`업스케일 결과 검토·적용 · ${selected.length}개 원본`,p_created_by:adminId})});return Array.isArray(rows)?rows[0]:rows;
}
