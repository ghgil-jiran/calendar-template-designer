(async()=>{
 const auth=window.ACDLAdminAuth,status=document.querySelector('#status'),save=document.querySelector('#save'),test=document.querySelector('#test');
 function refresh(){save.disabled=!auth.isSignedIn();status.textContent=auth.isSignedIn()?'관리자 로그인 완료. 수정본을 저장할 수 있습니다.':'관리자 로그인이 필요합니다.';}
 document.querySelector('#login').onsubmit=async e=>{e.preventDefault();try{await auth.signIn(document.querySelector('#email').value,document.querySelector('#password').value);document.querySelector('#password').value='';refresh();}catch(error){status.textContent=error.message;}};
 test.onclick=async()=>{try{await auth.signInForTesting();refresh();}catch(error){status.textContent=error.message;}};
 async function call(body){const r=await auth.authorizedFetch('/api/sample-d-installation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.message||data.error||'저장 실패');return data;}
 save.onclick=async()=>{save.disabled=true;try{status.textContent='등록 상태 확인 중';let result=await call({step:'start'});if(!result.completed){for(let index=0;index<result.documents;index++){status.textContent=`원본 PDF 등록 중 · ${index+1}/${result.documents}`;await call({step:'document',index});}status.textContent='템플릿 저장 중';result=await call({step:'save'});}const verified=await call({step:'verify'});if(!verified.completed||!verified.verified)throw Error('저장본 재열기 검증이 완료되지 않았습니다.');status.textContent=`저장 및 재열기 확인 완료 · v${verified.version} · ${verified.templateId}`;}catch(error){status.textContent=error.message+'\n다시 실행하면 완료된 PDF 등록부터 이어집니다.';}finally{save.disabled=false;}};
 await auth.ensureSession();refresh();test.hidden=!(await auth.capabilities()).testAutoLoginEnabled;
})();
