(()=>{
 let session=null;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function mount(host,current,onCorrection){
  clear();const auth=window.ACDLAdminAuth,requestId=current.receipt.id,local={requestId,frame:null,revision:null,ready:false,busy:false,quick:null,job:null,timer:null,poll:null};session=local;
  const intro=el('section');intro.className='review-material-intro';intro.append(el('p','저장한 교정 버전으로 인쇄 품질을 확인합니다. 먼저 빠른 검사 결과와 경고를 검토하고, 교정이 끝났을 때만 최종 인쇄 PDF 생성·검사를 실행하세요.'));
  const tasks=el('ol');for(const task of ['검사할 교정 버전 확인','빠른 검사로 문서·전체 면·원본·배치 해상도 확인','오류는 3단계에서 교정하고, 경고는 관리자가 검토','최종 PDF 생성·검사 요청 후 기존 PDF Worker 실행','완료 PDF와 자동 검사 결과 확인'])tasks.append(el('li',task));intro.append(tasks,el('small','과거 템플릿 통과 이력으로 검사를 생략하지 않습니다. 최종 생성은 30분 이상 걸릴 수 있으며, 자동 검사 통과는 5단계의 최종 승인이 아닙니다.'));host.append(intro);
  const basis=el('p','저장 버전을 확인하는 중…'),status=el('p');status.setAttribute('role','status');host.append(basis,status);
  const actions=el('div');actions.className='review-actions';
  function button(label,action){const node=el('button',label);node.type='button';node.className='review-button';node.onclick=()=>command(action);actions.append(node);return node;}
  const quick=button('빠른 검사 시작','quick'),generate=button('최종 인쇄 PDF 생성·검사','request'),refresh=button('Worker 결과 새로고침','status'),download=button('완료 PDF 다운로드','download');quick.classList.add('primary');
  const retry=button('최종 PDF 다시 생성','retry');retry.hidden=true;
  const correction=el('button','3단계로 돌아가 교정');correction.type='button';correction.className='review-button';correction.onclick=()=>{if(!local.busy)onCorrection();};actions.append(correction);host.append(actions);
  const consent=el('label');consent.className='review-print-consent';const accepted=el('input');accepted.type='checkbox';accepted.onchange=sync;consent.append(accepted,el('span','이 버전의 빠른 검사 경고를 확인했습니다. 최종 생성 후 PDF에서도 확인하겠습니다.'));consent.hidden=true;host.append(consent);
  const results=el('section'),worker=el('section');host.append(results,worker);
  const record=el('button','빠른 검사 기록 다운로드');record.type='button';record.className='review-button';record.hidden=true;record.onclick=()=>{if(!local.quick)return;const url=URL.createObjectURL(new Blob([JSON.stringify(local.quick,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download=`production-v${local.revision.revision_number}-quick-inspection.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};host.append(record);
  function sync(){const disabled=!local.ready||local.busy;quick.disabled=disabled;refresh.disabled=disabled;correction.disabled=local.busy;generate.disabled=disabled||!local.quick||local.quick.errors.length>0||local.quick.warnings.length>0&&!accepted.checked;download.disabled=disabled||local.job?.status!=='done';retry.disabled=generate.disabled;retry.hidden=!local.job||!['done','error'].includes(local.job.status);}
  function command(action){
   if(session!==local||!local.ready||local.busy||!auth.isSignedIn())return;
   if(['request','retry'].includes(action)&&generate.disabled)return;
   if(action==='retry'&&!confirm('기존 결과를 보존하고 이 버전의 최종 PDF를 다시 생성할까요? 30분 이상 걸릴 수 있습니다.'))return;
   local.busy=true;status.textContent=action==='quick'?'전체 면과 사용 원본을 검사하는 중…':action==='request'||action==='retry'?'보관 원본과 저장 버전을 고정하는 중…':'작업 결과 확인 중…';sync();
   clearTimeout(local.timer);local.timer=setTimeout(()=>{if(session===local){local.busy=false;status.textContent='응답 대기 시간이 초과되었습니다. 생성 요청이었다면 결과 새로고침으로 기존 작업부터 확인하세요.';sync();}},action==='quick'?600000:360000);
   local.frame.contentWindow.postMessage({type:'calendar:production-inspection-command',requestId,revisionId:local.revision.id,action:action==='retry'?'request':action,force:action==='retry',warningsAccepted:accepted.checked,jobId:local.job?.id},location.origin);
  }
  function showQuick(result){
   local.quick=result;accepted.checked=false;consent.hidden=!result.warnings.length;record.hidden=false;results.replaceChildren(el('h4','빠른 검사 결과'),el('p',`오류 ${result.errors.length}개 · 경고 ${result.warnings.length}개 · ${result.images.plan.uses.length}개 이미지 배치`));
   for(const [label,items] of [['오류 · 교정 필요',result.errors],['경고 · 관리자 확인',result.warnings]])if(items.length){const details=el('details');details.open=label.startsWith('오류');details.append(el('summary',`${label} ${items.length}개`));const list=el('ul');for(const item of items)list.append(el('li',item.message));details.append(list);results.append(details);}
   results.append(el('small','빠른 검사는 생성 전 점검입니다. CMYK 색상·PDF/X-4·서체·최종 PDF의 품질은 Worker 결과에서 확인합니다.'));
  }
  function showJob(job){
   local.job=job;worker.replaceChildren(el('h4','최종 인쇄 PDF·Worker 검사'));
   if(!job){worker.append(el('p','아직 최종 PDF 작업을 요청하지 않았습니다.'));return;}
   const labels={queued:'Worker 실행 대기',processing:'생성·검사 진행 중',done:'생성 완료',error:'작업 실패'};worker.append(el('p',`${labels[job.status]||job.status} · 작업 ${job.id}`));
   if(job.error)worker.append(el('p',job.error));
   if(['queued','processing'].includes(job.status)){worker.append(el('p','먼저 기존 사용자 서비스 폴더의 PDF Worker 파일을 최신 Preview 브랜치로 갱신하세요. 갱신한 기존 Worker에서 이 작업을 실행합니다. ImageMagick이나 별도 이미지 Worker는 사용하지 않습니다.'));const code=el('code',`npm.cmd run pdf:worker -- --job ${job.id}`);worker.append(code);}
   if(job.report){const verified=job.report.verified===true;worker.append(el('p',verified?'Worker 자동 검사 통과 · 관리자 PDF 확인과 최종 승인 필요':'Worker 검사 결과 확인 필요 · 최종 승인 전 오류·경고 검토'));const details=el('details');details.append(el('summary','Worker 검사 상세 결과'));const pre=el('pre',JSON.stringify(job.report,null,2));details.append(pre);worker.append(details);}
   if(job.status==='done')worker.append(el('small','PDF를 내려받아 전체 면과 교정 내용을 확인하세요. 최종 승인·인쇄소 전달은 5단계에서 처리합니다.'));
  }
  local.message=event=>{
   if(session!==local||!auth.isSignedIn()||!local.frame||event.source!==local.frame.contentWindow||event.origin!==location.origin||event.data?.requestId!==requestId)return;
   const data=event.data;
   if(data.type==='calendar:production-editor-progress'||data.type==='calendar:production-inspection-progress'){status.textContent=data.message;return;}
   if(data.type==='calendar:production-editor-error'){clearTimeout(local.timer);local.busy=false;local.ready=false;status.textContent=data.message;sync();return;}
   if(data.type==='calendar:production-editor-ready'){clearTimeout(local.timer);local.ready=true;local.busy=false;status.textContent='검사 준비 완료. 빠른 검사부터 진행하세요.';sync();command('status');return;}
   if(data.type!=='calendar:production-inspection-result'||data.revisionId!==local.revision?.id)return;
   clearTimeout(local.timer);local.busy=false;if(data.error){status.textContent=data.error;sync();return;}
   if(data.action==='quick'){showQuick(data.result);status.textContent=data.result.errors.length?'오류를 확인하고 3단계에서 교정하세요.':'빠른 검사를 완료했습니다. 경고를 검토한 뒤 최종 생성 여부를 결정하세요.';}
   else if(data.action==='request'){showJob(data.result.job);status.textContent='이 교정 버전의 PDF 작업을 확인했습니다.';}
   else if(data.action==='status'){showJob(data.result.jobs[0]||null);status.textContent='저장된 Worker 상태를 확인했습니다.';}
   else if(data.action==='download'){const a=el('a');a.href=data.result.downloadUrl;a.target='_blank';a.rel='noopener noreferrer';a.click();status.textContent='완료 PDF 다운로드를 열었습니다.';}
   sync();
  };
  sync();
  (async()=>{try{
   const response=await auth.authorizedFetch(`/api/production-corrections?requestId=${encodeURIComponent(requestId)}`),data=await response.json();if(!response.ok)throw Error(data.message||'교정 버전을 읽지 못했습니다.');if(session!==local||!host.isConnected||!auth.isSignedIn())return;
   const revision=data.revisions?.[0];if(!revision){basis.textContent='저장된 교정 버전이 없습니다. 3단계에서 교정 버전을 저장하세요.';return;}
   local.revision=revision;basis.textContent=`검사 대상: 교정 v${revision.revision_number} · ${new Date(revision.created_at).toLocaleString('ko-KR')}`;
   const frame=el('iframe');frame.className='review-print-engine';frame.title='기존 템플릿 검사 모듈';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.src=`./index.html?productionRequest=${encodeURIComponent(requestId)}&productionRevision=${encodeURIComponent(revision.id)}&productionEmbedded=1&productionInspection=1`;local.frame=frame;host.append(frame);local.timer=setTimeout(()=>{if(session===local){status.textContent='검사 화면 준비 시간이 초과되었습니다. 다른 단계로 이동한 뒤 다시 열어 주세요.';local.busy=false;sync();}},120000);
   local.poll=setInterval(()=>{if(session===local&&local.ready&&!local.busy&&['queued','processing'].includes(local.job?.status))command('status');},10000);
  }catch(error){if(session===local)status.textContent=error.message;}})();
 }
 function clear(){if(session){clearTimeout(session.timer);clearInterval(session.poll);session.frame?.remove();session=null;}}
 window.addEventListener('message',event=>session?.message?.(event));
 window.ACDLProductionPrint={mount,clear,isBusy:()=>Boolean(session?.busy)};
})();
