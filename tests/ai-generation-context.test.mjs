import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../apps/designer-studio/ai-design/ai-generation-context@0.1.0.js',import.meta.url),'utf8');
function api(){const context={};vm.createContext(context);vm.runInContext(source,context);return context.ACDLAIGenerationContext}
function project(definition,pages){return {productType:{category:definition.family.id,pageSize:definition.finishedSize,duplex:definition.printSides==='duplex'},template:{calendarTypeSnapshot:{definition},resources:{exportSettings:{dpi:300,bleed:3,safeMargin:5}}},book:{pageInstances:pages}}}

test('desk generation context enables all roles present in its page structure',()=>{
 const definition={id:'desk-standard',family:{id:'desk'},orientation:'landscape',printSides:'duplex',binding:{edge:'top',method:'wire-o'},finishedSize:{width:260,height:180,unit:'mm'},productionSize:{width:266,height:186,unit:'mm'},policies:{cover:'required',annualSingle:'optional',monthlyFront:'required',monthlyBack:'required',backCover:'required'},pageRules:[{role:'school-symbols'}]};
 const pages=[{id:'cover',role:'cover-front'},{id:'annual',role:'cover-back'},{id:'symbols',role:'front-insert-front',semanticPageRole:'school-symbols'},{id:'front',role:'monthly-front'},{id:'back',role:'monthly-back'},{id:'closing',role:'back-cover-front'}];
 const result=api().build(project(definition,pages));
 assert.deepEqual([...result.enabledRoles],['cover','annual','school-symbols','month','month-back','back-cover']);
 assert.deepEqual([...result.monthlyRoles],['month','month-back']);
 assert.equal(result.print.bleedMm,3);
});

test('poster generation context enables only annual',()=>{
 const definition={id:'poster-standard',family:{id:'single-sheet'},orientation:'portrait',printSides:'simplex',binding:{edge:'none',method:'none'},finishedSize:{width:420,height:594,unit:'mm'},productionSize:{width:426,height:600,unit:'mm'},policies:{cover:'unsupported',annualSingle:'required',monthlyFront:'unsupported',monthlyBack:'unsupported',backCover:'unsupported'},pageRules:[{role:'annual'}]};
 const result=api().build(project(definition,[{id:'annual',role:'poster-annual'}]));
 assert.deepEqual([...result.enabledRoles],['annual']);
 assert.deepEqual([...result.monthlyRoles],[]);
});

test('wall generation context does not invent an absent optional month back',()=>{
 const definition={id:'wall-standard',family:{id:'wall'},orientation:'portrait',printSides:'duplex',binding:{edge:'top',method:'wire-o'},finishedSize:{width:299,height:419,unit:'mm'},productionSize:{width:305,height:425,unit:'mm'},policies:{cover:'required',annualSingle:'required',monthlyFront:'required',monthlyBack:'optional',backCover:'unsupported'},pageRules:[]};
 const result=api().build(project(definition,[{id:'cover',role:'cover-front'},{id:'month',role:'monthly-front'},{id:'annual',role:'annual'}]));
 assert.deepEqual([...result.enabledRoles],['cover','annual','month']);
 assert.deepEqual([...result.monthlyRoles],['month']);
});
