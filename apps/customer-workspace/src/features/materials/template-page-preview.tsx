'use client';
import {useEffect,useRef,useState} from 'react';
import type {TemplateCard} from '@/lib/api/contracts';
import {fetchTemplateSource} from '@/lib/materials/template-source';
import type {NativeProject} from '@/lib/materials/native-project';
import {NativePreview} from './native-preview';
export function TemplatePagePreview({template,number,project,className='',decorative=false}:{template:TemplateCard;number:number;project?:NativeProject|null;className?:string;decorative?:boolean}){
 const host=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false),[source,setSource]=useState<NativeProject|null>(project||null),[error,setError]=useState('');
 useEffect(()=>{const node=host.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'160px'});observer.observe(node);return()=>observer.disconnect();},[]);
 useEffect(()=>{let active=true;if(project){setSource(project);setError('');return;}if(!visible)return;fetchTemplateSource(template).then(p=>{if(active){setSource(p);setError('');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[template,project,visible]);
 useEffect(()=>{if(host.current)host.current.style.aspectRatio=`${template.widthMm}/${template.heightMm}`;},[template.widthMm,template.heightMm]);
 const page=source?.book.pageInstances[number-1];
 return <div ref={host} className={`template-page-preview ${className}`} aria-hidden={decorative||undefined}>{page&&visible?<NativePreview project={source!} pageId={page.id} compact/>:<div className="preview-placeholder">{error?'페이지를 불러오지 못했어요.':`${number}면 불러오는 중…`}</div>}</div>;
}
