import {NextResponse} from 'next/server';
import {publishedSource,usesPublishedCatalog} from '@/server/published-catalog';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!usesPublishedCatalog())return NextResponse.json({error:'실제 템플릿 연결이 준비되지 않았습니다.'},{status:503});
 try{const {id}=await params;return NextResponse.json(await publishedSource(id,Number(new URL(request.url).searchParams.get('version'))),{headers:{'Cache-Control':'no-store'}});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'템플릿을 불러오지 못했습니다.'},{status:404});}
}
