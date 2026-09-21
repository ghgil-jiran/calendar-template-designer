import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design/ai-generation-context@0.2.0.js',import.meta.url),'utf8');
function api(){const context={};vm.createContext(context);vm.runInContext(source,context);return context.ACDLAIGenerationContext}
function project(definition,pages){return {productType:{category:definition.family.id,pageSize:definition.finishedSize,duplex:definition.printSides==='duplex'},template:{calendarTypeSnapshot:{definition},resources:{exportSettings:{dpi:300,bleed:3,safeMargin:5}}},book:{pageInstances:pages}}}

test('desk generation context enables all roles present in its page structure',()=>{
 const definition={id:'desk-standard',family:{id:'desk'},orientation:'landscape',printSides:'duplex',binding:{edge:'top',method:'wire-o'},finishedSize:{width:260,height:180,unit:'mm'},productionSize:{width:266,height:186,unit:'mm'},policies:{cover:'required',annualSingle:'optional',monthlyFront:'required',monthlyBack:'required',backCover:'required'},pageRules:[{role:'school-symbols'}]};
 const pages=[{id:'cover',role:'cover-front'},{id:'annual',role:'cover-back'},{id:'symbols',role:'front-insert-front',semanticPageRole:'school-symbols'},{id:'front',role:'monthly-front'},{id:'back',role:'monthly-back'},{id:'closing',role:'back-cover-front'}];
 const result=api().build(project(definition,pages));
 assert.deepEqual([...result.enabledRoles],['cover','annual','divider','month','month-back','back-cover']);
 assert.equal(result.roles.find(item=>item.role==='divider').targets[0].pageId,'symbols');
 assert.deepEqual([...result.monthlyRoles],['month','month-back']);
 assert.equal(result.print.bleedMm,3);
 const plan=api().plan(result,{monthCount:12,quality:'low'});
 assert.equal(plan.representativeCount,6);
 assert.equal(plan.monthlyAssetCount,24);
 assert.equal(plan.generationCount,28);
 assert.equal(plan.estimatedCostUsd,0.364);
});

test('page settings become restrained image roles with a print-resolution plan',()=>{
 const definition={id:'desk-standard',family:{id:'desk'},finishedSize:{width:260,height:180,unit:'mm'},productionSize:{width:266,height:186,unit:'mm'},policies:{cover:'required',frontInsert:'optional',monthlyFront:'required',monthlyBack:'required'}};
 const value=project(definition,[{id:'cover',role:'cover-front'},{id:'schedule',role:'front-insert-front',semanticPageRole:'divider'},{id:'month',role:'monthly-front'},{id:'back',role:'monthly-back'}]);
 value.template.settings={aiDesignSpec:{dividerPages:{schedule:{purpose:'academic-schedule',layoutId:'schedule-month-cards',objects:['title','schedule-list']}}}};
 const result=api().build(value),targets=Object.fromEntries(result.pageTargets.map(item=>[item.pageId,item]));
 assert.equal(result.schemaVersion,'ai-generation-context.v3@0.3.0');
 assert.equal(result.print.pdfStandard,'PDF/X-4');
 assert.equal(result.print.outputIntent,'Japan Color 2011 Coated');
 assert.equal(targets.cover.imageRole,'full-bleed-background');
 assert.equal(targets.schedule.visualWeight,'quiet');
 assert.deepEqual([...targets.month.decorationCoveragePercent],[0,12]);
 assert.deepEqual(JSON.parse(JSON.stringify(targets.month.printImagePlan.requiredPixels)),{width:3142,height:2197});
 assert.equal(targets.month.printImagePlan.upscaleRequired,true);
});

test('optional annual generation follows the saved semantic purpose of the physical cover-back surface',()=>{const definition={id:'desk-standard',family:{id:'desk'},finishedSize:{width:260,height:180},productionSize:{width:266,height:186},policies:{cover:'required',annualSingle:'optional',backCover:'required'}},value=project(definition,[{id:'front',role:'cover-front'},{id:'back',role:'cover-back',semanticPageRole:'cover-continuation'},{id:'closing',role:'back-cover-back'}]),result=api().build(value);assert.equal(result.roles.find(item=>item.role==='annual').enabled,false);assert.deepEqual([...result.roles.find(item=>item.role==='cover').pageIds],['front','back']);assert.ok(!result.enabledRoles.includes('annual'))});

