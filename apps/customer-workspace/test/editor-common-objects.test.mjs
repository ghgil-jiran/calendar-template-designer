import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorSession,applyEditor} from '../src/lib/editor/session.ts';
const photo=(id,extra={})=>({id,type:'image-frame',role:'monthly-image',x:10,y:15,width:30,height:20,image:{src:'template:'+id,fit:'contain',scale:1.2,offsetX:4,offsetY:2},permissions:{replaceImage:true,imageFit:true},...extra});
const logo=id=>({id,type:'semantic-object',role:'school-logo',binding:'school.profile.logo',x:70,y:5,width:15,height:8,showTitle:false,showCaption:false,sampleContent:{image:'logo'}});
function project(poster=false){return {format:'acdl-project',settings:{year:2027,startMonth:3},productType:{category:poster?'poster':'desk',pageSize:{width:poster?420:260,height:poster?594:180}},template:{masters:{calendar:{}},masterElements:{}},book:{school:{name:'학교',profile:{logo:{image:'logo'}}},pageInstances:[{id:'a',role:poster?'poster-annual':'monthly-front',masterId:'m',calendarYear:2027,calendarMonth:3},{id:'b',role:poster?'poster-annual':'monthly-front',masterId:'n',calendarYear:2027,calendarMonth:4},{id:'cover',role:'cover-front',masterId:'c'}],elementsByPage:{a:[photo('a-photo'),logo('a-logo'),{id:'slogan',type:'text',binding:'school.slogan',x:10,y:2,width:30,height:5,style:{fontSize:14}},{id:'year',type:'text',binding:'calendar.year',x:30,y:3,width:10,height:5},{id:'background',type:'image',role:'graphic-package-background',src:'bg',x:0,y:0,width:100,height:100,permissions:{replaceImage:true}}],b:[photo('b-photo',{x:25,image:{src:'other',fit:'cover',scale:1.8,offsetX:-12,offsetY:3}}),logo('b-logo')],cover:[photo('cover-photo')]}}};}
const assets=[{id:'new',url:'blob:new'}];
const selectPhoto=s=>{s.setPage('a');const t=s.targets('a').find(t=>t.elementId==='a-photo');s.select(t);return t;};
const item=(s,page,id)=>s.getDocument().book.elementsByPage[page].find(e=>e.id===id);

