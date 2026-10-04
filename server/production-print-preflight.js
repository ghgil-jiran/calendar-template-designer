import {productionImagePlan} from './production-print-images.js';
import {inspectProductionPrintReadiness} from './production-print-readiness.js';

// This boundary is shared by the existing editor inspection flow. It never
// publishes a template package or queues a legacy DOM conversion for a receipt.
export function prepareProductionPrintPreflight(requestId,revision,expectedDocumentHash){
 if(revision.document_hash!==expectedDocumentHash)throw Object.assign(Error('선택한 교정 버전의 문서 해시가 다릅니다. 다시 열어 주세요.'),{statusCode:409,code:'PRINT_REVISION_IDENTITY_MISMATCH'});
 const plan=productionImagePlan(revision),readiness=inspectProductionPrintReadiness(revision);
 return {
  schemaVersion:'production-print-preflight.v1',status:'blocked',jobCreated:false,finalApproved:false,
  identity:{requestId,revisionId:revision.id,revisionNumber:revision.revision_number,documentHash:revision.document_hash,contentHash:plan.contentHash,integrity:plan.integrity},
  rendererId:'production-runtime-native.v1',readiness,
  inventory:{pages:revision.document.template.pages.length,sources:plan.sources.length,imageUses:plan.uses.length},
  requiredProfile:{pdfStandard:'PDF/X-4',outputConditionIdentifier:'Japan Color 2011 Coated',cropMarkWidthPt:0.540},
  message:'교정 버전의 출력 준비를 확인했습니다. 네이티브 출력 구성요소와 Worker 연결이 완료되기 전에는 PDF 작업을 만들지 않습니다.'
 };
}
