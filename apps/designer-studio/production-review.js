(()=>{
 const auth=window.ACDLAdminAuth,$=id=>document.getElementById(id);
 function sync(){const signed=auth?.isSignedIn()===true;$('reviewLoginRequired').hidden=signed;$('reviewWorkspace').hidden=!signed;$('reviewAdminUser').textContent=signed?`${auth.currentUser()?.email||''} · Master Admin`:''}
 auth?.onChange(sync);sync();auth?.ensureSession().finally(sync);
 $('reviewFilters').addEventListener('submit',event=>{event.preventDefault();$('reviewSearchFeedback').textContent='접수 데이터 연결 후 검색과 상태 필터를 사용할 수 있습니다.'});
})();
