(function(root){
 const SESSION_KEY='acdl.masterAdminSession';
 const listeners=new Set();
 let session=null;
 try{session=JSON.parse(root.sessionStorage.getItem(SESSION_KEY)||'null')}catch{}
 const emit=()=>listeners.forEach(listener=>listener(session));
 const save=value=>{session=value?{...value,savedAt:Date.now()}:null;try{session?root.sessionStorage.setItem(SESSION_KEY,JSON.stringify(session)):root.sessionStorage.removeItem(SESSION_KEY)}catch{}emit();return session};
 async function request(body){
  const response=await root.fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(data.error==='MASTER_ADMIN_REQUIRED'?'Master Admin으로 등록된 계정만 사용할 수 있습니다.':data.error==='INVALID_CREDENTIALS'?'이메일 또는 비밀번호를 확인해주세요.':'로그인할 수 없습니다.'),{code:data.error||'AUTH_FAILED',status:response.status});
  return data;
 }
 async function signIn(email,password){return save(await request({action:'sign-in',email,password}))}
 async function refresh(){if(!session?.refreshToken)return null;try{return save(await request({action:'refresh',refreshToken:session.refreshToken}))}catch{save(null);return null}}
 function signOut(){save(null)}
 function accessToken(){return session?.accessToken||''}
 function currentUser(){return session?.user||null}
 function isSignedIn(){return Boolean(accessToken()&&currentUser()?.role==='master_admin')}
 async function ensureSession(){if(!session)return null;const expiresAt=Number(session.savedAt||0)+(Number(session.expiresIn||0)*1000);if(expiresAt&&Date.now()>expiresAt-60000)return refresh();return session}
 root.ACDLAdminAuth=Object.freeze({signIn,signOut,refresh,ensureSession,accessToken,currentUser,isSignedIn,onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)}});
})(window);
