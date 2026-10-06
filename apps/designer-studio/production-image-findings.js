// Administrator production review only; user order admission keeps its own policy.
export function productionImageFindings(images,assets=[]){
 const errors=[],warnings=[];
 for(const item of images.results){
  if(item.status==='blocked')errors.push({message:item.message});
  for(const placement of item.placements||[]){
   if(placement.status==='unresolved')errors.push({message:`${placement.pageNumber}면 · ${placement.role}: 배치 확인 불가`});
   else if(placement.status==='blocked')warnings.push({code:'IMAGE_BELOW_ORDER_MINIMUM',source:item.source,pageNumber:placement.pageNumber,role:placement.role,effectiveDpi:placement.effectiveDpi,message:`${placement.pageNumber}면 · ${placement.role}: ${placement.effectiveDpi} DPI · 최소 ${images.plan.imageQualityPolicy.orderMinimumDpi} DPI 미달. 관리자 인쇄 판단이 필요합니다. 원본으로 진행하거나 교체·보정을 선택하세요.`});
   else if(placement.status==='warning')warnings.push({code:'IMAGE_LOW_DPI',source:item.source,origin:item.source.startsWith('package-asset://')?'template':assets.find(asset=>`production-asset://${asset.id}`===item.source)?.inspectionOrigin||'unknown',pageNumber:placement.pageNumber,role:placement.role,effectiveDpi:placement.effectiveDpi,minimumDpi:images.plan.minimumDpi,message:`${placement.pageNumber}면 · ${placement.role}: ${placement.effectiveDpi} DPI · 보정 검토 대상 (자동 보정 미수행)`});
  }
 }
 return {errors,warnings};
}
