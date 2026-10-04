(()=>{
 let session=null;
 const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
 function mount(host,current,onNext){
  const receipt=current.receipt,auth=window.ACDLAdminAuth,canEdit=['reviewing','changes'].includes(receipt.status);
  const intro=el('section');intro.className='review-material-intro';intro.append(el('p','접수본 또는 최신 교정본을 템플릿 에디터에서 열어 문구·이미지·배치를 확인하고 수정합니다. 수정한 내용은 변경 기록과 함께 새 교정 버전으로 저장하세요.'));
  const tasks=el('ol');for(const task of ['작업 기준을 확인한 뒤 템플릿 에디터 열기','전체 면을 확인하고 문구·이미지·배치 교정','교정 이유와 변경 내용을 기록하고 새 버전 저장','제작 검수로 돌아와 저장된 버전 확인'])tasks.append(el('li',task));intro.append(el('strong','관리자가 할 일'),tasks,el('small','접수 원본과 이전 버전은 보존됩니다. 다음 단계의 인쇄 검증은 저장된 교정 버전을 기준으로 진행합니다.'));host.append(intro);
  const target=el('section');target.className='review-correction-target';const basis=el('p','작업 기준을 불러오는 중…');basis.setAttribute('role','status');target.append(el('h4','에디터에서 열 작업 대상'),basis);
  const actions=el('div');actions.className='review-actions';const link=el('a','템플릿 에디터에서 교정');link.className='review-button primary';const editorUrl=`./index.html?productionRequest=${encodeURIComponent(receipt.id)}`;
  link.setAttribute('aria-disabled','true');link.addEventListener('click',event=>{event.preventDefault();if(link.getAttribute('aria-disabled')!=='true')openEditor();});
  const refresh=el('button','버전 목록 새로고침');refresh.type='button';refresh.className='review-button';actions.append(link,refresh);target.append(actions);if(!canEdit)target.append(el('small',receipt.status==='received'?'1단계에서 검수를 시작한 뒤 에디터로 이동할 수 있습니다.':'이 접수 상태에서는 교정본을 수정할 수 없습니다.'));host.append(target);
  const list=el('section');list.className='review-correction-versions';host.append(list);
  const next=el('button','4단계 인쇄 품질 검증으로 이동');next.type='button';next.className='review-button';next.disabled=true;next.addEventListener('click',()=>{if(!next.disabled&&!session?.launchBusy&&typeof onNext==='function')onNext();});
  const nextInfo=el('small','교정본을 저장한 뒤 다음 단계로 이동하세요.');host.append(next,nextInfo,el('small','4단계에서 빠른 검사 후 최종 PDF 생성·검사를 별도로 요청합니다. 4단계 이동이나 교정본 저장은 인쇄 검증 완료를 의미하지 않습니다.'));
  const progressHost=el('div');progressHost.className='review-editor-progress';progressHost.hidden=true;const progressText=el('p'),progress=el('progress');progress.max=100;progress.value=0;progress.setAttribute('aria-label','편집 화면 불러오기');progressText.setAttribute('role','status');progressHost.append(progressText,progress);target.append(progressHost);
  session={requestId:receipt.id,refresh:null,launchBusy:false,dispose:null};const local=session;let run=0,editorDialog=null,frame=null,timer=null;
  function dispose(){clearTimeout(timer);if(editorDialog){editorDialog.close();editorDialog.remove();editorDialog=null;frame=null;}local.launchBusy=false;}local.dispose=dispose;
  function fail(message){dispose();progressHost.hidden=false;progressText.textContent=message;progress.value=0;refresh.disabled=false;if(canEdit){link.href=editorUrl;link.setAttribute('aria-disabled','false');}}
  function openEditor(){
   if(session!==local||local.launchBusy||!auth.isSignedIn())return;local.launchBusy=true;link.setAttribute('aria-disabled','true');refresh.disabled=true;progressHost.hidden=false;progress.value=0;progressText.textContent='편집기 준비 중…';
   editorDialog=el('dialog');editorDialog.className='review-editor-dialog is-loading';editorDialog.setAttribute('aria-label','접수본 교정 편집기');frame=el('iframe');frame.title='접수본 교정 편집 화면';frame.src=editorUrl+'&productionEmbedded=1';editorDialog.append(frame);editorDialog.addEventListener('cancel',event=>{event.preventDefault();frame?.contentWindow.postMessage({type:'calendar:production-editor-close',requestId:receipt.id},location.origin);});document.body.append(editorDialog);editorDialog.show();timer=setTimeout(()=>fail('편집 화면 준비 시간이 초과되었습니다. 다시 시도해 주세요.'),120000);
  }
  local.message=event=>{if(session!==local||!frame||event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.requestId!==receipt.id)return;const {type,message,value}=event.data;if(type==='calendar:production-editor-progress'){progress.value=Math.max(0,Math.min(100,Number(value)||0));progressText.textContent=message;}else if(type==='calendar:production-editor-ready'){clearTimeout(timer);local.launchBusy=false;progress.value=100;progressText.textContent='편집 화면 준비 완료';editorDialog.close();editorDialog.classList.remove('is-loading');editorDialog.showModal();}else if(type==='calendar:production-editor-error'){fail(message||'편집 화면을 불러오지 못했습니다. 다시 시도해 주세요.');}else if(type==='calendar:production-editor-return'){dispose();progressHost.hidden=true;load();}};
  async function load(){
   if(session!==local||local.launchBusy||editorDialog?.open||!list.isConnected||!auth.isSignedIn())return;const token=++run;refresh.disabled=true;link.removeAttribute('href');link.setAttribute('aria-disabled','true');next.disabled=true;basis.textContent='저장된 교정 버전을 확인하는 중…';
   try{const response=await auth.authorizedFetch(`/api/production-corrections?requestId=${encodeURIComponent(receipt.id)}`),body=await response.json();if(!response.ok)throw Error(body.message||'교정 버전을 읽지 못했습니다.');if(session!==local||token!==run||!list.isConnected||!auth.isSignedIn())return;
    if(!Array.isArray(body.revisions))throw Error('교정 버전 목록을 확인하지 못했습니다. 다시 조회해 주세요.');
    const revisions=[...body.revisions].sort((a,b)=>b.revision_number-a.revision_number),latest=revisions[0];basis.textContent=latest?`최신 교정 v${latest.revision_number}에서 이어서 작업합니다.`:'접수본에서 첫 교정 작업을 시작합니다.';
    if(canEdit){link.href=editorUrl;link.setAttribute('aria-disabled','false');}
    list.replaceChildren(el('h4','저장된 교정 버전'));if(!latest)list.append(el('p','저장된 교정 버전이 없습니다. 에디터에서 확인·교정 후 새 버전을 저장하세요.'));
    for(const revision of revisions){const card=el('article');card.className='review-correction-version';card.append(el('strong',`교정 v${revision.revision_number}${revision.id===latest.id?' · 최신':''}`),el('small',new Date(revision.created_at).toLocaleString('ko-KR')),el('p',revision.note||'변경 기록 없음'));list.append(card);}
    if(latest)list.append(el('small','버전 목록은 저장 이력입니다. 이전 버전 선택·비교 기능은 아직 연결되지 않았습니다.'));
    next.disabled=!latest;nextInfo.textContent=latest?`교정 v${latest.revision_number} 저장을 확인했습니다. 다음 단계에서 검사할 버전을 확인하세요.`:'교정본을 저장한 뒤 다음 단계로 이동하세요.';
   }catch(error){if(session===local&&token===run&&list.isConnected){basis.textContent='작업 기준을 확인하지 못했습니다. 버전 목록을 다시 조회해 주세요.';list.replaceChildren(el('p',error.message));nextInfo.textContent='저장된 버전을 확인한 뒤 다음 단계로 이동하세요.';}}
   finally{if(session===local&&token===run)refresh.disabled=false;}
  }
  refresh.addEventListener('click',load);local.refresh=load;load();
 }
 window.addEventListener('focus',()=>session?.refresh?.());
 window.addEventListener('message',event=>session?.message?.(event));
 window.ACDLProductionCorrection={mount,clear:()=>{session?.dispose?.();session=null;},canClose:()=>!session?.launchBusy,isBusy:()=>Boolean(session?.launchBusy),getAssets:()=>[],getPageIndex:()=>0,getDocument:()=>null};
})();
