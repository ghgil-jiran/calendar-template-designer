(()=>{
 const home=el('returnHomeBtn');if(!home)return;
 home.addEventListener('click',()=>{
  const changed=hasUnsavedEditorChanges();
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
 const modal=$('adminAuthModal'),form=$('adminAuthForm'),error=$('adminAuthError'),submit=$('submitAdminAuthBtn'),testOption=$('adminAuthTestOption'),testInput=$('adminAuthTestLogin');
 function updateAuthView(){const user=auth.currentUser(),signed=auth.isSignedIn();$('landingSignInBtn').textContent=signed?'Sign Out':'Sign In';$('landingAdminUser').textContent='';$('landingAdminUser').hidden=true;$('adminSessionBtn').textContent=signed?'Sign Out':'Sign In';document.body.dataset.adminAuthenticated=signed?'true':'false';document.querySelectorAll('.production-review-nav').forEach(link=>link.hidden=!signed)}
 function syncTestLoginFields(){const automatic=testInput.checked;$('adminAuthEmail').disabled=automatic;$('adminAuthPassword').disabled=automatic;$('adminAuthEmail').required=!automatic;$('adminAuthPassword').required=!automatic;submit.textContent=automatic?'테스트 로그인':'Sign In'}
 async function openSignIn(action=null){pendingAction=action;error.textContent='';form.reset();syncTestLoginFields();testOption.hidden=true;modal.classList.remove('hidden');const available=(await auth.capabilities?.())?.testAutoLoginEnabled===true;testOption.hidden=!available;requestAnimationFrame(()=>$(available?'adminAuthTestLogin':'adminAuthEmail').focus())}
 function closeSignIn(){modal.classList.add('hidden');pendingAction=null}
 document.addEventListener('click',event=>{const button=event.target.closest('#designerHomeLibrary,#designerHomeNew,#designerHomeTypes,#designerHomeGraphics,#designerHomeTemplateDesigner');if(!button||auth.isSignedIn())return;event.preventDefault();event.stopImmediatePropagation();openSignIn(()=>button.click())},true);
 $('landingSignInBtn').addEventListener('click',()=>{if(auth.isSignedIn()){auth.signOut();showEntry();updateAuthView()}else openSignIn()});
 $('adminSessionBtn').addEventListener('click',()=>{if(auth.isSignedIn()){auth.signOut();showEntry();updateAuthView()}else openSignIn()});
 $('closeAdminAuthBtn').addEventListener('click',closeSignIn);
 modal.addEventListener('click',event=>{if(event.target===modal)closeSignIn()});
 testInput.addEventListener('change',syncTestLoginFields);
 form.addEventListener('submit',async event=>{event.preventDefault();error.textContent='';submit.disabled=true;submit.textContent='확인 중…';try{if(testInput.checked)await auth.signInForTesting();else await auth.signIn($('adminAuthEmail').value,$('adminAuthPassword').value);const next=pendingAction;modal.classList.add('hidden');pendingAction=null;updateAuthView();next?.()}catch(reason){error.textContent=reason?.message||'로그인할 수 없습니다.'}finally{submit.disabled=false;submit.textContent=testInput.checked?'테스트 로그인':'Sign In'}});
 auth.onChange(updateAuthView);auth.ensureSession().finally(updateAuthView);updateAuthView();
})();

document.querySelectorAll('.production-review-nav').forEach(link=>link.addEventListener('click',event=>{
 const changed=hasUnsavedEditorChanges();
 if(changed&&!confirm('저장하지 않은 변경 사항이 있습니다. 제작 검수로 이동할까요?'))event.preventDefault();
}));

(() => {
 const button = document.getElementById('designerHomeTemplateDesigner');
 const dialog = document.getElementById('templateDesignerDialog');
 if (!button || !dialog) return;

 const viewer = dialog.querySelector('iframe');
 const legacyKey = 'acdl.template-designer.designs.v1';
 const endpoint = '/api/template-designs';
 const auth = window.ACDLAdminAuth;
 let migration;

 async function request(options) {
  const response = await auth.authorizedFetch(endpoint, options);
  if (!response.ok) throw new Error('Design storage request failed');
  return response.json();
 }

 function saveDesign(design, importExisting = false) {
  return request({
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ design, importExisting })
  });
 }

 function migrateBrowserDesigns() {
  if (migration) return migration;
  migration = (async () => {
   const source = localStorage.getItem(legacyKey);
   if (!source) return;
   const designs = JSON.parse(source);
   if (!Array.isArray(designs)) throw new Error('Invalid browser designs');
   for (const design of designs) await saveDesign(design, true);
   if (localStorage.getItem(legacyKey) === source) localStorage.removeItem(legacyKey);
  })().finally(() => { migration = undefined; });
  return migration;
 }

 window.addEventListener('message', async ({ source, origin, data }) => {
  if (source !== viewer.contentWindow || origin !== 'null' || !dialog.open ||
      !auth?.isSignedIn() || data?.channel !== 'template-designer-storage') return;

  const reply = payload => source.postMessage({ channel: data.channel, ...payload }, '*');
  if (data.action === 'load') {
   try {
    let migrationFailed = false;
    try { await migrateBrowserDesigns(); } catch { migrationFailed = true; }
    const { designs } = await request();
    reply({ action: 'loaded', designs, migrationFailed });
   } catch {
    reply({ action: 'loaded', ok: false });
   }
  } else if (data.action === 'save') {
   try {
    await saveDesign(data.design);
    reply({ action: 'saved', ok: true });
   } catch {
    reply({ action: 'saved', ok: false });
   }
  }
 });

 button.addEventListener('click', () => {
  if (!viewer.hasAttribute('src')) viewer.src = viewer.dataset.src;
  dialog.showModal();
 });
})();
