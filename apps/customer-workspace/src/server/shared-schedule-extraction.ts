import type {ScheduleEvent,ScheduleExtraction} from '../lib/api/contracts';
import {isScheduleDate} from '../lib/materials/schedule-review.ts';
import {extractSchedule,parseScheduleText} from './schedule-extraction.ts';
const DEFAULT_ORIGIN='https://school-calendar-editor-service.vercel.app';
export function normalizeSharedSchedules(data:unknown,year:number,startMonth:number):ScheduleExtraction{
 const source=data as {schedules?:unknown;holidayExcluded?:unknown};if(!Array.isArray(source?.schedules))throw Error('공통 일정 분석 결과를 확인하지 못했습니다.');
 const warnings:string[]=[],events:ScheduleEvent[]=[],seen=new Set<string>();let invalid=0;
 // The existing service maps to 2027/2028. Rebase month/day to the selected academic period.
 const rebase=(value:unknown)=>{if(typeof value!=='string'||!isScheduleDate(value))return '';const month=Number(value.slice(5,7));return `${year+(month<startMonth?1:0)}-${value.slice(5)}`;};
 if(source.schedules.length>2000)throw Error('일정은 한 번에 2,000건까지 읽을 수 있습니다.');
 for(const [i,raw] of source.schedules.entries()){
  const row=raw as {date?:unknown;endDate?:unknown;label?:unknown};const start=rebase(row?.date),end=row?.endDate?rebase(row.endDate):start,title=typeof row?.label==='string'?row.label.trim():'';
  if(!isScheduleDate(start)||!isScheduleDate(end)||end<start||!title||title.length>200){invalid++;warnings.push(`${i+1}번 분석 항목: 날짜 또는 일정명을 확인하지 못해 추가하지 않았어요. ${title.slice(0,80)}`);continue;}
  const key=JSON.stringify([start,end,title.replace(/\s+/g,' ')]);if(seen.has(key))continue;seen.add(key);events.push({id:`shared-${i+1}`,startDate:start,endDate:end,title});
 }
 if(!events.length)throw Error('파일에서 유효한 일정을 찾지 못했어요. 날짜가 포함된 원본을 확인해 주세요.');
 warnings.push('여러 행의 같은 일정이 기간으로 합쳐지거나 ‘주간’의 종료일이 추정될 수 있어요. 특히 방학·시험·상담주간의 시작일과 종료일을 원본과 비교해 주세요.');
 warnings.unshift(`원본의 월·일을 ${year}년 ${startMonth}월부터 시작하는 학사연도에 맞췄어요. 원본과 날짜·기간·일정명·누락 여부를 최종 확인해 주세요.`);
 if(Number(source.holidayExcluded)>0)warnings.push(`공통 분석에서 법정 공휴일 ${Number(source.holidayExcluded)}건을 제외했어요. ‘달력에 표시할 정보’의 공휴일 설정과 원본을 함께 확인해 주세요.`);
 if(invalid)warnings.push(`날짜가 잘못되었거나 달력 연도에 없는 날짜 등 ${invalid}건을 추가하지 않았어요. 필요한 일정은 직접 입력해 주세요.`);
 events.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title,'ko'));
 return {events,warnings,totalLines:source.schedules.length,sourceName:'공통 일정 분석',method:'shared-ai'};
}
export async function extractWithSharedService(file:File,year:number,startMonth=3,options:{fetcher?:typeof fetch;origin?:string}={}):Promise<ScheduleExtraction>{
 if(!file.size||file.size>3*1024*1024)throw Error('일정 파일은 3MB 이하로 선택해 주세요.');
 const ext=file.name.split('.').pop()?.toLowerCase();if(!['docx','xlsx','xls','hwpx','pdf','csv','txt'].includes(ext||''))throw Error('DOCX·XLSX·XLS·HWPX·PDF·CSV·TXT 파일을 선택해 주세요. 구형 HWP·DOC는 HWPX·DOCX 또는 PDF로 저장해 주세요.');
 const origin=(options.origin||process.env.SCHEDULE_EXTRACTION_ORIGIN||DEFAULT_ORIGIN).trim().replace(/\/$/,'');
 if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin))throw Error('일정 분석 연결 설정을 확인해 주세요.');
 try{
  const form=new FormData();form.set('file',file);form.set('academicYear',String(year));form.set('startMonth',String(startMonth));
  const response=await (options.fetcher||fetch)(origin+'/api/ai/schedule-extract',{method:'POST',body:form,signal:AbortSignal.timeout(55000)});
  if(!response.ok)throw Error('공통 분석 연결 실패');const data=await response.json(),result=normalizeSharedSchedules(data,year,startMonth);return {...result,sourceName:file.name};
 }catch{
  if(!['docx','xlsx','csv','txt'].includes(ext||''))throw Error('공통 일정 분석을 완료하지 못했어요. 잠시 후 다시 시도하거나 DOCX·XLSX·CSV·TXT로 저장해 올려 주세요. 기존 일정은 유지됩니다.');
  const result=await extractSchedule(file,year,startMonth);return {...result,method:'basic',warnings:['공통 분석을 완료하지 못해 기본 읽기를 사용했어요. 복잡한 표와 여러 일정이 적힌 칸은 원본과 비교해 주세요.',...result.warnings]};
 }
}
export async function extractPastedSchedule(text:string,year:number,startMonth=3){
 if(!text.trim())throw Error('읽어올 일정 내용을 입력해 주세요.');
 const simple=parseScheduleText(text,year,startMonth);
 if(simple.events.length&&simple.warnings.length===0)return {...simple,sourceName:'직접 입력',method:'basic' as const};
 return extractWithSharedService(new File([text],'붙여넣은-일정.txt',{type:'text/plain'}),year,startMonth);
}
