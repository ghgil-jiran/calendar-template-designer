(function(root){
 function token(){
  const value=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();
  if(!value)throw new Error('배포 화면에서 Master Admin 로그인 후 사용할 수 있습니다.');
  return value;
 }
 async function request(url,options={},timeoutMs=15000){
  const controller=new AbortController(),timeout=root.setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await root.fetch(url,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`,...options.headers}});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body?.error?.message||body?.message||'AI 디자인 연결 요청에 실패했습니다.');
   return body;
  }catch(error){if(error?.name==='AbortError')throw new Error('연결 확인 시간이 초과됐습니다. Supabase 설정을 확인해 주세요.');throw error}finally{root.clearTimeout(timeout)}
 }
 async function generate(input){
  return request('/api/ai-design-generate',{method:'POST',body:JSON.stringify(input)},70000);
 }
 async function config(){return request('/api/ai-design-config',{method:'GET'})}
 async function saveApiKey(apiKey){return request('/api/ai-design-config',{method:'PUT',body:JSON.stringify({apiKey})})}
 root.ACDLAIDesignClient=Object.freeze({generate,config,saveApiKey});
})(typeof window==='undefined'?globalThis:window);
