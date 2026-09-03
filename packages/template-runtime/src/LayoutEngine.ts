import type { Rect, RenderNode, RuntimeDiagnostic, Size } from "./types.js";
import { resolveMonthlyCalendarPreset } from "./CalendarPresetResolver.js";
export interface LayoutResult { object:RenderNode; diagnostics:RuntimeDiagnostic[]; }
export class LayoutEngine {
 layout(object:RenderNode,pageSize:Size,pageId:string):LayoutResult{
  const diagnostics:RuntimeDiagnostic[]=[];const frame=this.normalizeFrame(object.frame);const next={...object,frame,style:{...object.style}};
  if(frame.x+frame.width>pageSize.width||frame.y+frame.height>pageSize.height||frame.x<0||frame.y<0)diagnostics.push({severity:"warning",code:"OBJECT_OUT_OF_BOUNDS",message:"개체가 페이지 영역을 벗어납니다.",pageId,objectId:object.id});
  if(next.type==="text"&&typeof next.payload==="string")this.fitText(next,diagnostics,pageId);
  if(next.type==="image")this.normalizeImage(next);
  if(next.type==="calendar")this.normalizeCalendar(next);
  return {object:next,diagnostics};
 }
 private normalizeFrame(f:Rect):Rect{return{x:Number.isFinite(f.x)?f.x:0,y:Number.isFinite(f.y)?f.y:0,width:Math.max(0,Number.isFinite(f.width)?f.width:0),height:Math.max(0,Number.isFinite(f.height)?f.height:0)}}
 private fitText(o:RenderNode,d:RuntimeDiagnostic[],pageId:string){const text=o.payload as string,s=o.style;const fs=Number(s.fontSize??12),min=Number(s.minFontSize??Math.max(6,fs*.6)),lineHeight=Number(s.lineHeight??1.25),capacity=Math.max(1,(o.frame.width*o.frame.height)/Math.max(1,fs*fs*.5*lineHeight));s.overflow=s.overflow??"clip";s.verticalAlign=s.verticalAlign??"middle";s.whiteSpace=s.whiteSpace??"pre-wrap";if(text.length>capacity&&s.autoFit!==false){const ratio=Math.sqrt(capacity/text.length),next=Math.max(min,Math.floor(fs*ratio*10)/10);s.fontSize=next;d.push({severity:"info",code:"TEXT_AUTOFIT_APPLIED",message:`텍스트 자동 맞춤으로 글자 크기를 ${fs}에서 ${next}로 조정했습니다.`,pageId,objectId:o.id});if(next===min&&text.length>capacity*1.2)d.push({severity:"warning",code:"TEXT_OVERFLOW",message:"최소 글자 크기에서도 텍스트가 넘칠 수 있습니다.",pageId,objectId:o.id})}}
 private normalizeImage(o:RenderNode){o.style.objectFit=o.style.objectFit??o.style.fit??"cover";o.style.objectPosition=o.style.objectPosition??"center center";o.style.overflow="hidden"}
 private normalizeCalendar(o:RenderNode){const p=(o.payload&&typeof o.payload==="object"?o.payload:{}) as Record<string,unknown>;const normalized={...p,rows:Number(p.rows??o.style.rows??6),columns:7,weekStart:String(p.weekStart??o.style.weekStart??"sunday"),showHolidays:p.showHolidays??true};const config=resolveMonthlyCalendarPreset({payload:normalized,style:o.style});o.payload={...normalized,calendarLayout:config.layout,calendarPreset:config.preset,calendarOverrides:config.overrides}}
}
