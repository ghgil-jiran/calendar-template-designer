(async()=>{
 const auth=window.ACDLAdminAuth,$=id=>document.getElementById(id);let loaded;
 const update=()=>{$('login').hidden=auth.isSignedIn();$('inspect').hidden=$('apply').hidden=!auth.isSignedIn()};auth.onChange(update);update();
 $('login').onsubmit=async e=>{e.preventDefault();try{await auth.signIn($('email').value,$('password').value);$('password').value='';$('status').textContent='로그인했습니다. 현재 저장본을 확인해주세요.'}catch(e){$('status').textContent=e.message}};
 async function request(url,options){const r=await auth.authorizedFetch(url,options),data=await r.json();if(!r.ok)throw Error(data.error||'템플릿 요청 실패');return data}
 const load=id=>request('/api/templates?id='+encodeURIComponent(id));
 $('inspect').onclick=async()=>{try{
  const a=await load('cd82064c-12e3-4be4-973b-352327f6568b'),b=await load('00ccd75a-3223-40dc-a942-480913e5394b');
  if(a.version.projectData.template.metadata.sampleCPhotoCalendar===window.ACDLSampleCPhotoCalendar.REV){$('status').textContent=`이미 적용된 v${a.version.versionNumber}입니다.`;return}
  if(a.version.versionNumber!==9)throw Error(`현재 저장본은 v${a.version.versionNumber}입니다. 요청 기준 v9과 달라 자동 변경하지 않습니다.`);
  const candidate=window.ACDLSampleCPhotoCalendar.apply(a.version.projectData,b.version.projectData);loaded={a,b,candidate};$('apply').disabled=false;
  $('status').textContent=`샘플 C v${a.version.versionNumber} · 샘플 B v${b.version.versionNumber}\n`+candidate.book.pageInstances.filter(p=>p.role==='monthly-back').map(p=>`${p.monthKey} · 배경 ${candidate.book.elementsByPage[p.id][0].style.fill} · 사진 1장 · 월력 3개`).join('\n');
 }catch(e){loaded=null;$('apply').disabled=true;$('status').textContent=e.message}};
 $('apply').onclick=async()=>{if(!loaded)return;$('apply').disabled=true;try{const {a,b,candidate}=loaded,current=await load(a.template.id);if(current.version.id!==a.version.id)throw Error('다른 변경이 저장됐습니다. 현재 저장본을 다시 확인해주세요.');const result=await request('/api/templates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({templateId:a.template.id,stableKey:a.template.stableKey,name:a.template.name,description:a.template.description,edition:a.template.edition,state:a.template.state,isStandard:a.template.isStandard,productType:a.template.productType,templateKey:a.template.templateKey,saveKind:'manual',saveNote:`샘플 C v9 배경색 유지 · 기본 2 사진 조합형 · 샘플 B v${b.version.versionNumber} 사진 · 월력 뒷면 12면 사진·월력 조합형`,schemaVersion:candidate.version||'2.18.0',projectData:candidate})});const saved=await load(a.template.id);if(saved.version.id!==result.version.id)throw Error('저장 후 버전 확인 실패');const pages=saved.version.projectData.book.pageInstances.filter(p=>p.role==='monthly-back');if(pages.some(p=>(saved.version.projectData.book.elementsByPage[p.id]||[]).length!==5))throw Error('저장 후 개체 확인 실패');$('status').textContent=`적용·재조회 완료: 샘플 C v${saved.version.versionNumber} · 12면 · 각 사진 1장, 월력 3개 · 기존 배경색 유지`;loaded=null}catch(e){$('status').textContent=e.message}};
})();
