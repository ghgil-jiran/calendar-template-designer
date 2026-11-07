import '../../../designer-studio/schedule-file-parser.js';
import {inflateRawSync} from 'node:zlib';
import type {ScheduleEvent, ScheduleExtraction} from '@/lib/api/contracts';
const LIMIT=3*1024*1024,EXPANDED=20*1024*1024;
export function zipXml(buffer:Buffer):Map<string,string>{
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error('파일의 압축 구조를 읽을 수 없습니다.');
 const count=buffer.readUInt16LE(end+10);if(count>2000)throw Error('파일 안의 항목이 너무 많습니다.');let pos=buffer.readUInt32LE(end+16),total=0;const result=new Map<string,string>();
 for(let i=0;i<count;i++){
  if(pos+46>buffer.length||buffer.readUInt32LE(pos)!==0x02014b50)throw Error('파일 목록이 손상되었습니다.');
  const flags=buffer.readUInt16LE(pos+8),method=buffer.readUInt16LE(pos+10),size=buffer.readUInt32LE(pos+20),rawSize=buffer.readUInt32LE(pos+24),n=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),offset=buffer.readUInt32LE(pos+42),name=buffer.subarray(pos+46,pos+46+n).toString('utf8');pos+=46+n+extra+comment;
  if(!/^(word\/document\.xml|xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml))$/.test(name))continue;
  if(flags&1||rawSize>EXPANDED||offset+30>buffer.length||buffer.readUInt32LE(offset)!==0x04034b50)throw Error('지원하지 않거나 너무 큰 압축 파일입니다.');
  const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28);if(start+size>buffer.length)throw Error('파일 내용이 손상되었습니다.');
  const bytes=buffer.subarray(start,start+size),expanded=method===0?bytes:method===8?inflateRawSync(bytes,{maxOutputLength:EXPANDED-total}):null;if(!expanded)throw Error('지원하지 않는 압축 방식입니다.');total+=expanded.length;if(total>EXPANDED)throw Error('압축 해제된 파일이 너무 큽니다.');result.set(name,expanded.toString('utf8'));
 }
 return result;
}
const decode=(text:string)=>text.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function iso(y:number,m:number,d:number){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
export function parseScheduleText(text:string,year:number,startMonth=3):Omit<ScheduleExtraction,'sourceName'>{
 const events:ScheduleEvent[]=[],warnings:string[]=[];let contextYear=year,month=0;const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(lines.length>2000)throw Error('일정은 한 번에 2,000행까지 읽을 수 있습니다.');
 for(const [index,line] of lines.entries()){
  const header=line.match(/^(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*$/);if(header){month=Number(header[2]);contextYear=header[1]?Number(header[1]):year+(month<startMonth?1:0);continue;}
  let start='',end='',title='';
  const full=line.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s*[~～–]\s*(?:(\d{4})[-./])?(\d{1,2})[-./](\d{1,2}))?\s*(?:[,;\t:|]|\s)\s*(.+)$/);
  if(full){start=iso(+full[1],+full[2],+full[3]);end=full[5]?iso(+(full[4]||full[1]),+full[5],+full[6]):start;title=full[7];}
  else{
   const short=line.match(/^(?:(\d{1,2})\s*월\s*|(\d{1,2})[./])?(\d{1,2})(?:\s*일)?(?:\s*[-~～–]\s*(?:(\d{1,2})\s*월\s*|(\d{1,2})[./])?(\d{1,2})(?:\s*일)?)?\s*(?:[,;\t:|]|\s)\s*(.+)$/);
   if(short){const m=+(short[1]||short[2]||month),em=+(short[4]||short[5]||m),y=short[1]||short[2]?year+(m<startMonth?1:0):contextYear;if(m){start=iso(y,m,+short[3]);end=short[6]?iso(y+(em<m?1:0),em,+short[6]):start;title=short[7];}}
  }
  title=title.replace(/^[:：\s]+/,'').trim();if(!validDate(start)||!validDate(end)||end<start||!title||title.length>200){warnings.push(`${index+1}행: 날짜나 일정명을 확인해 주세요. ${line.slice(0,100)}`);continue;}
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
 else if(['xlsx','docx'].includes(extension||'')){
  const xml=zipXml(bytes);
  if(extension==='docx'){const doc=xml.get('word/document.xml');if(!doc)throw Error('Word 문서를 읽지 못했습니다.');text=doc.replace(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g,row=>[...row.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map(cell=>decode(cell[1].replace(/<\/w:p>/g,' ')).trim()).join('\t')+'\n');text=decode(text.replace(/<\/w:p>/g,'\n'));}
  else{
   // Reuse the designer's cell and row interpretation; only bounded ZIP decoding differs on the server.
   const parser=(globalThis as unknown as {ACDLScheduleFileParser:{worksheetRows:(xml:string,strings:string[])=>string[][];rowsToScheduleText:(rows:string[][],year:number)=>string}}).ACDLScheduleFileParser;
   const strings=[...(xml.get('xl/sharedStrings.xml')||'').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>decode(t[1])).join(''));
   const rows=[...xml.entries()].filter(([n])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).flatMap(([,v])=>parser.worksheetRows(v,strings));
   text=tableScheduleText(rows);
  }
 }else throw Error('DOCX·XLSX·CSV·TXT 파일을 선택해 주세요. DOC·XLS 파일은 새 형식으로 저장해 주세요.');
 return {...parseScheduleText(text,year,startMonth),sourceName:file.name};
}
