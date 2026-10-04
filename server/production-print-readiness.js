import '../apps/designer-studio/native-print-authoring.js';
import '../apps/designer-studio/native-print-package-compiler.js';

const labels={PRINT_INTENT_MISSING:'인쇄 정의 필요',RUNTIME_EXPANSION_REQUIRED:'복합 개체의 인쇄 구성요소 연결 필요',OBJECT_TYPE_UNSUPPORTED:'네이티브 출력 지원 필요',PRINT_STRUCTURE_UNSUPPORTED:'인쇄 구조 지원 필요',PRINT_CMYK_COLOR_UNRESOLVED:'인쇄 CMYK 색상 지정 필요',PRINT_FONT_ASSET_MISSING:'정확한 인쇄 폰트 연결 필요',PRINT_FONT_PACKAGE_PENDING:'인쇄 폰트 패키지 보관 필요',PRINT_IMAGE_ORIGINAL_MISSING:'CMYK 인쇄 이미지 원본 연결 필요',PRINT_IMAGE_NOT_CMYK_JPEG:'CMYK JPEG 인쇄 원본 필요',PRINT_IMAGE_DPI_BELOW_MINIMUM:'실제 배치 기준 이미지 해상도 부족',PRINT_IMAGE_OUTPUT_CONDITION_UNAPPROVED:'이미지 출력조건 확인 필요',PRINT_IMAGE_PACKAGE_PENDING:'승인한 인쇄 원본의 패키지 보관 필요',PRINT_IMAGE_ASSET_UNAPPROVED:'인쇄 이미지 원본 승인 필요'};
export function inspectProductionPrintReadiness(revision){
 const project=revision?.document?.editorProject;if(!project)throw Error('에디터에서 교정 버전을 저장한 뒤 검사해 주세요.');
 const candidate=structuredClone(project),authoring=globalThis.ACDLNativePrintAuthoring,compiler=globalThis.ACDLNativePrintPackageCompiler;
 // Probe existing definitions only. Do not invent CMYK colors, fonts, originals, or approvals.
 const authoringConnected=candidate.template.nativePrintAuthoring?.enabled===true;
 candidate.template.nativePrintAuthoring={...candidate.template.nativePrintAuthoring,enabled:true,contract:authoring.documentContract(candidate)};
 for(const elements of Object.values(candidate.book.elementsByPage||{}))for(const element of elements)authoring.decorateElement(element);
 const report=compiler.inspectProjectReadiness(candidate),pages=new Map(candidate.book.pageInstances.map(p=>[p.id,p]));
 const items=report.items.filter(item=>item.status!=='ready').map(item=>({pageId:item.containerId,pageNumber:pages.get(item.containerId)?.number,objectId:item.objectId,role:item.role,type:item.objectType,status:item.status,code:item.code,message:labels[item.code]||item.code,...(item.effectiveDpi!=null?{effectiveDpi:item.effectiveDpi,minimumDpi:item.minimumDpi}:{})}));
 const blockers=[...(!authoringConnected?[{code:'NATIVE_DEFINITIONS_REQUIRED',message:'접수 당시 프로젝트의 네이티브 인쇄 정의가 없습니다.'}]:[]),{code:'NATIVE_WORKER_NOT_CONNECTED',message:'이 교정본의 네이티브 PDF 작성기를 최종 검사 Worker에 연결해야 합니다.'}];
 return {schemaVersion:'production-print-readiness.v1',revisionId:revision.id,revisionNumber:revision.revision_number,documentHash:revision.document_hash,status:'blocked',authoringConnected,contract:candidate.template.nativePrintAuthoring.contract,counts:report.counts,blockers,items};
}
