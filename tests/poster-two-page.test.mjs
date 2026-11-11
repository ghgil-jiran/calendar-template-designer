import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../apps/designer-studio/project-document.js';import '../apps/designer-studio/calendar-type-domain.js';import '../apps/designer-studio/poster-one-page-sample.js';import '../apps/designer-studio/poster-two-page-sample.js';import '../apps/designer-studio/shared-screen-mini-calendar.js';import {installPosterSample} from '../server/poster-sample-installation.js';
const factory=globalThis.ACDLPosterTwoPageSample,domain=globalThis.ACDLCalendarTypeDomain,mini=globalThis.ACDLSharedMiniCalendar,documentModel=globalThis.ACDLProjectDocument;
const source={book:{events:[{id:'cross',title:'학기 연결 일정',startDate:'2027-08-31',endDate:'2027-09-04'}],school:{name:'연결 학교',englishName:'LINK SCHOOL',profile:{logo:{image:'acdl-asset://logo'}}}}};
function resolve(project,page){const e=project.book.elementsByPage[page.id].find(e=>e.academicPoster),m=mini.resolveAnnualCalendar(e,page,{year:project.settings.year,startMonth:project.settings.startMonth,calendarRows:6});return {e,m,html:mini.renderAnnualCalendarMarkup(m,e,{project})}}
test('two-page sample has six distinct months per sheet, shared school bindings and no photo/contact requirements',()=>{
 const before=JSON.stringify(source),p=factory.create(source),[a,b]=p.book.pageInstances,first=resolve(p,a),second=resolve(p,b);assert.equal(p.book.pageInstances.length,2);assert.equal(p.productType.duplex,false);assert.equal(domain.validateProject(p,domain.definition('poster-two-page')).valid,true);
 assert.deepEqual(first.m.months.map(m=>m.month),[3,4,5,6,7,8]);assert.deepEqual(second.m.months.map(m=>m.month),[9,10,11,12,1,2]);assert.equal(second.m.months.at(-1).year,2028);
 assert.equal(new Set([...first.m.months,...second.m.months].map(m=>m.year+'-'+m.month)).size,12);
 for(const out of [first,second]){assert.equal(out.e.columns,2);assert.equal(out.e.posterShowList,false);assert.match(out.html,/grid-template-rows:repeat\(3,/);assert.doesNotMatch(out.html,/academic-poster-month-list/);assert.match(out.html,/학기 연결 일정/)}
 assert.equal(p.template.publishing.dataRequirements.some(i=>['school.profile.building','school.contacts'].includes(i.path)),false);assert.equal(JSON.stringify(source),before);
 for(const page of p.book.pageInstances)assert.ok(p.book.elementsByPage[page.id].some(e=>e.binding==='school.name'));
 const loaded=JSON.parse(JSON.stringify(p));assert.equal(resolve(loaded,loaded.book.pageInstances[1]).html,second.html);
});
test('start month and year changes move both halves consistently without relying on stale page years',()=>{
 const p=factory.create(source);p.settings.year=2029;p.settings.startMonth=10;const all=p.book.pageInstances.flatMap(page=>resolve(p,page).m.months);assert.deepEqual(all.map(m=>m.month),[10,11,12,1,2,3,4,5,6,7,8,9]);assert.equal(all[0].year,2029);assert.equal(all.at(-1).year,2030);
});
test('basic settings rebuild preserves both authored pages and their own objects',()=>{
 const sourceCode=fs.readFileSync(new URL('../apps/designer-studio/features/template-settings-library.js',import.meta.url),'utf8'),extract=name=>sourceCode.slice(sourceCode.indexOf('function '+name+'('),sourceCode.indexOf('\nfunction ',sourceCode.indexOf('function '+name+'(')+1));
 const p=factory.create(source),context=vm.createContext({project:p,structuredClone,window:{ACDLCalendarTypeDomain:domain},SIZE_PRESETS:{poster:[{id:'poster-a2',recommended:true,width:420,height:594}]},selectedPageId:p.book.pageInstances[0].id,selectedElementId:null,selectedElementScope:null,makeProject:options=>documentModel.createProject(options,{sizePresets:{poster:[{id:'poster-a2',width:420,height:594}]},buildMonths:()=>[]})});
 vm.runInContext(extract('pageTransferKey')+'\n'+extract('rebuildProjectFromBasicSettings')+'\nrebuildProjectFromBasicSettings({...project.settings,year:2028});',context);
 const result=context.project;assert.equal(result.book.pageInstances.length,2);for(let i=0;i<2;i++)assert.equal(result.book.elementsByPage[result.book.pageInstances[i].id].find(e=>e.academicPoster).posterMonthOffset,i*6);assert.notEqual(result.book.elementsByPage[result.book.pageInstances[0].id][0].id,result.book.elementsByPage[result.book.pageInstances[1].id][0].id);
});
test('two-page registration uses its own stable key and leaves both existing kinds untouched on retry',async()=>{
 let saved;const deps={list:async()=>[],load:async()=>({version:{projectData:source}}),types:async()=>[domain.definition('poster-two-page')],save:async value=>{saved=value;return {template:{id:'two'},version:{versionNumber:1}}}};
 const result=await installPosterSample(deps,2);assert.equal(result.pageCount,2);assert.equal(saved.stableKey,factory.STABLE_KEY);assert.equal(saved.state,'draft');
 const existing=await installPosterSample({...deps,list:async()=>[{id:'two',stableKey:factory.STABLE_KEY}],save:()=>{throw Error('must not overwrite')},load:()=>{throw Error('must not reload edited sample')}},2);assert.equal(existing.existing,true);
 const broken=factory.create(source);broken.book.pageInstances.pop();assert.equal(domain.validateProject(broken,domain.definition('poster-two-page')).valid,false);
});
