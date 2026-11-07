import {assertNativeProject,fieldsForProject,photoSlotsForProject,type NativeProject} from '../lib/materials/native-project.ts';
import type {CatalogResponse,TemplateCard} from '../lib/api/contracts';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createPublishedReader(settings:{url:string;key:string;fetcher?:typeof fetch}){
 const url=settings.url.replace(/\/$/,''),key=settings.key,fetch=settings.fetcher||globalThis.fetch;
 if(!/^https:\/\//.test(url)||!key)throw Error('템플릿 연결 설정이 준비되지 않았습니다.');
 function config(){return {url,key};}
async function rows(path:string):Promise<NativeProject[]>{const {url,key}=config();const response=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('게시 템플릿을 불러오지 못했습니다.');return response.json();}
async function publishedRows(id?:string){return rows('template_projects?select=id,name,description,state,latest_version_id,updated_at&state=eq.published&order=updated_at.desc&limit=3'+(id?`&id=eq.${encodeURIComponent(id)}`:''));}
function card(row:NativeProject,version:NativeProject):TemplateCard{
 const p=version.project_data;assertNativeProject(p);const pages=p.book.pageInstances,thumbnail=p.template.thumbnail;
 const cover=typeof thumbnail==='string'?thumbnail:thumbnail?.dataUrl||thumbnail?.src||null;
 return {id:row.id,version:Number(version.version_number),name:row.name,description:row.description||'',note:'게시된 템플릿',previewKind:'published',sourceUrl:`/api/workspace/templates/${row.id}?version=${version.version_number}`,coverUrl:cover,representativePages:pages.map((_:unknown,i:number)=>i+1).filter((_:unknown,i:number)=>[0,1,3,4].includes(i)),pageCount:pages.length,widthMm:p.productType.pageSize.width,heightMm:p.productType.pageSize.height,period:`${p.settings.year}년 ${p.settings.startMonth||1}월부터`,pages:pages.map((page:NativeProject,i:number)=>({number:i+1,label:page.label||(page.calendarMonth?`${page.calendarMonth}월 ${page.role==='monthly-front'?'월력 앞면':'월력 뒷면'}`:page.role==='cover-front'?'표지':page.semanticPageRole==='school-symbols'?'학교 상징':`달력 ${i+1}면`),imageUrl:null})),composition:[{label:'전체',count:pages.length}],fields:fieldsForProject(p),photoSlots:photoSlotsForProject(p),photoGuide:'교체할 수 있는 사진 영역에 준비한 사진을 배정해 주세요.'};
}
async function publishedCatalog():Promise<CatalogResponse>{
 const templates=await publishedRows(),ids=templates.map(r=>r.latest_version_id).filter(x=>uuid.test(x)),versions=ids.length?await rows(`template_versions?select=id,template_id,version_number,project_data&state=eq.published&id=in.(${ids.join(',')})`):[];
 const cards=templates.flatMap(row=>{const version=versions.find(v=>v.id===row.latest_version_id&&v.template_id===row.id);return version?[card(row,version)]:[]});
 await Promise.all(cards.map(async card=>{if(card.coverUrl?.startsWith('acdl-asset://')){const hydrated=await hydrate({image:card.coverUrl});card.coverUrl=hydrated.image;}}));
 return {mode:'published' as const,notice:'게시된 템플릿입니다. 입력 자료의 서버 저장·로그인 연결은 준비 중입니다.',templates:cards};
}
function signedUrl(path:string,base:string){
 const result=new URL(path.startsWith('http')?path:path.startsWith('/storage/v1/')?base+path:base+'/storage/v1'+(path.startsWith('/')?'':'/')+path);
 if(result.origin!==new URL(base).origin||!result.pathname.startsWith('/storage/v1/object/sign/template-assets/'))throw Error('자산 주소를 확인해 주세요.');return result.href;
}
async function hydrate(project:NativeProject){
 const ids=[...new Set(JSON.stringify(project).match(/acdl-asset:\/\/[0-9a-f-]{36}/gi)||[])].map(s=>s.slice(13));if(!ids.length)return project;
 if(ids.length>500)throw Error('템플릿 자산 수가 너무 많습니다.');
 const assets=await rows(`template_assets?select=id,storage_bucket,storage_path&id=in.(${ids.join(',')})`),urls=new Map<string,string>();const {url,key}=config();
 await Promise.all(assets.map(async asset=>{if(asset.storage_bucket!=='template-assets')throw Error('자산 저장 위치를 확인해 주세요.');const r=await fetch(`${url}/storage/v1/object/sign/template-assets/${String(asset.storage_path).split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('템플릿 이미지를 불러오지 못했습니다.');const s=await r.json(),path=s.signedURL||s.signedUrl;if(typeof path!=='string')throw Error('자산 주소를 확인해 주세요.');urls.set(`acdl-asset://${asset.id}`,signedUrl(path,url));}));
 if(ids.some(id=>!urls.has(`acdl-asset://${id}`)))throw Error('템플릿 이미지가 누락되었습니다.');
 return JSON.parse(JSON.stringify(project,(_k,value)=>typeof value==='string'&&urls.has(value)?urls.get(value):value));
}
async function publishedSource(id:string,version:number){
 if(!uuid.test(id)||!Number.isInteger(version)||version<1)throw Error('템플릿 식별자가 올바르지 않습니다.');
 const [row]=await publishedRows(id);if(!row)throw Error('게시된 템플릿이 없습니다.');
 const [record]=await rows(`template_versions?select=id,template_id,version_number,project_data&state=eq.published&id=eq.${row.latest_version_id}&template_id=eq.${id}&version_number=eq.${version}&limit=1`);if(!record)throw Error('템플릿 버전이 변경되었습니다. 목록을 다시 열어 주세요.');assertNativeProject(record.project_data);
 return {templateId:id,version,project:await hydrate(record.project_data)};
}

return {publishedCatalog,publishedSource};
}
