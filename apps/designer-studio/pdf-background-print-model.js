/* Original PDF background placement contract, shared by authoring and PDF worker. */
(function(root){
 'use strict';
 const version='pdf-background-embedding.v1',uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
 const fail=message=>{throw new Error('PDF_BACKGROUND: '+message)};
 const number=(value,name)=>{const n=Number(value);if(!Number.isFinite(n))fail(name+' 값이 올바르지 않습니다.');return n};
 function source(value,packageId){
  if(value?.schemaVersion!=='graphic-pdf-source.v1'||!uuid.test(value.documentId)||!uuid.test(packageId)||!/^[a-f0-9]{64}$/i.test(value.sha256)||!Number.isSafeInteger(value.byteSize)||value.byteSize<8||value.byteSize>250*1024*1024||!Number.isInteger(value.pageNumber)||value.pageNumber<1||!(value.widthPt>0&&value.heightPt>0))fail('등록 원본 식별 정보가 올바르지 않습니다.');
  return {...value,packageId};
 }
 function pagePlan(project,page){
  const size=project?.productType?.pageSize||{},definition=project?.template?.calendarTypeSnapshot?.definition||{},bleed=Number(project?.template?.resources?.exportSettings?.bleed??3),production=project?.productType?.productionSize||{};
  const width=number(size.width,'재단 폭'),height=number(size.height,'재단 높이'),sheetWidth=number(production.width??width+2*bleed,'제작 폭'),sheetHeight=number(production.height??height+2*bleed,'제작 높이');
  if(size.unit&&size.unit!=='mm'||width<=0||height<=0||sheetWidth<width||sheetHeight<height)fail('mm 단위 제작 규격을 확인하세요.');
  if(definition.productionSize&&(Math.abs(sheetWidth-definition.productionSize.width)>.02||Math.abs(sheetHeight-definition.productionSize.height)>.02))fail('달력 유형과 제작 규격이 다릅니다.');
  const masters=project?.template?.masterElements?.[page.masterId]||[],local=project?.book?.elementsByPage?.[page.id]||[];
  const elements=root.ACDLSharedScreenComposition.visibleElements(page,masters,local).filter(e=>e.visible!==false);
  const layers=[];let foregroundSeen=false;
  for(const e of elements){
   if(!e.graphicSource?.pdfSource){const nested=value=>value&&typeof value==='object'&&(value!==e&&value.graphicSource?.pdfSource||Object.values(value).some(nested));if(nested(e))fail('그룹 내부 PDF 배경은 먼저 독립 배경 개체로 배치하세요: '+e.id);foregroundSeen=true;continue;}
   if(foregroundSeen)fail('PDF 배경은 편집 개체보다 아래에 배치해야 합니다: '+e.id);
   if(e.type!=='image'||!e.id||Number(e.rotation||0)!==0||Number(e.opacity??1)!==1||Number(e.style?.opacity??1)!==1||e.style?.transform||e.style?.clipPath||e.style?.mask)fail('현재 PDF 배경은 회전·마스크·불투명도 보정 없는 이미지 개체만 지원합니다: '+e.id);
   const fit=e.fit||'cover';if(!['cover','contain','fill'].includes(fit))fail('지원하지 않는 PDF 맞춤 방식입니다.');
   const x=number(e.x,'x')*width/100+(sheetWidth-width)/2,y=number(e.y,'y')*height/100+(sheetHeight-height)/2,w=number(e.width,'폭')*width/100,h=number(e.height,'높이')*height/100;
   if(w<=0||h<=0)fail('PDF 배경의 크기가 0입니다.');
   layers.push({elementId:e.id,fit,frameMm:{x,y,width:w,height:h},source:source(e.graphicSource.pdfSource,e.graphicSource.packageId)});
  }
  return {schemaVersion:version,pageId:page.id,sheetWidth,sheetHeight,layers};
 }
 function projectPlans(project){return (project?.book?.pageInstances||[]).map(page=>pagePlan(project,page))}
 function verifyEvidence(project,check){
  if(check?.status!=='passed'||check.evidence?.schemaVersion!==version)return false;
  try{
   const plans=projectPlans(project),required=plans.reduce((n,p)=>n+p.layers.length,0),proof=check.evidence;
   if(proof.required!==required||proof.embedded!==required||proof.pages?.length!==plans.length)return false;
   return plans.every(plan=>{const page=proof.pages.find(p=>p.pageId===plan.pageId);return page&&page.required===plan.layers.length&&page.embedded===plan.layers.length&&page.layers.length===plan.layers.length&&plan.layers.every((layer,i)=>{const actual=page.layers[i];return actual.elementId===layer.elementId&&actual.documentId===layer.source.documentId&&actual.sha256===layer.source.sha256&&actual.pageNumber===layer.source.pageNumber&&actual.fit===layer.fit&&actual.vectorEmbedding===true&&['x','y','width','height'].every(k=>Math.abs(actual.frameMm[k]-layer.frameMm[k])<.01)});});
  }catch{return false;}
 }
 root.ACDLPdfBackgroundPrint=Object.freeze({version,pagePlan,projectPlans,verifyEvidence});
})(globalThis);
