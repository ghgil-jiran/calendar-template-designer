(()=>{
 const home=el('returnHomeBtn');if(!home)return;
 home.addEventListener('click',()=>{
  const changed=!!project&&((el('saveStatus')?.textContent||'').includes('변경')||(savedHash&&savedHash!==window.ACDLPersistenceProject.hash(project)));
  if(changed&&!confirm('저장하지 않은 변경 사항이 있습니다. 처음 화면으로 돌아갈까요?'))return;
  el('templateLibraryModal')?.classList.add('hidden');el('templateMenuDropdown')?.classList.add('hidden');el('templateSaveDialog')?.classList.add('hidden');el('resourceModal')?.classList.add('hidden');el('objectDrawer')?.classList.add('hidden');el('workflowModal')?.classList.add('hidden');
  document.body.classList.remove('user-mode');
  showEntry();
  el('designerHome')?.classList.add('hidden');
  updateRoleIndicator?.();
 });
})();

(()=>{
 const $=id=>document.getElementById(id),auth=window.ACDLAdminAuth;
 if(!auth)return;
 let pendingAction=null;
 const modal=$('adminAuthModal'),form=$('adminAuthForm'),error=$('adminAuthError'),submit=$('submitAdminAuthBtn');
 function updateAuthView(){const user=auth.currentUser(),signed=auth.isSignedIn();$('landingSignInBtn').textContent=signed?'Sign Out':'Sign In';$('landingAdminUser').textContent=signed?`${user.email} · Master Admin`:'Master Admin 전용';$('adminSessionBtn').textContent=signed?`${user.email} · Sign Out`:'Sign In';document.body.dataset.adminAuthenticated=signed?'true':'false'}
 function openSignIn(action=null){pendingAction=action;error.textContent='';form.reset();modal.classList.remove('hidden');requestAnimationFrame(()=>$('adminAuthEmail').focus())}
 function closeSignIn(){modal.classList.add('hidden');pendingAction=null}
 document.addEventListener('click',event=>{const button=event.target.closest('#designerHomeLibrary,#designerHomeNew,#designerHomeTypes');if(!button||auth.isSignedIn())return;event.preventDefault();event.stopImmediatePropagation();openSignIn(()=>button.click())},true);
 $('landingSignInBtn').addEventListener('click',()=>{if(auth.isSignedIn()){auth.signOut();showEntry();updateAuthView()}else openSignIn()});
 $('adminSessionBtn').addEventListener('click',()=>{if(auth.isSignedIn()){auth.signOut();showEntry();updateAuthView()}else openSignIn()});
 $('closeAdminAuthBtn').addEventListener('click',closeSignIn);
 modal.addEventListener('click',event=>{if(event.target===modal)closeSignIn()});
 form.addEventListener('submit',async event=>{event.preventDefault();error.textContent='';submit.disabled=true;submit.textContent='확인 중…';try{await auth.signIn($('adminAuthEmail').value,$('adminAuthPassword').value);const next=pendingAction;modal.classList.add('hidden');pendingAction=null;updateAuthView();next?.()}catch(reason){error.textContent=reason?.message||'로그인할 수 없습니다.'}finally{submit.disabled=false;submit.textContent='Sign In'}});
 auth.onChange(updateAuthView);auth.ensureSession().finally(updateAuthView);updateAuthView();
})();
