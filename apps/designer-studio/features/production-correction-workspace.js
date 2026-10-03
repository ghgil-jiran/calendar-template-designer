(()=>{
 const auth=window.ACDLAdminAuth;let session=null;
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
 function canClose(){return !session?.dirty||window.confirm('저장하지 않은 교정 내용이 있습니다. 버리고 닫을까요?');}
 function clear(){session=null;}
 function mount(host,current,proofBase){
  const receipt=current.receipt;
  if(session?.requestId!==receipt.id)session={requestId:receipt.id,revisions:null,document:null,patches:new Map(),dirty:false,busy:false,page:0,object:0,note:'',pendingId:null,assets:[],uploadAvailable:false};
  const s=session;host.append(el('p','접수 원본을 보존한 교정본입니다. 위치·크기, 단순 텍스트와 접수된 이미지 교체를 지원합니다. 새 교정 원본을 업로드하고 연결할 수 있습니다. CMYK 검사는 후속 단계입니다.'));
  const area=el('div');host.append(area);
  async function request(method,body){const res=await auth.authorizedFetch(method==='GET'?`/api/production-corrections?requestId=${receipt.id}`:'/api/production-corrections',{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const result=await res.json();if(!res.ok)throw Error(result.message||'교정본을 저장하지 못했습니다.');return result;}
  function loadDocument(){s.document=structuredClone(s.revisions?.[0]?.document||receipt.snapshot.document);s.patches.clear();s.dirty=false;s.pendingId=null;}
  function render(){
   if(!area.isConnected||session!==s)return;area.replaceChildren();
   if(s.error){const error=el('p',s.error);error.setAttribute('role','alert');area.append(error);}
   if(s.revisions===null){area.append(el('p','교정 버전을 불러오는 중…'));return;}
   area.append(el('h4',s.revisions.length?`교정 v${s.revisions[0].revision_number} 기준`:'접수 원본 기준 · 첫 교정본'));
   area.append(el('p',s.dirty?'저장하지 않은 변경이 있습니다.':'편집 내용은 새 버전으로 저장됩니다. 이전 버전은 덮어쓰지 않습니다.'));
   const controls=el('div');controls.className='review-correction-controls';
   function field(label,node){const wrap=el('label',label);wrap.append(node);controls.append(wrap);return node;}
   const pages=s.document.template?.pages||[],page=pages[s.page],objects=page?.objects||[],object=objects[s.object];
   const pageSelect=el('select');pages.forEach((p,i)=>{const o=el('option',`${i+1}면 · ${p.title||p.role||p.id}`);o.value=i;pageSelect.append(o);});pageSelect.value=s.page;pageSelect.disabled=s.busy;pageSelect.onchange=()=>{s.page=Number(pageSelect.value);s.object=0;render();};field('교정할 면',pageSelect);
   const objectSelect=el('select');objects.forEach((o,i)=>{const opt=el('option',`${i+1}. ${o.type} · ${o.role||o.id}`);opt.value=i;objectSelect.append(opt);});objectSelect.value=s.object;objectSelect.disabled=s.busy;objectSelect.onchange=()=>{s.object=Number(objectSelect.value);render();};field('교정할 개체',objectSelect);
   const inputs={};if(object){for(const [key,label] of [['x','X (mm)'],['y','Y (mm)'],['width','너비 (mm)'],['height','높이 (mm)']]){const input=el('input');input.type='number';input.step='0.1';input.value=object.frame[key];input.disabled=s.busy;inputs[key]=field(label,input);}
    if(object.type!=='image'&&typeof object.payload==='string'){const input=el('textarea');input.value=object.payload;input.maxLength=10000;input.disabled=s.busy;inputs.text=field('텍스트',input);}
    if(object.type==='image'&&JSON.stringify(object.payload).includes('production-asset://')){const select=el('select');select.append(el('option','현재 이미지 유지'));for(const asset of [...current.assets,...s.assets]){const opt=el('option',`${asset.name||asset.id}${asset.width?` · ${asset.width}×${asset.height}px`:''}`);opt.value=asset.id;select.append(opt);}select.disabled=s.busy;inputs.asset=field('보관 원본으로 이미지 교체',select);}
   }
   area.append(controls);
   if(object?.type==='image'){
    const upload=el('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';upload.disabled=s.busy||!s.uploadAvailable||!['reviewing','changes'].includes(receipt.status);
    const uploadLabel=el('label','새 교정 원본 업로드 · 최대 25MB');uploadLabel.className='review-correction-note';uploadLabel.append(upload);area.append(uploadLabel);
    area.append(el('small','업로드 후 이미지 교체 목록에서 선택하고 변경 적용을 눌러 주세요. 접수 원본은 덮어쓰지 않습니다.'));
    if(!s.uploadAvailable)area.append(el('p','새 이미지 업로드에는 추가 SQL(202610040001) 적용이 필요합니다. 기존 교정본 편집은 계속할 수 있습니다.'));
    if(s.progress){const progress=el('p',s.progress);progress.setAttribute('role','status');area.append(progress);}
    upload.onchange=async()=>{
     const file=upload.files?.[0];if(!file)return;
     if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>25*1024*1024||file.size===0){s.error='JPEG·PNG·WebP 이미지(최대 25MB)를 선택해 주세요.';render();return;}
     s.busy=true;s.error=null;s.progress='이미지 확인 중…';render();
     try{
      const bitmap=await createImageBitmap(file);bitmap.close();
      async function assetApi(body){const response=await auth.authorizedFetch('/api/production-correction-assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:receipt.id,...body})});const data=await response.json();if(!response.ok)throw Error(data.message||'교정 이미지 업로드를 완료하지 못했습니다.');return data;}
      s.progress='원본 업로드 준비 중…';render();const prepared=await assetApi({action:'prepare',name:file.name,mimeType:file.type,byteSize:file.size});
      s.progress='원본 이미지 업로드 중…';render();const result=await fetch(prepared.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type,'x-upsert':'false'},body:file});if(!result.ok)throw Error('이미지를 보관소에 업로드하지 못했습니다. 다시 시도해 주세요.');
      s.progress='업로드 파일 형식과 픽셀 크기 확인 중…';render();const finalized=await assetApi({action:'finalize',assetId:prepared.id});
      if(session!==s||!auth.isSignedIn())return;s.assets.push(finalized.asset);s.progress=`${finalized.asset.name} 업로드 완료 · ${finalized.asset.width}×${finalized.asset.height}px. 교체 목록에서 선택해 주세요.`;
     }catch(error){if(session===s){s.error=error.message;s.progress=null;}}finally{s.busy=false;render();}
    };
   }
   const apply=el('button','변경 적용 · 미리보기');apply.type='button';apply.className='review-button';apply.disabled=!object||s.busy;apply.onclick=()=>{
    const frame=Object.fromEntries(['x','y','width','height'].map(k=>[k,Number(inputs[k].value)]));if(Object.values(frame).some(v=>!Number.isFinite(v)||Math.abs(v)>2000)||frame.width<=0||frame.height<=0){s.error='위치와 크기를 확인해 주세요.';render();return;}
    const key=`${page.id}/${object.id}`,patch=s.patches.get(key)||{pageId:page.id,objectId:object.id};patch.frame=frame;object.frame={...object.frame,...frame};
    if(inputs.text){patch.text=inputs.text.value;object.payload=patch.text;}
    if(inputs.asset?.value){patch.assetId=inputs.asset.value;function replace(v){if(typeof v==='string'&&v.startsWith('production-asset://'))return `production-asset://${patch.assetId}`;if(Array.isArray(v))return v.map(replace);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,c])=>[k,replace(c)]));return v;}object.payload=replace(object.payload);}
    s.patches.set(key,patch);s.dirty=true;s.pendingId=null;s.error=null;render();
   };area.append(apply);
   const frame=el('iframe');frame.id='reviewProofFrame';frame.title='교정본 전체 면 미리보기';frame.className='review-proof-frame';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.src=`${proofBase}/production-proof?parentOrigin=${encodeURIComponent(location.origin)}`;area.append(frame);
   const note=el('textarea');note.placeholder='교정 이유와 변경 내용을 기록하세요.';note.value=s.note;note.maxLength=2000;note.disabled=s.busy;note.oninput=()=>{s.note=note.value;s.pendingId=null;};const label=el('label','변경 기록');label.className='review-correction-note';label.append(note);area.append(label);
   const save=el('button',s.busy?'교정 버전 저장 중…':'새 교정 버전 저장');save.type='button';save.className='review-button';save.disabled=s.busy||s.loadFailed||!['reviewing','changes'].includes(receipt.status);save.onclick=async()=>{
    if(!s.note.trim()){s.error='변경 기록을 입력해 주세요.';render();return;}
    s.busy=true;s.error=null;s.pendingId ||= crypto.randomUUID();render();
    try{const result=await request('POST',{id:s.pendingId,requestId:receipt.id,baseRevisionId:s.revisions[0]?.id||null,note:s.note,patches:[...s.patches.values()]});if(session!==s||!auth.isSignedIn())return;s.revisions.unshift(result.revision);loadDocument();s.note='';s.error=null;}
    catch(error){if(session===s)s.error=error.message;}finally{s.busy=false;render();}
   };for(const input of Object.values(inputs))input.addEventListener('input',()=>{save.disabled=true;apply.textContent='입력한 변경 적용 · 미리보기';});area.append(save);if(receipt.status==='received')area.append(el('p','1단계에서 검수를 시작한 뒤 저장할 수 있습니다.'));
   area.append(el('h4','저장된 교정 버전'));for(const revision of s.revisions){area.append(el('p',`v${revision.revision_number} · ${new Date(revision.created_at).toLocaleString('ko-KR')} · ${revision.note} · 인쇄 검증 별도 필요`));}
  }
  render();if(s.revisions===null)request('GET').then(result=>{if(session!==s||!auth.isSignedIn())return;s.revisions=result.revisions;s.assets=result.assets||[];s.uploadAvailable=result.uploadAvailable===true;loadDocument();render();}).catch(error=>{if(session!==s)return;s.error=error.message;s.loadFailed=true;s.revisions=[];loadDocument();render();});
 }
 window.ACDLProductionCorrection={mount,clear,canClose,isBusy:()=>!!session?.busy,getAssets:()=>session?.assets||[],getPageIndex:()=>session?.page||0,getDocument:()=>session?.document};
})();
