(()=>{
 const page=()=>document.getElementById('page'),viewport=()=>document.getElementById('editorPageViewport'),canvas=()=>document.querySelector('.workspace>.center .canvas-wrap');
 let frame=0,mode='fit',manualScale=1;
 const clamp=value=>window.ACDLEditorCanvasFit.clampCanvasScale(value,.5,1.5);
 function updateControls(scale){
  const percent=Math.round(scale*100),range=document.getElementById('canvasZoomRange'),percentButton=document.getElementById('canvasZoomPercentBtn'),fitButton=document.getElementById('canvasFitBtn');
  if(range)range.value=String(Math.round(percent/5)*5);
  if(percentButton)percentButton.textContent=`${percent}%`;
  if(fitButton){fitButton.classList.toggle('active',mode==='fit');fitButton.setAttribute('aria-pressed',String(mode==='fit'))}
 }
 function fitEditorPageToViewport(){
  frame=0;
  const node=page(),frameNode=viewport(),host=canvas(),size=typeof project!=='undefined'?project?.productType?.pageSize:null;
  if(!node||!frameNode||!host||!size||document.body.classList.contains('review-pdf-printing'))return;
  const width=Number(size.width),height=Number(size.height);
  if(!(width>0&&height>0)||host.clientWidth<1||host.clientHeight<1)return;
  const style=getComputedStyle(host),horizontalPadding=parseFloat(style.paddingLeft||0)+parseFloat(style.paddingRight||0),verticalPadding=parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0);
  const availableWidth=Math.max(240,host.clientWidth-horizontalPadding-12),availableHeight=Math.max(240,host.clientHeight-verticalPadding-12),fit=window.ACDLEditorCanvasFit.fixedCanvasViewport({pageWidth:width,pageHeight:height,availableWidth,availableHeight}),scale=mode==='fit'?fit.scale:clamp(manualScale);
  node.style.width=`${fit.designWidth}px`;node.style.height=`${fit.designHeight}px`;node.style.transform=`scale(${scale})`;
  frameNode.style.width=`${fit.designWidth*scale}px`;frameNode.style.height=`${fit.designHeight*scale}px`;
  frameNode.dataset.canvasScale=scale.toFixed(4);frameNode.dataset.canvasZoomMode=mode;frameNode.dataset.designWidth=String(fit.designWidth);frameNode.dataset.designHeight=fit.designHeight.toFixed(4);
  node.dataset.fitAxis=fit.fitAxis;
  updateControls(scale);
 }
 function scheduleFit(){if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>requestAnimationFrame(fitEditorPageToViewport))}
 function setManualScale(scale){mode='manual';manualScale=clamp(scale);scheduleFit()}
 function setFitMode(){mode='fit';scheduleFit()}
 const priorRenderPage=window.renderPage;
 if(typeof priorRenderPage==='function')window.renderPage=function(){const result=priorRenderPage.apply(this,arguments);scheduleFit();return result};
 const host=canvas();
 if(host&&'ResizeObserver'in window)new ResizeObserver(scheduleFit).observe(host);
 window.addEventListener('resize',scheduleFit,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleFit,{passive:true});
 document.getElementById('canvasZoomRange')?.addEventListener('input',event=>setManualScale(Number(event.currentTarget.value)/100));
 document.getElementById('canvasZoomOutBtn')?.addEventListener('click',()=>setManualScale((Number(viewport()?.dataset.canvasScale)||1)-.05));
 document.getElementById('canvasZoomInBtn')?.addEventListener('click',()=>setManualScale((Number(viewport()?.dataset.canvasScale)||1)+.05));
 document.getElementById('canvasZoomPercentBtn')?.addEventListener('click',setFitMode);
 document.getElementById('canvasFitBtn')?.addEventListener('click',setFitMode);
 window.ACDLEditorPageFit=Object.freeze({fit:fitEditorPageToViewport,schedule:scheduleFit,setFit:setFitMode,setScale:setManualScale,state:()=>({mode,scale:Number(viewport()?.dataset.canvasScale)||manualScale}),designSize:()=>{const node=viewport();return node?{width:Number(node.dataset.designWidth),height:Number(node.dataset.designHeight),scale:Number(node.dataset.canvasScale)}:null}});
 scheduleFit();
})();
