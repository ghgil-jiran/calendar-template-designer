import {NextResponse} from 'next/server';
import {submitProductionReceipt} from '@/server/customer-production-receipts';

export const runtime='nodejs';
export const maxDuration=120;
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'허용되지 않은 요청이에요.'},{status:403,headers});
 const access=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization')||'')?.[1];
 if(!access)return NextResponse.json({error:'저장한 프로젝트의 원본 접근 정보를 확인해 주세요.'},{status:401,headers});
 try{
  const raw=await request.text();
  if(raw.length>1500000)return NextResponse.json({error:'접수 자료가 너무 커요.'},{status:413,headers});
  const receipt=await submitProductionReceipt({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_SERVICE_ROLE_KEY||''},access,JSON.parse(raw));
  return NextResponse.json(receipt,{headers});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:'제작 검수 접수에 실패했어요.'},{status:400,headers});
 }
}
