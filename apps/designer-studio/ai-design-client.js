(function(root){
 function token(){
  const value=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();
  if(!value)throw new Error('배포 화면에서 Master Admin 로그인 후 사용할 수 있습니다.');
  return value;
 }
 async function request(url,options={}){
  const response=await root.fetch(url,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`,...options.headers}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body?.error?.message||body?.message||'AI 디자인 연결 요청에 실패했습니다.');
  return body;
 }
 async function generate(input){
  return request('/api/ai-design-generate',{method:'POST',body:JSON.stringify(input)});
 }
 async function config(){return request('/api/ai-design-config',{method:'GET'})}
 async function saveApiKey(apiKey){return request('/api/ai-design-config',{method:'PUT',body:JSON.stringify({apiKey})})}
 root.ACDLAIDesignClient=Object.freeze({generate,config,saveApiKey});
})(typeof window==='undefined'?globalThis:window);
