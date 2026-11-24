import { read, utils } from 'xlsx';
import {inflateRawSync} from 'node:zlib';
import {parseHwpxCalendarGrid} from './hwpx-grid.ts';
import {readMonthlyHwpx} from './hwpx-monthly-table.ts';
import type {ScheduleEvent, ScheduleExtraction} from './contracts.ts';
const LIMIT=3*1024*1024,EXPANDED=20*1024*1024;
export function zipXml(buffer:Buffer):Map<string,string>{
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error('파일의 압축 구조를 읽을 수 없습니다.');
 const count=buffer.readUInt16LE(end+10);if(count>2000)throw Error('파일 안의 항목이 너무 많습니다.');let pos=buffer.readUInt32LE(end+16),total=0;const result=new Map<string,string>();
 for(let i=0;i<count;i++){
  if(pos+46>buffer.length||buffer.readUInt32LE(pos)!==0x02014b50)throw Error('파일 목록이 손상되었습니다.');
  const flags=buffer.readUInt16LE(pos+8),method=buffer.readUInt16LE(pos+10),size=buffer.readUInt32LE(pos+20),rawSize=buffer.readUInt32LE(pos+24),n=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),offset=buffer.readUInt32LE(pos+42),name=buffer.subarray(pos+46,pos+46+n).toString('utf8');pos+=46+n+extra+comment;
  if(!/^(word\/document\.xml|xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)|Contents\/section\d+\.xml)$/.test(name))continue;
  if(flags&1||rawSize>EXPANDED||offset+30>buffer.length||buffer.readUInt32LE(offset)!==0x04034b50)throw Error('지원하지 않거나 너무 큰 압축 파일입니다.');
  const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28);if(start+size>buffer.length)throw Error('파일 내용이 손상되었습니다.');
  const bytes=buffer.subarray(start,start+size),expanded=method===0?bytes:method===8?inflateRawSync(bytes,{maxOutputLength:EXPANDED-total}):null;if(!expanded)throw Error('지원하지 않는 압축 방식입니다.');total+=expanded.length;if(total>EXPANDED)throw Error('압축 해제된 파일이 너무 큽니다.');result.set(name,expanded.toString('utf8'));
 }
 return result;
}
const decode=(text:string)=>text.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
export function isScheduleDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function iso(y:number,m:number,d:number){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
export function readVacationTitleRange(title:string,year:number,startMonth:number){
 const range=/^(?:(?:여름|겨울|봄|가을|학년말)\s*)?방학\s*[(（]\s*((?:\d{2,4}년\s*)?\d{1,2}\s*(?:[/.]|월)\s*\d{1,2}(?:\s*일)?)\s*[-~～–]\s*((?:\d{2,4}년\s*)?(?:\d{1,2}\s*(?:[/.]|월)\s*)?\d{1,2}(?:\s*일)?)\s*[)）]$/.exec(title);
 if(!range)return null;
 const readPart=(text:string)=>/^(?:(\d{2}|\d{4})년\s*)?(?:(\d{1,2})\s*(?:[/.]|월)\s*)?(\d{1,2})(?:\s*일)?$/.exec(text);
 const first=readPart(range[1]),last=readPart(range[2]);
 if(!first||!last)return null;
 const month=Number(first[2]),endMonth=Number(last[2]||month);
 const toYear=(value:string|undefined,fallback:number)=>{
  if(!value)return fallback;
  if(value.length===4)return Number(value);
  return fallback+(Number(value)-fallback%100+150)%100-50;
 };
 const startYear=toYear(first[1],year+(month<startMonth?1:0));
 const endYear=toYear(last[1],startYear+(endMonth<month?1:0));
 const startDate=iso(startYear,month,Number(first[3]));
 const endDate=iso(endYear,endMonth,Number(last[3]));
 return isScheduleDate(startDate)&&isScheduleDate(endDate)&&endDate>=startDate?{startDate,endDate}:null;
}
const vacationDuration = /^((?:여름\s*|겨울\s*|봄\s*|가을\s*|학년말\s*)?방학)(?:\s*시작)?\s+([1-9]\d{0,2})\s*일$/;

export function applyVacationDuration(event:ScheduleEvent):ScheduleEvent{
 if(event.startDate!==event.endDate||!isScheduleDate(event.startDate))return event;
 const match=vacationDuration.exec(event.title);
 if(!match)return event;
 const end=new Date(event.startDate+'T00:00:00Z');
 end.setUTCDate(end.getUTCDate()+Number(match[2])-1);
 const endDate=end.toISOString().slice(0,10);
 if(!isScheduleDate(endDate))return event;
 return {...event,title:match[1].replace(/\s+/g,''),endDate};
}

function vacationMonthDayLine(line:string){
 const match=/^(\d{1,2})-(\d{1,2})(\s+(?:[:：]\s*)?)(.+)$/.exec(line);
 return match&&vacationDuration.test(match[4])?`${match[1]}/${match[2]}${match[3]}${match[4]}`:line;
}

export function parseMonthlyScheduleLine(line:string){
 return /^(?:(\d{1,2})[/.])?(\d{1,2})(?:일)?(?:\s*[-~～–]\s*(?:(\d{1,2})[/.])?(\d{1,2})(?:일)?)?(?:\s*[:：]\s*|\s+)(\S.*)$/.exec(line);
}
export function readMonthlyScheduleEvent(line:string,month:number,year:number,startMonth:number,id:string):ScheduleEvent|null{
    const match=parseMonthlyScheduleLine(vacationMonthDayLine(line));
    if(!match){const range=readVacationTitleRange(line,year,startMonth);return range?{id,title:line,...range}:null;}
    const [,explicitMonth,day,endMonth,endDay,title]=match;
    const m=Number(explicitMonth||month),em=Number(endMonth||m);
    const startYear=year+(m<startMonth?1:0);
    const vacation=readVacationTitleRange(title,year,startMonth);
    const startDate=vacation?.startDate??iso(startYear,m,Number(day));
    const endDate=vacation?.endDate??(endDay?iso(startYear+(em<m?1:0),em,Number(endDay)):startDate);
    if(!isScheduleDate(startDate)||!isScheduleDate(endDate)||endDate<startDate||title.length>200)return null;
    return {id,startDate,endDate,title};
}
export async function extractMonthlyHwpx(file:File,year:number,startMonth:number):Promise<ScheduleExtraction|null>{
 const xml=zipXml(Buffer.from(await file.arrayBuffer()));
 const events:ScheduleEvent[]=[];
 for(const [name,section] of xml){
  if(!/^Contents\/section\d+\.xml$/.test(name))continue;
  const entries=readMonthlyHwpx(section);
  if(!entries?.length){
   const grid=parseHwpxCalendarGrid(section,true);
   if(!grid.ok)return null;
   for(const {month,day,text} of grid.hits){
    const titles:string[]=[];
    for(const line of text.split('\n').map(value=>value.trim()).filter(Boolean)){
     if(titles.length&&/^[(（]\s*\d+(?:\s*[,，]\s*\d+)*\s*[)）]$/.test(line)){
      titles[titles.length-1]+=' '+line;
     }else titles.push(line);
    }
    for(const title of titles){
     const event=readMonthlyScheduleEvent(`${day}: ${title}`,month,year,startMonth,'hwpx-'+(events.length+1));
     if(!event)return null;
     events.push(event);
     if(events.length>2000)throw Error('일정은 한 번에 2,000건까지 읽을 수 있습니다.');
    }
   }
   continue;
  }
  for(const {month,lines} of entries){
   for(const line of lines){
    const event=readMonthlyScheduleEvent(line,month,year,startMonth,'hwpx-'+(events.length+1));
    if(!event)return null;
    events.push(event);
    if(events.length>2000)throw Error('일정은 한 번에 2,000건까지 읽을 수 있습니다.');
   }
  }
 }
 if(!events.length)return null;
 return {events,warnings:[],totalLines:events.length,sourceName:file.name,method:'basic'};
}
export function parseScheduleText(text:string,year:number,startMonth=3):Omit<ScheduleExtraction,'sourceName'>{
 const events:ScheduleEvent[]=[],warnings:string[]=[];let contextYear=year,month=0;const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(lines.length>2000)throw Error('일정은 한 번에 2,000행까지 읽을 수 있습니다.');
 for(const [index,sourceLine] of lines.entries()){
  const line=vacationMonthDayLine(sourceLine);
  const header=line.match(/^(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*$/);if(header){month=Number(header[2]);contextYear=header[1]?Number(header[1]):year+(month<startMonth?1:0);continue;}
  let start='',end='',title='';
  const full=line.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s*[~～–]\s*(?:(\d{4})[-./])?(\d{1,2})[-./](\d{1,2}))?\s*(?:[,;\t:|]|\s)\s*(.+)$/);
  if(full){start=iso(+full[1],+full[2],+full[3]);end=full[5]?iso(+(full[4]||full[1]),+full[5],+full[6]):start;title=full[7];}
  else{
   const short=line.match(/^(?:(\d{1,2})\s*월\s*|(\d{1,2})[./])?(\d{1,2})(?:\s*일)?(?:\s*[-~～–]\s*(?:(\d{1,2})\s*월\s*|(\d{1,2})[./])?(\d{1,2})(?:\s*일)?)?\s*(?:[,;\t:|]|\s)\s*(.+)$/);
   if(short){const m=+(short[1]||short[2]||month),em=+(short[4]||short[5]||m),y=short[1]||short[2]?year+(m<startMonth?1:0):contextYear;if(m){start=iso(y,m,+short[3]);end=short[6]?iso(y+(em<m?1:0),em,+short[6]):start;title=short[7];}}
  }
  title=title.replace(/^[:：\s]+/,'').trim();
  const vacation=readVacationTitleRange(title||line,year,startMonth);
  if(vacation){start=vacation.startDate;end=vacation.endDate;title=title||line;}
  if(!isScheduleDate(start)||!isScheduleDate(end)||end<start||!title||title.length>200){warnings.push(`${index+1}행: 날짜나 일정명을 확인해 주세요. ${line.slice(0,100)}`);continue;}
  if(!events.some(e=>e.startDate===start&&e.endDate===end&&e.title===title))events.push({id:`import-${index+1}`,startDate:start,endDate:end,title});
 }
 return {events,warnings,totalLines:lines.length};
}
export function tableScheduleText(rows:string[][]):string{
 const normalize=(s:string)=>s.replace(/\s/g,'').toLowerCase();
 const headerIndex=rows.findIndex(row=>row.some(v=>['일정명','행사명','일정','행사','title'].includes(normalize(v)))&&row.some(v=>['시작일','날짜','일자','startdate','date'].includes(normalize(v))));
 const serial=(v:string)=>/^\d{5}(?:\.\d+)?$/.test(v)&&Number(v)>=20000&&Number(v)<=80000?new Date(Date.UTC(1899,11,30)+Math.floor(Number(v))*86400000).toISOString().slice(0,10):v;
 if(headerIndex>=0){const header=rows[headerIndex].map(normalize),start=header.findIndex(v=>['시작일','날짜','일자','startdate','date'].includes(v)),end=header.findIndex(v=>['종료일','끝일','enddate'].includes(v)),title=header.findIndex(v=>['일정명','행사명','일정','행사','title'].includes(v));return rows.slice(headerIndex+1).filter(row=>row.some(v=>v.trim())).map(row=>`${serial(row[start]||'')}${end>=0&&row[end]?.trim()?' ~ '+serial(row[end]):''} : ${row[title]||''}`).join('\n');}
 return rows.filter(row=>row.some(v=>v.trim())).map(row=>row.map((v,index)=>index===0?serial(v):v).join('\t')).join('\n');
}
export function csvRows(text:string):string[][]{
 const rows:string[][]=[],row:string[]=[];let cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell)quoted=!quoted;else cell+=c;}
  else if(!quoted&&(c===','||c==='\t')){row.push(cell);cell='';}
  else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push([...row]);row.length=0;cell='';}else cell+=c;}
 if(quoted)throw Error('CSV 파일의 따옴표가 닫히지 않았습니다.');if(cell||row.length){row.push(cell);rows.push([...row]);}return rows;
}
export async function extractSchedule(file:File,year:number,startMonth=3):Promise<ScheduleExtraction>{
 if(!file.size||file.size>LIMIT)throw Error('일정 파일은 3MB 이하로 선택해 주세요.');
 const extension=file.name.split('.').pop()?.toLowerCase();let text='';const bytes=Buffer.from(await file.arrayBuffer());
 if(['txt','csv'].includes(extension||'')){text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(extension==='csv')text=tableScheduleText(csvRows(text));}
 else if(extension==='docx'){
  const doc=zipXml(bytes).get('word/document.xml');if(!doc)throw Error('Word 문서를 읽지 못했습니다.');
  text=doc.replace(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g,row=>[...row.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map(cell=>decode(cell[1].replace(/<\/w:p>/g,' ')).trim()).join('\t')+'\n');text=decode(text.replace(/<\/w:p>/g,'\n'));
 }else if(extension==='xlsx'||extension==='xls'){
   const workbook=read(bytes,{type:'buffer'});
   text=workbook.SheetNames.map(name=>{
    const rows=utils.sheet_to_json<unknown[]>(workbook.Sheets[name]!,{header:1,defval:'',blankrows:false});
    return tableScheduleText(rows.map(row=>row.map(value=>String(value??'').trim())));
   }).filter(Boolean).join('\n');
 }else throw Error('DOCX·XLSX·XLS·CSV·TXT 파일을 선택해 주세요. DOC 파일은 새 형식으로 저장해 주세요.');
 return {...parseScheduleText(text,year,startMonth),sourceName:file.name};
}

