(() => {
 const auth=window.ACDLAdminAuth,$=id=>document.getElementById(id),status=$('status');
 const update=()=>{$('login').hidden=auth.isSignedIn();$('install').hidden=!auth.isSignedIn();};
 auth.onChange(update);update();
 $('login').addEventListener('submit',async e=>{e.preventDefault();try{await auth.signIn($('email').value,$('password').value);$('password').value='';status.textContent='로그인했습니다. 샘플 C를 등록할 수 있습니다.';}catch(error){status.textContent=error.message;}});
 async function step(body){const response=await auth.authorizedFetch('/api/sample-c-installation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.error||'등록 요청에 실패했습니다.');return data;}
 $('install').addEventListener('click',async()=>{
  $('install').disabled=true;$('progress').hidden=false;
  try{
   const start=await step({step:'start'});
   if(!start.completed){const total=start.documentCount+start.assetCount+1;$('progress').max=total;
    for(let index=0;index<start.documentCount;index++){status.textContent=`원본 PDF 등록·검증 중 (${index+1}/${start.documentCount})`;await step({step:'document',index});$('progress').value=index+1;}
    for(let index=0;index<start.assetCount;index++){status.textContent=`학교 이미지·월별 장식 등록 중 (${index+1}/${start.assetCount})`;await step({step:'asset',index});$('progress').value=start.documentCount+index+1;}
    status.textContent='템플릿 초안을 저장하고 있습니다.';await step({step:'save'});$('progress').value=total;
   }
   status.textContent='샘플 C 초안을 등록했습니다. 에디터의 템플릿 목록에서 확인해주세요.';$('open').hidden=false;
  }catch(error){status.textContent=error.message+'\n다시 등록하면 완료된 단계에 이어서 진행합니다.';$('install').disabled=false;}
 });
})();
