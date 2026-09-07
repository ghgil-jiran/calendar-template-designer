import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCalendarType } from '../server/calendar-type-persistence.js';

const valid={id:'desk-standard',name:'스탠다드',family:{id:'desk'},finishedSize:{width:260,height:180},productionSize:{width:266,height:186},policies:{cover:'required',backCover:'required',monthlyFront:'required',monthlyBack:'required',annualSingle:'optional'}};
test('calendar type API contract accepts the production desk standard',()=>assert.equal(validateCalendarType(valid).id,'desk-standard'));
test('calendar type API contract rejects template-owned or malformed structural values',()=>assert.throws(()=>validateCalendarType({...valid,policies:{...valid.policies,cover:true}}),error=>error.code==='INVALID_CALENDAR_TYPE'));

