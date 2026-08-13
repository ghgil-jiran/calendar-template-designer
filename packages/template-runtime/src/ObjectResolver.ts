import { BindingResolver } from "./BindingResolver.js";
import type { RenderNode, RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, TemplateObject } from "./types.js";
import {TextOverflowEngine} from "./TextOverflowEngine.js";
import {ImageFrameResolver} from "./ImageFrameResolver.js";
import {MonthlyStyleResolver} from "./MonthlyStyleResolver.js";
import {CalendarGridResolver} from "./CalendarGridResolver.js";
export interface ObjectResolution { object:RenderNode; diagnostics:RuntimeDiagnostic[]; }
const stable=(value:unknown):string=>{ if(value===null||typeof value!=="object") return JSON.stringify(value); if(Array.isArray(value)) return `[${value.map(stable).join(",")}]`; return `{${Object.keys(value as object).sort().map(k=>`${JSON.stringify(k)}:${stable((value as Record<string,unknown>)[k])}`).join(",")}}`; };
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
export class ObjectResolver {
 constructor(private readonly bindings=new BindingResolver(),private readonly textOverflow=new TextOverflowEngine(),private readonly images=new ImageFrameResolver(),private readonly monthlyStyles=new MonthlyStyleResolver(),private readonly calendarGrid=new CalendarGridResolver()){}
 resolve(source:TemplateObject,dataset:RuntimeDataset,pageId:string,options:RuntimeOptions):ObjectResolution{
  const diagnostics:RuntimeDiagnostic[]=[]; let payload=source.value;
  if(source.binding){const result=this.bindings.resolve(source.binding,dataset);if(result.found)payload=result.value;else{const d=this.bindings.diagnostic(source.binding,pageId,source.id);d.severity=options.strictBindings?"error":"warning";diagnostics.push(d)}}
  const children=source.children?.map(child=>{const r=this.resolve(child,dataset,pageId,options);diagnostics.push(...r.diagnostics);return r.object});
  let style=this.monthlyStyles.resolve(source.style??{},dataset.calendar?.monthKey,dataset.monthlyStyleOverrides,source.id);
  if(source.type==="text"&&typeof payload==="string"){const result=this.textOverflow.inspect(payload,source.frame,style,(style.overflowPolicy as any)??undefined);diagnostics.push(...result.diagnostics.map(item=>({...item,pageId,objectId:source.id})));style={...style,fontSize:result.measurement.appliedFontSize,textMeasurement:result.measurement};}
  if(source.type==="image-frame"){const result=this.images.resolve(payload,dataset.assets,source.frame);diagnostics.push(...result.diagnostics.map(item=>({...item,pageId,objectId:source.id})));if(result.payload)payload=result.payload;}
  if(source.type==="calendar"||source.type==="calendar-grid"){try{payload=this.calendarGrid.resolve({...((payload&&typeof payload==="object"?payload:{})),weekStart:(payload as any)?.weekStart??dataset.calendar?.weekStart,rows:(payload as any)?.rows??dataset.calendar?.gridRows});}catch{diagnostics.push({severity:"error",code:"CALENDAR_GRID_INVALID",message:"월력의 연도 또는 월 정보가 올바르지 않습니다.",pageId,objectId:source.id});}}
  const base={id:source.id,sourceObjectId:source.id,type:source.type,frame:{...source.frame},rotation:Number(source.rotation??style.rotation??0),opacity:Math.max(0,Math.min(1,Number(source.opacity??style.opacity??1))),style,payload,value:payload,visible:source.visible!==false,zIndex:source.zIndex??0,...(children?{children}:{})};
  return {object:{...base,fingerprint:hash(stable(base))},diagnostics};
 }
}
