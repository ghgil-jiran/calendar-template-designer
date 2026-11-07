import {NextResponse} from 'next/server';
import {extractSchedule,parseScheduleText} from '@/server/schedule-extraction';
export const runtime='nodejs';
export async function POST(request:Request){
 if(Number(request.headers.get('content-length')||0)>3*1024*1024+65536)return NextResponse.json({error:'파일은 3MB 이하로 선택해 주세요.'},{status:413});
 try{
  const data=await request.formData(),year=Number(data.get('year')),startMonth=Number(data.get('startMonth')||3);
  if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(startMonth)||startMonth<1||startMonth>12)throw Error('학사연도와 시작 월을 확인해 주세요.');
  const file=data.get('file'),text=String(data.get('text')||'');if(text.length>200000)throw Error('일정 내용이 너무 깁니다.');
  const result=file instanceof File?await extractSchedule(file,year,startMonth):{...parseScheduleText(text,year,startMonth),sourceName:'직접 입력'};
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'일정 파일을 읽지 못했습니다.'},{status:400});}
}
