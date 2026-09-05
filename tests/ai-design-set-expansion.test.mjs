import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function api(){const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design/design-set-expansion@0.1.0.js',import.meta.url),'utf8'),context={};context.window=context;vm.createContext(context);vm.runInContext(source,context);return context.ACDLDesignSetExpansion}
function monthKey(index){const date=new Date(2027,2+index,1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
function fixture(){
 const pageInstances=[{id:'cover',role:'cover-front'},{id:'annual',role:'cover-back'},{id:'symbols',role:'front-insert-front',semanticPageRole:'school-symbols'}],elementsByPage={},monthlyVariations=[],monthlyAssets={};
 for(let index=0;index<12;index+=1){const key=monthKey(index);monthlyVariations.push({key});monthlyAssets[key]={month:`asset-month-${key}`,'month-back':`asset-back-${key}`,metadata:{}};pageInstances.push({id:`front-${key}`,role:'monthly-front',monthKey:key,calendarYear:Number(key.slice(0,4)),calendarMonth:Number(key.slice(5))},{id:`back-${key}`,role:'monthly-back',monthKey:key,calendarYear:Number(key.slice(0,4)),calendarMonth:Number(key.slice(5))})}
 pageInstances.push({id:'closing',role:'back-cover-front'});
 const selected={monthlyVariations,monthlyAssets,assetsByRole:{cover:'cover-asset',annual:'annual-asset','school-symbols':'symbols-asset','back-cover':'closing-asset'}};
 pageInstances.forEach(page=>{const role=api().generatedRole(page),key=api().monthKey(page);elementsByPage[page.id]=[{role:'ai-design-background',aiDesign:{assetId:`asset-${page.id}`,generatedRole:role,...(key?{monthKey:key}:{})}}]});
 return {project:{book:{pageInstances,elementsByPage}},selected};
}

test('selected design set expansion covers all twelve monthly pairs and representative roles',()=>{
 const {project,selected}=fixture(),report=api().createReport(project,selected);
 assert.equal(report.schemaVersion,'ai-design-set-expansion.v1@0.1.0');
 assert.equal(report.status,'complete');
 assert.equal(report.expectedMonthCount,12);
 assert.equal(report.generatedMonthlyAssetCount,24);
 assert.equal(report.appliedPageCount,28);
 assert.equal(report.missingMonthlyAssets.length,0);
 assert.equal(report.missingPages.length,0);
 assert.equal(report.roleCounts.month.applied,12);
 assert.equal(report.roleCounts['month-back'].applied,12);
 assert.ok(project.book.pageInstances.every(page=>page.aiDesignExpansion?.editableContentPreserved));
});

test('expansion report identifies a missing monthly role asset and its unapplied page',()=>{
 const {project,selected}=fixture(),key=monthKey(5);delete selected.monthlyAssets[key]['month-back'];project.book.elementsByPage[`back-${key}`]=[];
 const report=api().createReport(project,selected);
 assert.equal(report.status,'incomplete');
 assert.deepEqual(JSON.parse(JSON.stringify(report.missingMonthlyAssets)),[{monthKey:key,role:'month-back'}]);
 assert.equal(report.missingPages[0].pageId,`back-${key}`);
});
