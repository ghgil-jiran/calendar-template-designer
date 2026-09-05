(function(root){
 async function generate(input){
  const token=root.ACDLTemplateRemotePersistence?.accessToken?.()||root.ACDLAdminAuth?.accessToken?.();
  if(!token)throw new Error('새 AI 생성은 배포 화면에서 Master Admin 로그인 후 사용할 수 있습니다.');
  const response=await root.fetch('/api/ai-design-generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(input)});
  const body=await response.json().catch(()=>({}));
  if(!response.ok){const code=typeof body?.error==='string'?body.error:'',message=body?.error?.message||body?.message||(code==='AI_IMAGE_NOT_CONFIGURED'?'Vercel에 OPENAI_API_KEY 설정이 필요합니다.':code==='AI_IMAGE_UPSTREAM_FAILED'?'이미지 생성 서비스 요청이 실패했습니다. 잠시 후 다시 시도해 주세요.':response.status===503?'AI 이미지 생성 환경 설정이 필요합니다.':'AI 이미지 생성에 실패했습니다.');throw new Error(message)}
  return body;
 }
 root.ACDLAIDesignClient=Object.freeze({generate});
})(typeof window==='undefined'?globalThis:window);
