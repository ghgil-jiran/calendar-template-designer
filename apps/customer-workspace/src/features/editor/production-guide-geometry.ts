import '../../../../designer-studio/canvas-production-guides.js';

type GuideSize={width:number;height:number};
const shared=(globalThis as unknown as {ACDLCanvasProductionGuides:{
 geometry:(product:{pageSize:GuideSize;category:string})=>{width:number;height:number;bleed:number;left:number;top:number;bottom:number};
 bindingRects:(width:number,height:number)=>{x:number;y:number;width:number;height:number;rx:number}[];
}}).ACDLCanvasProductionGuides;

export const CUSTOMER_CANVAS_BLEED_MM=shared.geometry({pageSize:{width:260,height:180},category:'desk'}).bleed;

export function productionGuideGeometry(size:GuideSize,category='desk'){
 const width=Number(size.width),height=Number(size.height);
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid production page size');
 const geometry=shared.geometry({pageSize:{width,height},category});
 return {width,height,bleed:geometry.bleed,safeX:geometry.left,safeTop:geometry.top,safeBottom:geometry.bottom};
}

export const bindingPreviewRects=shared.bindingRects;
