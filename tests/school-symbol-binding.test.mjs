import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-page-object-model.js';
import '../apps/designer-studio/persistence-project.js';
const model=globalThis.ACDLPageObjectModel;
function fixture(){return {settings:{},template:{masterElements:{}},book:{school:{name:'지란중학교',profile:{tree:{name:'소나무',description:'굳센 의지'},flower:{name:'장미',description:'사랑과 열정'}}},pageInstances:[{id:'symbols',role:'school-symbols'}],elementsByPage:{symbols:['tree','flower','song'].map((key,i)=>({id:key,type:'semantic-object',role:'school-'+key,binding:'school.profile.'+key,x:5+i*30,y:10,width:25,height:50,style:{fontFamily:'Noto Serif KR',titleSize:19}}))}}};}
test('new symbol parts bind names and descriptions; school song follows school name without changing typography',()=>{
 const p=fixture();model.normalizeProject(p);const all=p.book.elementsByPage.symbols;
 for(const key of ['tree','flower'])for(const part of ['title','description']){const e=all.find(e=>e.id===key+'.'+part);assert.equal(e.binding,`school.profile.${key}.${part==='title'?'name':'description'}`);assert.equal(model.schoolText(e,p.book.school),p.book.school.profile[key][part==='title'?'name':'description']);}
 const song=all.find(e=>e.id==='song.title');assert.equal(model.schoolText(song,p.book.school),'지란중학교 교가');assert.equal(song.style.fontFamily,'Noto Serif KR');assert.equal(song.style.fontSize,19);p.book.school.name='새로운학교';assert.equal(model.schoolText(song,p.book.school),'새로운학교 교가');p.book.school.name='';assert.equal(model.schoolText(song,p.book.school),'교가');
});
test('existing split parts reconnect once, preserve style/frames and allow later fixed text',()=>{
 const p=fixture();model.normalizeProject(p);const parts=p.book.elementsByPage.symbols;
 for(const e of parts.filter(e=>e.type==='text')){delete e.metadata.schoolSymbolBindingVersion;if(e.id.endsWith('.title')){e.binding=null;delete e.bindingEnabled;}}
 const before=parts.map(e=>({id:e.id,style:e.style,x:e.x,y:e.y,width:e.width,height:e.height}));model.normalizeProject(p);assert.deepEqual(parts.map(e=>({id:e.id,style:e.style,x:e.x,y:e.y,width:e.width,height:e.height})),before);
 const title=parts.find(e=>e.id==='song.title');title.binding=null;title.content='교가';const saved=JSON.stringify(p);model.normalizeProject(p);assert.equal(JSON.stringify(p),saved);
});
test('explicit fixed content, unrelated titles and frozen correction documents are preserved',()=>{
 const p=fixture();p.book.elementsByPage.symbols=[{id:'tree.title',type:'text',role:'school-tree-title',bindingEnabled:false,content:'고정 제목'},{id:'custom',type:'text',role:'section-title',content:'교화'}];const before=JSON.stringify(p);model.normalizeProject(p);assert.equal(JSON.stringify(p),before);p.productionCorrection={id:'frozen'};model.normalizeProject(p);assert.equal(JSON.stringify(p),JSON.stringify({...JSON.parse(before),productionCorrection:{id:'frozen'}}));
});
