import test from 'node:test';import assert from 'node:assert/strict';
import {largePreviewUrl,majorPageNumbers,calendarKind} from '../src/lib/materials/template-preview.ts';
test('enlargement preserves signed package URLs and uses explicit high resolution images first',()=>{
 const signed='https://assets.example/storage/v1/object/sign/template-packages/saved.png?token=example';
 assert.equal(largePreviewUrl({imageUrl:signed}),signed);assert.equal(largePreviewUrl({imageUrl:signed,largeImageUrl:'blob:large'}),'blob:large');assert.equal(largePreviewUrl({imageUrl:'blob:saved'}),'blob:saved');assert.equal(largePreviewUrl({imageUrl:null}),null);
});
test('only local review previews request the supported large size',()=>{assert.equal(largePreviewUrl({imageUrl:'/api/workspace/previews/1'}),'/api/workspace/previews/1?size=large');assert.equal(largePreviewUrl({imageUrl:'/api/workspace/previews/1?v=2'}),'/api/workspace/previews/1?v=2&size=large');});

test('major pages follow semantic roles after physical reordering and small products retain all pages',()=>{const pages=[{role:'cover-front'},{role:'cover-back'},{role:'school-symbols'},...Array.from({length:12},(_,i)=>[{role:'monthly-back',monthKey:String(i)},{role:'monthly-front',monthKey:String(i)}]).flat(),{role:'back-cover-back'}];assert.deepEqual(majorPageNumbers(pages),[1,2,3,5,4,7,6,28]);assert.deepEqual(majorPageNumbers([{role:'poster-annual'}]),[1]);assert.equal(calendarKind({productType:{category:'single-sheet-poster'}}),'poster');});
