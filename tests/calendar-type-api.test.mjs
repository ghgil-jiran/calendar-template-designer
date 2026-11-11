import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCalendarType } from '../server/calendar-type-persistence.js';

const valid={id:'desk-standard',name:'스탠다드',family:{id:'desk'},coverBackMode:'shared-month-back',finishedSize:{width:260,height:180},productionSize:{width:266,height:186},policies:{cover:'required',backCover:'required',backCoverBack:'optional',monthlyFront:'required',monthlyBack:'required',annualSingle:'optional'}};
test('calendar type API contract accepts the production desk standard',()=>assert.equal(validateCalendarType(valid).id,'desk-standard'));
test('calendar type API contract rejects template-owned or malformed structural values',()=>assert.throws(()=>validateCalendarType({...valid,policies:{...valid.policies,cover:true}}),error=>error.code==='INVALID_CALENDAR_TYPE'));


test('poster API round trip keeps two-sheet page rules and blocks desk-only policies',()=>{
 const domain=globalThis.ACDLCalendarTypeDomain,input=domain.definition('poster-two-page');
 input.policies.monthlyBack='required';input.ranges.rearInsert.max=2;input.printSides='duplex';
 const saved=validateCalendarType(input);assert.equal(saved.pageRules[0].min,2);assert.equal(saved.pageRules[0].max,2);assert.equal(saved.policies.monthlyBack,'unsupported');assert.equal(saved.ranges.rearInsert.max,0);assert.equal(saved.printSides,'simplex');
 assert.throws(()=>validateCalendarType({...input,pageRules:[{role:'annual',kind:'required',min:3,max:3}]}),error=>error.code==='INVALID_CALENDAR_TYPE');
});
