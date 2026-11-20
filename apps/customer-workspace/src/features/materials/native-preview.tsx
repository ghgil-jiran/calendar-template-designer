'use client';
import {useEffect,useRef,useState} from 'react';
import {BindingPreview} from './binding-preview';
import {CUSTOMER_CANVAS_BLEED_MM} from '../editor/production-guide-geometry';
import type {NativeProject} from '@/lib/materials/native-project';
type Engine={render:(id:string,options?:{guides?:boolean})=>HTMLElement;update:(p:NativeProject)=>void;dispose:()=>void};
declare global {interface Window {ACDLCustomerPageRuntime?:{create:(host:ShadowRoot,source:NativeProject)=>Engine}}}
let ready:Promise<{styles:string[]}>|undefined;
export async function loadEngine(){
 if(!ready)ready=(async()=>{const r=await fetch('/generated/page-runtime/manifest.json');if(!r.ok)throw Error('달력 표시 기능을 불러오지 못했습니다.');const manifest=await r.json();
  for(const file of manifest.scripts as string[])await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='/generated/page-runtime/'+file;script.onload=()=>resolve();script.onerror=()=>reject(Error('달력 표시 파일을 불러오지 못했습니다.'));document.head.append(script);});
  await new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/shared-screen-fonts.css';link.onload=()=>resolve();link.onerror=()=>{link.remove();reject(Error('공통 글꼴 설정을 불러오지 못했습니다.'));};document.head.append(link);});
  return manifest as {styles:string[]};})();
 try{return await ready;}catch(error){ready=undefined;throw error;}
}
export function NativePreview({project,pageId,compact=false,guides=false,showAssetWarning=true,onReady}:{project:NativeProject;pageId:string;compact?:boolean;guides?:boolean;showAssetWarning?:boolean;onReady?:()=>void}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),[failure,setFailure]=useState(''),[assetWarning,setAssetWarning]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const readyCallback=useRef(onReady);
 useEffect(()=>{readyCallback.current=onReady;},[onReady]);
 useEffect(()=>{let alive=true;let cleanup=()=>{};setLoading(true);setFailure('');setAssetWarning('');
  (async()=>{const manifest=await loadEngine();if(!alive||!host.current)return;const shadow=host.current.shadowRoot||host.current.attachShadow({mode:'open'});shadow.replaceChildren();
   await Promise.all(manifest.styles.filter(file=>file!=='shared-screen-fonts.css').map(file=>new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/'+file;link.onload=()=>resolve();link.onerror=()=>reject(Error('달력 스타일을 불러오지 못했습니다.'));shadow.append(link);})));if(!alive)return;
   const widthMm=Number(project.productType.pageSize.width),heightMm=Number(project.productType.pageSize.height);
   // Match the designer's physical-size canvas for poster templates with pixel-based text styles.
   const poster=project.productType.category==='poster';
   const designWidth=poster?widthMm*96/25.4:850;
   const designHeight=designWidth*heightMm/widthMm;
   const style=document.createElement('style');style.textContent=':host{display:block;overflow:'+ (guides?'visible':'hidden') +'}.page{font-family:Arial,"Noto Sans KR",sans-serif;width:'+designWidth+'px!important;'+(poster?'height:'+designHeight+'px!important;':'')+'max-width:none!important;margin:0!important;box-shadow:none!important;transform-origin:top left}.editor-only,.non-output,.cover-role-badge{display:none!important}.page.editor-bleed-visible .binding{z-index:1000}';shadow.append(style);if(!guides){const bindingStyle=document.createElement('style');bindingStyle.textContent='.page .binding{display:none!important}';shadow.append(bindingStyle);}
   if(guides){const guideStyle=document.createElement('style');guideStyle.textContent='.page.editor-bleed-visible{outline:0!important}.page.editor-bleed-visible::before,.page.editor-bleed-visible::after{display:none!important}';shadow.append(guideStyle);}
   const page=document.createElement('div');page.id='page';shadow.append(page);const renderSource=guides?structuredClone(project):project;if(guides){renderSource.template.resources||={};renderSource.template.resources.exportSettings={...renderSource.template.resources.exportSettings,bleed:CUSTOMER_CANVAS_BLEED_MM};}engine.current=window.ACDLCustomerPageRuntime!.create(shadow,renderSource);const rendered=engine.current.render(pageId,{guides});
   const imageChecks=Array.from(rendered.querySelectorAll('img')).filter(img=>img.src).map(img=>Promise.race([img.decode().then(()=>true,()=>false),new Promise<boolean>(resolve=>setTimeout(()=>resolve(img.complete&&img.naturalWidth>0),5000))]));
   void Promise.all(imageChecks).then(results=>{if(alive&&results.some(ok=>!ok))setAssetWarning('일부 템플릿 이미지를 불러오지 못했어요. 디자인을 다시 선택해 이미지 연결을 확인해 주세요.');});
   const fit=()=>{if(!host.current)return;const scale=host.current.clientWidth/designWidth;page.style.transform=`scale(${scale})`;host.current.style.height=`${designHeight*scale}px`;};fit();await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));if(!alive)return;if(project.productType.category==='poster'){const issues=(window as unknown as {ACDLWallCalendar?:{inspect:(scope:HTMLElement)=>unknown[]}}).ACDLWallCalendar?.inspect(page)||[];if(issues.length)setAssetWarning('벽보형 월력에 '+issues.length+'곳의 공간 부족이 있습니다. 템플릿의 전체 월력 구성을 확인해 주세요.');}const observer=new ResizeObserver(fit);observer.observe(host.current);cleanup=()=>observer.disconnect();setLoading(false);
   if(readyCallback.current){await Promise.all(imageChecks);if(alive)readyCallback.current?.();}
  })().catch(error=>{if(alive){setFailure(error.message);setLoading(false);readyCallback.current?.();}});
  return()=>{alive=false;cleanup();engine.current?.dispose();engine.current=null;};
 },[project,pageId,retry,guides]);
 return <div className="native-preview"><div className="binding-preview-surface"><div ref={host} aria-label="학교 자료가 반영된 달력" role="img" />{!guides&&<BindingPreview width={Number(project.productType.pageSize.width)} height={Number(project.productType.pageSize.height)} enabled={project.productType.category==='desk'}/>}</div>{showAssetWarning&&(!compact||project.productType.category==='poster')&&assetWarning&&<p className="field-error" role="alert">{assetWarning}</p>}{!compact&&loading&&<p role="status">달력을 표시하고 있어요.</p>}{failure&&<div role="alert"><p>{failure}</p>{!compact&&<button type="button" className="button" onClick={()=>setRetry(v=>v+1)}>다시 불러오기</button>}</div>}</div>;
}

