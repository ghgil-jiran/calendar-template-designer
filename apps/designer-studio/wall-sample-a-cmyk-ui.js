(()=>{
 const $=id=>document.getElementById(id),auth=window.ACDLAdminAuth;
 let observed=null,busy=false;
 const status=message=>{$('status').textContent=message;};
 const call=async(step,versionId)=>{const response=await auth.authorizedFetch('/api/poster-sample',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variant:'floral-a-cmyk',step,versionId})});const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.message||data.error||'처리하지 못했습니다.');return data;};
 async function inspect(){observed=await call('inspect');$('account').textContent=`${observed.name} · 현재 v${observed.version}`;status(observed.completed?'이미 CMYK 배경이 반영되어 있습니다. 에디터에서 확인해 주세요.':'준비 완료. 버튼을 누르면 배경 원본 등록 후 새 초안 버전을 저장합니다.');$('apply').disabled=observed.completed;}
 async function ready(){await auth.ensureSession();const signed=auth.isSignedIn();$('login').hidden=signed;$('apply').disabled=!signed||busy;if(signed)await inspect();}
 $('login').onsubmit=async event=>{event.preventDefault();$('signIn').disabled=true;try{await auth.signIn($('email').value,$('password').value);$('password').value='';await ready();}catch(error){status(error.message);}finally{$('signIn').disabled=false;}};
 $('apply').onclick=async()=>{if(busy||!observed)return;busy=true;$('apply').disabled=true;try{status('1/2 · CMYK 배경 원본을 등록하고 있습니다…');const prepared=await call('prepare',observed.versionId);if(!prepared.completed){status('2/2 · 현재 템플릿의 배경을 교체하고 새 초안 버전을 저장하고 있습니다…');const saved=await call('save',observed.versionId);status(`반영 완료 · v${saved.version}\n템플릿 ID: ${saved.templateId}\n에디터에서 다시 열어 확인해 주세요.`);}else status('이미 반영되어 있습니다. 에디터에서 확인해 주세요.');observed=null;$('apply').textContent='반영 완료';}catch(error){status(error.message+'\n다시 누르면 현재 버전을 확인한 뒤 등록을 재개합니다.');try{observed=await call('inspect');$('apply').disabled=observed.completed;}catch{observed=null;}}finally{busy=false;if(observed&&!observed.completed)$('apply').disabled=false;}};
 ready().catch(error=>status(error.message));
})();
