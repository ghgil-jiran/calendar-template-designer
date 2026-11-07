import type{Rect,RuntimeDiagnostic}from"./types.js";
export interface ImageAsset{id:string;src:string;widthPx?:number;heightPx?:number;}
export interface ImageFramePayload{asset:ImageAsset;fit:"cover"|"contain"|"fill";focalPoint:{x:number;y:number};requiredDpi?:number;}
export class ImageFrameResolver{
 resolve(value:unknown,assets:unknown,frame:Rect):{payload?:ImageFramePayload;diagnostics:RuntimeDiagnostic[]}{
  const source=value&&typeof value==="object"?value as Record<string,unknown>:{};const list=Array.isArray(assets)?assets:Object.values(assets&&typeof assets==="object"?assets as object:{});const linked=list.find(item=>item&&typeof item==="object"&&(item as Record<string,unknown>).id===source.assetId) as ImageAsset|undefined;const inlineSrc=typeof value==="string"?value:typeof source.src==="string"?source.src:undefined;const asset=linked??(inlineSrc?{id:String(source.assetId??"inline"),src:inlineSrc}:undefined);
  if(!asset)return{diagnostics:[{severity:"warning",code:"IMAGE_ASSET_NOT_FOUND",message:"이미지 프레임에 연결된 자산을 찾지 못했습니다."}]};const focal=source.focalPoint&&typeof source.focalPoint==="object"?source.focalPoint as Record<string,unknown>:{};const payload:ImageFramePayload={asset,fit:source.fit==="contain"||source.fit==="fill"?source.fit:"cover",focalPoint:{x:Number(focal.x??.5),y:Number(focal.y??.5)},requiredDpi:Number(source.requiredDpi??300)};const diagnostics:RuntimeDiagnostic[]=[];
  if(asset.widthPx&&asset.heightPx){const dpi=Math.min(asset.widthPx/(frame.width/25.4),asset.heightPx/(frame.height/25.4));if(dpi<(payload.requiredDpi??300))diagnostics.push({severity:"warning",code:"IMAGE_LOW_RESOLUTION",message:"이미지 해상도가 출력 권장값보다 낮습니다."});}return{payload,diagnostics};
 }
}
