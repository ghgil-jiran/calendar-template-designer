import test from 'node:test';import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-schedule.js';
const {monthSchedule}=globalThis.ACDLSharedSchedule;
const layout={segments:[
 {eventId:'trip',title:'체험학습',startDate:'2027-03-05',endDate:'2027-03-09',row:0},
 {eventId:'trip',title:'체험학습',startDate:'2027-03-05',endDate:'2027-03-09',row:1},
 ...[1,2,3].map(n=>({eventId:'single'+n,title:'일정'+n,startDate:'2027-03-10',endDate:'2027-03-10',row:1}))],hiddenByDate:{'2027-03-12':1}};
test('monthly schedule honors visibility and all four label modes without mutating events',()=>{
 assert.equal(monthSchedule(layout,{enabled:false}).segments.length,0);
 assert.equal(monthSchedule(layout,{labelMode:'first'}).segments[1].label,'');
 assert.equal(monthSchedule(layout,{labelMode:'continued'}).segments[1].label,'체험학습 · 계속');
 assert.equal(monthSchedule(layout,{labelMode:'every'}).segments[1].label,'체험학습');
 assert.ok(monthSchedule(layout,{labelMode:'none'}).segments.every(s=>s.label===''));
 assert.equal(layout.segments[0].label,undefined);
});
test('single-day limit and overflow policy keep multi-day events and original lane counts',()=>{
 const result=monthSchedule(layout,{},2);
 assert.equal(result.segments.length,4);assert.equal(result.hiddenByDate['2027-03-10'],1);assert.equal(result.hiddenByDate['2027-03-12'],1);
 assert.deepEqual(monthSchedule(layout,{overflowStyle:'hide'},1).hiddenByDate,{});
 assert.deepEqual(monthSchedule(layout,{enabled:false}).hiddenByDate,{});
});
