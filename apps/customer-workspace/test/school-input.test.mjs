import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySchoolInput, validateSchoolInput, visibleSchoolValues} from '../src/lib/api/school-input.ts';
const fields = [
  {key: 'name', label: '학교명', group: 'basic', required: true, allowHide: false, maxLength: 80},
  {key: 'website', label: '홈페이지', group: 'contact', required: false, allowHide: true, maxLength: 160}
];
test('required fields cannot be hidden to bypass validation', () => {
  assert.ok(validateSchoolInput(fields, {values: {}, hidden: ['name']}).name);
  assert.ok(validateSchoolInput(fields, emptySchoolInput(fields)).name);
});
test('hiding retains the entered value while excluding it from submitted values', () => {
  const input = {values: {name: ' 학교 ', website: 'school.example'}, hidden: ['website']};
  assert.deepEqual(visibleSchoolValues(fields, input), {name: '학교'});
  assert.equal(input.values.website, 'school.example');
});
test('template fields determine input shape without stale fields from another template', () => {
  assert.deepEqual(emptySchoolInput(fields), {values: {name: '', website: ''}, hidden: [], omitEmptyContacts: true});
  assert.deepEqual(visibleSchoolValues(fields, {values: {name: '학교', website: '', unknown: 'x'}, hidden: []}), {name: '학교', website: ''});
});
test('length errors remain visible instead of silently truncating', () => {
  assert.ok(validateSchoolInput(fields, {values: {name: '가'.repeat(81)}, hidden: []}).name);
});

test('address is required when displayed and may be explicitly hidden', () => {
  const address = [{key:'address',label:'학교 주소',group:'contact',required:true,allowHide:true,maxLength:200}];
  assert.ok(validateSchoolInput(address,{values:{},hidden:[]}).address);
  assert.deepEqual(validateSchoolInput(address,{values:{},hidden:['address']}),{});
  assert.deepEqual(visibleSchoolValues(address,{values:{address:'보관한 주소'},hidden:['address']}),{});
});
