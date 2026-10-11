import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {validateVersionSave} from '../server/template-persistence.js';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const context={window:{},TextEncoder,structuredClone};
vm.createContext(context);
vm.runInContext(read('apps/designer-studio/persistence-project.js'),context);
const policy=context.window.ACDLUserEditingPolicy,persistence=context.window.ACDLPersistenceProject;
const plain=value=>JSON.parse(JSON.stringify(value));
const fixture=()=>({format:'acdl-project',settings:{year:2027},template:{masterElements:{monthly:[{id:'master',type:'text',binding:'school.name',permissions:{content:true}}]}},book:{pageInstances:[{id:'cover',role:'cover-front'},{id:'month',role:'monthly-front'}],elementsByPage:{cover:[{id:'photo',type:'image-frame',image:{binding:'assets.coverPhoto'},x:10,y:20,width:60,height:40},{id:'fixed',type:'image',locked:true,selectable:false,permissions:{move:true}},{id:'required',type:'text',required:true,permissions:{delete:true}}],month:[{id:'blocked',type:'image-frame',binding:'monthlyImages.2027-03',permissions:{replaceImage:false}},{id:'logo',type:'image-frame',image:{binding:'school.profile.logo'},permissions:{replaceImage:true}}]}}});

test('legacy projects normalize master, page and nested permissions without changing layout or data',()=>{
 const project=fixture(),photo=project.book.elementsByPage.cover[0];photo.children=[{id:'child',type:'text'}];
 policy.normalizeProject(project);
 assert.equal(project.template.userEditing.schemaVersion,policy.schemaVersion);
 assert.equal(photo.permissions.replaceImage,true);assert.equal(photo.permissions.imageFit,true);assert.equal(photo.permissions.move,false);
 assert.deepEqual([photo.x,photo.y,photo.width,photo.height],[10,20,60,40]);
 assert.equal(photo.children[0].permissions.resize,false);
 assert.equal(project.template.masterElements.monthly[0].permissions.content,true);
 assert.equal(project.book.elementsByPage.cover[1].permissions.move,false);
 assert.equal(project.book.elementsByPage.cover[2].permissions.delete,false);
 assert.equal(project.book.elementsByPage.month[0].permissions.replaceImage,false);
 assert.equal(project.book.elementsByPage.month[1].permissions.replaceImage,false);
 const normalized=JSON.stringify(project);policy.normalizeProject(project);assert.equal(JSON.stringify(project),normalized);
});

test('image replacement, internal fit and frame movement remain independent through save and reopen',()=>{
 const project=fixture();policy.normalizeProject(project);const photo=project.book.elementsByPage.cover[0];
 Object.assign(photo.permissions,{replaceImage:false,imageFit:true,move:true,resize:true});photo.userReplaceable=false;
 const reopened=persistence.deserialize(persistence.serialize(project)),saved=reopened.book.elementsByPage.cover[0];
 assert.equal(saved.permissions.replaceImage,false);assert.equal(saved.permissions.imageFit,true);assert.equal(saved.permissions.move,true);assert.equal(saved.permissions.resize,true);
 assert.equal(saved.image.binding,'assets.coverPhoto');assert.equal(saved.x,10);
});

test('template additions and per-page allow, deny and inheritance survive persistence',()=>{
 const project=fixture();policy.normalizeProject(project);project.template.userEditing.additions={image:true,text:false};
 project.book.pageInstances[0].userEditing.additions={image:false,text:true};
 const saved=persistence.clone(project);
 assert.deepEqual(plain(policy.effectiveAdditions(saved,saved.book.pageInstances[0])),{image:false,text:true});
 assert.deepEqual(plain(policy.effectiveAdditions(saved,saved.book.pageInstances[1])),{image:true,text:false});
 assert.equal(saved.template.userEditing.userAddedPermissions.move,true);
 assert.deepEqual(plain(saved.template.userEditing.pageStructure),{add:false,delete:false,reorder:false,resize:false});
});

