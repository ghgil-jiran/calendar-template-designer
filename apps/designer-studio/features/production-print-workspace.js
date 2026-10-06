(()=>{
 let session=null;
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function warningGroups(items){
  const groups=new Map(),origins={template:'템플릿 이미지',receipt:'접수 보관 이미지',correction:'관리자 교정 이미지',unknown:'출처 확인 필요'},roles={'ai-design-background':'배경','ai-month-back-component':'월 뒤 구성 이미지','school-building':'학교사진','school-song':'교가'};
  for(const item of items){
   const image=item.code==='IMAGE_LOW_DPI',key=image?JSON.stringify([item.origin,item.source,item.role,item.effectiveDpi,item.minimumDpi]):JSON.stringify([item.code,item.message]);
   const group=groups.get(key)||{...item,count:0,pages:new Set()};group.count++;if(item.pageNumber)group.pages.add(item.pageNumber);else{const match=item.path?.match(/^pages\[(\d+)\]/);if(match)group.pages.add(Number(match[1])+1);}groups.set(key,group);
  }
  return [...groups.values()].map(group=>{const pages=[...group.pages].sort((a,b)=>a-b),where=pages.length?` · ${pages.join(', ')}면`:'',repeated=group.count>1?` · ${group.count}건`:'';return group.code==='IMAGE_LOW_DPI'?`${origins[group.origin]||origins.unknown} · ${roles[group.role]||group.role} · ${group.effectiveDpi} DPI / 기준 ${group.minimumDpi} DPI · 보정 검토 대상 (자동 보정 미수행)${where}${repeated}`:`${group.message}${where}${repeated}`;});
 }
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
  const results=el('section'),upscale=el('section'),worker=el('section');host.append(results,upscale,worker);local.upscaleJob=null;local.upscaleBusy=false;local.upscaleMessage="";local.upscaleStatusPending=false;
  async function upscaleApi(action,extra={}){const response=await auth.authorizedFetch('/api/production-upscale',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,revisionId:local.revision.id,documentHash:local.revision.document_hash||local.quick?.identity?.documentHash,action,...extra})});const data=await response.json();if(!response.ok)throw Error(data.message||data.error||'업스케일 요청 실패');return data;}
  async function upscaleCommand(action,extra={}){
   if(session!==local)return;
   if(action==='status'){
    if(local.upscaleStatusPending||local.upscaleBusy)return;local.upscaleStatusPending=true;
    try{const data=await upscaleApi('status');if(session===local&&!local.upscaleBusy){const job=data.job||data.jobs?.[0]||null;if(JSON.stringify(job)!==JSON.stringify(local.upscaleJob)){local.upscaleJob=job;showUpscale();}}}
    catch(error){if(session===local&&!local.upscaleBusy){local.upscaleMessage='작업 상태 조회 실패: '+error.message;showUpscale();}}
    finally{local.upscaleStatusPending=false;}return;
   }
   if(local.upscaleBusy||local.busy){local.upscaleMessage='진행 중인 요청을 확인하고 있습니다. 잠시 후 다시 실행하세요.';showUpscale();return;}
   local.upscaleBusy=true;local.upscaleMessage=action==='request'?'업스케일 작업 준비 중… 저장 버전과 보관 원본을 확인하고 있습니다. 원본 용량에 따라 수 분 걸릴 수 있습니다.':action==='apply'?'보정 결과를 새 교정 버전으로 저장하는 중…':'업스케일 작업 상태 확인 중…';showUpscale();
   try{const data=await upscaleApi(action,extra);if(session!==local)return;if(action==='apply'){location.reload();return;}local.upscaleJob=data.job||data.jobs?.[0]||null;local.upscaleMessage=action==='request'?'업스케일 작업을 만들었습니다. 아래 Worker 실행 명령을 확인하세요.':'';}
   catch(error){if(session===local)local.upscaleMessage='업스케일 요청 실패: '+error.message;}
   finally{local.upscaleBusy=false;if(session===local)showUpscale();}
  }
  function showUpscale(){
   upscale.replaceChildren(el('h4','업스케일 · 선택사항'),el('p','DPI는 관리자 판단 자료입니다. 보정하지 않고 원본으로 최종 PDF 검사를 진행할 수 있습니다.'));
   const candidates=(local.quick?.images.results||[]).filter(item=>!item.vector&&item.placements?.length&&item.placements.every(p=>p.measurable&&Number.isFinite(p.effectiveDpi)&&p.effectiveDpi>0)&&item.placements.some(p=>p.effectiveDpi<local.quick.images.plan.imageQualityPolicy?.upscaleTargetDpi));
   upscale.append(el('p',`보정 목표 미달 ${candidates.length}개 원본 · 같은 원본의 여러 배치는 일괄 처리합니다. 투명도·ICC 등 미지원 원본은 처리 실패·별도 검토로 표시됩니다.`));
   if(local.upscaleMessage){const message=el('p',local.upscaleMessage);message.setAttribute('role','status');upscale.append(message);}
   const run=el('button',local.upscaleBusy?'업스케일 작업 준비 중…':local.upscaleJob?.status==='queued'?'보정 작업 생성 완료 · PC 실행 대기':local.upscaleJob?.status==='processing'?'일괄 업스케일 진행 중':'대상 이미지 일괄 업스케일');run.type='button';run.className='review-button';run.disabled=local.upscaleBusy||local.busy||!local.quick||local.quick.errors.length>0||!candidates.length||['queued','processing'].includes(local.upscaleJob?.status);run.onclick=()=>upscaleCommand('request',{imageLayouts:(local.quick.images.plan.uses||[]).filter(u=>u.layoutBasis).map(u=>({pageId:u.pageId,objectId:u.objectId,source:u.source,frameMm:u.frameMm,fit:u.fit,scale:u.scale,basis:u.layoutBasis}))});
   const skip=el('button','업스케일 없이 원본으로 진행');skip.type='button';skip.className='review-button';skip.onclick=()=>{status.textContent='원본으로 진행합니다. 빠른 검사 경고를 확인한 뒤 최종 인쇄 PDF 생성·검사를 실행하세요.';};upscale.append(run,skip);
   const job=local.upscaleJob;if(!job)return;const refreshUpscale=el('button','업스케일 결과 새로고침');refreshUpscale.type='button';refreshUpscale.className='review-button';refreshUpscale.disabled=local.upscaleBusy||local.busy;refreshUpscale.onclick=()=>upscaleCommand('status');upscale.append(refreshUpscale,el('p',`보정 작업 ${job.id} · ${{queued:'PC Worker 실행 대기',processing:'이미지 보정 진행 중',done:'보정 결과 확인 필요',error:'작업 실패'}[job.status]||job.status}${job.report?.total?' · '+(job.report.processed||0)+'/'+job.report.total+' 처리':''}`));
   if(job.status==='queued')upscale.append(el('p','이 버전의 보정 작업이 이미 생성되어 중복 요청을 막았습니다. 기존 사용자 서비스 폴더에서 PowerShell을 열고 아래 명령을 실행하세요. 엔진이 D:\\upscale-test 외의 폴더에 있으면 -EngineRoot 옵션을 추가하세요.'),el('code',`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\\upscale-test\\worker-upscale-admin\\run-upscale-job.ps1" -ProjectRoot (Get-Location).Path -JobId "${job.id}"`));if(job.error)upscale.append(el('p',job.error));
   const selected=[];for(const item of job.report?.results||[]){const block=el('div');block.append(el('p',`${(local.quick?.images.plan.uses||[]).filter(u=>u.source===item.source).map(u=>u.pageNumber+'면 · '+u.role).join(', ')||'이미지'} · ${{completed:'보정 완료·검토 필요',failed:'실패',skipped:'처리 제외',unresolved:'배치 확인 필요',blocked:'기준 확인 필요'}[item.status]||item.status}${item.error?' · '+item.error:''}`));if(item.status==='completed'&&item.assetId){const label=el('label'),check=el('input');check.type='checkbox';check.checked=true;selected.push({check,source:item.source});label.append(check,el('span','검토한 보정 결과 적용'));block.append(label);for(const [caption,url] of [['원본',local.quick?.imagePreviews?.[item.source]],['보정 결과',item.previewUrl]])if(url){const img=el('img');img.src=url;img.alt=caption;img.style.maxWidth='300px';img.style.maxHeight='250px';const link=el('a',caption+' 크게 보기');link.href=url;link.target='_blank';link.rel='noopener noreferrer';block.append(img,link);}block.append(el('p',`결과 ${item.width}×${item.height}px · 픽셀 증가가 실제 디테일 개선을 보장하지 않습니다.`));}upscale.append(block);}
   if(job.status==='done'&&selected.length){const apply=el('button','선택한 결과 적용·새 교정 버전 저장');apply.type='button';apply.className='review-button';apply.disabled=local.upscaleBusy||local.busy;apply.onclick=()=>{const sources=selected.filter(x=>x.check.checked).map(x=>x.source);if(!sources.length){status.textContent='적용할 결과를 선택하세요. 원본으로도 진행할 수 있습니다.';return;}if(confirm('선택한 보정 결과로 새 교정 버전을 저장할까요? 저장 후 빠른 검사를 다시 진행합니다.'))upscaleCommand('apply',{jobId:job.id,selectedSources:sources,id:crypto.randomUUID()});};upscale.append(apply);}
  }
  const record=el('button','빠른 검사 기록 다운로드');record.type='button';record.className='review-button';record.hidden=true;record.onclick=()=>{if(!local.quick)return;const url=URL.createObjectURL(new Blob([JSON.stringify(local.quick,(key,value)=>key==='imagePreviews'?undefined:value,2)],{type:'application/json'})),a=el('a');a.href=url;a.download=`production-v${local.revision.revision_number}-quick-inspection.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};host.append(record);
  function sync(){const disabled=!local.ready||local.busy;quick.disabled=disabled;refresh.disabled=disabled;correction.disabled=local.busy;generate.disabled=disabled||!local.quick||local.quick.errors.length>0||local.quick.warnings.length>0&&!accepted.checked;download.disabled=disabled||local.job?.status!=='done';retry.disabled=generate.disabled;retry.hidden=!local.job||!['done','error'].includes(local.job.status);}
  function command(action,{silent=false}={}){
   if(session!==local||!local.ready||local.busy||local.statusPending||!auth.isSignedIn())return;
   if(['request','retry'].includes(action)&&generate.disabled)return;
   if(action==='retry'&&!confirm('기존 결과를 보존하고 이 버전의 최종 PDF를 다시 생성할까요? 30분 이상 걸릴 수 있습니다.'))return;
   local.silentStatus=action==='status'&&silent;local.statusPending=action==='status';local.pendingAction=action;local.startedAt=Date.now();local.busy=!local.silentStatus;if(["request","retry"].includes(action))local.jobRendered=false;if(["request","retry"].includes(action))worker.replaceChildren(el("h4","최종 인쇄 PDF·Worker 검사"),el("p","저장한 교정 버전과 원본 이미지를 준비하고 있습니다. 원본 수와 용량에 따라 수 분 걸릴 수 있습니다. 준비가 끝나면 작업 번호와 기존 Worker 실행 명령이 표시됩니다."));if(!local.silentStatus)status.textContent=action==='quick'?'전체 면과 사용 원본을 검사하는 중…':action==='request'||action==='retry'?'보관 원본과 저장 버전을 고정하는 중…':'작업 결과 확인 중…';sync();
   local.progressMessage=status.textContent;clearTimeout(local.timer);local.timer=setTimeout(()=>{if(session===local){local.busy=false;local.statusPending=false;status.textContent='응답 대기 시간이 초과되었습니다. 생성 요청이었다면 결과 새로고침으로 기존 작업부터 확인하세요.';sync();}},action==='quick'?600000:360000);
   local.frame.contentWindow.postMessage({type:'calendar:production-inspection-command',requestId,revisionId:local.revision.id,action:action==='retry'?'request':action,force:action==='retry',warningsAccepted:accepted.checked,jobId:local.job?.id},location.origin);
  }
  function showQuick(result){
   local.quick=result;accepted.checked=false;consent.hidden=!result.warnings.length;record.hidden=false;results.replaceChildren(el('h4','빠른 검사 결과'),el('p',`오류 ${result.errors.length}개 · 경고 ${result.warnings.length}개 · ${result.images.plan.uses.length}개 이미지 배치`));
   const placements=(result.images.results||[]).flatMap(item=>item.placements||[]),counts={passed:0,warning:0,blocked:0,unresolved:0};for(const placement of placements)counts[placement.status]=(counts[placement.status]||0)+1;
   results.append(el('p',`이미지 기준 충족 ${counts.passed}건 · 보정 검토 ${counts.warning}건 · 최소 기준 미달·관리자 판단 ${counts.blocked}건 · 배치 확인 불가 ${counts.unresolved}건`));
   showUpscale();upscaleCommand('status');const quality=result.images.plan.imageQualityPolicy;if(quality)results.append(el('p',`권장 ${quality.recommendedDpi} DPI · 주문 최소 ${quality.orderMinimumDpi} DPI · 보정 목표 ${quality.upscaleTargetDpi} DPI. DPI 미달은 관리자 확인 사항입니다. 업스케일은 선택사항이며 원본으로 진행할 수 있습니다.`));
   for(const [label,items] of [['오류 · 교정 필요',result.errors],['경고 · 관리자 확인',result.warnings]])if(items.length){const details=el('details');details.open=label.startsWith('오류');details.append(el('summary',`${label} ${items.length}개`));const list=el('ul'),messages=label.startsWith('오류')?items.map(item=>item.message):warningGroups(items);if(!label.startsWith('오류'))details.append(el('p',`동일한 경고를 묶어 ${messages.length}개 항목으로 표시합니다. 검사 기록에는 전체 ${items.length}건을 보존합니다.`));for(const message of messages)list.append(el('li',message));details.append(list);results.append(details);}
   if(result.warnings.some(item=>item.code==='IMAGE_LOW_DPI'))results.append(el('p','접수 보관 이미지는 사용자·템플릿 원본이 함께 포함될 수 있습니다. 출처가 기록된 범위에서 구분합니다. 저해상도 이미지는 최종 PDF에서 선명도를 확인하세요. 교가 등 글자가 포함된 이미지는 작은 글자까지 확인하고, 필요한 경우 3단계에서 원본을 교체하거나 배치 크기를 조정하세요. CMYK 변환은 해상도를 개선하지 않습니다.'));
   results.append(el('small','빠른 검사는 생성 전 점검입니다. CMYK 색상·PDF/X-4·서체·최종 PDF의 품질은 Worker 결과에서 확인합니다.'));
  }
  function jobStatus(job){return {queued:'PC에서 기존 PDF Worker 실행이 필요합니다. 아래 작업 명령을 실행해 주세요.',processing:'PC Worker가 최종 PDF를 생성·검사하고 있습니다. 상태를 자동으로 확인합니다.',done:'최종 PDF 생성이 완료되었습니다. PDF와 자동 검사 결과를 확인하세요.',error:'Worker 작업이 실패했습니다. 오류 내용을 확인하세요.'}[job?.status]||'아직 최종 PDF 작업을 요청하지 않았습니다. 빠른 검사 후 생성 요청을 진행하세요.';}
  function showJob(job){
   if(local.jobRendered&&JSON.stringify(local.job)===JSON.stringify(job))return;local.jobRendered=true;local.job=job;worker.replaceChildren(el('h4','최종 인쇄 PDF·Worker 검사'));
   if(!job){worker.append(el('p','아직 최종 PDF 작업을 요청하지 않았습니다.'));return;}
   const labels={queued:'Worker 실행 대기',processing:'생성·검사 진행 중',done:'생성 완료',error:'작업 실패'};worker.append(el('p',`${labels[job.status]||job.status} · 작업 ${job.id}`));
   if(job.error)worker.append(el('p',job.error));
   if(job.status==='queued'){worker.append(el('p','먼저 기존 사용자 서비스 폴더의 PDF Worker 파일을 최신 Preview 브랜치로 갱신하세요. 갱신한 기존 Worker에서 이 작업을 실행합니다. ImageMagick이나 별도 이미지 Worker는 사용하지 않습니다.'));const code=el('code',`npm.cmd run pdf:worker -- --job ${job.id}`);worker.append(code);}
   if(job.status==='processing')worker.append(el('p','PC Worker가 이 작업을 처리하고 있습니다. PowerShell을 열어 둔 채 기다려 주세요. 같은 작업을 다시 실행하지 마세요.'));
   if(job.report){const verified=job.report.verified===true;worker.append(el('p',verified?'Worker 자동 검사 통과 · 관리자 PDF 확인과 최종 승인 필요':'Worker 검사 결과 확인 필요 · 최종 승인 전 오류·경고 검토'));const details=el('details');details.append(el('summary','Worker 검사 상세 결과'));const pre=el('pre',JSON.stringify(job.report,null,2));details.append(pre);worker.append(details);}
   if(job.status==='done')worker.append(el('small','PDF를 내려받아 전체 면과 교정 내용을 확인하세요. 최종 승인·인쇄소 전달은 5단계에서 처리합니다.'));
  }
  local.message=event=>{
   if(session!==local||!auth.isSignedIn()||!local.frame||event.source!==local.frame.contentWindow||event.origin!==location.origin||event.data?.requestId!==requestId)return;
   const data=event.data;
   if(data.type==='calendar:production-editor-progress'||data.type==='calendar:production-inspection-progress'){local.progressMessage=data.message;status.textContent=data.message;return;}
   if(data.type==='calendar:production-editor-error'){clearTimeout(local.timer);local.busy=false;local.ready=false;status.textContent=data.message;sync();return;}
   if(data.type==='calendar:production-editor-ready'){clearTimeout(local.timer);local.ready=true;local.busy=false;status.textContent='검사 준비 완료. 빠른 검사부터 진행하세요.';sync();command('status');return;}
   if(data.type!=='calendar:production-inspection-result'||data.revisionId!==local.revision?.id)return;
   clearTimeout(local.timer);local.busy=false;local.statusPending=false;if(data.error){status.textContent=data.error;sync();return;}
   if(data.action==='quick'){showQuick(data.result);status.textContent=data.result.errors.length?'오류를 확인하고 3단계에서 교정하세요.':'빠른 검사를 완료했습니다. 경고를 검토한 뒤 최종 생성 여부를 결정하세요.';}
   else if(data.action==='request'){showJob(data.result.job);status.textContent=jobStatus(data.result.job);}
   else if(data.action==='status'){const job=data.result.jobs[0]||null;showJob(job);status.textContent=jobStatus(job);}
   else if(data.action==='download'){const a=el('a');a.href=data.result.downloadUrl;a.target='_blank';a.rel='noopener noreferrer';a.click();status.textContent='완료 PDF 다운로드를 열었습니다.';}
   sync();
  };
  sync();
  (async()=>{try{
   const response=await auth.authorizedFetch(`/api/production-corrections?requestId=${encodeURIComponent(requestId)}`),data=await response.json();if(!response.ok)throw Error(data.message||'교정 버전을 읽지 못했습니다.');if(session!==local||!host.isConnected||!auth.isSignedIn())return;
   const revision=data.revisions?.[0];if(!revision){basis.textContent='저장된 교정 버전이 없습니다. 3단계에서 교정 버전을 저장하세요.';return;}
   local.revision=revision;basis.textContent=`검사 대상: 교정 v${revision.revision_number} · ${new Date(revision.created_at).toLocaleString('ko-KR')}`;
   const frame=el('iframe');frame.className='review-print-engine';frame.title='기존 템플릿 검사 모듈';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.src=`./index.html?productionRequest=${encodeURIComponent(requestId)}&productionRevision=${encodeURIComponent(revision.id)}&productionEmbedded=1&productionInspection=1`;local.frame=frame;host.append(frame);local.timer=setTimeout(()=>{if(session===local){status.textContent='검사 화면 준비 시간이 초과되었습니다. 다른 단계로 이동한 뒤 다시 열어 주세요.';local.busy=false;sync();}},120000);
   local.poll=setInterval(()=>{if(session!==local)return;if(local.busy&&['request','retry'].includes(local.pendingAction)){const seconds=Math.floor((Date.now()-local.startedAt)/1000);status.textContent=`${local.progressMessage} · ${Math.floor(seconds/60)}분 ${seconds%60}초 경과`;return;}if(local.ready&&!local.busy&&!local.upscaleBusy&&['queued','processing'].includes(local.upscaleJob?.status))upscaleCommand('status');if(local.ready&&!local.busy&&['queued','processing'].includes(local.job?.status))command('status',{silent:true});},10000);
  }catch(error){if(session===local)status.textContent=error.message;}})();
 }
 function clear(){if(session){clearTimeout(session.timer);clearInterval(session.poll);session.frame?.remove();session=null;}}
 window.addEventListener('message',event=>session?.message?.(event));
 window.ACDLProductionPrint={mount,clear,isBusy:()=>Boolean(session?.busy)};
})();
