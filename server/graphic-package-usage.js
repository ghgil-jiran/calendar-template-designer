import {supabaseRequest} from './template-persistence.js';
export function packageReferences(data){
 const ids=new Set();function visit(value){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(visit);return;}if(typeof value.packageId==='string')ids.add(value.packageId);if(typeof value.capturedPackageId==='string')ids.add(value.capturedPackageId);if(value.graphicPackage?.id)ids.add(value.graphicPackage.id);for(const child of Object.values(value))visit(child);}visit(data);return ids;
}
export function buildPackageUsage(packages,templates,versions,drafts=[]){
 const map=new Map(packages.map(p=>[p.id,{verified:true,templates:[],historyTemplates:[]}])),byId=new Map(templates.map(t=>[t.id,t]));
 const add=(data,id,current)=>{const t=byId.get(id);if(!t)return;for(const key of packageReferences(data)){const usage=map.get(key);if(!usage)continue;const entries=current?usage.templates:usage.historyTemplates;if(!entries.some(e=>e.id===id))entries.push({id,name:t.name,state:t.state});}};
 for(const v of versions)add(v,v.template_id,byId.get(v.template_id)?.latest_version_id===v.id);
 for(const d of drafts)add(d,d.template_id,true);
 return packages.map(p=>{const usage=map.get(p.id);return {...p,usage:{...usage,count:usage.templates.length,historyCount:usage.historyTemplates.length}}});
}
async function all(query,path){let rows=[],offset=0;while(true){const page=await query(path+`&limit=10&offset=${offset}`);if(!Array.isArray(page))throw Error('패키지 사용 여부를 확인하지 못했습니다.');rows.push(...page);if(page.length<10)return rows;offset+=10;}}
export async function withPackageUsage(packages,{query=supabaseRequest,includeHistory=true}={}){
 const projection='capturedPackageId:project_data->template->settings->graphicPackage->>id,masterElements:project_data->template->masterElements,elements:project_data->book->elementsByPage';
 const templates=await all(query,'template_projects?select=id,name,state,latest_version_id&order=id.asc');
 const latest=[...new Set(templates.map(t=>t.latest_version_id).filter(Boolean))];
 const currentVersions=async()=>{const rows=[];for(let i=0;i<latest.length;i+=20)rows.push(...await all(query,'template_versions?select=id,template_id,'+projection+'&id=in.('+latest.slice(i,i+20).map(encodeURIComponent).join(',')+')&order=id.asc'));return rows;};
 const [versions,drafts]=await Promise.all([includeHistory?all(query,'template_versions?select=id,template_id,'+projection+'&order=id.asc'):currentVersions(),all(query,'template_drafts?select=template_id,'+projection+'&order=template_id.asc')]);
 return buildPackageUsage(packages,templates,versions,drafts).map(p=>({...p,usage:{...p.usage,historyVerified:includeHistory}}));
}
export function assertPackageUnused(pkg){if(!pkg.usage?.verified||pkg.usage.historyVerified===false)throw Object.assign(Error('패키지 사용 여부를 확인한 뒤 다시 시도해 주세요.'),{statusCode:409,code:'GRAPHIC_PACKAGE_USAGE_UNKNOWN'});if(pkg.usage.count||pkg.usage.historyCount)throw Object.assign(Error('현재 템플릿 또는 이전 저장 버전에서 사용하는 패키지입니다. 삭제 대신 보관을 이용해 주세요.'),{statusCode:409,code:'GRAPHIC_PACKAGE_IN_USE'});}
