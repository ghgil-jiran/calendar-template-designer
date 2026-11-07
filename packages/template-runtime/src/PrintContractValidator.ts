import type { PrintColor, RuntimeDiagnostic, TemplateDocument, TemplateObject } from "./types.js";

const vectorTypes = new Set(["text", "shape", "vector", "line", "calendar", "calendar-grid", "year-calendar", "mini-calendar", "mini-calendar-prev", "mini-calendar-next", "month-date-strip", "event-list", "monthly-schedule", "memo"]);
const imageTypes = new Set(["image", "image-frame", "background"]);
const validColor = (color?:PrintColor) => !color || [color.c,color.m,color.y,color.k].every(value => Number.isFinite(value) && value >= 0 && value <= 1);

export class PrintContractValidator {
  validate(template:TemplateDocument):RuntimeDiagnostic[] {
    const diagnostics:RuntimeDiagnostic[]=[];
    const contract=template.printContract;
    if(!contract){
      diagnostics.push({severity:"error",code:"PRINT_CONTRACT_MISSING",message:"인쇄 대상에는 printContract가 필요합니다."});
      return diagnostics;
    }
    if(contract.coordinateUnit!=="mm") diagnostics.push({severity:"error",code:"PRINT_COORDINATE_UNIT_INVALID",message:"인쇄 좌표 단위는 mm여야 합니다."});
    const expectedWidth=contract.trimSizeMm.width+contract.bleedMm*2;
    const expectedHeight=contract.trimSizeMm.height+contract.bleedMm*2;
    if(Math.abs(contract.productionSizeMm.width-expectedWidth)>0.001||Math.abs(contract.productionSizeMm.height-expectedHeight)>0.001){
      diagnostics.push({severity:"error",code:"PRINT_BLEED_GEOMETRY_INVALID",message:"제작 크기는 완성 크기와 도련을 합한 값이어야 합니다."});
    }
    const inspect=(object:TemplateObject,pageId:string):void=>{
      const policy=object.print;
      if(!policy) diagnostics.push({severity:"error",code:"PRINT_OBJECT_POLICY_MISSING",message:"인쇄 개체 정책이 없습니다.",pageId,objectId:object.id});
      else {
        if(vectorTypes.has(object.type)&&policy.structure!=="native-vector") diagnostics.push({severity:"error",code:"PRINT_VECTOR_STRUCTURE_REQUIRED",message:"기본 구성 요소는 네이티브 벡터여야 합니다.",pageId,objectId:object.id});
        if(["text","calendar","calendar-grid","year-calendar","mini-calendar","mini-calendar-prev","mini-calendar-next","month-date-strip","event-list","monthly-schedule"].includes(object.type)){
          if(policy.textMode!=="outline") diagnostics.push({severity:"error",code:"PRINT_TEXT_OUTLINE_REQUIRED",message:"인쇄 텍스트는 아웃라인이어야 합니다.",pageId,objectId:object.id});
          const font=policy.font;
          if(!font) diagnostics.push({severity:"error",code:"PRINT_TEXT_FONT_POLICY_MISSING",message:"인쇄 텍스트에는 Package 폰트 자산 정책이 필요합니다.",pageId,objectId:object.id});
          else {
            if(font.ref!=="package"||!font.assetId||!font.postscriptName||!font.license||!/^[a-f0-9]{64}$/i.test(font.sha256)) diagnostics.push({severity:"error",code:"PRINT_TEXT_FONT_POLICY_INVALID",message:"인쇄 폰트 자산 식별자·해시·PostScript 이름·라이선스가 올바르지 않습니다.",pageId,objectId:object.id});
            if(font.outlineAllowed!==true) diagnostics.push({severity:"error",code:"PRINT_TEXT_OUTLINE_LICENSE_REQUIRED",message:"아웃라인 생성을 허용하는 폰트 정책이 필요합니다.",pageId,objectId:object.id});
          }
        }
        if(object.type==="memo"&&object.value&&typeof object.value==="object"&&["checklist","weekly"].includes(String((object.value as Record<string,unknown>).layout))){
          if(policy.textMode!=="outline"||!policy.font) diagnostics.push({severity:"error",code:"PRINT_MEMO_FONT_POLICY_MISSING",message:"체크리스트·주차형 메모에는 Package 폰트 정책이 필요합니다.",pageId,objectId:object.id});
        }
        if(policy.blackMode==="k100"&&policy.fill && (policy.fill.c!==0||policy.fill.m!==0||policy.fill.y!==0||policy.fill.k!==1)) diagnostics.push({severity:"error",code:"PRINT_K100_INVALID",message:"K100 개체의 색상 값이 올바르지 않습니다.",pageId,objectId:object.id});
        if(!validColor(policy.fill)||!validColor(policy.stroke)) diagnostics.push({severity:"error",code:"PRINT_CMYK_INVALID",message:"CMYK 값은 0~1 범위여야 합니다.",pageId,objectId:object.id});
        if(imageTypes.has(object.type)){
          if(policy.structure!=="raster-image"||!policy.image) diagnostics.push({severity:"error",code:"PRINT_IMAGE_POLICY_MISSING",message:"이미지 인쇄 정책이 없습니다.",pageId,objectId:object.id});
          else if(policy.image.minimumDpi!==contract.minimumImageDpi) diagnostics.push({severity:"error",code:"PRINT_IMAGE_DPI_POLICY_MISMATCH",message:"이미지 DPI 기준이 문서 계약과 다릅니다.",pageId,objectId:object.id});
        }
      }
      object.children?.forEach(child=>inspect(child,pageId));
    };
    for(const page of template.pages){
      if(page.size.unit!=="mm") diagnostics.push({severity:"error",code:"PRINT_PAGE_UNIT_INVALID",message:"인쇄 페이지 단위는 mm여야 합니다.",pageId:page.id});
      if(Math.abs(page.size.width-contract.trimSizeMm.width)>0.001||Math.abs(page.size.height-contract.trimSizeMm.height)>0.001) diagnostics.push({severity:"error",code:"PRINT_TRIM_SIZE_MISMATCH",message:"페이지 크기가 완성 크기와 다릅니다.",pageId:page.id});
      page.objects.forEach(object=>inspect(object,page.id));
    }
    return diagnostics;
  }
}
