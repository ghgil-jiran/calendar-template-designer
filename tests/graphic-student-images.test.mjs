import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installStudentImages} from '../server/graphic-student-images.js';
import {curatedId} from '../server/graphic-curated-library.js';
import {validateThumbnail} from '../server/graphic-library.js';
import calendarItems from '../server/graphic-student-calendar-data.js';
function fixture(){const records=[{id:curatedId('theme:students'),name:'학생',status:'active',assets:{},count:8}],sources=[];return {records,sources,validateThumbnail,storeAsset:async s=>{sources.push(s);return {id:'asset-'+sources.length}},createRecord:async r=>{records.push(r);return r}};}
test('student PNG originals install in the theme without replacing vector slots or user edits',async()=>{
 const f=fixture(),theme=JSON.stringify(f.records[0]),added=await installStudentImages(f);
 assert.equal(added.length,10);assert.equal(JSON.stringify(f.records[0]),theme);
 for(const [i,g] of added.slice(0,2).entries()){assert.equal(g.themeId,f.records[0].id);assert.equal(g.mimeType,'image/png');assert.equal(g.width,1024);assert.equal(g.height,1536);assert.equal(g.vectorObject,undefined);assert.equal(g.illustrationRecipe,undefined);assert.deepEqual(Buffer.from(f.sources[i].split(',')[1],'base64'),readFileSync(new URL(`../assets/student-image-prototypes/student-wave-0${i+1}.png`,import.meta.url)));}
 for(const [i,g] of added.slice(2).entries()){const item=calendarItems[i];assert.equal(g.themeId,f.records[0].id);assert.equal(g.width,item.width);assert.equal(g.height,item.height);assert.equal(g.id,curatedId('asset:student-calendar-01-'+item.key));assert.equal(g.generationInfo.edition,'student-calendar-01');assert.deepEqual(Buffer.from(f.sources[i+2].split(',')[1],'base64'),readFileSync(new URL('../assets/student-calendar-illustrations/'+item.fileName,import.meta.url)));}
 added[0].name='사용자 수정';added[0].status='archived';added[2].status='archived';assert.deepEqual(await installStudentImages(f),[]);assert.equal(f.sources.length,10);assert.equal(added[0].name,'사용자 수정');assert.equal(added[0].status,'archived');assert.equal(added[2].status,'archived');
});
test('interrupted PNG registration resumes only missing assets',async()=>{const f=fixture(),create=f.createRecord;let count=0;f.createRecord=async r=>{if(++count===5)throw Error('interrupted');return create(r)};await assert.rejects(installStudentImages(f));f.createRecord=create;const added=await installStudentImages(f);assert.equal(added.length,6);assert.equal(f.records.length,11);assert.equal(new Set(f.records.map(r=>r.id)).size,11);});
test('PNG installation respects unavailable or archived student theme',async()=>{const f=fixture();f.records[0].status='archived';assert.deepEqual(await installStudentImages(f),[]);f.records.length=0;assert.deepEqual(await installStudentImages(f),[]);assert.equal(f.sources.length,0);});
