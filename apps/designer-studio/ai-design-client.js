(function(root){
 function token(){
  const value=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();
  if(!value)throw new Error('배포 화면에서 Master Admin 로그인 후 사용할 수 있습니다.');
  return value;
 }
 async function request(url,options={},timeoutMs=15000){
  const controller=new AbortController(),externalSignal=options.signal,abortFromOutside=()=>controller.abort(),timeout=root.setTimeout(()=>controller.abort(),timeoutMs);
  if(externalSignal?.aborted)controller.abort();else externalSignal?.addEventListener?.('abort',abortFromOutside,{once:true});
  try{
   const response=await root.fetch(url,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`,...options.headers}});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body?.error?.message||body?.message||'AI 디자인 연결 요청에 실패했습니다.');
   return body;
  }catch(error){if(error?.name==='AbortError'){const stopped=new Error(externalSignal?.aborted?'AI 디자인 생성을 중지했습니다.':'연결 확인 시간이 초과됐습니다. Supabase 설정을 확인해 주세요.');stopped.name=externalSignal?.aborted?'AIGenerationCancelledError':'Error';throw stopped}throw error}finally{root.clearTimeout(timeout);externalSignal?.removeEventListener?.('abort',abortFromOutside)}
 }
 async function generate(input,options={}){
  return request('/api/ai-design-generate',{method:'POST',body:JSON.stringify(input),signal:options.signal},170000);
 }
 async function config(){return request('/api/ai-design-config',{method:'GET'})}
 async function saveApiKey(apiKey){return request('/api/ai-design-config',{method:'PUT',body:JSON.stringify({apiKey})})}
 root.ACDLAIDesignClient=Object.freeze({generate,config,saveApiKey});
})(typeof window==='undefined'?globalThis:window);
