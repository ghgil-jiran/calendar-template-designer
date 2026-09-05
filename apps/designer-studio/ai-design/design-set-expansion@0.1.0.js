(function(root){
 const VERSION='ai-design-set-expansion.v1@0.1.0';
 const ROLE_BY_PAGE=Object.freeze({'cover-front':'cover','cover-back':'annual','poster-annual':'annual','school-symbols':'school-symbols','front-insert-front':'school-symbols','monthly-front':'month','monthly-back':'month-back','back-cover-front':'back-cover','back-cover-back':'back-cover'});
 function monthKey(page){return page?.monthKey||(page?.calendarYear&&page?.calendarMonth?`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`:null)}
 function generatedRole(page){return page?.semanticPageRole==='school-symbols'?'school-symbols':ROLE_BY_PAGE[page?.role]||null}
 function expectedAsset(selected,page,role){if(role==='month'||role==='month-back')return selected?.monthlyAssets?.[monthKey(page)]?.[role]||null;return selected?.assetsByRole?.[role]||null}
 function appliedBackground(project,page,role){return (project?.book?.elementsByPage?.[page.id]||[]).find(item=>item.role==='ai-design-background'&&item.aiDesign?.generatedRole===role&&(!['month','month-back'].includes(role)||item.aiDesign?.monthKey===monthKey(page)))||null}
 function createReport(project,selected){
  const pages=(project?.book?.pageInstances||[]).filter(page=>generatedRole(page)),expectedMonths=(selected?.monthlyVariations||[]).map(item=>item.key),missingMonthlyAssets=[];
  expectedMonths.forEach(key=>['month','month-back'].forEach(role=>{if(!selected?.monthlyAssets?.[key]?.[role])missingMonthlyAssets.push({monthKey:key,role})}));
  const coverage=pages.map(page=>{const role=generatedRole(page),key=monthKey(page),assetReady=Boolean(expectedAsset(selected,page,role)),background=appliedBackground(project,page,role),applied=Boolean(background);page.aiDesignExpansion={schemaVersion:VERSION,generatedRole:role,monthKey:key,assetReady,applied,editableContentPreserved:true};return {pageId:page.id,pageRole:page.role,generatedRole:role,monthKey:key,assetReady,applied,assetId:background?.aiDesign?.assetId||null}}),missingPages=coverage.filter(item=>!item.assetReady||!item.applied),roleCounts={};
  coverage.forEach(item=>{const value=roleCounts[item.generatedRole]||{expected:0,applied:0};value.expected+=1;if(item.applied)value.applied+=1;roleCounts[item.generatedRole]=value});
  return {schemaVersion:VERSION,status:missingMonthlyAssets.length||missingPages.length?'incomplete':'complete',sharedVisualLanguage:true,expectedMonthCount:expectedMonths.length,generatedMonthCount:Object.keys(selected?.monthlyAssets||{}).length,expectedMonthlyAssetCount:expectedMonths.length*2,generatedMonthlyAssetCount:expectedMonths.reduce((sum,key)=>sum+['month','month-back'].filter(role=>selected?.monthlyAssets?.[key]?.[role]).length,0),expectedPageCount:coverage.length,appliedPageCount:coverage.filter(item=>item.applied).length,roleCounts,missingMonthlyAssets,missingPages,pages:coverage,verifiedAt:new Date().toISOString()}
 }
 root.ACDLDesignSetExpansion=Object.freeze({VERSION,ROLE_BY_PAGE,monthKey,generatedRole,createReport});
})(typeof window==='undefined'?globalThis:window);
