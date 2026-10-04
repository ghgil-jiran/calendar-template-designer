import {productionImagePlan} from './production-print-images.js';

// This boundary is shared by the existing editor inspection flow. It never
// publishes a template package or queues work without a revision-bound input.
export function prepareProductionPrintPreflight(requestId,revision,expectedDocumentHash){
 if(revision.document_hash!==expectedDocumentHash)throw Object.assign(Error('선택한 교정 버전의 문서 해시가 다릅니다. 다시 열어 주세요.'),{statusCode:409,code:'PRINT_REVISION_IDENTITY_MISMATCH'});
 const plan=productionImagePlan(revision);
 return {
  schemaVersion:'production-print-preflight.v1',status:'ready',jobCreated:false,finalApproved:false,
  identity:{requestId,revisionId:revision.id,revisionNumber:revision.revision_number,documentHash:revision.document_hash,contentHash:plan.contentHash,integrity:plan.integrity},
  rendererId:'template-editor-review-dom.v1',
  inventory:{pages:revision.document.template.pages.length,sources:plan.sources.length,imageUses:plan.uses.length},
  requiredProfile:{pdfStandard:'PDF/X-4',outputConditionIdentifier:'Japan Color 2011 Coated',cropMarkWidthPt:0.540},
  message:'저장 교정 버전을 확인했습니다. 최종 생성 요청 시 보관 원본과 함께 입력을 고정하고 기존 PDF Worker를 사용합니다. 과거 템플릿의 통과 이력은 이 버전의 검사나 승인을 대신하지 않습니다.'
 };
}
