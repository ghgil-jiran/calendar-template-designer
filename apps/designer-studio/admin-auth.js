(function(root){
 const SESSION_KEY='acdl.masterAdminSession';
 const listeners=new Set();
 let session=null,refreshPending=null,refreshTimer=null;
 try{session=JSON.parse(root.sessionStorage.getItem(SESSION_KEY)||'null')}catch{}
 const emit=()=>listeners.forEach(listener=>listener(session));
 function scheduleRefresh(){if(refreshTimer)root.clearTimeout?.(refreshTimer);refreshTimer=null;if(session&&root.setTimeout){const delay=Math.max(1000,Number(session.savedAt)+Number(session.expiresIn)*1000-Date.now()-60000);refreshTimer=root.setTimeout(()=>ensureSession().catch(()=>{}),delay)}}
 const save=value=>{session=value?{...value,savedAt:Date.now()}:null;try{session?root.sessionStorage.setItem(SESSION_KEY,JSON.stringify(session)):root.sessionStorage.removeItem(SESSION_KEY)}catch{}scheduleRefresh();emit();return session};
 async function request(body){
  const response=await root.fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.error==='MASTER_ADMIN_REQUIRED'?'Master Admin으로 등록된 계정만 사용할 수 있습니다.':data.error==='INVALID_CREDENTIALS'?'이메일 또는 비밀번호를 확인해주세요.':'로그인할 수 없습니다.'),{code:data.error||'AUTH_FAILED',status:response.status});
  return data;
 }
 async function signIn(email,password){return save(await request({action:'sign-in',email,password}))}
 async function signInForTesting(){return save(await request({action:'test-sign-in'}))}
 async function capabilities(){try{const response=await root.fetch('/api/admin-auth?capabilities=1'),data=await response.json().catch(()=>({}));return {testAutoLoginEnabled:response.ok&&data.testAutoLoginEnabled===true}}catch{return {testAutoLoginEnabled:false}}}
 async function refresh(){if(refreshPending)return refreshPending;if(!session?.refreshToken)return null;const current=session;refreshPending=(async()=>{try{const next=await request({action:'refresh',refreshToken:current.refreshToken});return session===current?save(next):session}catch(error){if(session===current){if(error.status===400||error.status===401||error.status===403)save(null);else if(root.setTimeout)refreshTimer=root.setTimeout(()=>refresh().catch(()=>{}),30000)}return null}finally{refreshPending=null}})();return refreshPending}
 function signOut(){save(null)}
 function accessToken(){return session?.accessToken||''}
 function currentUser(){return session?.user||null}
 function isSignedIn(){return Boolean(accessToken()&&currentUser()?.role==='master_admin')}
 async function ensureSession(){if(!session)return null;const expiresAt=Number(session.savedAt||0)+(Number(session.expiresIn||0)*1000);if(expiresAt&&Date.now()>=expiresAt-60000)return refresh();return session}
 async function authorizedFetch(path,options={}){await ensureSession();if(!accessToken())throw Object.assign(new Error('로그인이 만료되었습니다. 편집 내용을 유지한 채 다시 로그인해주세요.'),{code:'AUTH_REQUIRED',status:401});const send=()=>root.fetch(path,{...options,headers:{...options.headers,Authorization:`Bearer ${accessToken()}`}});let response=await send();if(response.status===401||response.status===403){const body=await response.clone().json().catch(()=>({}));if(body.error==='INVALID_SESSION'||body.error==='AUTH_REQUIRED'){const old=accessToken();if(await refresh()){if(accessToken()!==old)response=await send()}}}return response}
 root.addEventListener?.('focus',()=>ensureSession().catch(()=>{}));root.document?.addEventListener?.('visibilitychange',()=>{if(root.document.visibilityState==='visible')ensureSession().catch(()=>{})});scheduleRefresh();
 root.ACDLAdminAuth=Object.freeze({signIn,signInForTesting,capabilities,signOut,refresh,ensureSession,authorizedFetch,accessToken,currentUser,isSignedIn,onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)}});
})(window);
