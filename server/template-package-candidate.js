import { createHash } from 'node:crypto';

const PACKAGE_ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value}
function deterministicJson(value){return `${JSON.stringify(stable(value),null,2)}\n`}
function inputType(path){if(path==='calendar.events')return'schedule-import';if(/photo|logo|image/i.test(path))return'image';if(path==='calendar.year')return'year';return'text'}
function requirement(path,required){return {path,stage:required?'project-create-required':'optional',input:inputType(path),fallback:required?'empty':'template-sample'}}
function pageComposition(project){const pages=project?.book?.pageInstances||[];return {sheetCount:Math.ceil(pages.length/2),surfaceCount:pages.length,monthCount:pages.filter(page=>page.role==='monthly-front').length,defaultStartMonth:Number(project?.settings?.startMonth)||3}}

export function buildTemplatePackageCandidate({template,version,packageId,packageVersion}){
 if(!PACKAGE_ID.test(packageId||''))throw Object.assign(new Error('Invalid Package ID'),{statusCode:400,code:'INVALID_PACKAGE_ID'});
 if(!SEMVER.test(packageVersion||''))throw Object.assign(new Error('Invalid Package version'),{statusCode:400,code:'INVALID_PACKAGE_VERSION'});
 const project=version?.projectData,classification=project?.template?.classification,userInput=project?.template?.userInput;
 if(!template?.isStandard||template?.state!=='ready'||!project||classification?.schemaVersion!=='template-classification.v1'||userInput?.schemaVersion!=='template-user-input.v1')throw Object.assign(new Error('System base classification is incomplete'),{statusCode:409,code:'PACKAGE_CANDIDATE_NOT_READY'});
 const composition=pageComposition(project),trim=project.productType?.pageSize||{},production=project.productType?.productionSize||{width:Number(trim.width)+6,height:Number(trim.height)+6,unit:'mm'},required=userInput.requiredInputs||[],optional=userInput.optionalInputs||[],dataRequirements=[...required.map(path=>requirement(path,true)),...optional.map(path=>requirement(path,false))];
 const files={
  manifest:{schemaVersion:'template-package.v1-draft',templateId:packageId,version:packageVersion,name:classification.managementName,productType:classification.productType,status:'review',publishable:false,pageComposition:composition,classification:{sizeCode:classification.sizeCode,compositionType:classification.compositionType,designStyle:classification.designStyle},compatibility:{datasetSchema:'1.x',templateSchema:'2.x',runtime:'1.x'},files:{template:'template.json',bindings:'bindings.json',print:'print.json',parity:'parity.json',assets:'assets/',publishing:'publishing.json'},releaseContract:{schemaVersion:'template-publishing.v1',status:'review',immutableAfterPublish:true}},
  template:{schemaVersion:'template.v2-draft',templateId:packageId,version:packageVersion,kind:'designer-project-snapshot',source:{application:'calendar-template-designer',templateId:template.id,versionId:version.id,versionNumber:version.versionNumber},classification,projectData:project},
  bindings:{contractVersion:'1.1',templateId:packageId,templateVersion:packageVersion,bindings:[...required.map(path=>({path,required:true,status:'current',missing:'error'})),...optional.map(path=>({path,required:false,status:'current',missing:'template-sample'}))]},
  print:{schemaVersion:'print-profile.v1-draft',templateId:packageId,version:packageVersion,trimSize:{width:trim.width,height:trim.height,unit:trim.unit||'mm'},productionSize:{width:production.width,height:production.height,unit:production.unit||'mm'},bleed:{top:3,right:3,bottom:3,left:3,unit:'mm'},cropMarkWidth:{value:.54,unit:'pt'},pdfStandard:'PDF/X-4',colorProfile:'Japan Color 2011 Coated',blackRule:'K100',fontHandling:'outline',boxes:['TrimBox','BleedBox'],status:'contract-review'},
  parity:{schemaVersion:'template-parity-review.v1',templateId:packageId,version:packageVersion,visual:{status:'pending',scope:[...new Set((project.book?.pageInstances||[]).map(page=>page.role))]},print:{status:'pending',blockers:['RUNTIME_PDF_NOT_GENERATED','PDF_X4_PREFLIGHT_PENDING']}},
  publishing:{schemaVersion:'template-publishing.v1',templateId:packageId,version:packageVersion,contractStatus:'review',sourceOwner:'calendar-template-designer',consumerSnapshot:true,dataRequirements,userInput,editCompatibility:{policyOwner:'user-service',capabilities:userInput.userServiceCapabilities||[],note:'템플릿은 입력 흐름을 안내하며 실제 사용자 편집 기능은 사용자 서비스가 결정한다.'},lifecycle:{allowedStatuses:['review','published','deprecated','archived'],currentStatus:'review',immutableAfterPublish:true,visibleInUserServiceWhen:{status:'published',compatibilityPasses:true}},compatibility:{datasetSchema:'1.x',templateSchema:'2.x',runtime:'1.x'},releaseReadiness:{ready:false,completed:['classification-finalized','user-input-contract-defined','package-candidate-built'],blockers:['USER_SERVICE_IMPORT_PENDING','USER_SERVICE_SELECTION_E2E_PENDING','PDF_X4_PREFLIGHT_PENDING','PRODUCT_OWNER_PUBLISH_APPROVAL_PENDING']}}
 };
 const packageBundle={schemaVersion:'template-package-bundle.v1',...files},bytes=Buffer.from(deterministicJson(packageBundle),'utf8'),sha256=createHash('sha256').update(bytes).digest('hex');
 return {templateId:packageId,version:packageVersion,status:'review',publishable:false,sha256,byteLength:bytes.length,source:{templateId:template.id,versionId:version.id,versionNumber:version.versionNumber},classification,summary:composition,packageBundle};
}

export { deterministicJson };
