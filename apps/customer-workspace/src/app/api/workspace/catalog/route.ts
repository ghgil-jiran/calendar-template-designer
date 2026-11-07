import {NextResponse} from 'next/server';
import {reviewCatalog} from '@/server/review-catalog';
import {publishedCatalog,usesPublishedCatalog} from '@/server/published-catalog';
export async function GET() {
 try{return NextResponse.json(usesPublishedCatalog()?await publishedCatalog():reviewCatalog(),{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({error:'게시된 템플릿을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:503});}
}
