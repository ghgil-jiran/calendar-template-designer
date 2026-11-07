'use client';
import {useEffect,useRef,useState} from 'react';
import type {NativeProject} from '@/lib/materials/native-project';
type Engine={render:(id:string)=>HTMLElement;update:(p:NativeProject)=>void;dispose:()=>void};
declare global {interface Window {ACDLCustomerPageRuntime?:{create:(host:ShadowRoot,source:NativeProject)=>Engine}}}
let ready:Promise<{styles:string[]}>|undefined;
async function loadEngine(){
 if(!ready)ready=(async()=>{const r=await fetch('/generated/page-runtime/manifest.json');if(!r.ok)throw Error('달력 표시 기능을 불러오지 못했습니다.');const manifest=await r.json();
  for(const file of manifest.scripts as string[])await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='/generated/page-runtime/'+file;script.onload=()=>resolve();script.onerror=()=>reject(Error('달력 표시 파일을 불러오지 못했습니다.'));document.head.append(script);});
  if(!document.querySelector('[data-calendar-fonts]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/shared-screen-fonts.css';link.dataset.calendarFonts='true';document.head.append(link);}
  return manifest as {styles:string[]};})();
 try{return await ready;}catch(error){ready=undefined;throw error;}
}
export function NativePreview({project,pageId,compact=false}:{project:NativeProject;pageId:string;compact?:boolean}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),[failure,setFailure]=useState(''),[assetWarning,setAssetWarning]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{let alive=true;let cleanup=()=>{};setLoading(true);setFailure('');setAssetWarning('');
  (async()=>{const manifest=await loadEngine();if(!alive||!host.current)return;const shadow=host.current.shadowRoot||host.current.attachShadow({mode:'open'});shadow.replaceChildren();
   await Promise.all(manifest.styles.filter(file=>file!=='shared-screen-fonts.css').map(file=>new Promise<void>((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/'+file;link.onload=()=>resolve();link.onerror=()=>reject(Error('달력 스타일을 불러오지 못했습니다.'));shadow.append(link);})));if(!alive)return;
   const style=document.createElement('style');style.textContent=':host{display:block;overflow:hidden}.page{font-family:Arial,"Noto Sans KR",sans-serif;width:850px!important;max-width:none!important;margin:0!important;box-shadow:none!important;transform-origin:top left}.editor-only,.non-output,.cover-role-badge{display:none!important}';shadow.append(style);
   const page=document.createElement('div');page.id='page';shadow.append(page);engine.current=window.ACDLCustomerPageRuntime!.create(shadow,project);const rendered=engine.current.render(pageId);
   const imageChecks=Array.from(rendered.querySelectorAll('img')).filter(img=>img.src).map(img=>Promise.race([img.decode().then(()=>true,()=>false),new Promise<boolean>(resolve=>setTimeout(()=>resolve(img.complete&&img.naturalWidth>0),5000))]));
   void Promise.all(imageChecks).then(results=>{if(alive&&results.some(ok=>!ok))setAssetWarning('일부 템플릿 이미지를 불러오지 못했어요. 디자인을 다시 선택해 이미지 연결을 확인해 주세요.');});
   const fit=()=>{if(!host.current)return;const scale=host.current.clientWidth/850;page.style.transform=`scale(${scale})`;host.current.style.height=`${850*Number(project.productType.pageSize.height)/Number(project.productType.pageSize.width)*scale}px`;};fit();const observer=new ResizeObserver(fit);observer.observe(host.current);cleanup=()=>observer.disconnect();setLoading(false);
  })().catch(error=>{if(alive){setFailure(error.message);setLoading(false);}});
  return()=>{alive=false;cleanup();engine.current?.dispose();engine.current=null;};
 },[project,pageId,retry]);
 return <div className="native-preview"><div ref={host} aria-label="학교 자료가 반영된 달력" role="img" />{!compact&&assetWarning&&<p className="field-error" role="alert">{assetWarning}</p>}{!compact&&loading&&<p role="status">달력을 표시하고 있어요.</p>}{failure&&<div role="alert"><p>{failure}</p>{!compact&&<button type="button" className="button" onClick={()=>setRetry(v=>v+1)}>다시 불러오기</button>}</div>}</div>;
}
