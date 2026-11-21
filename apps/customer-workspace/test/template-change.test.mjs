import test from 'node:test';import assert from 'node:assert/strict';
import {templateChangeDraft,compatibleTemplate,compatibleCatalogTemplates} from '../src/lib/editor/template-change.ts';
import {createEditorSession} from '../src/lib/editor/session.ts';
const card=id=>({id,name:id,widthMm:260,heightMm:180,calendarKind:'desk',period:'2027년 3월부터',fields:[],photoSlots:[]});
function source(prefix){return {format:'acdl-project',settings:{year:2027,startMonth:3},productType:{category:'desk',pageSize:{width:260,height:180}},template:{masters:{cover:{},back:{}},masterElements:{},userEditing:{preset:'individual'},resources:{},publishing:{dataRequirements:[]}},book:{school:{},events:[],pageInstances:[{id:prefix+'cover',role:'cover-front',masterId:'cover'},{id:prefix+'month',role:'monthly-back',masterId:'back',calendarYear:2027,calendarMonth:3}],elementsByPage:{[prefix+'cover']:[{id:prefix+'logo',type:'image-frame',image:{binding:'school.profile.logo',src:'sample-logo'},x:1,y:2,width:10,height:10,permissions:{replaceImage:true,imageFit:true}}],[prefix+'month']:[{id:prefix+'photo',type:'image-frame',image:{src:'sample-photo'},x:10,y:20,width:40,height:30,permissions:{replaceImage:true,imageFit:true}}]}}};}
const photo=(id)=>({id,url:'blob:'+id,file:new File(['bytes'],id+'.png'),width:600,height:400});
function draft(){return {template:card('A'),source:source('old'),school:{values:{name:'우리학교',motto:'교훈'},hidden:[]},events:[{id:'e',title:'입학식',startDate:'2027-03-02',endDate:'2027-03-02'}],photos:[photo('logo'),photo('monthly')],assignments:{'school:school.profile.logo':{photoId:'logo',url:'blob:logo'},'page:oldmonth:oldphoto':{photoId:'monthly',url:'blob:monthly'}},name:'기존 작업',id:'old-project',revision:7,step:'editor',photoSelections:{old:{photoId:'monthly'}}};}
test('new template retains user common images and source data; month placements, fit and geometry start fresh',()=>{const d=draft(),before=JSON.stringify(d),next=templateChangeDraft(d,card('D'),source('new'));assert.equal(next.id,undefined);assert.equal(next.revision,undefined);assert.equal(next.photos.length,2);assert.deepEqual(next.school,d.school);assert.deepEqual(next.events,d.events);assert.deepEqual(next.assignments,{'school:school.profile.logo':{photoId:'logo',url:'blob:logo'}});assert.deepEqual(next.editorState.edits,[]);assert.equal(next.editorState.pageId,'newcover');assert.deepEqual(next.photoSelections,{});assert.equal(JSON.stringify(d),before);});
test('a later explicit common-image edit supersedes its original assignment',()=>{const d=draft();d.photos.push(photo('replacement'));const session=createEditorSession({project:d.source,assets:d.photos.map(p=>({id:p.id,url:p.url}))});session.select(session.targets('oldcover').find(t=>t.binding==='school.profile.logo'));session.editPhoto({photoId:'replacement',fit:{fit:'contain',scale:2,offsetX:1,offsetY:2}});d.editorState=session.getState();const next=templateChangeDraft(d,card('B'),source('new'));assert.equal(next.assignments['school:school.profile.logo'].photoId,'replacement');assert.deepEqual(next.editorState.edits,[]);});
test('no user assignment means embedded sample logos are not transferred; a template with no month photo works',()=>{const d=draft();d.assignments={};const n=source('new');n.book.elementsByPage.newmonth=[];const next=templateChangeDraft(d,card('D'),n);assert.deepEqual(next.assignments,{});assert.equal(next.photos.length,2);});
test('different kind, size or period is excluded; fetched source year and start month are verified',()=>{for(const patch of [{calendarKind:'poster'},{widthMm:420},{period:'2028'}])assert.equal(compatibleTemplate(card('A'),{...card('B'),...patch}),false);for(const patch of [{year:2028},{startMonth:1}]){const n=source('new');Object.assign(n.settings,patch);assert.throws(()=>templateChangeDraft(draft(),card('B'),n),/연도와 시작 월/);}});

test('linked paper switching keeps the project and restores size-specific edits for the same version',()=>{
 const d=draft(),a3={...card('A'),version:3,calendarKind:'poster',widthMm:297,heightMm:420};
 const a2={...a3,id:'A2',version:8,widthMm:420,heightMm:594};
 const pair=[a3,a2],a2Source=source('large');
 d.template=a3;
 d.editorState={version:1,pageId:'oldmonth',edits:[]};
 const large=templateChangeDraft(d,a2,a2Source,pair);
 assert.equal(large.id,d.id);assert.equal(large.name,d.name);
 assert.deepEqual(large.events,d.events);assert.deepEqual(large.assignments['school:school.profile.logo'],d.assignments['school:school.profile.logo']);
 assert.equal(large.editorState.pageId,'largecover');
 const back=templateChangeDraft(large,a3,d.source,pair);
 assert.equal(back.editorState.pageId,'oldmonth');
 const updated=templateChangeDraft(large,{...a3,version:4},d.source,[{...a3,version:4},a2]);
 assert.equal(updated.editorState.pageId,'oldcover');
 assert.throws(()=>templateChangeDraft(d,a2,a2Source),/같은 유형/);
});

test('design picker shows linked designs at the current size and uses representative covers',()=>{
 const poster=(id,widthMm,heightMm)=>({...card(id),calendarKind:'poster',widthMm,heightMm});
 const e3={...poster('E3',297,420),coverUrl:'/e.png'},f3=poster('F3',297,420),g3=poster('G3',297,420);
 const e2=poster('E2',420,594),f2=poster('F2',420,594);
 const catalog=[e3,f3,g3,card('desk')],pairs=[[e3,e2],[f3,f2]];
 assert.deepEqual(compatibleCatalogTemplates(f3,catalog,pairs).map(item=>item.id),['E3','F3','G3']);
 const large=compatibleCatalogTemplates(f2,catalog,pairs);
 assert.deepEqual(large.map(item=>item.id),['E2','F2']);
 assert.equal(large[0].coverUrl,'/e.png');
});
