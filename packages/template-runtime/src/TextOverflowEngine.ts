import type{Rect,RuntimeDiagnostic,TextMeasurement,TextOverflowPolicy}from"./types.js";
export class TextOverflowEngine{
 inspect(text:string,frame:Rect,style:Record<string,unknown>,policy:TextOverflowPolicy={mode:"warn",minFontSize:6}):{measurement:TextMeasurement;diagnostics:RuntimeDiagnostic[]}{
  const usesPoints=style.fontSizePt!==undefined;const initial=Number(style.fontSizePt??style.fontSize??12);const physicalSize=(size:number)=>usesPoints?size*25.4/72:size;const lineHeight=Number(policy.lineHeight??style.lineHeight??1.25);const maxLines=policy.maxLines??Math.max(1,Math.floor(frame.height/(physicalSize(initial)*lineHeight)));const estimate=(size:number)=>Math.max(1,Math.ceil(text.length/Math.max(1,Math.floor(frame.width/(physicalSize(size)*.55)))));let applied=initial;let lines=estimate(applied);
  if(policy.mode==="shrink")while(lines>maxLines&&applied>policy.minFontSize){applied=Math.max(policy.minFontSize,applied-.5);lines=estimate(applied);}
  const overflow=lines>maxLines;return{measurement:{overflow,estimatedLines:lines,appliedFontSize:applied,capacity:maxLines},diagnostics:overflow?[{severity:"warning",code:"TEXT_OVERFLOW",message:"텍스트가 허용 영역을 초과합니다."}]:[]};
 }
}
