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