test('server version save enforces the same policy as browser persistence',()=>{
 const project=fixture();const saved=validateVersionSave({stableKey:'desk-policy',name:'권한 검토',state:'draft',edition:2027,saveKind:'manual',schemaVersion:'2.0',productType:'desk',templateKey:'school-basic',projectData:project});
 assert.equal(saved.projectData.template.userEditing.schemaVersion,policy.schemaVersion);
 assert.deepEqual(plain(saved.projectData),plain(persistence.clone(fixture())));
});

test('review bundle includes explicit rights and per-page overrides',()=>{
 vm.runInContext(read('apps/designer-studio/template-publishing-runtime.js'),context);
 const project=fixture();policy.normalizeProject(project);project.book.pageInstances[0].userEditing.additions.text=true;
 const bundle=context.window.ACDLTemplatePublishing.buildBundle(project,{id:'desk-policy',version:'1.0.0',name:'권한 검토',productType:'desk'});
 const stored=plain(bundle.template.projectData);
 assert.equal(stored.template.userEditing.schemaVersion,policy.schemaVersion);assert.equal(stored.book.pageInstances[0].userEditing.additions.text,true);
 assert.equal(stored.book.elementsByPage.cover[0].permissions.imageFit,true);
});

test('frozen production corrections are not migrated by template policy',()=>{
 const project=fixture();project.productionCorrection={requestId:'receipt'};const before=JSON.stringify(project);
 persistence.serialize(project);assert.equal(JSON.stringify(project),before);
});

test('permission panel saves selected frame rights to matching months without resetting other rights',()=>{
 const source=read('apps/designer-studio/features/object-editing-workspace-layout-v38.js');
 const project=fixture();policy.normalizeProject(project);
 const item=project.book.elementsByPage.cover[0],second=structuredClone(item);second.id='second';second.permissions.content=true;
 project.book.elementsByPage.month.push(second);
 const page=project.book.pageInstances[0];page.role='monthly-front';
 const ui={window:context.window,project,normalizeElementData(){},permissionHTML(){return 'original'},selectedPage:()=>page,matchingMonthlyObjectsFor:()=>[item,second]};
 vm.createContext(ui);
 vm.runInContext(source.slice(source.indexOf(' const policy='),source.indexOf(' const $=')),ui);
 const html=ui.permissionHTML(item);
 assert.match(html,/data-user-permission="move"/);assert.match(html,/data-user-permission="imageFit"/);assert.match(html,/data-template-addition="image"/);assert.match(html,/data-page-addition="text"/);
 const fields={
  '[data-user-permission]':[{dataset:{userPermission:'move'},checked:true},{dataset:{userPermission:'resize'},checked:false},{dataset:{userPermission:'replaceImage'},checked:true},{dataset:{userPermission:'imageFit'},checked:false}],
  '[data-template-addition]':[{dataset:{templateAddition:'image'},checked:true}],
  '[data-page-addition]':[{dataset:{pageAddition:'text'},value:'true'},{dataset:{pageAddition:'image'},value:'inherit'}],
 };
 ui.item=item;ui.button={closest:()=>({querySelectorAll:key=>fields[key]||[]})};ui.snapshot=()=>{};ui.$=id=>id==='graphicRequired'?{checked:false}:id==='applyMonthlyPermissions'?{checked:true}:null;
 vm.runInContext(source.slice(source.indexOf('  const panel=button.closest'),source.indexOf('  markDirty();render();',source.indexOf('  const panel=button.closest'))),ui);
 for(const target of [item,second]){assert.equal(target.permissions.move,true);assert.equal(target.permissions.resize,false);assert.equal(target.permissions.imageFit,false)}
 assert.equal(second.permissions.content,true);
 const reopened=persistence.clone(project);
 assert.equal(reopened.template.userEditing.additions.image,true);assert.equal(reopened.book.pageInstances[0].userEditing.additions.text,true);
 assert.equal(reopened.book.elementsByPage.month.at(-1).permissions.move,true);
});
