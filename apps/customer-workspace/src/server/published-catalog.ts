import 'server-only';
import {unstable_cache} from 'next/cache';
import {createPublishedReader} from './published-reader';
export function usesPublishedCatalog(){return process.env.NODE_ENV==='production'||process.env.CUSTOMER_CATALOG_MODE?.trim()!=='review';}
function reader(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('템플릿 연결 설정이 준비되지 않았습니다.');return createPublishedReader({url,key});}
const cachedPublishedCatalog=unstable_cache(async()=>reader().publishedCatalog(),['customer-published-catalog-v2'],{revalidate:30});
export async function publishedCatalog(){return cachedPublishedCatalog();}
export async function publishedSource(id:string,version:number){return reader().publishedSource(id,version);}
