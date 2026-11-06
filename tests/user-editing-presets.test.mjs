import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={structuredClone};vm.createContext(context);
vm.runInContext(readFileSync(new URL('../apps/designer-studio/persistence-project.js',import.meta.url),'utf8'),context);
const p=context.ACDLUserEditingPolicy,plain=v=>JSON.parse(JSON.stringify(v));
function fixture(mode='basic'){
 const photo={id:'photo',type:'image-frame',mediaPurpose:'user-replaceable-photo',permissions:{replaceImage:true,move:true,resize:true},x:10,y:20,width:30,height:40};
 const pages=[{id:'cover',role:'cover-front'},{id:'year',role:'cover-back',semanticPageRole:'yearly-calendar'},{id:'symbols',role:'front-insert-front',semanticPageRole:'school-symbols'},{id:'back',role:'monthly-back'},{id:'month',role:'monthly-front'},{id:'end',role:'back-cover-back'}];
 return {format:'acdl-project',settings:{},template:{userEditing:{preset:mode},masterElements:{}},book:{pageInstances:pages,elementsByPage:{back:[photo]}}};
}
test('basic and minimal allow only intended physical pages, including shared monthly backs',()=>{
 const project=fixture(),pages=project.book.pageInstances;
 assert.deepEqual(pages.map(page=>p.eligiblePage(project,page)),[true,false,true,true,false,true]);
 project.template.userEditing.preset='minimal';assert.deepEqual(pages.map(page=>p.eligiblePage(project,page)),[true,false,false,true,false,true]);
 const shared={...pages[3],sharedSurface:'divider-back:front:1',sourcePageId:'back'};assert.equal(p.eligiblePage(project,shared),true);
 project.template.settings={aiDesignSpec:{pageSettings:{monthBackMediaMode:'template-design'}}};assert.equal(p.eligiblePage(project,pages[3]),false);
 project.template.settings.aiDesignSpec.pageSettings.monthBackMediaMode='school-asset';assert.equal(p.eligiblePage(project,pages[3]),false);
});
test('school identity and user photos are linked; dates, years, decorations and calendars stay protected',()=>{
 const project=fixture(),cover=project.book.pageInstances[0];
 for(const binding of ['school.name','school.englishName','school.contacts','school.phone','school.profile.logo','school.profile.tree.description']){
  const rights=p.effectivePermissions(project,cover,{type:'text',binding});assert.equal(rights.move,true,binding);assert.equal(rights.resize,true);assert.equal(rights.content,false);assert.equal(rights.color,false);
 }
 for(const item of [{type:'text',binding:'calendar.year'},{type:'calendar',binding:'school.name'},{type:'text',binding:'calendar.currentMonth'},{type:'image',role:'graphic-package-background'},{type:'shape'},{type:'text',binding:'school.unrecognized'}])assert.equal(p.effectivePermissions(project,cover,item).move,false);
 const logo={type:'image-frame',image:{binding:'school.profile.logo'}};assert.equal(p.effectivePermissions(project,cover,logo).replaceImage,false);
});
test('month-back frames remain fixed through normalize, export and reopening; photo replacement stays enabled',()=>{
 const project=fixture(),page=project.book.pageInstances[3],photo=project.book.elementsByPage.back[0],before=JSON.stringify(photo);
 const rights=p.effectivePermissions(project,page,photo);assert.equal(rights.replaceImage,true);assert.equal(rights.imageFit,true);
 for(const key of ['move','resize','rotate','delete','duplicate','layer','color','content'])assert.equal(rights[key],false,key);
 assert.equal(JSON.stringify(photo),before);
 const saved=context.ACDLPersistenceProject.deserialize(context.ACDLPersistenceProject.serialize(project));
 assert.equal(saved.template.userEditing.preset,'basic');assert.equal(saved.book.elementsByPage.back[0].permissions.move,true);
 assert.equal(p.effectivePermissions(saved,saved.book.pageInstances[3],saved.book.elementsByPage.back[0]).move,false);
 project.template.userEditing.preset='individual';assert.equal(p.effectivePermissions(project,page,photo).move,true);
});
test('bulk additions ignore old overrides without erasing them and cannot unlock month fronts',()=>{
 const project=fixture(),cover=project.book.pageInstances[0],month=project.book.pageInstances[4];
 cover.userEditing={additions:{image:false,text:false}};month.userEditing={additions:{image:true,text:true}};
 assert.deepEqual(plain(p.effectiveAdditions(project,cover)),{image:true,text:true});assert.deepEqual(plain(p.effectiveAdditions(project,month)),{image:false,text:false});
 project.template.userEditing.preset='individual';assert.deepEqual(plain(p.effectiveAdditions(project,cover)),{image:false,text:false});assert.deepEqual(plain(p.effectiveAdditions(project,month)),{image:true,text:true});
});
test('old projects retain individual mode and production corrections remain unchanged',()=>{
 const project=fixture();delete project.template.userEditing.preset;p.normalizeProject(project);assert.equal(p.preset(project),'individual');
 project.productionCorrection={id:'frozen'};const before=JSON.stringify(project);p.normalizeProject(project);assert.equal(JSON.stringify(project),before);
});
