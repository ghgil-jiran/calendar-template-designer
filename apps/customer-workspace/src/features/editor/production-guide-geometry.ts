// Product-size policy; template and page overrides never control customer canvas guides.
export const CUSTOMER_CANVAS_BLEED_MM=3;
export function productionGuideGeometry(size:{width:number;height:number}){
 const width=Number(size.width),height=Number(size.height);
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid production page size');
 const bleed=CUSTOMER_CANVAS_BLEED_MM;
 return {width,height,bleed,safeX:bleed+width*.02,safeY:bleed+height*.02};
}
