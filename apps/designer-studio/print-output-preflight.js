((root)=>{
 const num=value=>Number(value)||0;
 const text=value=>String(value??'').trim();
 const issue=(severity,code,message,path='')=>({severity,code,message,path});
 function profile(project){
  const size=project?.productType?.pageSize||{},settings=project?.template?.resources?.exportSettings||{},bleed=num(settings.bleed),trim={width:num(size.width),height:num(size.height),unit:text(size.unit)||'mm'};
  return {pdfStandard:'PDF/X-4',productionSize:{width:trim.width+bleed*2,height:trim.height+bleed*2,unit:trim.unit},trimSize:trim,bleed:{top:bleed,right:bleed,bottom:bleed,left:bleed,unit:'mm'},colorProfile:'Japan Color 2011 Coated',cropMarkWidth:{value:.540,unit:'pt'},blackRule:'K100',fontHandling:'outline',boxes:['TrimBox','BleedBox'],dpi:num(settings.dpi),format:text(settings.format).toLowerCase(),colorMode:text(settings.colorMode).toLowerCase(),cropMarks:settings.cropMarks===true};
 }
 function inspect(project,{artifact=null}={}){
  const value=profile(project),comparison=root.ACDLDeskAcademicPrintParity?.compare?.(value,{print:{status:'approved',blockers:[]}}),issues=[];
  (comparison?.issues||[]).forEach(item=>issues.push(issue('error',item.code,`인쇄 계약 값이 기준과 다릅니다: ${item.code}`,'print.profile')));
  if(value.format!=='pdf')issues.push(issue('error','PRINT_FORMAT_INVALID','출력 형식이 PDF가 아닙니다.','template.resources.exportSettings.format'));
  if(value.dpi<300)issues.push(issue('error','PRINT_DPI_TOO_LOW','인쇄 해상도는 300 DPI 이상이어야 합니다.','template.resources.exportSettings.dpi'));
  if(value.colorMode!=='cmyk')issues.push(issue('error','PRINT_COLOR_MODE_INVALID','최종 출력 색상 모드는 CMYK여야 합니다.','template.resources.exportSettings.colorMode'));
  if(!value.cropMarks)issues.push(issue('error','PRINT_CROP_MARKS_DISABLED','인쇄 출력에 재단선이 설정되지 않았습니다.','template.resources.exportSettings.cropMarks'));
  if(!artifact)issues.push(issue('warning','PRINT_ARTIFACT_REQUIRED','실제 CMYK PDF가 아직 생성되지 않아 PDF/X-4·ICC·K100·Box·폰트 구조 검증이 필요합니다.','print.artifact'));
  else if(['queued','processing'].includes(artifact.status))issues.push(issue('warning','PRINT_ARTIFACT_PENDING',artifact.status==='queued'?'운영 PDF 워커의 처리 대기 중입니다.':'운영 PDF 워커가 CMYK PDF를 생성하고 있습니다.','print.artifact.status'));
  else if(artifact.status==='error')issues.push(issue('error','PRINT_ARTIFACT_FAILED',artifact.error||'운영 PDF 워커 처리에 실패했습니다.','print.artifact.error'));
  else if(artifact.verified!==true)issues.push(issue('error','PRINT_ARTIFACT_NOT_VERIFIED','CMYK PDF 자동 Preflight 결과가 통과 상태가 아닙니다.','print.artifact.verified'));
  return Object.freeze({schemaVersion:'print-output-preflight.v1',contractReady:Boolean(comparison?.contractReady)&&!issues.some(item=>item.severity==='error'&&item.code!=='PRINT_ARTIFACT_NOT_VERIFIED'),artifactVerified:Boolean(artifact?.verified),artifact:artifact||null,worker:'user-service-pdf-worker',profile:value,issues});
 }
 root.ACDLPrintOutputPreflight=Object.freeze({profile,inspect});
})(typeof window!=='undefined'?window:globalThis);
