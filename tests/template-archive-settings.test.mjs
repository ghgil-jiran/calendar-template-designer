import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
test('archive settings skip broken cover capture, retain the original and synchronize the active catalog',async()=>{
 const original={template:{thumbnail:null,metadata:{name:'old'}},settings:{startMonth:3}};let savedInput,options,synchronized=0,deferred=false;
 const record={id:'t1',remoteId:'t1',name:'old',edition:2027,state:'ready'};
 const window={ACDLPersistenceProject:{clone:structuredClone},ACDLTemplateYearSynchronizer:{synchronize(){}},ACDLRepresentativePreview:{refresh(){throw Error('invalid cover')}},ACDLTemplateRemotePersistence:{isRemote:()=>true,load:async(id,opts)=>{deferred=opts.deferAssets;return {version:{storedProjectData:original}}},save:async(input,opts)=>{savedInput=input;options=opts;return {template:{id:'t1',name:'old',state:'archived'},version:{projectData:input.projectData}}}},ACDLTemplatePublishing:{synchronizeCatalog:async()=>{synchronized++}}};
 const context={window,records:()=>[record],projectForRecord(){throw Error('must not hydrate images')},scopeOf:()=> 'base',normalize:x=>x,saveTemplateProjectData:async()=>{},oldLibrary:()=>[],saveRecords(){},renderLibrary(){},renderUserChoices(){},showEditorToast(){},activeLibraryState:'all',structuredClone};
 vm.createContext(context);const a=source.indexOf(' async function saveSettings('),b=source.indexOf(' window.ACDLTemplateLibrarySettings=',a);vm.runInContext(source.slice(a,b)+';globalThis.save=saveSettings',context);
 await context.save('t1',{state:'archived',name:'old',edition:2027});
 assert.equal(deferred,true);assert.equal(options.verifyThumbnail,false);assert.equal(savedInput.projectData.template.thumbnail,null);assert.equal(savedInput.state,'archived');assert.equal(synchronized,1);assert.equal(original.template.metadata.state,undefined);
});
