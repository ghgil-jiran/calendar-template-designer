((root)=>{
 const num=value=>Number(value)||0;
 const text=value=>String(value??'').trim();
 const issue=(severity,code,message,path='')=>({severity,code,message,path});
 const checkState=value=>{
  if(value&&typeof value==='object')return text(value.status)||(value.passed===true||value.valid===true?'passed':value.passed===false||value.valid===false?'failed':'not_run');
  if(value===true)return 'passed';if(value===false)return 'failed';return 'not_run';
 };
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
  const followUpChecks={trimContentParity:checks.trimContentParity,templateImageApproval:checks.templateImageApproval};
  const runtimeChecks={imageDpi:checks.imageDpi,finalPrintImageApproval:checks.finalPrintImageApproval};
  const coreStates=Object.fromEntries(Object.entries(coreChecks).map(([key,value])=>[key,checkState(value)]));
  const followUpStates=Object.fromEntries(Object.entries(followUpChecks).map(([key,value])=>[key,checkState(value)]));
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
  return Object.freeze({schemaVersion:'print-output-preflight.v2',approval,contractReady:Boolean(comparison?.contractReady)&&!issues.some(item=>item.severity==='error'),artifactVerified,artifactChecksComplete:failedChecks.length===0&&missingChecks.length===0,failedArtifactChecks:failedChecks,missingArtifactChecks:missingChecks,followUpArtifactChecks,runtimeArtifactChecks,geometryMappingVerified:geometryValid,contentParity:{status:followUpStates.trimContentParity==='not_run'?'same-dataset-required':followUpStates.trimContentParity,comparisonBox:'TrimBox',message:'동일한 Runtime Dataset으로 생성한 Review PDF와 CMYK PDF의 TrimBox 영역을 비교해야 합니다.'},artifact:artifact||null,worker:'user-service-pdf-worker',profile:value,issues});
 }
 root.ACDLPrintOutputPreflight=Object.freeze({profile,inspect});
})(typeof window!=='undefined'?window:globalThis);
