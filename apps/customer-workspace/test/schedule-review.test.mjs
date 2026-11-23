import test from 'node:test';import assert from 'node:assert/strict';
import {academicMonths,eventInMonth,validSchedule,sortSchedules} from '../src/lib/materials/schedule-review.ts';
import {normalizeSharedSchedules,extractWithSharedService} from '../src/server/shared-schedule-extraction.ts';
const event=(startDate,endDate=startDate,title='행사')=>({id:'test',startDate,endDate,title});
test('academic months roll into next year and spanning events appear in both without cloning',()=>{const months=academicMonths(2027,3);assert.equal(months[0].key,'2027-03');assert.equal(months[11].end,'2028-02-29');const e=event('2027-03-30','2027-04-02');assert.ok(eventInMonth(e,months[0]));assert.ok(eventInMonth(e,months[1]));assert.ok(!eventInMonth(e,months[2]));assert.equal(e.id,'test');assert.ok(!validSchedule([event('2027-02-30')]));assert.ok(!eventInMonth(event('',''),months[0]));});
test('shared AI dates follow selected academic year; invalid dates and duplicates are visible in diagnostics',()=>{const r=normalizeSharedSchedules({holidayExcluded:2,schedules:[{date:'2027-12-30',endDate:'2028-01-05',label:'겨울방학'},{date:'2027-12-30',endDate:'2028-01-05',label:'겨울방학'},{date:'2028-02-29',label:'윤일 일정'},{date:'2027-03-01',label:''}]},2028,3);assert.equal(r.events.length,1);assert.equal(r.events[0].startDate,'2028-12-30');assert.equal(r.events[0].endDate,'2029-01-05');assert.ok(r.warnings.some(w=>w.includes('공휴일 2건')));assert.ok(r.warnings.some(w=>w.includes('2건을 추가하지')));});
test('PDF transcription keeps original row boundaries and flags conflicting candidates',async()=>{
 const rows=[
  {date:'2030-10-03',label:'개학식, 입학식',category:'event'},
  {date:'2031-02-16',label:'신학년집중준비기간',category:'event'},
  {date:'2031-02-17',label:'신학년집중준비기간',category:'event'},
  {date:'2031-08-18',label:'학부모상담기간',category:'event'},
  {date:'2031-08-18',endDate:'2031-08-20',label:'수업공개주간',category:'event'},
 ];
 const replies=[
  [...rows,{date:'2031-08-31',label:'우시기준 마감일',category:'event'}],
  [...rows,{date:'2031-08-31',label:'수시기준 마감일',category:'event'}],
 ];
 let calls=0;
 const r=await extractWithSharedService(new File(['%PDF-1.4'],'school.pdf'),2030,9,{apiKey:'test',fetcher:async(url,init)=>{
  assert.equal(new URL(url).origin,'https://api.anthropic.com');
  const request=JSON.parse(init.body);
  assert.equal(request.messages[0].content[0].type,'document');
  assert.match(request.system,/2030-09-01 ~ 2031-08-31/);
  assert.match(request.system,/맞춤법 교정/);
  const schedules=replies[calls++];
  return Response.json({id:'msg_test',type:'message',role:'assistant',stop_reason:'tool_use',
   content:[{type:'tool_use',id:'tool_test',name:'save_schedules',input:{documentDateCount:6,schedules}}],
   usage:{input_tokens:1,output_tokens:1}});
 }});
 assert.equal(calls,2);
 assert.equal(r.method,'shared-ai');
 assert.equal(r.engineVersion,'0.1.1');
 assert.deepEqual(r.events.map(item=>[item.startDate,item.endDate,item.title]).sort(),
  rows.map(row=>[row.date,row.endDate??row.date,row.label]).sort());
 assert.ok(r.warnings.some(w=>w.includes('판독 불일치')&&w.includes('우시기준')));
});
test('upstream failure retains useful basic parsing and explicitly reports limited fallback',async()=>{const r=await extractWithSharedService(new File(['2027-03-02 : 입학식'],'school.txt'),2027,3,{fetcher:async()=>new Response('',{status:503})});assert.equal(r.events.length,1);assert.equal(r.method,'basic');assert.ok(r.warnings[0].includes('기본 읽기'));await assert.rejects(()=>extractWithSharedService(new File(['fixture'],'school.pdf'),2027,3,{fetcher:async()=>new Response('',{status:503})}),/기존 일정은 유지/);await assert.rejects(()=>extractWithSharedService(new File(['fixture'],'school.hwp'),2027),/구형 HWP/);});

test('schedule additions sort by start and end date without changing IDs or input order',()=>{const original=[{...event('2027-03-24'),id:'late'},{...event('2027-03-08','2027-03-09'),id:'range'},{...event('2027-03-08'),id:'single'}];const sorted=sortSchedules(original);assert.deepEqual(sorted.map(e=>e.id),['single','range','late']);assert.equal(original[0].id,'late');assert.equal(sorted[0],original[2]);});

test('HWPX table preserves original title characters, whitespace, and line boundaries',async()=>{
 const {readMonthlyHwpx}=await import('../packages/schedule-import/hwpx-monthly-table.ts');
 const cell=(row,col,body)=>`<hp:tc id="1"><hp:cellAddr colAddr="${col}" rowAddr="${row}"/><hp:p id="1">${body}</hp:p></hp:tc>`;
 const xml='<hp:tbl id="1">'+cell(0,0,'<hp:t>월</hp:t>')+
  cell(0,1,'<hp:t>상세 일정</hp:t>')+cell(1,0,'<hp:t>3월</hp:t>')+
  cell(1,1,'<hp:t>3 : 개학씩,  입학식<hp:lineBreak/></hp:t><hp:t xml:space="preserve">18 : 글&#xB7;그림  한마당&#9314;</hp:t>')+'</hp:tbl>';
 assert.deepEqual(readMonthlyHwpx(xml),[{month:3,lines:['3 : 개학씩,  입학식','18 : 글·그림  한마당③']}]);
});
