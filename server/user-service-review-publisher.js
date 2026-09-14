const DEFAULT_REVIEW_ENDPOINT='https://school-calendar-editor-servic-git-1a2acc-gil-gighyun-s-projects.vercel.app/api/template-packages/review';
const ALLOWED_MODES=new Set(['next-version','asset-chunk','chunk','finalize','activate-review','withdraw','retire-packages']);

function endpoint(){
  const configured=process.env.USER_SERVICE_REVIEW_API_URL?.trim();
  return configured||DEFAULT_REVIEW_ENDPOINT;
}

export async function forwardReviewPackage({authorization,body,fetcher=fetch}){
  if(!authorization?.match(/^Bearer\s+\S+/i))throw Object.assign(new Error('AUTH_REQUIRED'),{statusCode:401,code:'AUTH_REQUIRED'});
  if(!body||!ALLOWED_MODES.has(body.mode))throw Object.assign(new Error('INVALID_REVIEW_MODE'),{statusCode:400,code:'INVALID_REVIEW_MODE'});
  const timeoutMs=body.mode==='finalize'?240000:60000;
  let response;try{response=await fetcher(endpoint(),{
    method:'POST',
    headers:{Authorization:authorization,'Content-Type':'application/json'},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(timeoutMs)
  })}catch(error){if(error?.name==='TimeoutError'||error?.code===23)throw Object.assign(new Error(`사용자 서비스의 ${body.mode} 처리가 ${Math.round(timeoutMs/1000)}초 안에 끝나지 않았습니다.`),{statusCode:504,code:'USER_SERVICE_REVIEW_TIMEOUT'});throw error}
  const result=await response.json().catch(()=>({error:'invalid_user_service_response',message:`사용자 서비스가 JSON이 아닌 ${response.status} 응답을 반환했습니다.`}));
  if(!response.ok)throw Object.assign(new Error(result.message||result.error||'사용자 서비스 검토 패키지 전송에 실패했습니다.'),{statusCode:response.status,code:result.error||'USER_SERVICE_REVIEW_FAILED',detail:result});
  return result;
}
