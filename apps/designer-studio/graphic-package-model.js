(function(root){
 'use strict';
 const vector=root.ACDLGraphicVectorDesign;
 const pages={cover:'표지','cover-inside':'표지 안쪽','interleaf-front':'간지 앞면','interleaf-back':'간지 뒷면','month-front':'월력 앞면 · 12개월','month-back':'월력 뒷면 · 12개월','rear-interleaf-front':'뒷간지 앞면','rear-interleaf-back':'뒷간지 뒷면','back-cover':'뒷표지',symbols:'학교 상징',year:'연력',planner:'플래너'};
 const fail=message=>{throw new Error(message)};
 function metadata(body={}){const name=String(body.name||'').trim();if(!name||name.length>120||body.size&&body.size!=='desk-standard')fail('패키지 이름과 규격을 확인해주세요.');return {name,size:'desk-standard',tags:String(body.tags||'').trim().slice(0,500),source:String(body.source||'').trim().slice(0,500)}}
 function derive(cover,page){if(!pages[page]||!cover?.design||cover.design.page!=='cover')fail('표지를 먼저 저장해주세요.');const p=vector.normalize(cover.design);if(page==='cover')return p;return vector.normalize({...p,page,composition:null,coverTuning:null,scene:null,layout:'auto',variation:'same',familyTuning:p.coverTuning||p.familyTuning||null});}
 function count(pkg){return Object.keys(pkg.pages||{}).filter(p=>pages[p]&&pkg.pages[p]?.graphicId).length}
 function outdated(pkg,page){const slot=pkg.pages?.[page];return Boolean(page!=='cover'&&slot?.derivedFromCoverId&&slot.derivedFromCoverId!==pkg.pages?.cover?.graphicId)}
 root.ACDLGraphicPackageModel=Object.freeze({pages,metadata,derive,count,outdated});
})(typeof window==='undefined'?globalThis:window);
