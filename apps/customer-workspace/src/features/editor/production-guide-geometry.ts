// Product-size policy; template and page overrides never control customer canvas guides.
export const CUSTOMER_CANVAS_BLEED_MM=3;
export function productionGuideGeometry(size:{width:number;height:number},category='desk'){
 const width=Number(size.width),height=Number(size.height);
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid production page size');
 const bleed=CUSTOMER_CANVAS_BLEED_MM;
 return {width,height,bleed,safeX:category==='desk'?3:bleed+width*.02,safeTop:category==='desk'?15:bleed+height*.02,safeBottom:category==='desk'?3:bleed+height*.02};
}

export function bindingPreviewRects(width:number,height:number){
 const pitch=width*.93/26;
 return Array.from({length:26},(_,i)=>({x:width*.035+pitch*(i+6/36),y:height*(.02+.035/22),width:pitch*20/36,height:height*.035*18/22,rx:.6}));
}
