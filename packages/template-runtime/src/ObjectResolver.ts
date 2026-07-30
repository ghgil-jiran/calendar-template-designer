import { BindingResolver } from "./BindingResolver.js";
import type { RenderNode, RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, TemplateObject } from "./types.js";
export interface ObjectResolution { object:RenderNode; diagnostics:RuntimeDiagnostic[]; }
const stable=(value:unknown):string=>{ if(value===null||typeof value!=="object") return JSON.stringify(value); if(Array.isArray(value)) return `[${value.map(stable).join(",")}]`; return `{${Object.keys(value as object).sort().map(k=>`${JSON.stringify(k)}:${stable((value as Record<string,unknown>)[k])}`).join(",")}}`; };
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
export class ObjectResolver {
 constructor(private readonly bindings=new BindingResolver()){}
 resolve(source:TemplateObject,dataset:RuntimeDataset,pageId:string,options:RuntimeOptions):ObjectResolution{
  const diagnostics:RuntimeDiagnostic[]=[]; let payload=source.value;
  if(source.binding){const result=this.bindings.resolve(source.binding,dataset);if(result.found)payload=result.value;else{const d=this.bindings.diagnostic(source.binding,pageId,source.id);d.severity=options.strictBindings?"error":"warning";diagnostics.push(d)}}
  const children=source.children?.map(child=>{const r=this.resolve(child,dataset,pageId,options);diagnostics.push(...r.diagnostics);return r.object});
  const base={id:source.id,sourceObjectId:source.id,type:source.type,frame:{...source.frame},rotation:Number(source.rotation??source.style?.rotation??0),opacity:Math.max(0,Math.min(1,Number(source.opacity??source.style?.opacity??1))),style:{...(source.style??{})},payload,value:payload,visible:source.visible!==false,zIndex:source.zIndex??0,...(children?{children}:{})};
  return {object:{...base,fingerprint:hash(stable(base))},diagnostics};
 }
}
