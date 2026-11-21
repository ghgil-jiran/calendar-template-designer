import {createPublishedReader} from '@/server/published-reader';

export async function GET(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:'일러스트 연결 설정이 준비되지 않았습니다.'},{status:503});
 try{
  const catalog=await createPublishedReader({url,key}).illustrations();
  return Response.json(catalog,{headers:{'Cache-Control':'public, max-age=60, s-maxage=300'}});
 }catch{
  return Response.json({error:'게시된 일러스트를 불러오지 못했습니다.'},{status:502});
 }
}
