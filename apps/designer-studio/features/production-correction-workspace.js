(()=>{
 const auth=window.ACDLAdminAuth;let session=null;
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
 function canClose(){return !session?.dirty||window.confirm('저장하지 않은 교정 내용이 있습니다. 버리고 닫을까요?');}
 function clear(){session=null;}
 function mount(host,current,proofBase){
  const receipt=current.receipt;
  if(session?.requestId!==receipt.id)session={requestId:receipt.id,revisions:null,document:null,patches:new Map(),dirty:false,busy:false,page:0,object:0,note:'',pendingId:null};
  const s=session;host.append(el('p','접수 원본을 보존한 교정본입니다. 위치·크기, 단순 텍스트와 접수된 이미지 교체를 지원합니다. 새 원본 업로드·CMYK 검사는 다음 단계에서 연결합니다.'));
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
    if(object.type==='image'&&JSON.stringify(object.payload).includes('production-asset://')){const select=el('select');select.append(el('option','현재 이미지 유지'));for(const asset of current.assets){const opt=el('option',asset.name||asset.id);opt.value=asset.id;select.append(opt);}select.disabled=s.busy;inputs.asset=field('보관 원본으로 이미지 교체',select);}
   }
   area.append(controls);
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
  render();if(s.revisions===null)request('GET').then(result=>{if(session!==s||!auth.isSignedIn())return;s.revisions=result.revisions;loadDocument();render();}).catch(error=>{if(session!==s)return;s.error=error.message;s.loadFailed=true;s.revisions=[];loadDocument();render();});
 }
 window.ACDLProductionCorrection={mount,clear,canClose,isBusy:()=>!!session?.busy,getPageIndex:()=>session?.page||0,getDocument:()=>session?.document};
})();
