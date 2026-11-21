import {createPublishedReader} from '@/server/published-reader';

export async function GET(request:Request){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:'일러스트 연결 설정이 준비되지 않았습니다.'},{status:503});
 try{
  const reader=createPublishedReader({url,key});
  const query=new URL(request.url).searchParams;
  if(query.has('id')){
   const asset=await reader.illustrationImage(query.get('id')||'',query.get('version')||'');
   if(!asset)return new Response(null,{status:404});
   return new Response(asset.body,{headers:{'Content-Type':asset.mimeType,'Cache-Control':'public, max-age=86400',
    'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
  }
  const catalog=await reader.illustrations();
  return Response.json(catalog,{headers:{'Cache-Control':'public, max-age=60, s-maxage=300'}});
 }catch{
  return Response.json({error:'게시된 일러스트를 불러오지 못했습니다.'},{status:502});
 }
}
