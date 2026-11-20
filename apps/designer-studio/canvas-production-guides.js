(function(root){
 const NS='http://www.w3.org/2000/svg';
 function geometry(product){
  const size=product?.pageSize||{},width=Number(size.width)||260,height=Number(size.height)||180;
  const desk=product?.category==='desk';
  if(product?.category==='poster')return {width,height,bleed:3,left:5,right:5,top:5,bottom:5,desk};
  return {width,height,bleed:3,left:desk?3:3+width*.02,right:desk?3:3+width*.02,top:desk?15:3+height*.02,bottom:desk?3:3+height*.02,desk};
 }
 function svgNode(name,attrs){const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;}
 function bindingRects(width,height){
  const pitch=width*.93/26;
  return Array.from({length:26},(_,i)=>({x:width*.035+pitch*(i+6/36),y:height*(.02+.035/22),width:pitch*20/36,height:height*.035*18/22,rx:.6}));
 }
 function binding(page,product,{review=false}={}){
  page.querySelectorAll('.binding-guide-preview').forEach(n=>n.remove());const g=geometry(product);if(!g.desk)return;
  const svg=svgNode('svg',{class:'binding-guide-preview'+(review?'':' editor-only non-output'),viewBox:`0 0 ${g.width} ${g.height}`,'aria-label':'타공 위치 미리보기'});svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:100000;pointer-events:none;overflow:visible';
  for(const rect of bindingRects(g.width,g.height))svg.appendChild(svgNode('rect',{...rect,fill:'#c6c8ca','fill-opacity':'.55'}));page.appendChild(svg);return svg;
 }
 function render(page,project,{guides=true}={}){
  page.querySelectorAll('.canvas-production-overlay,.canvas-production-paper').forEach(n=>n.remove());page.classList.toggle('canvas-uniform-guides',guides);if(guides)page.classList.add('editor-bleed-visible');binding(page,project.productType);if(!guides)return;
  const g=geometry(project.productType),w=g.width,h=g.height,b=g.bleed,position=`position:absolute;left:${-b/w*100}%;top:${-b/h*100}%;width:${(w+2*b)/w*100}%;height:${(h+2*b)/h*100}%;pointer-events:none;overflow:visible;`;
  const paper=svgNode('svg',{class:'canvas-production-paper editor-only non-output',viewBox:`${-b} ${-b} ${w+2*b} ${h+2*b}`});paper.style.cssText=position+'z-index:0';
  const color=page.style.backgroundColor||'#fff';for(const r of [{x:-b,y:-b,width:w+2*b,height:b},{x:-b,y:h,width:w+2*b,height:b},{x:-b,y:0,width:b,height:h},{x:w,y:0,width:b,height:h}])paper.appendChild(svgNode('rect',{...r,fill:color}));page.prepend(paper);
  const svg=svgNode('svg',{class:'canvas-production-overlay editor-only non-output',viewBox:`${-b} ${-b} ${w+2*b} ${h+2*b}`,'aria-label':`제작 기준선: 안전 상단 ${g.top}mm, 하단 ${g.bottom}mm, 좌우 ${g.left}mm, 도련 3mm`});svg.style.cssText=position+'z-index:100001';
  for(const r of [{x:-b,y:-b,width:w+2*b,height:h+2*b,stroke:'#3b82f6'},{x:0,y:0,width:w,height:h,stroke:'#df3535'},{x:g.left,y:g.top,width:w-g.left-g.right,height:h-g.top-g.bottom,stroke:'#16a34a'}])svg.appendChild(svgNode('rect',{...r,fill:'none','stroke-width':1,'stroke-dasharray':'3 2','vector-effect':'non-scaling-stroke'}));page.appendChild(svg);
  page.style.setProperty('--export-bleed-x-pct',`${b/w*100}%`);page.style.setProperty('--export-bleed-y-pct',`${b/h*100}%`);
 }
 root.ACDLCanvasProductionGuides=Object.freeze({geometry,render,binding,bindingRects});
})(typeof window==='undefined'?globalThis:window);
