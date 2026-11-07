import 'server-only';
import {createPublishedReader} from './published-reader';
export function usesPublishedCatalog(){return process.env.CUSTOMER_CATALOG_MODE==='published';}
function reader(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('템플릿 연결 설정이 준비되지 않았습니다.');return createPublishedReader({url,key});}
export async function publishedCatalog(){return reader().publishedCatalog();}
export async function publishedSource(id:string,version:number){return reader().publishedSource(id,version);}
