import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function api(){const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design/design-quality@0.2.0.js',import.meta.url),'utf8'),context={Set,Date};context.window=context;vm.createContext(context);vm.runInContext(source,context);return context.ACDLDesignQuality}
function fixture(){
 const pageInstances=[{id:'cover',role:'cover-front'},{id:'march',role:'monthly-front',monthKey:'2028-03'},{id:'april',role:'monthly-front',monthKey:'2028-04'}];
 const elementsByPage=Object.fromEntries(pageInstances.map(page=>[page.id,[{id:`bg-${page.id}`,role:'ai-design-background'},{id:`content-${page.id}`,role:'title',x:10,y:10,width:30,height:10}]]));
 const metadata=id=>({id,size:'1536x1024',promptVersion:'school-calendar-design@test',designStyleId:'editorial',qualityChecks:{forbiddenText:'pass'}});
 const selected={key:'editorial',assetsByRole:{cover:'cover'},assetMetadataByRole:{cover:metadata('cover-asset')},monthlyAssets:{'2028-03':{month:'march',metadata:{month:metadata('march-asset')}},'2028-04':{month:'april',metadata:{month:metadata('april-asset')}}}};
 return {project:{productType:{pageSize:{width:260,height:180}},book:{pageInstances,elementsByPage}},selected};
}
test('quality report checks every generated page and preserves print resolution as review',()=>{const {project,selected}=fixture(),report=api().createReport(project,selected,'2026-09-05T00:00:00.000Z');assert.equal(report.schemaVersion,'ai-design-quality.v1@0.2.0');assert.equal(report.status,'review-required');assert.equal(report.pageCount,3);assert.equal(report.failedPageCount,0);assert.equal(report.reviewPageCount,3);assert.ok(report.pages.every(page=>page.issues.some(issue=>issue.code==='print-resolution-review')));assert.equal(report.printInspection.criteriaVersion,'ai-image-print-quality.v1@0.1.0');assert.equal(report.printInspection.status,'pending');assert.equal(report.printInspection.criteria.identity.status,'passed');assert.equal(report.printInspection.criteria.generationStandard.status,'review');assert.equal(report.printInspection.criteria.frameSuitability.status,'review');assert.equal(report.printInspection.criteria.visualArtifacts.status,'review')});
test('only image-correctable failures become regeneration targets',()=>{
 const {project,selected}=fixture();
 selected.monthlyAssets['2028-04'].month='march';
 selected.monthlyAssets['2028-03'].metadata.month.detectedForbiddenText=['2028'];
 project.book.elementsByPage.cover[1].x=0;
 const report=api().createReport(project,selected);
 assert.equal(report.status,'failed');
 assert.ok(report.regenerationTargets.some(item=>item.pageId==='march'&&item.reasons.includes('forbidden-text')));
 assert.ok(report.regenerationTargets.some(item=>item.pageId==='april'&&item.reasons.includes('duplicate-asset')));
 assert.ok(!report.regenerationTargets.some(item=>item.pageId==='cover'));
 assert.ok(report.pages.find(page=>page.pageId==='cover').issues.some(issue=>issue.code==='safe-area'));
});
test('style inconsistency fails only its page role',()=>{const {project,selected}=fixture();selected.assetMetadataByRole.cover.styleKey='geometry';const report=api().createReport(project,selected);assert.deepEqual(JSON.parse(JSON.stringify(report.regenerationTargets)),[{pageId:'cover',generatedRole:'cover',monthKey:null,reasons:['visual-inconsistency']}])});
