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
 async function detail(id){
  const token=++detailRun,host=$('reviewDetail');host.replaceChildren(text('h2','접수 상세'),text('p','접수본을 불러오는 중…'));
  try{const {receipt,assets}=await api(new URLSearchParams({id}));if(token!==detailRun||!auth.isSignedIn())return;
   host.replaceChildren(text('h2',number(receipt.receipt_number)),text('h3',receipt.school_name),text('p',`${states[receipt.status]} · ${new Date(receipt.created_at).toLocaleString('ko-KR')}`));
   const snapshot=receipt.snapshot,contact=receipt.contact,warnings=snapshot.imageChecks.filter(item=>item.status==='warning');
   const dl=document.createElement('dl');for(const [title,value] of [['템플릿',`${snapshot.doc?.meta?.templateId||'선택 템플릿'} @${snapshot.doc?.meta?.templateVersion||'-'}`],['담당자',`${contact.name} · ${contact.email||contact.phone}${contact.email&&contact.phone?` · ${contact.phone}`:''}`],['확인한 면수',`${snapshot.confirmation.reviewedPageCount}면`],['이미지 검사',`${snapshot.imageChecks.length}개 배치 · 저해상도 ${warnings.length}개`],['사용자 동의',snapshot.confirmation.lowResolutionAccepted?'저해상도 품질 저하 가능성 및 원본 재요청 동의':'학교 정보·일정·사진 배치 확인'],['검수 안내','사용자 동의는 인쇄 품질 승인과 다릅니다. 원본을 검토한 뒤 CMYK 제작 또는 원본 재요청 여부를 결정하세요.']])dl.append(text('dt',title),text('dd',value));host.append(dl);
   if(warnings.length){host.append(text('h3','저해상도 위치'));for(const item of warnings)host.append(text('p',`${item.label} · ${item.dpi} DPI`))}
   const download=text('button','접수본 데이터 다운로드');download.type='button';download.className='review-button primary';download.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({receipt,assets},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${number(receipt.receipt_number)}-snapshot.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});host.append(download,text('small','편집 데이터·공통 Runtime·입력 정보·검사·동의 기록을 포함합니다. PDF/CMYK 생성과 교정본 편집 연결은 다음 단계입니다.'));
   host.append(text('h3',`보관 원본 ${assets.length}개`));for(const asset of assets){const link=text('a',asset.name);link.href=asset.url;link.target='_blank';link.rel='noopener noreferrer';link.className='review-asset-link';host.append(link)}
  }catch(error){if(token===detailRun)host.replaceChildren(text('h2','접수 상세'),text('p',error.message))}
 }
 function sync(){const signed=auth?.isSignedIn()===true;$('reviewLoginRequired').hidden=signed;$('reviewWorkspace').hidden=!signed;$('reviewAdminUser').textContent=signed?`${auth.currentUser()?.email||''} · Master Admin`:'';if(signed)list();else{run++;detailRun++;$('reviewRows').replaceChildren();$('reviewDetail').replaceChildren(text('h2','접수 상세'))}}
 auth?.onChange(sync);sync();auth?.ensureSession().finally(sync);
 $('reviewFilters').addEventListener('submit',event=>{event.preventDefault();offset=0;list()});$('reviewMore').addEventListener('click',()=>{offset+=50;list()});
})();
