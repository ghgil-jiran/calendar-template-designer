import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import '../apps/designer-studio/graphic-vector-design.js';
import '../apps/designer-studio/graphic-package-model.js';
import '../apps/designer-studio/graphic-template-mapping.js';
import {validateGraphicSvg} from '../server/graphic-library.js';
const m=globalThis.ACDLGraphicTemplateMapping,v=globalThis.ACDLGraphicVectorDesign;
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(){
 const keys=['cover','cover-inside','year','symbols','month-front','month-back','back-cover'];
 const graphics=keys.map(key=>({id:key,name:key,originalAssetId:'original-'+key,design:v.normalize({page:key,backgroundRevision:2,variation:key.startsWith('month')?'monthly':'same',palette:'terracotta'})}));
 const pkg={id:'package',name:'사각 배경',size:'desk-standard',revision:4,pages:Object.fromEntries(keys.map(key=>[key,{graphicId:key}]))};
 const project={productType:{pageSize:{width:260,height:180,unit:'mm'}},settings:{year:2027},template:{id:'test',masters:{},masterElements:{},settings:{vectorBackgroundEnabled:true,aiDesignSpec:{dividerPages:{inside:{purpose:'school-symbols'},insert:{purpose:'annual-calendar'}}}}},book:{pageInstances:[{id:'cover',role:'cover-front'},{id:'inside',role:'cover-back'},{id:'insert',role:'front-insert-back'},...Array.from({length:12},(_,i)=>({id:'month-'+i,role:'monthly-back',calendarMonth:(i+2)%12+1})),{id:'rear',role:'rear-insert-front'}],elementsByPage:{cover:[{id:'photo',type:'image',src:'original-photo'},{id:'text',type:'text',content:'학교명'}]}}};
 project.template.settings.graphicPackage=m.capture(pkg,graphics,project.productType.pageSize);return {project,pkg,graphics};
}
test('purpose takes precedence over physical face; unmatched pages remain unmatched',()=>{
 const {project}=setup(),rows=m.mapping(project);assert.equal(rows[0].key,'cover');assert.equal(rows[1].key,'symbols');assert.equal(rows[2].key,'year');assert.equal(rows.at(-1).entry,null);
 delete project.template.settings.graphicPackage.entries.symbols;assert.equal(m.mapping(project)[1].key,'cover-inside');
 project.template.settings.aiDesignSpec={pageSettings:{roleCompositions:{annual:{typeId:'open-grid',components:['year-calendar']}}}};assert.equal(m.mapping(project)[1].key,'year');
 assert.equal(m.physical({role:'monthly-back',sharedSurface:'cover-inside'}),'month-back');
});
test('manual choices and background none survive serialization; automatic reset restores matching',()=>{
 const {project}=setup(),s=project.template.settings.graphicPackage;s.overrides.inside='year';s.overrides.cover=null;
 let rows=m.mapping(clone(project));assert.equal(rows[0].key,null);assert.equal(rows[0].manual,true);assert.equal(rows[1].key,'year');delete s.overrides.inside;assert.equal(m.mapping(project)[1].key,'symbols');
});
test('applying twice preserves original objects and pages, replaces only package backgrounds, and expands 3mm',()=>{
 const {project}=setup(),before=clone(project.book.pageInstances),photo=project.book.elementsByPage.cover[0];m.apply(project);m.apply(project);
 assert.deepEqual(project.book.pageInstances,before);assert.equal(project.book.elementsByPage.cover.filter(e=>e.role==='graphic-package-background').length,1);assert.equal(project.book.elementsByPage.cover[1],photo);
 const e=project.book.elementsByPage.cover[0];assert.equal(e.type,'vector');assert.equal(e.src,undefined);assert.ok(Math.abs(e.x*2.6+3)<1e-8);assert.ok(Math.abs(e.width*2.6-266)<1e-8);assert.ok(Math.abs(e.height*1.8-186)<1e-8);assert.equal(e.printIntent.directPdfMapping,false);assert.equal(e.printIntent.locked,true);
 assert.equal(project.book.elementsByPage.rear.length,0);project.template.settings.graphicPackage.overrides.cover=null;m.apply(project);assert.deepEqual(project.book.elementsByPage.cover.map(e=>e.id),['photo','text']);
});
test('snapshot reproduces background after package edits/deletion; each monthly instance uses actual month',()=>{
 const {project,pkg,graphics}=setup();m.apply(project);const original=m.svg(project.book.elementsByPage.cover[0].value);
 pkg.pages={};graphics[0].design.colors[0]='#000000';const restored=clone(project);m.apply(restored);assert.equal(m.svg(restored.book.elementsByPage.cover[0].value),original);
 for(let i=0;i<12;i++)assert.equal(restored.book.elementsByPage['month-'+i][0].value.graphicMonth,(i+2)%12+1);
 assert.notEqual(m.svg(restored.book.elementsByPage['month-0'][0].value),m.svg(restored.book.elementsByPage['month-1'][0].value));
});
test('bleed SVG is pure vector, retains seasonal background color and namespaces gradient IDs',()=>{
 const {project}=setup();m.apply(project);const e=project.book.elementsByPage['month-0'][0],svg=m.svg(e.value);validateGraphicSvg(svg);
 assert.ok(svg.includes('viewBox="-15 -15 1330 930"'));assert.ok(svg.includes('<rect x="-15" y="-15" width="1330" height="930"'));assert.ok(!/<(?:image|text|filter)\b/.test(svg));
 const ids=[...svg.matchAll(/id="([\w-]+)"/g)].map(x=>x[1]);for(const ref of svg.matchAll(/url\(#([\w-]+)\)/g))assert.ok(ids.includes(ref[1]));const other=m.svg({...e.value,graphicMonth:4});assert.notEqual(ids[0],other.match(/id="([\w-]+)"/)[1]);
 const baseColor=v.svg(e.value.graphicDesign,3).match(/<rect width="1300" height="900" fill="([^"]+)"/)[1];assert.ok(svg.includes(`height="930" fill="${baseColor}"`));
});
test('unsupported sizes or empty/illustration-only packages fail without changing the template',()=>{
 const {project,pkg,graphics}=setup();assert.throws(()=>m.capture(pkg,graphics,{width:297,height:210}));assert.throws(()=>m.capture({...pkg,pages:{}},graphics,project.productType.pageSize));assert.throws(()=>m.capture({...pkg,pages:{cover:{graphicId:'illustration'}}},[{id:'illustration',design:{kind:'illustration'}}],project.productType.pageSize));
 project.productType.pageSize.width=297;const before=JSON.stringify(project);assert.throws(()=>m.apply(project));assert.equal(JSON.stringify(project),before);
});
test('common screen helpers render package SVG and runtime adapter preserves the exact recipe and bleed frame',()=>{
 const context={structuredClone};vm.createContext(context);for(const file of ['graphic-vector-design.js','graphic-package-model.js','graphic-template-mapping.js','page-composition-runtime.js','shared-screen-vector.js','shared-screen-composition.js','runtime-project-adapter.js'])vm.runInContext(readFileSync(new URL('../apps/designer-studio/'+file,import.meta.url),'utf8'),context);
 const {project}=setup();m.apply(project);const e=project.book.elementsByPage.cover[0];assert.equal(context.ACDLSharedVector.renderVectorSvg(e.assetId,e.colors),context.ACDLPageCompositionRuntime.renderVectorSvg(e.assetId,e.colors));assert.ok(context.ACDLSharedVector.renderVectorSvg(e.assetId,e.colors).includes('1330 930'));
 const adapter=context.ACDLRuntimeProjectAdapter.create({datasetDomain:{buildRuntimeDataset:()=>({}),resolvePageBinding:p=>p},parity:{buildDeskAcademicSurfacePlan:()=>[]},pageAdapter:{compose:()=>({pages:[],complete:true})}});const result=adapter.adapt(project,undefined,{}),node=result.template.pages[0].objects.find(x=>x.id===e.id);
 assert.equal(JSON.stringify(node.value.graphicDesign),JSON.stringify(e.value.graphicDesign));assert.equal(node.frame.x,-3);assert.equal(node.frame.width,266);assert.equal(node.style.graphicBleedMm,3);assert.equal(node.printIntent.structure,'runtime-expansion-required');
});
