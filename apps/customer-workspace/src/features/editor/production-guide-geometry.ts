// Product-size policy; template and page overrides never control customer canvas guides.
export const CUSTOMER_CANVAS_BLEED_MM=3;
export function productionGuideGeometry(size:{width:number;height:number},category='desk'){
 const width=Number(size.width),height=Number(size.height);
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid production page size');
 const bleed=CUSTOMER_CANVAS_BLEED_MM;
 return {width,height,bleed,safeX:category==='desk'?3:bleed+width*.02,safeY:category==='desk'?3:bleed+height*.02,bindingTop:category==='desk'?15:0};
}