test('desk cover inside annual is generated even when the single-sheet annual policy is unsupported',()=>{
 const definition={id:'desk-standard',family:{id:'desk'},finishedSize:{width:260,height:180},productionSize:{width:266,height:186},policies:{cover:'required',annualSingle:'unsupported',frontInsert:'optional',monthlyFront:'required',monthlyBack:'required',backCover:'required'}};
 const pages=[
  {id:'surface.1.front',role:'cover-front'},
  {id:'surface.1.back',role:'cover-back',semanticPageRole:'yearly-calendar'},
  {id:'surface.2.front',role:'front-insert-front',semanticPageRole:'school-symbols'},
  {id:'surface.2.back',role:'front-insert-back',semanticPageRole:'academic-schedule'},
  ...Array.from({length:12},(_,index)=>[{id:`surface.month.${index+1}.front`,role:'monthly-front'},{id:`surface.month.${index+1}.back`,role:'monthly-back'}]).flat(),
  {id:'surface.15.front',role:'back-cover-front'},
  {id:'surface.15.back',role:'back-cover-back'}
 ];
 const result=api().build(project(definition,pages)),annual=result.roles.find(item=>item.role==='annual'),plan=api().plan(result,{monthCount:12,quality:'low'});
 assert.equal(annual.enabled,true);
 assert.deepEqual([...annual.pageIds],['surface.1.back']);
 assert.equal(plan.actualPageCount,30);
 assert.equal(plan.representativeCount,8);
 assert.equal(plan.generationCount,30);
});

test('surface audit rejects unknown and unintended empty fixed surfaces while allowing an explicit blank divider',()=>{
 const definition={id:'desk-standard',family:{id:'desk'},finishedSize:{width:260,height:180,unit:'mm'},productionSize:{width:266,height:186,unit:'mm'},policies:{cover:'required',monthlyFront:'required'}};
 const value=project(definition,[{id:'cover',role:'cover-front'},{id:'mystery',role:'unknown'},{id:'blank',role:'front-insert-front'}]);
 value.book.elementsByPage={cover:[],mystery:[],blank:[]};
 value.template.settings={aiDesignSpec:{dividerPages:{blank:{purpose:'blank'}}}};
 const audit=api().surfaceAudit(value);
 assert.deepEqual([...audit.unassignedPageIds],['mystery']);
 assert.deepEqual([...audit.unintendedEmptyPageIds],['cover']);
 assert.equal(audit.surfaces.find(item=>item.pageId==='blank').explicitBlank,true);
 assert.equal(audit.valid,false);
});

test('poster generation context is blocked while the feature is desk-only',()=>{
 const definition={id:'poster-standard',family:{id:'single-sheet'},orientation:'portrait',printSides:'simplex',binding:{edge:'none',method:'none'},finishedSize:{width:420,height:594,unit:'mm'},productionSize:{width:426,height:600,unit:'mm'},policies:{cover:'unsupported',annualSingle:'required',monthlyFront:'unsupported',monthlyBack:'unsupported',backCover:'unsupported'},pageRules:[{role:'annual'}]};
 const result=api().build(project(definition,[{id:'annual',role:'poster-annual'}]));
 assert.deepEqual([...result.enabledRoles],[]);
 assert.deepEqual([...result.monthlyRoles],[]);
 const plan=api().plan(result,{monthCount:12,quality:'medium'});
 assert.equal(plan.familyId,'single-sheet');
 assert.equal(plan.representativeCount,0);
 assert.equal(plan.monthCount,0);
 assert.equal(plan.monthlyAssetCount,0);
 assert.equal(plan.generationCount,0);
 assert.equal(plan.estimatedCostUsd,0);
});

test('wall generation context is blocked while the feature is desk-only',()=>{
 const definition={id:'wall-standard',family:{id:'wall'},orientation:'portrait',printSides:'duplex',binding:{edge:'top',method:'wire-o'},finishedSize:{width:299,height:419,unit:'mm'},productionSize:{width:305,height:425,unit:'mm'},policies:{cover:'required',annualSingle:'required',monthlyFront:'required',monthlyBack:'optional',backCover:'unsupported'},pageRules:[]};
 const result=api().build(project(definition,[{id:'cover',role:'cover-front'},{id:'month',role:'monthly-front'},{id:'annual',role:'annual'}]));
 assert.deepEqual([...result.enabledRoles],[]);
 assert.deepEqual([...result.monthlyRoles],[]);
 const plan=api().plan(result,{monthCount:12,quality:'low'});
 assert.equal(plan.representativeCount,0);
 assert.equal(plan.monthlyAssetCount,0);
 assert.equal(plan.generationCount,0);
});
