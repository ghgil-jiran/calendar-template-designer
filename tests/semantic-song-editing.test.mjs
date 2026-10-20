import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const editing=fs.readFileSync(new URL('../apps/designer-studio/features/object-editing.js',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');
function setup(){
 const item={id:'song',type:'semantic-object',role:'school-song',bindingEnabled:true,showTitle:true,sampleContent:{name:'샘플 교가',description:'샘플 설명',image:'sample.png'},style:{textAlign:'center'}};
 const context=vm.createContext({item,project:{mode:'template',book:{school:{profile:{song:{name:'실제 교가',description:'실제 설명',image:'actual.png'}}}}},semanticData:i=>i.sampleContent,ensureSchoolProfile(){},semanticTitleVisible:i=>i.showTitle!==false,semanticRoleLabel:()=> '교가',escapeAttr:x=>x,change:fn=>fn(),sourceElement:()=>item,ensureSemanticTemplateData(){},showEditorToast(){},semanticImageDraft:null,semanticImageDraftElementId:null,fields:{},handlers:{}});
 vm.runInContext('const oldSemanticData=semanticData;'+core.slice(core.indexOf('  semanticData=function'),core.indexOf('  const oldApply=applyUserSchoolData')),context);
 vm.runInContext(editing.slice(editing.indexOf('function renderSemanticObject('),editing.indexOf('function pageRecommendations(')),context);
 vm.runInContext('const el=id=>fields[id];const bind=(id,fn)=>handlers[id]=fn;'+editing.slice(editing.indexOf(' bind("applySemanticSample"'),editing.indexOf(' bind("applySemanticBinding"')),context);
 return context;
}
test('saves and displays authored song text while keeping actual school data unchanged',()=>{
 const c=setup();c.fields={semanticName:{value:'우리 학교 노래'},semanticDescription:{value:'새 설명'}};c.handlers.applySemanticSample();
 assert.equal(c.item.sampleContent.name,'우리 학교 노래');assert.equal(c.item.sampleContent.description,'새 설명');
 assert.equal(c.project.book.school.profile.song.name,'실제 교가');
 const html=vm.runInContext('renderSemanticObject(item)',c);assert.match(html,/우리 학교 노래/);assert.match(html,/새 설명/);assert.doesNotMatch(html,/실제 설명/);
 const saved=JSON.parse(JSON.stringify(c.item));c.item=saved;assert.match(vm.runInContext('renderSemanticObject(item)',c),/우리 학교 노래/);
});
test('renders all three song alignments and respects a hidden caption',()=>{
 const c=setup();for(const align of ['left','center','right']){c.item.style.textAlign=align;assert.ok(vm.runInContext('renderSemanticObject(item)',c).includes('width:100%;text-align:'+align));}
 c.item.showCaption=false;assert.doesNotMatch(vm.runInContext('renderSemanticObject(item)',c),/샘플 설명/);
});
test('user calendars and production correction retain bound school data',()=>{
 const c=setup();c.project.mode='calendar-workspace';assert.equal(vm.runInContext('semanticData(item).description',c),'실제 설명');
 c.item.bindingEnabled=false;assert.equal(vm.runInContext('semanticData(item).description',c),'샘플 설명');
 c.item.bindingEnabled=true;c.project.mode='template';c.project.productionCorrection=true;assert.equal(vm.runInContext('semanticData(item).description',c),'실제 설명');
});
test('new and cloned templates retain linked images without replacing authored text',()=>{
 for(const role of ['school-logo','school-building','school-song','school-tree','school-flower']){
  const c=setup(),key=role.replace('school-','');c.item.role=role;c.item.sampleContent.image='';
  c.project.book.school.profile[key]={name:'학교 정보 명칭',description:'학교 정보 설명',image:'linked-'+key+'.png'};
  const actual=vm.runInContext('semanticData(item)',c);assert.equal(actual.image,'linked-'+key+'.png');assert.equal(actual.name,'샘플 교가');assert.equal(actual.description,'샘플 설명');
  c.item=JSON.parse(JSON.stringify(c.item));assert.equal(vm.runInContext('semanticData(item).image',c),'linked-'+key+'.png');
  c.item.sampleContent.image='authored.png';assert.equal(vm.runInContext('semanticData(item).image',c),'authored.png');
  c.item.sampleContent.image='';c.item.bindingEnabled=false;assert.equal(vm.runInContext('semanticData(item).image',c),'');
 }
});
