import {DRAFT_RESOURCE} from './draft-store.mjs';

// Server-only, not imported by the browser or legacy persistence.
export function createV2DraftTransport({env=process.env,fetchImpl=fetch}={}){
  const raw=env.CALENDAR_V2_SUPABASE_URL?.trim(),key=env.CALENDAR_V2_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!raw||!key)throw new Error('V2 storage is not configured');
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Invalid V2 Supabase origin');
  return async function request(resource,options={}){
    const method=options.method||'GET';
    if(!['GET','POST','PATCH'].includes(method)||!resource.startsWith(DRAFT_RESOURCE))throw new Error('V2 resource is not allowed');
    const [table,query,...rest]=resource.split('?');
    if(table!==DRAFT_RESOURCE||rest.length)throw new Error('V2 resource is not allowed');
    const params=new URLSearchParams(query);
    for(const name of params.keys())if(!['id','revision','select'].includes(name))throw new Error('V2 query is not allowed');
    const response=await fetchImpl(`${url.origin}/rest/v1/${resource}`,{
      method,signal:AbortSignal.timeout(20000),redirect:'error',
      headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},
      ...(options.body===undefined?{}:{body:options.body})
    });
    if(!response.ok)throw Object.assign(new Error(`V2 storage request failed (${response.status})`),{statusCode:response.status});
    return response.json();
  };
}
