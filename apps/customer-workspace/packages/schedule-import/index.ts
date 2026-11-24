import type {ScheduleEvent,ScheduleExtraction} from './contracts.ts';
import {isLegalHoliday} from './legal-holiday-names.ts';
import {isScheduleDate} from './schedule-extraction.ts';
import {analyzeWithModel} from './model.ts';
import {PDF_WITHOUT_SCHEDULE_TEXT,readPdfDateList} from './pdf-text.ts';
import manifest from './package.json' with {type: 'json'};
export const SCHEDULE_IMPORT_VERSION = manifest.version;
import {applyVacationDuration,extractMonthlyHwpx,extractSchedule,parseScheduleText,readVacationTitleRange} from './schedule-extraction.ts';
function reviewVacationDates<T extends Pick<ScheduleExtraction, 'events' | 'warnings'>>(result:T,year:number,startMonth:number):T{
 const first=`${year}-${String(startMonth).padStart(2,'0')}-01`;
 const after=`${year+1}-${String(startMonth).padStart(2,'0')}-01`;
 const seen=new Set<string>();
 const events:ScheduleEvent[]=[];
 let outside=false;
 for(const event of result.events){
  const normalized=applyVacationDuration(event);
  const key=JSON.stringify([normalized.startDate,normalized.endDate,normalized.title]);
  if(seen.has(key))continue;
  seen.add(key);
  events.push(normalized);
  if((normalized!==event||readVacationTitleRange(event.title,year,startMonth))&&(normalized.startDate<first||normalized.endDate>=after))outside=true;
 }
 return {...result,events,warnings:outside?[...result.warnings,'선택한 학사연도 밖의 날짜가 포함된 방학 일정이 있어요. 원본의 연도를 확인해 주세요.']:result.warnings};
}
function withoutDefaultHolidays<T extends Pick<ScheduleExtraction, 'events' | 'warnings'>>(result:T):T{
 const events=result.events.filter(event=>!isLegalHoliday(event.title));
 const excluded=result.events.length-events.length;
 if(!excluded)return result;
 const warning=`기본 달력에서 제공하는 공휴일 ${excluded}건을 학사일정에서 제외했어요.`;
 return {...result,events,warnings:[...result.warnings,warning]};
}
export function normalizeSharedSchedules(data:unknown,year:number,startMonth:number):ScheduleExtraction{
 const source=data as {schedules?:unknown;holidayExcluded?:unknown;reviewWarnings?:unknown};if(!Array.isArray(source?.schedules))throw Error('공통 일정 분석 결과를 확인하지 못했습니다.');
 const warnings:string[]=Array.isArray(source.reviewWarnings)?source.reviewWarnings.filter((warning):warning is string=>typeof warning==='string'):[],events:ScheduleEvent[]=[],seen=new Set<string>();let invalid=0;
 // The existing service maps to 2027/2028. Rebase month/day to the selected academic period.
 const rebase=(value:unknown)=>{if(typeof value!=='string'||!isScheduleDate(value))return '';const month=Number(value.slice(5,7));return `${year+(month<startMonth?1:0)}-${value.slice(5)}`;};
 if(source.schedules.length>2000)throw Error('일정은 한 번에 2,000건까지 읽을 수 있습니다.');
 for(const [i,raw] of source.schedules.entries()){
  const row=raw as {date?:unknown;endDate?:unknown;label?:unknown};const title=typeof row?.label==='string'?row.label.trim():'';
  const vacation=readVacationTitleRange(title,year,startMonth);
  const start=vacation?.startDate??rebase(row?.date),end=vacation?.endDate??(row?.endDate?rebase(row.endDate):start);
  if(!isScheduleDate(start)||!isScheduleDate(end)||end<start||!title||title.length>200){invalid++;warnings.push(`${i+1}번 분석 항목: 날짜 또는 일정명을 확인하지 못해 추가하지 않았어요. ${title.slice(0,80)}`);continue;}
  const key=JSON.stringify([start,end,title]);if(seen.has(key))continue;seen.add(key);events.push({id:`shared-${i+1}`,startDate:start,endDate:end,title});
 }
 if(!events.length)throw Error('파일에서 유효한 일정을 찾지 못했어요. 날짜가 포함된 원본을 확인해 주세요.');
 if(!Array.isArray(source.reviewWarnings))warnings.push('여러 행의 같은 일정이 기간으로 합쳐지거나 ‘주간’의 종료일이 추정될 수 있어요. 특히 방학·시험·상담주간의 시작일과 종료일을 원본과 비교해 주세요.');
 warnings.unshift(`원본의 월·일을 ${year}년 ${startMonth}월부터 시작하는 학사연도에 맞췄어요. 원본과 날짜·기간·일정명·누락 여부를 최종 확인해 주세요.`);
 if(Number(source.holidayExcluded)>0)warnings.push(`공통 분석에서 법정 공휴일 ${Number(source.holidayExcluded)}건을 제외했어요. ‘달력에 표시할 정보’의 공휴일 설정과 원본을 함께 확인해 주세요.`);
 if(invalid)warnings.push(`날짜가 잘못되었거나 달력 연도에 없는 날짜 등 ${invalid}건을 추가하지 않았어요. 필요한 일정은 직접 입력해 주세요.`);
 events.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title,'ko'));
 return {events,warnings,totalLines:source.schedules.length,sourceName:'공통 일정 분석',method:'shared-ai'};
}
export async function extractWithSharedService(file:File,year:number,startMonth=3,options:{fetcher?:typeof fetch;apiKey?:string}={}):Promise<ScheduleExtraction>{
 if(!file.size||file.size>3*1024*1024)throw Error('일정 파일은 3MB 이하로 선택해 주세요.');
 const ext=file.name.split('.').pop()?.toLowerCase();if(!['docx','xlsx','xls','hwpx','pdf','csv','txt'].includes(ext||''))throw Error('DOCX·XLSX·XLS·HWPX·PDF·CSV·TXT 파일을 선택해 주세요. 구형 HWP·DOC는 HWPX·DOCX 또는 PDF로 저장해 주세요.');
 if(ext==='hwpx'){
  const result=await extractMonthlyHwpx(file,year,startMonth).catch(()=>null);
  if(result)return {...reviewVacationDates(withoutDefaultHolidays(result),year,startMonth),engineVersion:SCHEDULE_IMPORT_VERSION};
 }
 if(ext==='pdf'){
  const result=await readPdfDateList(file,year,startMonth).catch(error=>{
   console.warn('[schedule-import] PDF text reader failed:',error instanceof Error?error.name:'unknown error');
   throw Error('PDF 원문을 읽지 못했어요. 파일을 확인하거나 HWPX 원본으로 올려 주세요. 기존 일정은 유지됩니다.');
  });
  if(result===PDF_WITHOUT_SCHEDULE_TEXT){
   throw Error('이 PDF에서 일정명과 날짜를 원문 텍스트로 확인할 수 없어요. HWPX 원본이나 글자를 선택할 수 있는 PDF로 올려 주세요. 기존 일정은 유지됩니다.');
  }
  if(result)return {...reviewVacationDates(withoutDefaultHolidays(result),year,startMonth),engineVersion:SCHEDULE_IMPORT_VERSION};
 }
 try{
  const response=await analyzeWithModel(file,year,startMonth,options.apiKey,options.fetcher);
  if(response.status===504)throw new DOMException('공통 일정 분석 시간이 초과됐어요.','TimeoutError');
  if(!response.ok){
   const payload=await response.json();
   throw Error(payload.error?.message||'일정 분석에 실패했어요.');
  }
  const result=normalizeSharedSchedules(await response.json(),year,startMonth);
  return {...reviewVacationDates(result,year,startMonth),sourceName:file.name,engineVersion:SCHEDULE_IMPORT_VERSION};
 }catch(error){
  const reason=error instanceof Error&&error.name==='TimeoutError'
   ?'공통 일정 분석 시간이 초과됐어요.'
   :error instanceof Error
    ?error.message:'공통 일정 분석 결과를 받지 못했어요.';
  if(!['docx','xlsx','csv','txt'].includes(ext||'')){
   throw Error(reason+' 잠시 후 다시 시도해 주세요. 기존 일정은 유지됩니다.');
  }
  let result:ScheduleExtraction;
  try{
   result=await extractSchedule(file,year,startMonth);
  }catch{
   throw Error(reason+' 기본 읽기에서 파일 내용을 처리하지 못했어요. 기존 일정은 유지됩니다.');
  }
  if(!result.events.length){
   throw Error(reason+' 기본 읽기에서도 일정을 찾지 못했어요. 원본의 날짜와 일정명을 확인해 주세요. 기존 일정은 유지됩니다.');
  }
  result=reviewVacationDates(withoutDefaultHolidays(result),year,startMonth);
  return {...result,method:'basic',engineVersion:SCHEDULE_IMPORT_VERSION,warnings:[reason+' 기본 읽기로 가져왔어요. 복잡한 표와 여러 일정이 적힌 칸은 원본과 비교해 주세요.',...result.warnings]};
 }
}
export async function extractPastedSchedule(text:string,year:number,startMonth=3){
 if(!text.trim())throw Error('읽어올 일정 내용을 입력해 주세요.');
 const simple=parseScheduleText(text,year,startMonth);
 if(simple.events.length&&simple.warnings.length===0)return {...reviewVacationDates(withoutDefaultHolidays(simple),year,startMonth),sourceName:'직접 입력',method:'basic' as const,engineVersion:SCHEDULE_IMPORT_VERSION};
 return extractWithSharedService(new File([text],'붙여넣은-일정.txt',{type:'text/plain'}),year,startMonth);
}

