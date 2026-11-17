import type {NativeProject} from '@/lib/materials/native-project';
export function ProductionGuides({project,pageId}:{project:NativeProject;pageId:string}){
 const size=project.productType.pageSize,w=Number(size.width),h=Number(size.height),bleed=Math.max(0,Number(project.template.resources?.exportSettings?.bleed??3)),page=project.book.pageInstances.find((p:NativeProject)=>p.id===pageId),frame=page?.screenComposition?.contentFramePct||project.template.screenComposition?.surfaces?.[page?.role]?.contentFramePct||{x:5,y:7,width:90,height:88},binding=project.productType.category==='desk',vw=w+2*bleed,vh=h+2*bleed;
 return <svg className="production-guides" viewBox={`${-bleed} ${-bleed} ${vw} ${vh}`} ref={node=>{if(node){node.style.left=`${-bleed/w*100}%`;node.style.top=`${-bleed/h*100}%`;node.style.width=`${vw/w*100}%`;node.style.height=`${vh/h*100}%`;}}} role="img" aria-label={`제작 기준선: 재단 ${w}×${h}mm, 사방 도련 ${bleed}mm, 안전 영역${binding?', 상단 제본 보호 영역':''}`}>
 <rect className="production-guide-bleed" x={-bleed} y={-bleed} width={vw} height={vh}/><rect className="production-guide-trim" x={0} y={0} width={w} height={h}/>
 <rect className="production-guide-safe" x={w*frame.x/100} y={h*frame.y/100} width={w*frame.width/100} height={h*frame.height/100}/>
 {binding&&<><rect className="production-guide-binding" x={0} y={0} width={w} height={h*.05}/><line className="production-guide-binding-edge" x1={0} x2={w} y1={h*.05} y2={h*.05}/></>}
 </svg>;
}

export function ProductionGuideLegend(){return <div className="production-guide-legend" aria-label="제작 기준선 안내"><span className="guide-safe" title="중요한 글자와 교표를 안쪽에 배치하는 기준선">안전 영역</span><span className="guide-trim" title="실제 종이가 잘리는 위치">재단 영역</span><span className="guide-bleed" title="재단 오차에 대비해 배경을 채우는 바깥 영역">작업 영역(여백)</span></div>;}
