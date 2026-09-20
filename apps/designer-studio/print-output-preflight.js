((root)=>{
 const num=value=>Number(value)||0;
 const text=value=>String(value??'').trim();
 const issue=(severity,code,message,path='')=>({severity,code,message,path});
 const checkState=value=>{
  if(value&&typeof value==='object')return text(value.status)||(value.passed===true||value.valid===true?'passed':value.passed===false||value.valid===false?'failed':'not_run');
  if(value===true)return 'passed';if(value===false)return 'failed';return 'not_run';
 };
 const list=value=>Array.isArray(value)?value:[];
 function aiImageInventory(project){
  const resources=project?.template?.resources||{},assets=[...list(resources.aiDesignAssets),...list(resources.assets)],aiAssetIds=new Set(assets.filter(asset=>asset?.origin==='ai-generated'||asset?.source?.type==='live-ai-generation'||text(asset?.id).startsWith('ai-design.')).map(asset=>text(asset.id)).filter(Boolean)),items=[];
  const pages=list(project?.book?.pageInstances||project?.pages),elementsByPage=project?.book?.elementsByPage||{},masters=project?.template?.masterElements||{};
  pages.forEach(page=>[...list(masters[page?.masterId]),...list(elementsByPage[page?.id]),...list(page?.elements),...list(page?.objects)].forEach(element=>{
   const role=text(element?.role||element?.semanticRole).toLowerCase(),assetId=text(element?.assetId||element?.image?.assetId),isAi=Boolean(element?.aiDesign)||role==='ai-design-background'||role==='ai-background'||aiAssetIds.has(assetId);
   if(isAi)items.push({pageId:text(page?.id)||null,objectId:text(element?.id)||null,assetId:assetId||text(element?.aiDesign?.resourceId)||null,role:role||null});
  }));
  return Object.freeze({required:items.length>0||list(resources.aiDesignAssets).length>0,count:items.length,items:Object.freeze(items)});
 }
 const AI_IMAGE_CRITERIA=Object.freeze([
  ['identity','용도·대상 페이지·프레임 식별'],
  ['generationStandard','생성 기준 버전과 최대 품질 적용'],
  ['frameSuitability','대상 프레임 화면비·크롭 안전성'],
  ['placementIntegrity','누락·깨짐·프레임 이탈·과도한 확대'],
  ['visualArtifacts','흐림·노이즈·반복 패턴·비정상 형상'],
  ['contentLegibility','달력 개체와 배경·일러스트 가독성 충돌']
 ]);
 function criterionValue(source,key){
  const values=source?.criteria||source?.checks||source?.results;if(Array.isArray(values))return values.find(item=>text(item?.key||item?.id)===key);return values?.[key];
 }
 function legacyCriterion(key,quality,inventory){
  const pages=list(quality?.pages),issues=pages.flatMap(page=>list(page?.issues).map(item=>({...item,pageId:page.pageId}))),hasReport=Boolean(quality?.schemaVersion&&pages.length),failed=codes=>issues.filter(item=>codes.includes(text(item.code))&&item.severity==='fail'),review=codes=>issues.filter(item=>codes.includes(text(item.code))&&item.severity==='review');
  if(key==='identity'){const incomplete=inventory.items.filter(item=>!item.pageId||!item.objectId||!item.assetId);return {status:incomplete.length?'failed':inventory.count?'passed':'not_run',message:incomplete.length?`${incomplete.length}개 이미지의 페이지·개체·자산 식별 정보가 부족합니다.`:inventory.count?`${inventory.count}개 AI 이미지의 적용 위치를 식별했습니다.`:'식별할 AI 이미지가 없습니다.'}}
  if(!hasReport)return {status:'not_run',message:'저장된 AI 품질 보고서가 없습니다.'};
  const mappings={generationStandard:[[],[]],frameSuitability:[['effective-resolution'],['print-resolution-review']],placementIntegrity:[['missing-asset','safe-area','collision','effective-resolution'],['print-resolution-review']],visualArtifacts:[['duplicate-asset','visual-inconsistency'],[]],contentLegibility:[['readability','collision','safe-area','forbidden-text'],['forbidden-text-review']]},entry=mappings[key]||[[],[]],failures=failed(entry[0]),reviews=review(entry[1]);
  if(failures.length)return {status:'failed',message:`기존 AI 품질 보고서에서 ${failures.length}건의 실패 근거가 있습니다.`,evidence:{pageIds:[...new Set(failures.map(item=>item.pageId))],issueCodes:[...new Set(failures.map(item=>item.code))]}};
  if(reviews.length)return {status:'review',message:`기존 AI 품질 보고서에서 ${reviews.length}건의 수동 확인이 필요합니다.`,evidence:{pageIds:[...new Set(reviews.map(item=>item.pageId))],issueCodes:[...new Set(reviews.map(item=>item.code))]}};
  if(key==='generationStandard')return {status:'review',message:`기존 생성 보고서 ${quality.schemaVersion}는 참고할 수 있지만 최대 품질 적용을 증명하지 않습니다.`};
  if(key==='frameSuitability')return {status:'review',message:'기존 보고서는 화면비와 크롭 안전성을 독립 검사하지 않았습니다.'};
  if(key==='visualArtifacts')return {status:'review',message:'중복·스타일 일관성 외 흐림·노이즈·비정상 형상 검사가 필요합니다.'};
  return {status:'passed',message:`기존 AI 품질 보고서 ${quality.schemaVersion}에서 관련 실패가 없습니다.`};
 }
 function aiImageCriteria(project,source,inventory){
  const quality=project?.template?.aiDesignDraft?.quality||null;
  return AI_IMAGE_CRITERIA.map(([key,label])=>{const explicit=criterionValue(source,key),state=checkState(explicit);if(state!=='not_run')return Object.freeze({key,label,status:state,message:text(explicit?.message||explicit?.reason)||null,evidence:explicit?.evidence||null,source:'ai-image-print-quality'});const legacy=legacyCriterion(key,quality,inventory);return Object.freeze({key,label,...legacy,source:'legacy-ai-quality'});});
 }
 function profile(project){
  const size=project?.productType?.pageSize||{},settings=project?.template?.resources?.exportSettings||{},bleed=num(settings.bleed),trim={width:num(size.width),height:num(size.height),unit:text(size.unit)||'mm'};
  return {pdfStandard:'PDF/X-4',productionSize:{width:trim.width+bleed*2,height:trim.height+bleed*2,unit:trim.unit},trimSize:trim,bleed:{top:bleed,right:bleed,bottom:bleed,left:bleed,unit:'mm'},coordinateMapping:{source:'trim',target:'production',mode:'translate-no-scale',scale:1,offsetX:bleed,offsetY:bleed,comparisonBox:'TrimBox'},colorProfile:'Japan Color 2011 Coated',cropMarkWidth:{value:.540,unit:'pt'},blackRule:'K100',fontHandling:'outline',boxes:['TrimBox','BleedBox'],dpi:num(settings.dpi),format:text(settings.format).toLowerCase(),colorMode:text(settings.colorMode).toLowerCase(),cropMarks:settings.cropMarks===true};
 }
 function inspect(project,{artifact=null}={}){
  const value=profile(project),comparison=root.ACDLDeskAcademicPrintParity?.compare?.(value,{print:{status:'approved',blockers:[]}}),issues=[];
  (comparison?.issues||[]).forEach(item=>issues.push(issue('error',item.code,`인쇄 계약 값이 기준과 다릅니다: ${item.code}`,'print.profile')));
  if(value.format!=='pdf')issues.push(issue('error','PRINT_FORMAT_INVALID','출력 형식이 PDF가 아닙니다.','template.resources.exportSettings.format'));
  if(value.dpi<300)issues.push(issue('error','PRINT_DPI_TOO_LOW','인쇄 해상도는 300 DPI 이상이어야 합니다.','template.resources.exportSettings.dpi'));
  if(value.colorMode!=='cmyk')issues.push(issue('error','PRINT_COLOR_MODE_INVALID','최종 출력 색상 모드는 CMYK여야 합니다.','template.resources.exportSettings.colorMode'));
  if(!value.cropMarks)issues.push(issue('error','PRINT_CROP_MARKS_DISABLED','인쇄 출력에 재단선이 설정되지 않았습니다.','template.resources.exportSettings.cropMarks'));
  const geometryValid=value.trimSize.width>0&&value.trimSize.height>0&&value.bleed.top>0&&Math.abs(value.productionSize.width-(value.trimSize.width+value.bleed.left+value.bleed.right))<.02&&Math.abs(value.productionSize.height-(value.trimSize.height+value.bleed.top+value.bleed.bottom))<.02&&value.coordinateMapping.scale===1;
  if(!geometryValid)issues.push(issue('error','PRINT_TRIM_BLEED_MAPPING_INVALID','완성 크기에서 도련 포함 제작 크기로 이동하는 좌표 매핑이 올바르지 않습니다.','print.profile.coordinateMapping'));
  if(!artifact)issues.push(issue('warning','PRINT_ARTIFACT_REQUIRED','실제 CMYK PDF가 아직 생성되지 않아 PDF/X-4·ICC·K100·Box·폰트 구조 검증이 필요합니다.','print.artifact'));
  else if(['queued','processing'].includes(artifact.status))issues.push(issue('warning','PRINT_ARTIFACT_PENDING',artifact.status==='queued'?'운영 PDF 워커의 처리 대기 중입니다.':'운영 PDF 워커가 CMYK PDF를 생성하고 있습니다.','print.artifact.status'));
  else if(artifact.status==='error'){
   const details=Array.isArray(artifact.issues)?artifact.issues:[];
   if(details.length)details.forEach((item,index)=>issues.push(issue(item?.severity==='warning'?'warning':'error',text(item?.code)||'PRINT_ARTIFACT_FAILED',text(item?.message)||'PDF 자동 Preflight 검사에 실패했습니다.',text(item?.path)||`print.artifact.issues[${index}]`)));
   else issues.push(issue('error','PRINT_ARTIFACT_FAILED',artifact.error||'운영 PDF 워커 처리에 실패했습니다.','print.artifact.error'));
  }
  const checks=artifact?.checks||artifact?.preflight?.checks||{};
  const coreChecks={pdfx4:checks.pdfx4,outputIntent:checks.outputIntent,cmyk:checks.cmyk,k100:checks.k100,trimBox:checks.trimBox,bleedBox:checks.bleedBox,fontOutlined:checks.fontOutlined??checks.fontOutline,vectorContentPreserved:checks.vectorContentPreserved};
  const followUpChecks={trimContentParity:checks.trimContentParity};
  const aiImageCheck=checks.aiImagePrintQuality||project?.template?.aiDesignDraft?.quality?.printInspection;
  const legacyImageReview=checks.templateImageApproval;
  const runtimeChecks={imageDpi:checks.imageDpi,finalPrintImageApproval:checks.finalPrintImageApproval};
  const coreStates=Object.fromEntries(Object.entries(coreChecks).map(([key,value])=>[key,checkState(value)]));
  const followUpStates=Object.fromEntries(Object.entries(followUpChecks).map(([key,value])=>[key,checkState(value)]));
  const aiImages=aiImageInventory(project),aiImageState=checkState(aiImageCheck),aiCriteria=aiImageCriteria(project,aiImageCheck,aiImages),explicitCriteria=aiCriteria.filter(item=>item.source==='ai-image-print-quality'),legacyCriteria=aiCriteria.filter(item=>item.source==='legacy-ai-quality'),aiCriteriaFailed=explicitCriteria.some(item=>item.status==='failed'),aiCriteriaComplete=explicitCriteria.length===AI_IMAGE_CRITERIA.length&&explicitCriteria.every(item=>item.status==='passed');
  const runtimeStates=Object.fromEntries(Object.entries(runtimeChecks).map(([key,value])=>[key,checkState(value)]));
  const failedChecks=artifact?.status==='done'?Object.entries(coreStates).filter(([,state])=>state==='failed').map(([key])=>key):[];
  const missingChecks=artifact?.status==='done'?Object.entries(coreStates).filter(([,state])=>state!=='passed'&&state!=='failed').map(([key])=>key):[];
  const followUpArtifactChecks=artifact?.status==='done'?Object.entries(followUpStates).filter(([,state])=>state!=='passed').map(([key])=>key):[];
  const runtimeArtifactChecks=artifact?.status==='done'?Object.entries(runtimeStates).filter(([,state])=>state!=='passed').map(([key])=>key):[];
  const artifactVerified=artifact?.status==='done'&&failedChecks.length===0&&missingChecks.length===0;
  if(artifact?.status==='done'&&failedChecks.length)issues.push(issue('error','PRINT_ARTIFACT_CHECKS_FAILED',`최종 PDF의 핵심 자동검사에 실패했습니다: ${failedChecks.join(', ')}`,'print.artifact.checks'));
  if(artifact?.status==='done'&&missingChecks.length)issues.push(issue('warning','PRINT_ARTIFACT_CHECKS_INCOMPLETE',`완료 PDF의 핵심 자동검사가 남아 있습니다: ${missingChecks.join(', ')}`,'print.artifact.checks'));
  if(artifact?.status==='done'&&followUpArtifactChecks.length)issues.push(issue('warning','PRINT_ARTIFACT_FOLLOW_UP',`1차 자동검사는 완료되었고 후속 품질검토가 남아 있습니다: ${followUpArtifactChecks.join(', ')}`,'print.artifact.checks'));
  const automatedStatus=artifactVerified?'passed':issues.some(item=>item.severity==='error')?'failed':'pending',generationMode=text(artifact?.generationMode||artifact?.renderer||'');
  const approval=Object.freeze({automated:{status:automatedStatus,label:'핵심 자동 인쇄 Preflight'},external:{status:'not_run',label:'Acrobat 외부 Preflight',required:true},physical:{status:'not_run',label:'실물 인쇄 승인',required:true},finalApproved:false,artifactClass:generationMode.includes('native')?'native-print-model':artifact?'legacy-converted':'not-generated'});
  const summarize=items=>({passed:items.filter(item=>item.status==='passed').length,review:items.filter(item=>item.status==='review').length,failed:items.filter(item=>item.status==='failed').length,notRun:items.filter(item=>item.status==='not_run').length});
  const explicitSummary=summarize(explicitCriteria),referenceSummary=summarize(legacyCriteria);explicitSummary.notRun+=AI_IMAGE_CRITERIA.length-explicitCriteria.length;
  const aiImageInspection=Object.freeze({status:!aiImages.required?'passed':aiImageState==='failed'||aiCriteriaFailed?'blocked':aiImageState==='passed'&&aiCriteriaComplete?'passed':'pending',disposition:aiImages.required?'required':'not_applicable',evidenceMode:explicitCriteria.length?'dedicated':'legacy-reference',required:aiImages.required,imageCount:aiImages.count,images:aiImages.items,checkKey:'aiImagePrintQuality',criteriaVersion:text(aiImageCheck?.criteriaVersion||aiImageCheck?.evidence?.criteriaVersion)||null,criteriaComplete:aiCriteriaComplete,criteriaSummary:explicitSummary,referenceSummary,legacyReview:legacyImageReview||null,legacyQualityReport:project?.template?.aiDesignDraft?.quality?{schemaVersion:text(project.template.aiDesignDraft.quality.schemaVersion)||null,status:text(project.template.aiDesignDraft.quality.status)||null,checkedAt:text(project.template.aiDesignDraft.quality.checkedAt)||null,pageCount:Number(project.template.aiDesignDraft.quality.pageCount)||0}:null,criteria:aiCriteria,result:aiImageCheck||null});
  return Object.freeze({schemaVersion:'print-output-preflight.v3',approval,contractReady:Boolean(comparison?.contractReady)&&!issues.some(item=>item.severity==='error'),artifactVerified,artifactChecksComplete:failedChecks.length===0&&missingChecks.length===0,failedArtifactChecks:failedChecks,missingArtifactChecks:missingChecks,followUpArtifactChecks,aiImageInspection,runtimeArtifactChecks,geometryMappingVerified:geometryValid,contentParity:{status:followUpStates.trimContentParity==='not_run'?'same-dataset-required':followUpStates.trimContentParity,comparisonBox:'TrimBox',message:'동일한 Runtime Dataset으로 생성한 Review PDF와 CMYK PDF의 TrimBox 영역을 비교해야 합니다.'},artifact:artifact||null,worker:'user-service-pdf-worker',profile:value,issues});
 }
 root.ACDLPrintOutputPreflight=Object.freeze({profile,inspect});
})(typeof window!=='undefined'?window:globalThis);
