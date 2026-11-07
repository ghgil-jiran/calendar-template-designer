import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectWallTemplate } from '../server/template-package-preflight.js';

function fixture(){
  const months=Array.from({length:12},(_,index)=>{const offset=2+index;return {id:`month-${index}`,role:'monthly-front',calendarYear:2028+Math.floor(offset/12),calendarMonth:offset%12+1,monthKey:`${2028+Math.floor(offset/12)}-${String(offset%12+1).padStart(2,'0')}`}});
  const projectData={format:'acdl-project',productType:{category:'wall',pageSize:{width:297,height:420,unit:'mm'}},settings:{year:2028,startMonth:3,frontInsertCount:1,rearInsertCount:0},book:{pageInstances:[{id:'cover',role:'cover-front'},{id:'insert',role:'front-insert-front'},...months,{id:'back',role:'back-cover-front'}],school:{profile:{logo:{image:'acdl-asset://11111111-1111-4111-8111-111111111111'}}}}};
  return {template:{id:'t1',name:'벽걸이형 표준 01',edition:2028,state:'ready',productType:'wall',latestVersionNumber:4},version:{id:'v4',versionNumber:4,createdAt:'2026-08-26T00:00:00Z',projectData}};
}

test('saved wall template passes the 15-surface package contract',()=>{
  const {template,version}=fixture(),result=inspectWallTemplate(template,version);
  assert.equal(result.ok,true);assert.equal(result.summary.surfaceCount,15);assert.equal(result.summary.months.at(0),'2028-03');assert.equal(result.summary.months.at(-1),'2029-02');assert.equal(result.summary.assetCount,1);assert.match(result.summary.projectSha256,/^[a-f0-9]{64}$/);
});

test('a 13-surface wall draft is blocked before package export',()=>{
  const {template,version}=fixture();version.projectData.book.pageInstances.splice(1,1);version.projectData.settings.frontInsertCount=0;
  const result=inspectWallTemplate(template,version);assert.equal(result.ok,false);assert.ok(result.blockers.includes('총 15면'));assert.ok(result.blockers.includes('표지·앞간지·월력 12면·뒷표지 순서'));
});
