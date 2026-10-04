(()=>{
 let session=null;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function mount(host,current){
  const receipt=current.receipt;
  host.append(el('p','접수본을 기존 템플릿 에디터에서 열어 교정합니다. 면을 선택하고 개체를 직접 수정한 뒤, 해당 접수 건의 새 교정 버전으로 저장합니다. 원본 템플릿과 접수본은 보존됩니다.'));
  const link=el('a','템플릿 에디터에서 교정');link.className='review-button';link.href=`./index.html?productionRequest=${encodeURIComponent(receipt.id)}`;
  if(!['reviewing','changes'].includes(receipt.status)){host.append(el('p','1단계에서 검수를 시작한 뒤 교정할 수 있습니다.'));}else host.append(link);
  host.append(el('p','에디터에서 저장한 교정 버전을 기준으로 인쇄 품질 검사를 진행합니다. 검사 결과는 다른 교정 버전에 자동으로 적용되지 않습니다.'));
  const list=el('div');host.append(list);list.append(el('p','교정 버전을 불러오는 중…'));
  session={requestId:receipt.id};const local=session;
  window.ACDLAdminAuth.authorizedFetch(`/api/production-corrections?requestId=${receipt.id}`).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.message||'교정 버전을 읽지 못했습니다.');if(session!==local||!list.isConnected)return;list.replaceChildren(el('h4','저장된 교정 버전'));if(!body.revisions.length)list.append(el('p','저장된 교정 버전이 없습니다. 첫 교정본은 접수본을 기준으로 엽니다.'));for(const revision of body.revisions)list.append(el('p',`v${revision.revision_number} · ${new Date(revision.created_at).toLocaleString('ko-KR')} · ${revision.note} · 인쇄 검증 별도 필요`));}).catch(error=>{if(list.isConnected)list.replaceChildren(el('p',error.message));});
 }
 window.ACDLProductionCorrection={mount,clear:()=>{session=null;},canClose:()=>true,isBusy:()=>false,getAssets:()=>[],getPageIndex:()=>0,getDocument:()=>null};
})();
