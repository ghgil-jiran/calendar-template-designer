import type {NativeProject} from '@/lib/materials/native-project';
import {productionGuideGeometry} from './production-guide-geometry';
export function ProductionGuides({project,pageId}:{project:NativeProject;pageId:string}){
 const {width:w,height:h,bleed,safeX,safeY,bindingTop}=productionGuideGeometry(project.productType.pageSize,project.productType.category),vw=w+2*bleed,vh=h+2*bleed;
 const position={left:`${-bleed/w*100}%`,top:`${-bleed/h*100}%`,width:`${vw/w*100}%`,height:`${vh/h*100}%`};
 return <><div className="production-guide-paper" style={position} aria-hidden="true"/><svg className="production-guides" style={position} viewBox={`${-bleed} ${-bleed} ${vw} ${vh}`} role="img" aria-label={`제작 기준선: 재단 ${w}×${h}mm, 사방 도련 ${bleed}mm, 안전 여백 좌우 ${safeX}mm·상하 ${safeY}mm${bindingTop?`, 상단 제본 보호 ${bindingTop}mm`:""}`}>
 {bindingTop>0&&<rect className="production-guide-binding-zone" x={0} y={0} width={w} height={bindingTop}/>}
 <rect className="production-guide-bleed" x={-bleed} y={-bleed} width={vw} height={vh}/><rect className="production-guide-trim" x={0} y={0} width={w} height={h}/>
 <rect className="production-guide-safe" x={safeX} y={safeY} width={w-2*safeX} height={h-2*safeY}/>

 </svg></>;
}

export function ProductionGuideLegend({desk=false}:{desk?:boolean}){return <div className="production-guide-legend" aria-label="제작 기준선 안내"><span className="guide-safe" title="중요한 글자와 교표를 안쪽에 배치하는 기준선">안전 영역</span><span className="guide-trim" title="실제 종이가 잘리는 위치">재단 영역</span><span className="guide-bleed" title="재단 오차에 대비해 배경을 채우는 바깥 영역">작업 영역(여백)</span>{desk&&<span className="guide-binding" title="상단 재단선에서 15mm 안쪽까지 중요한 글자와 교표를 피하는 제본 보호 영역">상단 제본 보호(15mm)</span>}</div>;}
