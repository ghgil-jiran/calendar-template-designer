import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../apps/designer-studio/shared-page-object-model.js';
const update=globalThis.ACDLPageObjectModel.updateBoundSchoolImage;
test('replacing the song sample updates page/master images and survives save while preserving layout, text and opt-outs',()=>{
 const song={id:'song',type:'semantic-object',role:'school-song',binding:'school.profile.song',bindingEnabled:true,x:56,y:37,width:35,height:49,style:{color:'navy'},sampleContent:{name:'교가',image:'old',description:'보존'},permissions:{move:false}};
 const unbound={...structuredClone(song),id:'unbound',bindingEnabled:false},other={...structuredClone(song),id:'other',binding:'school.profile.tree'},master=structuredClone(song),project={book:{elementsByPage:{symbols:[song,unbound,other]}},template:{masterElements:{symbols:[master]}}};
 const layout=JSON.stringify({...song,sampleContent:null});
 assert.equal(update(project,'school-song','new','new-asset'),2);
 const saved=JSON.parse(JSON.stringify(project));assert.equal(saved.book.elementsByPage.symbols[0].sampleContent.image,'new');assert.equal(master.sampleContent.image,'new');assert.equal(song.sampleContent.description,'보존');assert.equal(JSON.stringify({...song,sampleContent:null}),layout);assert.equal(unbound.sampleContent.image,'old');assert.equal(other.sampleContent.image,'old');
 update(project,'school-song','');assert.equal(song.sampleContent.image,'');assert.equal(song.sampleContent.assetId,undefined);
});
test('Sample D song keeps its frame and receives the replacement from template settings',()=>{
 const project=JSON.parse(fs.readFileSync(new URL('../assets/sample-d-v4/project.json',import.meta.url)));const song=Object.values(project.book.elementsByPage).flat().find(e=>e.role==='school-song');const frame=[song.x,song.y,song.width,song.height];assert.ok(update(project,'school-song','acdl-asset://replacement')>0);assert.equal(song.sampleContent.image,'acdl-asset://replacement');assert.deepEqual([song.x,song.y,song.width,song.height],frame);
});
