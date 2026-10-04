(()=>{
 const normalizer=normalizeElementData;normalizeElementData=function(){if(project?.productionCorrection){project.book.elementsByPage||={};project.template.masterElements||={};return;}return normalizer();};
 const geometrySync=syncMonthlyGeometry;syncMonthlyGeometry=function(item){return project?.productionCorrection?0:geometrySync(item);};
 const visibleElements=allVisibleElements;allVisibleElements=function(){const items=visibleElements();return project?.productionCorrection?items.filter(item=>!['calendar','calendar-grid'].includes(item.type)):items;};
 const pageRenderer=renderPage;renderPage=function(){const page=project?.productionCorrection?selectedPage():null;if(page?.productionCalendarMaster)project.template.masters.calendar=page.productionCalendarMaster;return pageRenderer();};
 window.ACDLProductionRenderContext=true;
})();
