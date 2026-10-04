(()=>{
 const auth=window.ACDLAdminAuth,$=id=>document.getElementById(id),states={received:'제작 요청 접수',reviewing:'관리자 검수 중',changes:'수정 요청',approved:'인쇄 승인',sent:'인쇄소 전달'};
 let offset=0,run=0,detailRun=0;
 const number=value=>`CAL-${String(value).padStart(6,'0')}`;
 function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node}
 async function api(query){const response=await auth.authorizedFetch(`/api/production-requests?${query}`),body=await response.json();if(!response.ok)throw new Error(body.message||'접수 데이터를 불러오지 못했습니다. 서버 설정과 데이터베이스 연결을 확인해 주세요.');return body}
 async function list(){
  const token=++run;$('reviewFeedback').textContent='접수 목록을 불러오는 중…';
  try{const params=new URLSearchParams({search:$('reviewSearch').value,status:$('reviewStatus').value,offset:String(offset)}),body=await api(params);if(token!==run||!auth.isSignedIn())return;
   $('reviewRows').replaceChildren();
   for(const receipt of body.receipts){const row=document.createElement('tr'),cell=document.createElement('td'),button=text('button',number(receipt.receipt_number));button.type='button';button.className='review-link';button.addEventListener('click',()=>detail(receipt.id));cell.append(button);row.append(cell,text('td',receipt.school_name),text('td',`${receipt.template_id||'선택 템플릿'}${receipt.template_version?` @${receipt.template_version}`:''}`),text('td',new Date(receipt.created_at).toLocaleString('ko-KR')),text('td',states[receipt.status]||receipt.status));$('reviewRows').append(row)}
   if(!body.receipts.length){const row=document.createElement('tr'),cell=text('td','조건에 맞는 접수 내역이 없습니다.');cell.colSpan=5;cell.className='review-empty';row.append(cell);$('reviewRows').append(row)}
   $('reviewMore').hidden=!body.hasMore;$('reviewFeedback').textContent=`${body.receipts.length}건 표시${offset?' · 이전 목록은 검색을 다시 실행해 확인하세요.':''}`;
  }catch(error){if(token===run)$('reviewFeedback').textContent=error.message}
 }
 const steps=[['접수 정보','정보·검사 기록'],['접수 자료 확인','원본·확인 필요 항목'],['교정·버전 저장','에디터에서 교정·저장'],['인쇄 품질 검증','저장한 교정 버전 검사'],['확정·전달','승인 연결 예정']];
 let current=null,step=0,reviewBusy=false,reviewError=null,proofDialog=null,proofFrame=null;
 const proofBase='https://school-calendar-editor-service-q08rq3end-gil-gighyun-s-projects.vercel.app';
 function button(label,action,disabled=false){const node=text('button',label);node.type='button';node.className='review-button';node.disabled=disabled||reviewBusy;if(action)node.addEventListener('click',action);return node}
 function closeDetail(){if((reviewBusy||(window.ACDLProductionCorrection?.isBusy()||window.ACDLProductionPrint?.isBusy()))&&auth.isSignedIn())return;if(auth.isSignedIn()&&!window.ACDLProductionCorrection?.canClose())return;window.ACDLProductionCorrection?.clear();window.ACDLProductionPrint?.clear();detailRun++;current=null;closeProof();$('reviewDialog').close();$('reviewDetail').replaceChildren();$('reviewSteps').replaceChildren()}
 function info(host,entries){const dl=document.createElement('dl');dl.className='review-info-grid';for(const [label,value] of entries){const group=document.createElement('div');group.append(text('dt',label),text('dd',value));dl.append(group)}host.append(dl)}
 function download(){if(!current)return;const {receipt}=current;const blob=new Blob([JSON.stringify({receipt},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${number(receipt.receipt_number)}-snapshot.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function startReview(){
  if(reviewBusy||!current||current.receipt.status!=='received')return;
  const id=current.receipt.id,token=detailRun;reviewBusy=true;reviewError=null;renderDetail();
  try{
   const response=await auth.authorizedFetch('/api/production-requests',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action:'start-review'})}),body=await response.json();
   if(!response.ok)throw new Error(body.message||'검수 시작 상태를 저장하지 못했습니다.');
   if(token!==detailRun||!current||!auth.isSignedIn())return;
   current.receipt={...current.receipt,...body.receipt};step=1;list();
  }catch(error){if(token===detailRun)reviewError=error.message}
  finally{reviewBusy=false;if(token===detailRun&&current)renderDetail()}
 }
 function renderDetail(){
  if(!current)return;$('reviewDialogClose').disabled=reviewBusy;$('reviewDialogDone').disabled=reviewBusy;const {receipt,assets}=current,snapshot=receipt.snapshot,checks=snapshot.imageChecks||[],warnings=checks.filter(item=>item.status==='warning'),host=$('reviewDetail');
  $('reviewDialogTitle').textContent=`${number(receipt.receipt_number)} · ${receipt.school_name}`;$('reviewDialogMeta').textContent=`${states[receipt.status]||receipt.status} · 접수 ${new Date(receipt.created_at).toLocaleString('ko-KR')}`;
  $('reviewSteps').replaceChildren();steps.forEach(([label,caption],index)=>{const node=button(`${index+1}. ${label}`,()=>{if((window.ACDLProductionCorrection?.isBusy()||window.ACDLProductionPrint?.isBusy()))return;step=index;renderDetail()});node.className='review-step';if(step===index)node.setAttribute('aria-current','step');node.append(text('span',caption));$('reviewSteps').append(node)});
  window.ACDLProductionCorrection?.clear();window.ACDLProductionPrint?.clear();host.replaceChildren(text('h3',`${step+1}. ${steps[step][0]}`));if(reviewError){const error=text('p',reviewError);error.setAttribute('role','alert');error.className='review-callout';host.append(error)}if(reviewBusy){const progress=text('p','검수 시작 상태를 저장하는 중…');progress.setAttribute('role','status');host.append(progress)}
  if(step===0){
   host.append(text('p','담당자와 접수 내용을 확인하고, 사용자가 수행한 검사와 동의 기록을 검토하세요.'));
   const contact=receipt.contact||{},confirmed=snapshot.confirmation||{};
   info(host,[['템플릿·버전',`${snapshot.doc?.meta?.templateId||'선택 템플릿'} @${snapshot.doc?.meta?.templateVersion||'-'}`],['담당자',contact.name||'-'],['이메일',contact.email||'-'],['전화번호',contact.phone||'-'],['사용자 확인 면수',`${confirmed.reviewedPageCount||0}면`],['사용자 이미지 검사',`${checks.length}개 배치 · 저해상도 ${warnings.length}개`],['정보·배치 확인',confirmed.information&&confirmed.layout?'사용자 확인 완료':'확인 기록 없음'],['저해상도 동의',confirmed.lowResolutionAccepted?'품질 저하 가능성·원본 재요청에 동의':'동의 기록 없음']]);
   host.append(text('h4','검사 출처와 확인 범위'));const callout=text('p','사용자 서비스 검사는 이미지 해상도와 정보·배치 확인 기록입니다. 템플릿 자체의 인쇄 검증 이력은 이 접수 데이터만으로 확인되지 않으며, 관리자 CMYK·최종 인쇄 검증은 4단계에서 저장한 교정 버전으로 별도 진행합니다.');callout.className='review-callout';host.append(callout);
   if(checks.length){host.append(text('h4','사용자 이미지 검사 기록'));const wrap=document.createElement('div');wrap.className='review-table-wrap';const table=document.createElement('table');table.className='review-check-table';const head=document.createElement('tr');for(const value of ['배치 위치','해상도','결과'])head.append(text('th',value));const thead=document.createElement('thead');thead.append(head);table.append(thead);const body=document.createElement('tbody');for(const item of checks){const row=document.createElement('tr');row.append(text('td',item.label||'-'),text('td',item.dpi?`${item.dpi} DPI`:'확인 불가'),text('td',item.status==='warning'?'저해상도 주의':'기준 통과'));body.append(row)}table.append(body);wrap.append(table);host.append(wrap)}
   const actions=document.createElement('div');actions.className='review-actions';if(receipt.status==='received')actions.append(button(reviewBusy?'검수 시작 중…':'검수 시작 · 자료 확인',startReview));actions.append(button('접수 자료 확인으로 이동',()=>{step=1;renderDetail()}),button('접수 데이터 다운로드 (JSON)',download));host.append(actions,text('small','JSON은 백업·분석용입니다. 3단계에서 접수본을 에디터로 열어 교정할 수 있습니다.'));
  }else if(step===1){
   const intro=document.createElement('section');intro.className='review-material-intro';
   intro.append(text('p','사용자가 제출한 원본 이미지와 이미지 검사 기록을 확인합니다. 누락되거나 사용할 수 없는 자료, 저해상도 경고를 살펴보고 교정을 진행할지 원본을 다시 요청할지 판단하세요.'));
   const tasks=document.createElement('ol');for(const item of ['원본 누락·읽기 실패와 추가 자료 필요 여부 확인','저해상도 경고·사용자 동의를 검토하고 에디터에서 재확인할 항목 파악','자료를 확인한 뒤 3단계에서 에디터로 교정 진행'])tasks.append(text('li',item));intro.append(text('strong','관리자가 할 일'),tasks,text('small','전체 면의 배치·문구 확인과 수정은 템플릿 에디터에서 진행합니다. 이 단계에서는 접수 상태나 인쇄 승인 결과를 변경하지 않습니다.'));host.append(intro);
   const pages=snapshot.document?.template?.pages||[],attention=checks.filter(item=>item.status!=='pass'),blocked=attention.filter(item=>item.status!=='warning');
   info(host,[['접수 면수',`${pages.length}면`],['보관 원본',`${assets.length}개`],['저해상도 경고',`${warnings.length}개 배치`],['검사 기록의 확인 불가',`${blocked.length}개 배치`]]);
   host.append(text('h4','우선 확인할 항목'));
   if(!checks.length)host.append(text('p','사용자 이미지 검사 기록이 없습니다. 원본 목록과 에디터에서 사용 이미지를 확인하세요.'));
   else if(!attention.length)host.append(text('p','사용자 검사 기록에 저해상도 경고나 확인 불가 항목이 없습니다. 원본 누락·내용 적합성은 관리자가 확인하고, 실제 배치는 에디터에서 재검사하세요.'));
   if(attention.length){const records=document.createElement('details');records.className='review-material-section';records.open=blocked.length>0;records.append(text('summary',`확인 필요 ${attention.length}개 배치 · 위치별 검사 기록 보기`));const wrap=document.createElement('div');wrap.className='review-table-wrap';const table=document.createElement('table');table.className='review-check-table review-material-checks';const head=document.createElement('tr');for(const label of ['사용 위치','검사 결과','관리자 확인'])head.append(text('th',label));const thead=document.createElement('thead');thead.append(head);table.append(thead);const body=document.createElement('tbody');for(const item of attention){const row=document.createElement('tr');row.append(text('td',item.label||'사용 위치 확인 필요'),text('td',item.status==='warning'?`저해상도${item.dpi?` · ${item.dpi} DPI`:''}`:'확인 불가'),text('td',item.detail||'에디터에서 배치와 원본을 확인하세요.'));body.append(row);}table.append(body);wrap.append(table);records.append(wrap);host.append(records);}
   host.append(text('small',`저해상도 동의: ${snapshot.confirmation?.lowResolutionAccepted?'사용자 동의 기록 있음':'사용자 동의 기록 없음'}. 사용자 동의는 관리자 인쇄 승인이 아닙니다. 원본 재요청 전송·상태 관리 기능은 아직 연결되지 않았습니다.`));
   const originals=document.createElement('details');originals.className='review-material-section';originals.append(text('summary',`보관 원본 ${assets.length}개 확인`),text('p','필요한 이미지를 클릭하면 보관 원본을 새 탭에서 확인합니다. 목록에서 이미지가 보이지 않으면 접수 건을 다시 열어 확인하세요.'));
   const grid=document.createElement('div');grid.className='review-image-grid';for(const asset of assets){let url;try{url=new URL(asset.url);if(!['https:','http:'].includes(url.protocol))continue}catch{originals.append(text('p',`${asset.name||'보관 원본'} · 원본 주소를 확인할 수 없습니다.`));continue}const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.className='review-image-card';const image=document.createElement('img');image.src=url.href;image.alt=asset.name||'보관 원본';image.loading='lazy';image.addEventListener('error',()=>{image.remove();link.prepend(text('span','이미지를 불러오지 못했습니다. 접수 건을 다시 열어 주세요.'))},{once:true});link.append(image,text('span',asset.name||'보관 원본'));grid.append(link);}originals.append(grid);if(!assets.length)originals.append(text('p','보관 원본 목록이 없습니다. 에디터에서 필요한 이미지가 누락되지 않았는지 확인하세요.'));host.append(originals);
   const composition=document.createElement('details');composition.className='review-material-section';composition.append(text('summary',`접수 면 구성 ${pages.length}면`));const pageList=document.createElement('div');pageList.className='review-page-list';pages.forEach((page,index)=>pageList.append(text('span',`${index+1}면 · ${page.title||page.role||'페이지'}`)));composition.append(pageList);host.append(composition);
   const actions=document.createElement('div');actions.className='review-actions';const next=button('3단계 교정으로 이동',()=>{step=2;renderDetail()});next.classList.add('primary');const proof=button('접수 당시 모습 보기',openProof);proof.classList.add('review-secondary-action');actions.append(next,proof);host.append(actions,text('small','접수 당시 모습은 수정 전 자료를 참고하는 보조 화면입니다. 최신 교정본은 3단계의 템플릿 에디터에서 확인하세요.'));
  }else if(step===2){window.ACDLProductionCorrection.mount(host,current,()=>{step=3;renderDetail()});
  }else if(step===3){window.ACDLProductionPrint.mount(host,current,()=>{step=2;renderDetail()});
  }else{
   const descriptions=[null,null,['교정·재작업에서 할 일',['접수 원본을 보존한 별도 교정본 생성','필요한 정보·이미지·배치 교정 또는 사용자 원본 재요청','교정본 버전 저장과 변경 내용 기록'],'검수용 편집본 열기'],['인쇄 출력 검토에서 할 일',['검사할 교정본 버전 선택','네이티브 CMYK·PDF/X-4 생성','Worker 자동 검사와 관리자 육안 확인, 필요 시 시험 출력','수정한 새 버전은 다시 검증'],'인쇄 파일 생성·검사'],['확정·전달에서 할 일',['검증을 통과한 교정 버전과 최종 인쇄 파일 확정','관리자 승인 기록','인쇄소 전달 파일과 전달 일시 기록'],'최종 인쇄 승인']][step];
   host.append(text('p',descriptions[0]));const list=document.createElement('ol');for(const item of descriptions[1])list.append(text('li',item));host.append(list,button(`${descriptions[2]} · 연결 예정`,null,true),text('small','최종 승인·인쇄소 전달 처리는 아직 연결되지 않았습니다. 자동 검사 결과를 확인하고, 단계 선택만으로 검수 상태나 최종 승인이 바뀌지 않음을 확인하세요.'));
  }
 }
 async function detail(id,initialStep=0){
  const token=++detailRun;current=null;step=initialStep===2?2:0;reviewError=null;closeProof();$('reviewDetail').replaceChildren(text('p','접수본을 불러오는 중…'));$('reviewSteps').replaceChildren();$('reviewDialogTitle').textContent='접수본 확인';$('reviewDialogMeta').textContent='';if(!$('reviewDialog').open)$('reviewDialog').showModal();
  try{const result=await api(new URLSearchParams({id}));if(token!==detailRun||!auth.isSignedIn())return;current=result;renderDetail()}
  catch(error){if(token===detailRun)$('reviewDetail').replaceChildren(text('p',error.message))}
 }
 function closeProof(){if(proofDialog){proofDialog.close();proofDialog.remove();proofDialog=null;proofFrame=null;}}
 function openProof(){
  if(!current||!auth.isSignedIn())return;closeProof();
  proofDialog=document.createElement('dialog');proofDialog.className='review-receipt-proof';proofDialog.setAttribute('aria-labelledby','receiptProofTitle');
  const header=document.createElement('header');header.className='review-dialog-header';const heading=document.createElement('div'),title=text('h2',`${number(current.receipt.receipt_number)} · 접수 당시 모습`);title.id='receiptProofTitle';heading.append(title,text('p','수정 전 접수본의 읽기 전용 화면입니다. 최신 교정본과 인쇄 승인 결과는 포함하지 않습니다.'));header.append(heading,button('닫기',closeProof));
  proofFrame=document.createElement('iframe');proofFrame.title='수정 전 접수본 전체 면';proofFrame.className='review-proof-frame';proofFrame.referrerPolicy='no-referrer';proofFrame.setAttribute('sandbox','allow-scripts allow-same-origin');proofFrame.src=`${proofBase}/production-proof?parentOrigin=${encodeURIComponent(location.origin)}`;
  proofDialog.append(header,proofFrame);proofDialog.addEventListener('cancel',event=>{event.preventDefault();closeProof();});document.body.append(proofDialog);proofDialog.showModal();
 }
 window.addEventListener('message',event=>{
  if(!proofFrame||event.source!==proofFrame.contentWindow||event.origin!==proofBase||event.data?.type!=='calendar:production-proof-ready'||!current||!auth.isSignedIn())return;
  const {receipt,assets}=current;
  proofFrame.contentWindow.postMessage({type:'calendar:production-proof',mode:'receipt',pageIndex:0,receipt:{receipt_number:receipt.receipt_number,school_name:receipt.school_name,snapshot:{document:receipt.snapshot.document,printProfile:receipt.snapshot.printProfile}},assets:assets.map(asset=>({id:asset.id,url:asset.url}))},proofBase);
 });
 $('reviewDialogClose').addEventListener('click',closeDetail);$('reviewDialogDone').addEventListener('click',closeDetail);$('reviewDialog').addEventListener('cancel',event=>{event.preventDefault();closeDetail()});
 const returnQuery=new URLSearchParams(location.search);let resumed=false;
 function sync(){const signed=auth?.isSignedIn()===true;$('reviewLoginRequired').hidden=signed;$('reviewWorkspace').hidden=!signed;$('reviewAdminUser').textContent=signed?`${auth.currentUser()?.email||''} · Master Admin`:'';if(signed){list();if(!resumed&&returnQuery.get('reviewStep')==='3'&&/^[a-f0-9-]{36}$/i.test(returnQuery.get('productionRequest')||'')){resumed=true;detail(returnQuery.get('productionRequest'),2);}}else{run++;detailRun++;$('reviewRows').replaceChildren();closeDetail()}}
 auth?.onChange(sync);sync();auth?.ensureSession().finally(sync);
 $('reviewFilters').addEventListener('submit',event=>{event.preventDefault();offset=0;list()});$('reviewMore').addEventListener('click',()=>{offset+=50;list()});
})();

