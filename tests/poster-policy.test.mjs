import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/project-document.js';
import '../apps/designer-studio/calendar-type-domain.js';
import '../apps/designer-studio/poster-one-page-sample.js';
import '../apps/designer-studio/poster-two-page-sample.js';
import '../apps/designer-studio/shared-screen-calendar-annotations.js';
import '../apps/designer-studio/shared-screen-mini-calendar.js';
import '../apps/designer-studio/editor-canvas-fit.js';
const api=globalThis.ACDLSharedMiniCalendar;
const make=()=>globalThis.ACDLPosterTwoPageSample.create({});
function grid(p,index=0){return p.book.elementsByPage[p.book.pageInstances[index].id].find(e=>e.academicPoster);}
function html(p,item=grid(p)){return api.renderPosterCalendarMarkup(api.resolveAnnualCalendar(item,p.book.pageInstances[0],p.settings),item,p);}
test('legacy poster sizes migrate once and persist without overwriting later author edits or month mapping',()=>{
 const p=make(),before=p.book.pageInstances.map(x=>x.posterMonthOffset);for(const page of p.book.pageInstances){const g=p.book.elementsByPage[page.id].find(e=>e.academicPoster);delete g.posterPolicyVersion;g.style.dateSize=21;g.posterEventSize=8;}api.normalizePosterProject(p);assert.equal(grid(p).style.dateSize,13);assert.equal(grid(p).posterEventSize,6);assert.equal(grid(p).posterPolicyVersion,2);grid(p).style.dateSize=19;grid(p).posterEventSize=9;api.normalizePosterProject(p);assert.equal(grid(p).style.dateSize,19);assert.equal(grid(p).posterEventSize,9);const reopened=JSON.parse(JSON.stringify(p));api.normalizePosterProject(reopened);assert.equal(grid(reopened).style.dateSize,19);assert.deepEqual(reopened.book.pageInstances.map(x=>x.posterMonthOffset),before);
 const one=globalThis.ACDLPosterOnePageSample.create({});api.normalizePosterProject(one);assert.equal(grid(one).style.dateSize,10);
 const desk={productType:{category:'desk'},book:{elementsByPage:{x:[{academicPoster:true,style:{dateSize:21}}]}}};api.normalizePosterProject(desk);assert.equal(desk.book.elementsByPage.x[0].style.dateSize,21);
});
test('monthly colors change on each month and custom month colors survive reopen and year rollover',()=>{
 const p=make(),g=grid(p);g.posterMonthColors={'3':'#112233','4':'#445566'};const markup=html(p);assert.match(markup,/background:#112233/);assert.match(markup,/background:#445566/);assert.deepEqual(g.posterMonthColors,{'3':'#112233','4':'#445566'});const q=JSON.parse(JSON.stringify(p));assert.equal(html(q),markup);const second=html(p,grid(p,1));assert.match(second,/2028-01/);assert.match(second,/2028-02/);
});
test('other-page placement matches linked header objects without changing content, month grids or source page',()=>{
 const p=make(),pages=p.book.pageInstances,[a,b]=pages.map(x=>p.book.elementsByPage[x.id]),logo=a.find(x=>x.role==='school-logo'),target=b.find(x=>x.role==='school-logo'),before=structuredClone(grid(p,1));Object.assign(logo,{x:7,y:5,width:11,height:8});assert.equal(api.applyPosterPlacement(p,pages[0].id,logo),1);assert.equal(target.x,7);assert.equal(target.height,8);assert.deepEqual(grid(p,1),before);const year=a.find(x=>x.binding==='calendar.year');year.width=25;api.applyPosterPlacement(p,pages[0].id,year);assert.equal(b.find(x=>x.binding==='calendar.year').width,25);assert.equal(api.applyPosterPlacement(p,pages[0].id,grid(p)),0);
});
test('all four annotation layouts share weekday/custom colors and holiday visibility is independent of anniversaries',()=>{
 const p=make();p.book.calendarReference={years:{2027:{public_holiday:{items:[{date:'2027-03-03',name:'holiday',isHoliday:true},{date:'2027-03-04',name:'anniversary',isHoliday:false}]},solar_term:{items:[{date:'2027-03-04',name:'term'}]},lunar:{items:[{date:'2027-03-04',name:'lunar'}]}}}};
 p.template.masters.calendar.calendarLayout||={};p.template.masters.calendar.calendarLayout.referenceColors={anniversaries:{mode:'custom',color:'#334455'}};
 for(const layout of ['basic-1','basic-2','below','beside']){const g=grid(p);g.posterReferenceLayout=layout;const out=html(p);assert.match(out,/data-reference-kind="holidays" style="color:#d92d20"/);assert.match(out,/data-reference-kind="anniversaries" style="color:#334455"/);assert.match(out,/data-reference-kind="solarTerms"/);assert.match(out,/data-reference-kind="lunars"/);}
 p.settings.calendarData.includeHolidays=false;const out=html(p);assert.doesNotMatch(out,/>holiday</);assert.match(out,/>anniversary</);
});
test('CSS print dimensions define poster 100% while initial fit may be below 50% and desktop defaults stay unchanged',()=>{
 const fit=globalThis.ACDLEditorCanvasFit.fixedCanvasViewport({pageWidth:420,pageHeight:594,availableWidth:800,availableHeight:700,physicalSize:true,minimumScale:.05,maximumScale:4});assert.ok(Math.abs(fit.designWidth-420*96/25.4)<.001);assert.ok(fit.scale<.5);assert.ok(fit.displayHeight<=700);const desk=globalThis.ACDLEditorCanvasFit.fixedCanvasViewport({pageWidth:260,pageHeight:180,availableWidth:1000,availableHeight:700});assert.equal(desk.designWidth,850);
});