test('monthly front photo supports moving/resizing and layout sharing leaves recipient image fit intact',()=>{
 const p=project(),s=createEditorSession({project:p,assets}),before=structuredClone(p);selectPhoto(s);assert.equal(s.selection().rights.resize,true);assert.equal(s.counterparts().length,1);
 s.editPhoto({layout:{x:20,y:18,width:40,height:25}},{layoutAll:true});assert.equal(item(s,'b','b-photo').x,20);assert.equal(item(s,'b','b-photo').image.scale,1.8);assert.equal(item(s,'cover','cover-photo').x,10);assert.deepEqual(p,before);
 s.undo();assert.equal(item(s,'a','a-photo').x,10);assert.equal(item(s,'b','b-photo').x,25);s.redo();assert.equal(item(s,'b','b-photo').width,40);
});
test('image sharing uses one undo step and preserves other frames, crop and logo',()=>{
 const p=project(),s=createEditorSession({project:p,assets});selectPhoto(s);s.editPhoto({photoId:'new'},{imageAll:true});assert.equal(item(s,'a','a-photo').image.src,'blob:new');assert.equal(item(s,'b','b-photo').image.src,'blob:new');assert.equal(item(s,'b','b-photo').image.scale,1.8);assert.equal(item(s,'b','b-photo').image.offsetX,-12);assert.equal(item(s,'b','b-photo').x,25);assert.equal(item(s,'b','b-logo').bindingEnabled,undefined);
 s.undo();assert.equal(item(s,'a','a-photo').image.src,'template:a-photo');assert.equal(item(s,'b','b-photo').image.src,'other');s.redo();const reopened=applyEditor(p,JSON.parse(JSON.stringify(s.getState())),[{id:'new',url:'blob:reopened'}]);assert.equal(reopened.book.elementsByPage.b[0].image.src,'blob:reopened');
});
test('default template image can be copied without saving a temporary URL in editor state',()=>{
 const p=project(),s=createEditorSession({project:p,assets});selectPhoto(s);s.applyAcrossPages({image:true});assert.equal(item(s,'b','b-photo').image.src,'template:a-photo');assert.ok(!JSON.stringify(s.getState()).includes('template:'));const source=structuredClone(p);source.book.elementsByPage.a[0].image.src='restored:template';assert.equal(applyEditor(source,s.getState(),assets).book.elementsByPage.b[0].image.src,'restored:template');
});
test('poster and duplex-style pages use the same text styling and matching image actions',()=>{
 const p=project(true);p.book.pageInstances=p.book.pageInstances.slice(0,2);const s=createEditorSession({project:p,assets});const text=s.targets('a').find(t=>t.elementId==='slogan');assert.equal(text.rights.content,true);s.select(text);s.editPhoto({textStyle:{fontStyle:'italic',textDecoration:'underline',fontWeight:700}});assert.equal(item(s,'a','slogan').style.fontStyle,'italic');assert.equal(applyEditor(p,JSON.parse(JSON.stringify(s.getState())),assets).book.elementsByPage.a[2].style.textDecoration,'underline');
 const l=s.targets('a').find(t=>t.role==='school-logo');assert.equal(l.rights.imageFit,true);s.select(l);s.editPhoto({fit:{fit:'contain',scale:1.3,offsetX:5,offsetY:-2}});assert.equal(item(s,'a','a-logo').image.scale,1.3);s.applyAcrossPages({layout:true});assert.equal(item(s,'b','b-logo').x,70);
});
test('ambiguous or missing counterparts are skipped instead of changing unrelated photos',()=>{
 const p=project();p.book.elementsByPage.b.push(photo('extra'));const s=createEditorSession({project:p,assets});selectPhoto(s);assert.equal(s.counterparts().length,0);s.editPhoto({photoId:'new'},{imageAll:true});assert.equal(item(s,'b','b-photo').image.src,'other');assert.equal(item(s,'b','extra').image.src,'template:extra');
 p.book.elementsByPage.a[0].metadata={correspondenceKey:'main'};p.book.elementsByPage.b[0].metadata={correspondenceKey:'main'};const explicit=createEditorSession({project:p,assets});selectPhoto(explicit);assert.equal(explicit.counterparts().length,1);
});
test('backgrounds, automatic years and locked recipients remain protected',()=>{
 const p=project(true);p.book.elementsByPage.b[0].locked=true;const s=createEditorSession({project:p,assets});for(const id of ['year','background']){const t=s.targets('a').find(t=>t.elementId===id);assert.ok(!Object.values(t.rights).some(Boolean));s.select(t);assert.throws(()=>s.editPhoto({textStyle:{fontStyle:'italic'}}),/허용/);}
 selectPhoto(s);assert.equal(s.counterparts().length,0);s.editPhoto({photoId:'new'},{imageAll:true});assert.equal(item(s,'b','b-photo').image.src,'other');assert.throws(()=>s.editPhoto({textStyle:{fontStyle:'oblique'}}),/스타일/);
});
test('reset with image sharing is atomic and keeps geometry',()=>{
 const s=createEditorSession({project:project(),assets});selectPhoto(s);s.editPhoto({photoId:'new',layout:{x:15,y:15,width:30,height:20}},{imageAll:true});s.resetPhoto({imageAll:true});assert.equal(item(s,'a','a-photo').image.src,'template:a-photo');assert.equal(item(s,'b','b-photo').image.src,'template:a-photo');assert.equal(item(s,'a','a-photo').x,15);s.undo();assert.equal(item(s,'a','a-photo').image.src,'blob:new');assert.equal(item(s,'b','b-photo').image.src,'blob:new');
});
test('copied photos cannot read locked source objects and failed edits leave history unchanged',()=>{
 const p=project(),s=createEditorSession({project:p,assets});selectPhoto(s);s.applyAcrossPages({image:true});const saved=s.getState();p.book.elementsByPage.a[0].locked=true;assert.throws(()=>applyEditor(p,saved,assets),/공통 적용할 이미지/);const clean=createEditorSession({project:project(),assets});selectPhoto(clean);assert.throws(()=>clean.editPhoto({photoId:'missing'},{imageAll:true}),/원본/);assert.equal(clean.canUndo(),false);
});

test('copied bound text retains binding, formatting and survives reopening, deletion and undo',()=>{
 const p=project(true),s=createEditorSession({project:p,assets});s.select(s.targets('a').find(t=>t.elementId==='slogan'));
 s.editPhoto({textStyle:{textAlign:'justify',fontSize:23}});s.setPage('b');s.select(s.targets('a').find(t=>t.elementId==='slogan'));const copy=s.duplicate();
 assert.equal(copy.pageId,'b');s.editPhoto({layout:{x:20,y:10,width:30,height:5}});
 const reopened=applyEditor(p,JSON.parse(JSON.stringify(s.getState())),assets),copied=reopened.book.elementsByPage.b.find(e=>e.id===copy.elementId);
 assert.equal(copied.binding,'school.slogan');assert.equal(copied.style.textAlign,'justify');assert.equal(copied.style.fontSize,23);assert.equal(copied.x,20);
 s.remove();assert.equal(item(s,'b',copy.elementId).visible,false);s.undo();assert.notEqual(item(s,'b',copy.elementId).visible,false);
 s.select(s.targets('b').find(t=>t.elementId===copy.elementId));const again=s.duplicate();assert.ok(item(s,'b',again.elementId));
});
test('copying replaced photos preserves durable photo IDs and protected objects cannot be duplicated',()=>{
 const p=project(),s=createEditorSession({project:p,assets});selectPhoto(s);s.editPhoto({photoId:'new'});const copy=s.duplicate();
 assert.equal(applyEditor(p,s.getState(),[{id:'new',url:'restored:new'}]).book.elementsByPage.a.find(e=>e.id===copy.elementId).image.src,'restored:new');
 s.select(s.targets('a').find(t=>t.elementId==='year'));assert.throws(()=>s.duplicate(),/복사할 수 없는/);
});
