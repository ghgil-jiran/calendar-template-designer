const SAMPLE_EVENTS=[
{id:"e1",title:"삼일절",startDate:"2027-03-01",endDate:"2027-03-01",category:"holiday",source:"template"},
{id:"e2",title:"개학식",startDate:"2027-03-03",endDate:"2027-03-03",category:"school",source:"user"},
{id:"e3",title:"입학식",startDate:"2027-03-03",endDate:"2027-03-03",category:"school",source:"user"},
{id:"e4",title:"학부모상담기간",startDate:"2027-03-09",endDate:"2027-03-13",category:"school",source:"user",priority:80},
{id:"e4b",title:"교육과정 집중 운영기간",startDate:"2027-03-01",endDate:"2027-03-10",category:"education",source:"user",priority:90},
{id:"e4c",title:"신입생 적응교육",startDate:"2027-03-02",endDate:"2027-03-05",category:"student",source:"user",priority:70},
{id:"e4d",title:"학교폭력 예방교육 주간",startDate:"2027-03-07",endDate:"2027-03-14",category:"safety",source:"user",priority:60},
{id:"e4e",title:"봄방학",startDate:"2027-03-29",endDate:"2027-04-04",category:"vacation",source:"user",priority:85},
{id:"e5",title:"어린이날",startDate:"2027-05-05",endDate:"2027-05-05",category:"holiday",source:"template"},
{id:"e6",title:"스포츠 페스티벌",startDate:"2027-05-08",endDate:"2027-05-08",category:"school",source:"user"},
{id:"e7",title:"글·그림 한마당",startDate:"2027-05-08",endDate:"2027-05-08",category:"school",source:"user"},
{id:"e8",title:"학생자치회의",startDate:"2027-05-08",endDate:"2027-05-08",category:"school",source:"user"},
{id:"e9",title:"동아리 작품 전시",startDate:"2027-05-08",endDate:"2027-05-08",category:"school",source:"user"}];
const BUILTIN_SAMPLE_ASSETS=[];
function svgAsset(label,bg,fg,symbol){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${bg}"/><circle cx="300" cy="160" r="92" fill="white" opacity=".72"/><text x="300" y="195" text-anchor="middle" font-size="92" fill="${fg}">${symbol}</text><text x="300" y="315" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="700" fill="${fg}">${label}</text></svg>`;return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
function userSampleAssets(){try{return JSON.parse(localStorage.getItem("acdl.sampleAssets")||"[]")}catch{return[]}}
function saveUserSampleAssets(items){try{localStorage.setItem("acdl.sampleAssets",JSON.stringify(items));return true}catch(err){console.warn("공용 샘플 자산 저장 실패",err);return false}}
function projectSampleAssets(){return project?.template?.resources?.sampleAssets||[]}
function ensureAssetResources(){if(!project)return;project.template||={};project.template.resources||={};project.template.resources.sampleAssetLibraryVersion=2;project.template.resources.sampleAssets||=[]}
function ensureTemplateResources(){
 project.template.resources ||= {};const r=project.template.resources;
 r.sampleAssets ||= [];
 r.colorTheme ||= {primary:"#315e9e",secondary:"#667085",accent:"#4777bd",holiday:"#d92d20",weekend:"#175cd3",background:"#ffffff",line:"#d7dce5"};
 r.fontTheme ||= {title:"Arial",body:"Arial",calendar:"Arial",event:"Arial",fallback:'"Noto Sans KR", sans-serif'};
 r.eventCategories ||= [{id:"holiday",name:"공휴일",color:"#d92d20",priority:100},{id:"school",name:"학교 행사",color:"#4777bd",priority:70}];
 r.exportSettings ||= {format:"pdf",dpi:300,bleed:3,cropMarks:true,colorMode:"cmyk",pageRange:"all",imageQuality:"high",guides:false};
}
function applyThemeTokens(){if(!project)return;ensureTemplateResources();const page=el("page");if(!page)return;const c=project.template.resources.colorTheme,f=project.template.resources.fontTheme,e=project.template.resources.exportSettings,ps=project.productType?.pageSize||{width:260,height:180},bleed=Math.max(0,Number(e.bleed||0)),editorGuides=!preview&&project.mode!=="calendar-workspace",bleedX=bleed/Number(ps.width||260)*100,bleedY=bleed/Number(ps.height||180)*100;Object.entries({primary:c.primary,secondary:c.secondary,accent:c.accent,holiday:c.holiday,weekend:c.weekend,background:c.background,line:c.line}).forEach(([k,v])=>page.style.setProperty(`--tpl-${k}`,v));page.style.setProperty("--tpl-title-font",`${f.title}, ${f.fallback}`);page.style.setProperty("--tpl-body-font",`${f.body}, ${f.fallback}`);page.style.setProperty("--tpl-calendar-font",`${f.calendar}, ${f.fallback}`);page.style.setProperty("--tpl-event-font",`${f.event}, ${f.fallback}`);page.style.setProperty("--export-bleed-mm",bleed);page.style.setProperty("--export-bleed-x-pct",`${bleedX}%`);page.style.setProperty("--export-bleed-y-pct",`${bleedY}%`);page.style.setProperty("--export-safe-x-pct",`${bleedX+2}%`);page.style.setProperty("--export-safe-y-pct",`${bleedY+2}%`);page.classList.toggle("editor-bleed-visible",editorGuides&&bleed>0);page.classList.toggle("export-guides-visible",preview&&e.guides===true);page.classList.toggle("export-crop-marks",editorGuides&&e.cropMarks===true)}
function eventCategoryFor(ev){ensureTemplateResources();return project.template.resources.eventCategories.find(c=>c.id===ev.category)||null}
function eventPriority(ev){const category=eventCategoryFor(ev);return Number(ev.priority??category?.priority??0)}
function eventColor(ev){if(typeof ev?.color==='string'&&ev.color.trim())return ev.color.trim();const category=eventCategoryFor(ev);if(category?.color)return category.color;const c=project.template.resources.colorTheme;return ev.category==="holiday"?c.holiday:c.accent}
function escapeAttr(value){return String(value??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}


function allSampleAssets(){const merged=[...BUILTIN_SAMPLE_ASSETS,...projectSampleAssets(),...userSampleAssets()],seen=new Set();return merged.filter(a=>a&&a.id&&!seen.has(a.id)&&(seen.add(a.id),true))}
function preferredAssetForRole(role){const profileKey=semanticProfileKey(role),profile=project?.book?.school?.profile?.[profileKey];if(profile?.assetId){const hit=allSampleAssets().find(a=>a.id===profile.assetId);if(hit)return hit}return projectSampleAssets().find(a=>a.role===role)||allSampleAssets().find(a=>a.role===role)||null}
function compressImageFile(file,maxSide=1600,quality=.86){return new Promise((resolve,reject)=>{if(!file.type.startsWith("image/")){reject(new Error("이미지 파일만 등록할 수 있습니다."));return}const reader=new FileReader();reader.onerror=()=>reject(new Error("이미지 파일을 읽지 못했습니다."));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error("지원하지 않는 이미지 형식입니다."));img.onload=()=>{const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);const type=file.type==="image/png"?"image/png":"image/jpeg";resolve(canvas.toDataURL(type,type==="image/jpeg"?quality:undefined))};img.src=reader.result};reader.readAsDataURL(file)})}
let activeExplorer="pages",activeResourcePage="basic";
let project=null,selectedPageId=null,selectedDate=null,selectedElementId=null,selectedElementScope=null,pendingImageElementId=null,pendingImageElementScope=null,pendingSemanticRole=null,semanticImageDraft=null,semanticImageDraftElementId=null,calendarEditing=false,editMode="template",preview=false,previewType=null,history=[],inspectorActiveTab="content",future=[],savedHash="",elementDrag=null,calendarDrag=null,inspectorDirty=false,inspectorNotice={type:"ready",message:"설정을 변경하면 저장 버튼이 활성화됩니다."},currentWorkflowLabel="새 템플릿 만들기";
const el=id=>document.getElementById(id);
function setEditorContext(label){currentWorkflowLabel=label||currentWorkflowLabel;const node=el("currentWorkflowMenu");if(node)node.textContent=currentWorkflowLabel}
for(let m=1;m<=12;m++)el("setupMonth").innerHTML+=`<option value="${m}" ${m===3?"selected":""}>${m}월</option>`;
for(let n=0;n<=5;n++){el("setupFrontInserts").innerHTML+=`<option value="${n}" ${n===1?"selected":""}>${n}장</option>`;el("setupRearInserts").innerHTML+=`<option value="${n}">${n}장</option>`}
const SIZE_PRESETS={
 desk:[
  {id:"desk-compact",label:"Compact — 210 × 150 mm",width:210,height:150,note:"공간 효율을 중시한 소형 규격"},
  {id:"desk-standard",label:"Standard — 260 × 180 mm",width:260,height:180,note:"학교용 탁상 달력에 권장하는 기본 규격",recommended:true},
  {id:"desk-large",label:"Large — 297 × 210 mm",width:297,height:210,note:"사진과 일정을 크게 보여주는 대형 규격"}
 ],
 wall:[
  {id:"wall-a4",label:"A4 — 210 × 297 mm",width:210,height:297,note:"교실과 개인 공간용 소형 규격"},
  {id:"wall-b4",label:"B4 — 257 × 364 mm",width:257,height:364,note:"가독성과 공간의 균형이 좋은 중형 규격"},
  {id:"wall-a3",label:"A3 — 297 × 420 mm",width:297,height:420,note:"학교 벽걸이 달력에 권장하는 규격",recommended:true}
 ],
 poster:[
  {id:"poster-a3",label:"A3 — 297 × 420 mm",width:297,height:420,note:"교실 게시용 연간 벽보형",recommended:true},
  {id:"poster-a2",label:"A2 — 420 × 594 mm",width:420,height:594,note:"복도·교무실 게시용 대형 벽보형"}
 ]
};
function renderSizeOptions(){const list=SIZE_PRESETS[el("setupType").value];el("setupSize").innerHTML=list.map(x=>`<option value="${x.id}" ${x.recommended?"selected":""}>${x.label}${x.recommended?" · 추천":""}</option>`).join("");updateSizeNote()}
function updateSizeNote(){const p=[...SIZE_PRESETS.desk,...SIZE_PRESETS.wall,...SIZE_PRESETS.poster].find(x=>x.id===el("setupSize").value);el("setupSizeNote").textContent=p?p.note:""}
const SETUP_TYPE_NOTES={desk:"탁상형은 앞·뒷면을 갖는 양면 Sheet 구조입니다. 간지와 월력 뒷면 설정을 사용할 수 있습니다.",wall:"벽걸이형은 앞면 중심의 단면 페이지 구조입니다. 월력 구성과 앞 간지를 설정합니다.",poster:"벽보형은 연간 월력 한 면으로 생성됩니다. 앞·뒤 간지와 셀 미니 월력은 사용하지 않으며, 5×7 또는 6×7 월력 구성을 선택할 수 있습니다."};
function updateSetupFields(){const type=el("setupType").value;document.querySelectorAll(".setup-field[data-types]").forEach(node=>node.classList.toggle("hidden-by-type",!node.dataset.types.split(/\s+/).includes(type)));el("setupTypeNote").textContent=SETUP_TYPE_NOTES[type]||"";renderSizeOptions()}
el("setupType").addEventListener("change",updateSetupFields);el("setupSize").addEventListener("change",updateSizeNote);updateSetupFields();

function monthSequence(year,startMonth){
 return window.ACDLCalendarDomain.buildTwelveMonths(year,startMonth)
}
function makeProject(opts){
 return window.ACDLProjectDocument.createProject(opts,{sizePresets:SIZE_PRESETS,buildMonths:monthSequence})
}
const __historyCodec=window.ACDLPersistenceHistory.createHistoryCodec(),__historyBinaryPool=__historyCodec.binaryPool;
function __compactHistoryValue(value){return __historyCodec.compact(value)}
function __restoreHistoryValue(value){return __historyCodec.restore(value)}
function __historyString(value){return __historyCodec.stringify(value)}
function __historyParse(text){return __historyCodec.parse(text)}
function snapshot(){history.push(__historyString(project));if(history.length>12)history.shift();future=[];markDirty();window.__acdlUpdateMemoryMonitor?.()}
function markDirty(){el("undoBtn").disabled=!history.length;el("redoBtn").disabled=!future.length}
function stable(){savedHash=window.ACDLPersistenceProject.hash(project)}
function selectedPage(){return project.book.pageInstances.find(p=>p.id===selectedPageId)}
function isInsertPage(p){return p.role.includes("front-insert")||p.role.includes("rear-insert")}
function pageDesignType(p){
 if(isInsertPage(p))return {key:"template",label:"자유 템플릿 면"};
 if(p.role==="monthly-front"||p.role==="monthly-back")return {key:"fixed",label:"구조 정의 면"};
 if(p.role==="poster-annual")return {key:"template",label:"자유 벽보 템플릿"};
 if(p.role.includes("cover"))return {key:"fixed",label:"구조 정의 면"};
 return {key:"template",label:"템플릿 면"}
}
function roleLabel(p){const map={"cover-front":"표지 앞면","cover-back":"표지 뒷면","front-insert-front":"앞 간지 앞면","front-insert-back":"앞 간지 뒷면","rear-insert-front":"뒤 간지 앞면","rear-insert-back":"뒤 간지 뒷면","monthly-front":"월력 앞면","monthly-back":"월력 뒷면","back-cover-front":"맨 뒷표지 앞면","back-cover-back":"맨 뒷표지 뒷면","poster-annual":"연간 벽보"},semantic={"yearly-calendar":"연력","school-symbols":"학교 상징","back-cover-information":"맨 뒷표지"};const idx=p.insertIndex?` ${p.insertIndex}`:"";return p.calendarMonth?`${p.calendarYear}.${String(p.calendarMonth).padStart(2,"0")} · ${map[p.role]}`:`${semantic[p.semanticPageRole]||map[p.role]||p.role}${idx}`}
function renderNavigator(){
 const nav=el("navigator");nav.innerHTML="";const isDesk=project.productType.category==="desk";
 const size=project.productType.pageSize;const calendarScheme=`${project.settings.calendarRows||6}×7 · ${project.settings.weekStart==="monday"?"월요일":"일요일"} 시작`;
 el("currentTemplateTitle").textContent=project.template?.metadata?.name||`${project.settings.year} 달력 템플릿`;
 if(isDesk){project.book.sheets.forEach(sh=>{const box=document.createElement("div");box.className="sheet";box.innerHTML=`<div class="sheet-head">Sheet ${sh.sheetNumber} · ${sh.calendar?`${sh.calendar.year}.${String(sh.calendar.month).padStart(2,"0")}`:sh.role}</div>`;sh.surfaces.forEach(p=>box.appendChild(pageButton(p)));nav.appendChild(box)})}
 else project.book.pageInstances.forEach(p=>nav.appendChild(pageButton(p)));
}
function pageNavigationKind(p){if(/^back-cover/.test(p.role))return"back-cover";if(/^cover/.test(p.role))return"cover";if(/^monthly/.test(p.role)||p.role==="poster-annual")return"month";return"insert"}
function pageButton(p){const b=document.createElement("button"),parity=Number(p.number)%2?"odd":"even",kind=pageNavigationKind(p);b.className=`page-btn page-${parity} page-kind-${kind} ${p.id===selectedPageId?"active":""}`;b.dataset.pageId=p.id;b.dataset.pageParity=parity;b.dataset.pageKind=kind;b.innerHTML=`<span><strong>${p.number}면</strong><small>${roleLabel(p)}</small></span>`;b.addEventListener("click",()=>{if(p.id===selectedPageId||!confirmDiscardInspectorChanges())return;inspectorDirty=false;inspectorNotice={type:"ready",message:"설정을 변경하면 저장 버튼이 활성화됩니다."};selectedPageId=p.id;selectedDate=null;selectedElementId=null;selectedElementScope=null;semanticImageDraft=null;semanticImageDraftElementId=null;calendarEditing=false;document.querySelectorAll('.page-btn.active').forEach(node=>node.classList.remove('active'));b.classList.add('active');renderPage();applyThemeTokens();renderInspector();renderObjectRecommendations();window.updateRoleIndicator?.()});return b}
function groupedEvents(){return window.ACDLDatasetDomain.groupEventsByDate(project.book.events)}


function openEventDialog(existing=null){
 const title=prompt("일정명",existing?.title||"");if(!title)return;
 const start=prompt("시작일 (YYYY-MM-DD)",existing?.startDate||selectedDate);if(!start)return;
 const end=prompt("종료일 (YYYY-MM-DD)",existing?.endDate||start);if(!end)return;
 change(()=>{
  if(existing){existing.title=title;existing.startDate=start;existing.endDate=end}
  else project.book.events.push({id:"event."+Date.now(),title,startDate:start,endDate:end,category:"school",source:"user",priority:50})
 });
 showEditorToast(start===end?"단일 일정을 저장했습니다.":"구간 일정을 저장했습니다. 월력에 자동 막대로 표시됩니다.")
}

/* v20 Template Package Runtime */
function utf8Bytes(text){return new TextEncoder().encode(text)}
function concatBytes(parts){const n=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function le16(n){return new Uint8Array([n&255,(n>>>8)&255])}function le32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function zipDate(){const d=new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();return {time,date}}
function createStoredZip(entries){const locals=[],centrals=[];let offset=0;const dt=zipDate();for(const e of entries){const name=utf8Bytes(e.name),data=e.data instanceof Uint8Array?e.data:utf8Bytes(e.data),crc=crc32(data);const local=concatBytes([le32(0x04034b50),le16(20),le16(0x800),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name,data]);locals.push(local);const central=concatBytes([le32(0x02014b50),le16(20),le16(20),le16(0x800),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]);centrals.push(central);offset+=local.length}const centralOffset=offset,central=concatBytes(centrals),end=concatBytes([le32(0x06054b50),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(central.length),le32(centralOffset),le16(0)]);return concatBytes([...locals,central,end])}
function parseStoredZip(bytes){const out={};let o=0;while(o+30<=bytes.length&&new DataView(bytes.buffer,bytes.byteOffset+o,4).getUint32(0,true)===0x04034b50){const v=new DataView(bytes.buffer,bytes.byteOffset+o,30),method=v.getUint16(8,true),size=v.getUint32(18,true),nameLen=v.getUint16(26,true),extraLen=v.getUint16(28,true);if(method!==0)throw new Error('압축 방식이 지원되지 않습니다.');const name=new TextDecoder().decode(bytes.slice(o+30,o+30+nameLen)),start=o+30+nameLen+extraLen;out[name]=bytes.slice(start,start+size);o=start+size}return out}
function dataUrlBytes(url){const [head,b64]=url.split(','),mime=(head.match(/^data:([^;]+)/)||[])[1]||'application/octet-stream',bin=atob(b64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return {mime,bytes}}
function mimeExt(m){return m.includes('png')?'png':m.includes('svg')?'svg':m.includes('webp')?'webp':m.includes('gif')?'gif':'jpg'}
function externalizeAssets(value,assets,path='root'){if(Array.isArray(value))return value.map((v,i)=>externalizeAssets(v,assets,path+'-'+i));if(value&&typeof value==='object'){const o={};for(const [k,v] of Object.entries(value))o[k]=externalizeAssets(v,assets,path+'-'+k);return o}if(typeof value==='string'&&value.startsWith('data:image/')){const x=dataUrlBytes(value),id='img-'+String(assets.length+1).padStart(4,'0'),name=`assets/images/${id}.${mimeExt(x.mime)}`;assets.push({id,name,mime:x.mime,data:x.bytes});return `asset://${id}`}return value}
function hydrateAssetRefs(value,map){if(Array.isArray(value))return value.map(v=>hydrateAssetRefs(v,map));if(value&&typeof value==='object'){for(const k of Object.keys(value))value[k]=hydrateAssetRefs(value[k],map);return value}if(typeof value==='string'&&value.startsWith('asset://'))return map[value.slice(8)]||value;return value}
function themeCss(){const r=project.template.resources||{},c=r.colorTheme||{},f=r.fontTheme||{};return `:root{
 --acdl-primary:${c.primary||'#315e9e'};
 --acdl-secondary:${c.secondary||'#667085'};
 --acdl-accent:${c.accent||'#4777bd'};
 --acdl-holiday:${c.holiday||'#d92d20'};
 --acdl-weekend:${c.weekend||'#175cd3'};
 --acdl-background:${c.background||'#fff'};
 --acdl-line:${c.line||'#d7dce5'};
 --acdl-font-title:${f.title||'Arial'};
 --acdl-font-body:${f.body||'Arial'};
 --acdl-font-calendar:${f.calendar||'Arial'};
 --acdl-font-event:${f.event||'Arial'};
 --acdl-font-fallback:${f.fallback||'sans-serif'};
}
`}
function packageReadme(){return `# ACDL Template Package

이 패키지는 사용자용 Calendar Workspace에서 사용하는 배포 템플릿입니다.

- manifest.json: 패키지 식별 정보
- template/template.json: 템플릿 구조와 Binding
- assets/images/: 이미지 파일
- styles/theme.css: 색상·폰트 CSS 토큰
- contracts/data-bindings.json: 사용자 데이터 Binding 계약

이미지는 template.json 안에 Base64로 중복 저장되지 않으며 asset:// 식별자로 참조됩니다.
`}
function bindingContract(){return {version:'1.1',school:{name:'string',englishName:'string',slogan:'string',address:'string',phone:'string',fax:'string',website:'string',profile:{logo:'asset',building:'asset',flower:'asset',tree:'asset',motto:'text',song:'text'}},calendar:{year:'number',startMonth:'number',events:'array',dataOptions:{includeHolidays:'boolean',includeSolarTerms:'boolean',includeLunar:'boolean'}}}}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportTemplatePackage(){normalizeElementData();ensureTemplateResources();const assets=[],portable=externalizeAssets(project,assets);portable.version='2.18.0';portable.packageMode='published-template';const meta=project.template.metadata||{},safe=(meta.name||project.book.id||'calendar-template').replace(/[\/:*?"<>|]+/g,'-');const manifest={format:'acdl-template-package',packageVersion:'1.0.0',schemaVersion:'2.18.0',id:project.template.id,name:meta.name||safe,version:meta.version||'1.0.0',productType:project.productType,entry:'template/template.json',style:'styles/theme.css',assetCount:assets.length,createdAt:new Date().toISOString()};const entries=[{name:'manifest.json',data:JSON.stringify(manifest,null,2)},{name:'template/template.json',data:JSON.stringify(portable,null,2)},{name:'styles/theme.css',data:themeCss()},{name:'contracts/data-bindings.json',data:JSON.stringify(bindingContract(),null,2)},{name:'README.md',data:packageReadme()}];for(const a of assets)entries.push({name:a.name,data:a.data});const zip=createStoredZip(entries);downloadBlob(new Blob([zip],{type:'application/zip'}),safe+'.acdlpkg');stable();showEditorToast(`사용자용 템플릿 패키지를 저장했습니다. 이미지 ${assets.length}개를 별도 파일로 분리했습니다.`)}
async function importTemplatePackage(file){const entries=parseStoredZip(new Uint8Array(await file.arrayBuffer()));if(!entries['manifest.json']||!entries['template/template.json'])throw new Error('올바른 ACDL 패키지가 아닙니다.');const manifest=JSON.parse(new TextDecoder().decode(entries['manifest.json']));if(manifest.format!=='acdl-template-package')throw new Error('지원하지 않는 패키지입니다.');const p=JSON.parse(new TextDecoder().decode(entries['template/template.json'])),map={};for(const [name,data] of Object.entries(entries)){if(!name.startsWith('assets/images/'))continue;const id=(name.match(/(img-\d+)/)||[])[1];if(!id)continue;const ext=name.split('.').pop().toLowerCase(),mime=ext==='png'?'image/png':ext==='svg'?'image/svg+xml':ext==='webp'?'image/webp':ext==='gif'?'image/gif':'image/jpeg';let binary='';for(let i=0;i<data.length;i+=0x8000)binary+=String.fromCharCode(...data.slice(i,i+0x8000));map[id]=`data:${mime};base64,${btoa(binary)}`}return hydrateAssetRefs(p,map)}

function change(fn){snapshot();fn();render()}
function changeElement(fn){snapshot();const target=ensureCurrentPageEditTarget();if(!target.item){history.pop();return}fn(target.item);if(target.created)showEditorToast("현재 페이지만 수정했습니다. 같은 Master의 다른 페이지는 유지됩니다.");render()}
function validate(){const issues=[];if(project.productType.category==="poster"){if(project.book.pageInstances.length!==1)issues.push("벽보형은 1페이지여야 합니다.");return issues}const inserts=(project.settings.frontInsertCount||0)+(project.settings.rearInsertCount||0),units=14+inserts,expected=project.productType.category==="desk"?units*2:units;if(project.productType.category==="desk"&&project.book.sheets.length!==units)issues.push(`탁상형 Sheet는 ${units}장이어야 합니다.`);if(project.book.pageInstances.length!==expected)issues.push(`페이지 수는 ${expected}개여야 합니다.`);return issues}
function render(){normalizeElementData();ensureTemplateResources();renderNavigator();renderPage();applyThemeTokens();renderInspector();renderResourceAssetManager();
 const rp=selectedPage();el("editCalendarBtn").classList.toggle("hidden",rp.role!=="monthly-front");el("editCalendarBtn").classList.toggle("active",calendarEditing&&rp.role==="monthly-front");el("editCalendarBtn").textContent=calendarEditing?"월력 선택 해제":"월력 선택·크기 조절";
 document.querySelectorAll(".back-widget").forEach(b=>{const allow=rp.role==="monthly-back"||rp.role==="poster-annual";b.classList.toggle("hidden",!allow)});
 if(rp.role!=="monthly-front")calendarEditing=false;editMode="template";el("duplicateElementBtn").disabled=!sourceElement();el("deleteElementBtn").disabled=!sourceElement();el("templateMode").classList.add("active");el("modeHelp").textContent="샘플 콘텐츠, 실제 학교 데이터 Binding, 위치와 스타일을 한 화면에서 설계합니다.";renderObjectRecommendations();el("undoBtn").disabled=!history.length;el("redoBtn").disabled=!future.length}
function resetEditorViewState(){exitPreviewMode();selectedElementId=null;selectedElementScope=null;calendarEditing=false;el("objectDrawer")?.classList.add("hidden");}
function clearNewTemplateBase(){window.ACDLNewTemplateBaseProject=null;window.ACDLNewTemplateBaseRecord=null;el("setupType").disabled=false}
let newTemplateSetupInProgress=false;
function createFromSetup(){beginProjectTransition({clearProject:true});const opts={type:el("setupType").value,year:Number(el("setupYear").value),startMonth:Number(el("setupMonth").value),template:el("setupTemplate").value,frontInsertCount:Number(el("setupFrontInserts").value),rearInsertCount:Number(el("setupRearInserts").value),calendarRows:Number(el("setupCalendarRows").value),weekStart:el("setupWeekStart").value,showAdjacentMiniCalendars:el("setupAdjacentMiniCalendars").checked,posterColumns:Number(el("setupPosterColumns").value||4),sizePresetId:el("setupSize").value};const base=window.ACDLNewTemplateBaseProject?structuredClone(window.ACDLNewTemplateBaseProject):null;project=base||makeProject(opts);if(base){rebuildProjectFromBasicSettings({year:opts.year,startMonth:opts.startMonth,frontInsertCount:opts.frontInsertCount,rearInsertCount:opts.rearInsertCount,calendarRows:opts.calendarRows,weekStart:opts.weekStart,showAdjacentMiniCalendars:opts.showAdjacentMiniCalendars,calendarData:project.settings?.calendarData});project.template.derivedFromTemplateId=window.ACDLNewTemplateBaseRecord?.id||null}project.template.id=null;delete project.template.remoteId;delete project.template.remoteStableKey;delete project.template.remoteVersionNumber;project.template.librarySource="local";project.template.metadata={...(project.template.metadata||{}),name:base?`${window.ACDLNewTemplateBaseRecord?.name||"표준 템플릿"} 기반 새 템플릿`:"새 템플릿",description:"",edition:opts.year,state:"draft",isStandard:false};project.template.preset=project.template.preset||opts.template;clearNewTemplateBase();selectedPageId=project.book.pageInstances[0].id;selectedElementId=null;selectedElementScope=null;history=[];future=[];aiDesignMockSession=null;newTemplateSetupInProgress=true;el("setup").classList.add("hidden");setEditorContext("새 템플릿 만들기");render();openResourceModal("basic")}
el("createBtn").addEventListener("click",createFromSetup);el("newBtn").addEventListener("click",()=>{resetEditorViewState();el("setup").classList.remove("hidden")});
el("templateMode").addEventListener("click",()=>showEditorToast("현재 템플릿 설계 모드입니다."));
el("undoBtn").addEventListener("click",()=>{if(!history.length)return;future.push(__historyString(project));project=__historyParse(history.pop());if(!project.book.pageInstances.some(p=>p.id===selectedPageId))selectedPageId=project.book.pageInstances[0].id;markDirty();render();window.__acdlUpdateMemoryMonitor?.()});
el("redoBtn").addEventListener("click",()=>{if(!future.length)return;history.push(__historyString(project));project=__historyParse(future.pop());markDirty();render();window.__acdlUpdateMemoryMonitor?.()});
el("publishBtn")?.addEventListener("click",exportTemplatePackage);
el("saveBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(project,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=project.book.id+".acdl.json";a.click();URL.revokeObjectURL(url);stable()});
function loadClick(){resetEditorViewState();setEditorContext(appMode==="user"?"기존 달력 열기":"기존 템플릿 열기");el("fileInput").click()}el("loadBtn").addEventListener("click",loadClick);
el("fileInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;const transitionId=beginProjectTransition({clearProject:true});try{let p;if(f.name.toLowerCase().endsWith(".acdlpkg"))p=await importTemplatePackage(f);else p=JSON.parse(await f.text());if(!isCurrentProjectTransition(transitionId))return;if(p.format!=="acdl-project"||!p.book||!p.settings)throw new Error("올바른 ACDL 템플릿이 아닙니다.");project=p;normalizeElementData();selectedPageId=p.book.pageInstances[0].id;selectedElementId=null;selectedElementScope=null;history=[];future=[];inspectorNotice={type:"info",message:f.name.toLowerCase().endsWith(".acdlpkg")?"배포 패키지를 불러왔습니다. 분리된 이미지 자산도 복원했습니다.":"프로젝트 원본을 불러왔습니다."};el("setup").classList.add("hidden");stable();render()}catch(err){if(isCurrentProjectTransition(transitionId))alert(err.message||"올바른 ACDL 템플릿 파일이 아닙니다.")}e.target.value=""});



el("openObjectDrawerBtn").addEventListener("click",()=>{el("objectDrawer").classList.remove("hidden");renderObjectRecommendations();renderRegisteredAssetLibrary()});
el("closeObjectDrawerBtn").addEventListener("click",()=>el("objectDrawer").classList.add("hidden"));
function schoolTextSample(binding){const labels={"school.name":"학교명","school.englishName":"영문 학교명","school.slogan":"학교 슬로건","school.address":"학교 주소","school.website":"학교 홈페이지","school.contacts":"교무실 02-0000-0000\n행정실 02-0000-0001 · 팩스 02-0000-0002","school.profile.motto.description":"바르게 배우고 함께 성장하자","school.profile.song.description":"우리 학교 교가 · 작사·작곡 정보"};return schoolBindingValue(binding)||labels[binding]||"학교 정보"}
function estimateSchoolTextBox(binding,text,fontSize){const value=String(text||"");const longForm=["school.address","school.contacts","school.profile.song.description"].includes(binding);const lines=value.split(/\n/);if(longForm){const width=binding==="school.contacts"?54:62;const charsPerLine=Math.max(12,Math.floor(width*1.45));const wrapped=lines.reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/charsPerLine)),0);return {width,height:Math.max(8,Math.min(28,4+wrapped*(fontSize>=18?4.2:3.2))),autoSize:"height"}}const longest=Math.max(1,...lines.map(x=>x.length));return {width:Math.max(14,Math.min(82,6+longest*(fontSize>=18?1.85:1.18))),height:fontSize>=18?9:7,autoSize:"width"}}
function createSchoolTextObject(binding){const scope=el("elementScope").value,arr=scope==="master"?masterElements():pageElements(),content=schoolTextSample(binding),fontSize=binding==="school.name"?22:12,auto=estimateSchoolTextBox(binding,content,fontSize);const base={x:12,y:72,width:auto.width,height:auto.height};const placed=findSemanticPlacement(base,arr);const item={id:`text.school.${Date.now()}`,type:"text",role:"school-info",binding,content,x:placed.x,y:placed.y,width:placed.width,height:placed.height,autoSize:auto.autoSize,zIndex:maxZ(scope)+1,style:{fontSize,textAlign:"left",background:false,color:"#17202e"}};snapshot();arr.push(item);selectedElementId=item.id;selectedElementScope=scope;el("objectDrawer").classList.add("hidden");render();showEditorToast("학교 정보 텍스트 개체를 추가했습니다.")}
document.querySelectorAll("[data-school-text-add]").forEach(b=>b.addEventListener("click",()=>createSchoolTextObject(b.dataset.schoolTextAdd)));
document.querySelectorAll("[data-semantic-add]").forEach(b=>b.addEventListener("click",()=>createSemanticObject(b.dataset.semanticAdd,{asset:preferredAssetForRole(b.dataset.semanticAdd)})));
document.querySelectorAll("[data-basic-add]").forEach(b=>b.addEventListener("click",()=>{el("objectDrawer").classList.add("hidden");addElement(b.dataset.basicAdd)}));
document.querySelectorAll("[data-widget-add]").forEach(b=>b.addEventListener("click",()=>{el("objectDrawer").classList.add("hidden");addBackWidget(b.dataset.widgetAdd)}));
el("semanticImageInput").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file||!pendingSemanticRole)return;
 const reader=new FileReader();reader.onload=()=>{
  const i=sourceElement();if(!i||i.type!=="semantic-object")return;
  semanticImageDraft=reader.result;semanticImageDraftElementId=i.id;pendingSemanticRole=null;
  inspectorNotice={type:"dirty",message:"샘플 이미지가 선택되었습니다. 샘플 콘텐츠 저장 버튼을 눌러 반영하세요."};renderInspector();showEditorToast("샘플 이미지를 선택했습니다. 샘플 콘텐츠 저장 버튼을 눌러 확정하세요.")
 };reader.readAsDataURL(file);e.target.value=""
});


document.querySelectorAll("[data-resource-page]").forEach(b=>b.addEventListener("click",()=>switchResourcePage(b.dataset.resourcePage)));
el("templateSettingsBtn").addEventListener("click",()=>openResourceModal("basic"));el("closeResourceModalBtn").addEventListener("click",closeResourceModal);el("resourceModal").addEventListener("click",e=>{const saveKeyButton=e.target.closest?.("#saveAIDesignOpenAIKeyBtn"),generateButton=e.target.closest?.("#generateLiveAIDesignBtn");if(saveKeyButton){e.preventDefault();e.stopPropagation();saveAIDesignOpenAIKey();return}if(generateButton){e.preventDefault();e.stopPropagation();generateLiveAIDesignSample();return}if(e.target===el("resourceModal"))closeResourceModal()});el("resourceModal").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target?.id==="aiDesignOpenAIKey"){e.preventDefault();saveAIDesignOpenAIKey()}});
el("newTemplateSettingsBackBtn").addEventListener("click",returnToNewTemplateProductSetup);
el("newTemplateSettingsPrevBtn").addEventListener("click",()=>{const index=NEW_TEMPLATE_SETTINGS_PAGES.indexOf(activeResourcePage);switchResourcePage(NEW_TEMPLATE_SETTINGS_PAGES[Math.max(0,index-1)])});
el("newTemplateSettingsNextBtn").addEventListener("click",()=>{const index=NEW_TEMPLATE_SETTINGS_PAGES.indexOf(activeResourcePage);switchResourcePage(NEW_TEMPLATE_SETTINGS_PAGES[Math.min(NEW_TEMPLATE_SETTINGS_PAGES.length-1,index+1)])});
el("newTemplateEnterEditorBtn").addEventListener("click",startTemplateEditorAfterGeneration);
el("templateEditorBuildRetryBtn").addEventListener("click",startTemplateEditorAfterGeneration);
el("templateEditorBuildCloseBtn").addEventListener("click",hideTemplateEditorBuildModal);
el('uploadResourceThumbnailBtn').addEventListener('click',()=>el('resourceThumbnailInput').click());
el('resourceThumbnailInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{snapshot();project.template.thumbnail={kind:'upload',dataUrl:reader.result,fileName:file.name,updatedAt:new Date().toISOString(),aspectRatio:'4:3',fit:'contain'};markDirty();renderResourceThumbnailPreview();showEditorToast('템플릿 대표 이미지를 등록했습니다. 기본 설정 저장을 눌러 확정하세요.')};reader.readAsDataURL(file);e.target.value=''});
el('removeResourceThumbnailBtn').addEventListener('click',()=>{if(!project?.template?.thumbnail)return;snapshot();delete project.template.thumbnail;markDirty();renderResourceThumbnailPreview();showEditorToast('대표 이미지를 삭제했습니다. 표지 또는 전체 페이지가 자동 표시됩니다.')});
el("saveBasicResourceBtn").addEventListener("click",()=>{snapshot();normalizeElementData();const metadata={...project.template.metadata,name:el("resourceTemplateName").value.trim()||"이름 없는 템플릿",description:el("resourceTemplateDescription").value.trim(),author:el("resourceTemplateAuthor").value.trim(),version:el("resourceTemplateVersion").value.trim()||"1.0.0",language:el("resourceTemplateLanguage").value},next={year:Number(el('resourceCalendarYear').value),startMonth:Number(el('resourceStartMonth').value),frontInsertCount:Number(el('resourceFrontInserts').value),rearInsertCount:Number(el('resourceRearInserts').value),calendarRows:Number(el('resourceCalendarRows').value),calendarRowsMode:'fixed',weekStart:el('resourceWeekStart').value,showAdjacentMiniCalendars:el('resourceAdjacentMini').checked,calendarData:{...(project.settings.calendarData||{}),includeHolidays:el('resourceIncludeHolidays').checked,includeAnniversaries:el('resourceIncludeAnniversaries').checked,includeSolarTerms:el('resourceIncludeSolarTerms').checked,includeLunar:el('resourceIncludeLunar').checked}},structureChanged=['year','startMonth','frontInsertCount','rearInsertCount','calendarRows','weekStart'].some(key=>String(project.settings[key])!==String(next[key]))||project.settings.calendarRowsMode!==next.calendarRowsMode;if(structureChanged)rebuildProjectFromBasicSettings(next);else Object.assign(project.settings,next);project.settings.calendarRowsMode=next.calendarRowsMode;project.template.metadata=metadata;project.template.publishing={...(project.template.publishing||{}),schemaVersion:"template-publishing.v1",dataRequirements:collectInputContractRequirements()};window.ACDLScheduleApiClient?.ensureCalendarReferences?.(project,{force:true}).catch(error=>showEditorToast?.(error.message));markDirty();render();populateResourceBasicForm();showEditorToast(structureChanged?"템플릿 기본 설정과 페이지 구성을 저장했습니다.":"템플릿 기본 설정을 저장했습니다.")});
el("saveSchoolInfoBtn").addEventListener("click",()=>{snapshot();ensureSchoolProfile();const school=project.book.school;school.name=el("resourceSchoolName").value.trim()||"샘플 학교";school.englishName=el("resourceSchoolEnglishName").value.trim();school.slogan=el("resourceSchoolSlogan").value.trim();school.address=el("resourceSchoolAddress").value.trim();school.phone=el("resourceSchoolPhone").value.trim();school.fax=el("resourceSchoolFax").value.trim();school.website=el("resourceSchoolWebsite").value.trim();school.profile.motto.description=el("resourceSchoolMotto").value.trim();school.profile.song.description=el("resourceSchoolSong").value.trim();school.profile.building.name=school.name;project.book.pageInstances.filter(p=>p.role==="cover-front"||p.role==="poster-annual").forEach(p=>(project.book.elementsByPage[p.id]||[]).forEach(item=>{if(item.role==="school-name"&&!item.binding)item.content=school.name;if(item.role==="slogan"&&!item.binding)item.content=school.slogan}));applyAllBoundAssets(project);markDirty();render();populateSchoolResourceForm();showEditorToast("샘플 학교 정보와 에셋 설정을 저장했습니다.")});

el("saveColorThemeBtn").addEventListener("click",()=>{snapshot();ensureTemplateResources();const c=project.template.resources.colorTheme;[["Primary","primary"],["Secondary","secondary"],["Accent","accent"],["Holiday","holiday"],["Weekend","weekend"],["Background","background"],["Line","line"]].forEach(([id,k])=>c[k]=el(`themeColor${id}Text`).value);markDirty();render();populateColorThemeForm();showEditorToast("색상 테마를 저장했습니다.")});
el("resetColorThemeBtn").addEventListener("click",()=>{const d={Primary:"#315e9e",Secondary:"#667085",Accent:"#4777bd",Holiday:"#d92d20",Weekend:"#175cd3",Background:"#ffffff",Line:"#d7dce5"};Object.entries(d).forEach(([id,v])=>{el(`themeColor${id}`).value=v;el(`themeColor${id}Text`).value=v});showEditorToast("기본 색상을 불러왔습니다. 저장하면 적용됩니다.")});
el("saveFontThemeBtn").addEventListener("click",()=>{snapshot();ensureTemplateResources();project.template.resources.fontTheme={title:el("themeFontTitle").value,body:el("themeFontBody").value,calendar:el("themeFontCalendar").value,event:el("themeFontEvent").value,fallback:el("themeFontFallback").value};markDirty();render();populateFontThemeForm();showEditorToast("폰트 테마를 저장했습니다.")});
el("resetFontThemeBtn").addEventListener("click",()=>{["Title","Body","Calendar","Event"].forEach(id=>el(`themeFont${id}`).value="Arial");el("themeFontFallback").value='"Noto Sans KR", sans-serif';updateFontPreview();showEditorToast("기본 폰트를 불러왔습니다. 저장하면 적용됩니다.")});
["themeFontTitle","themeFontBody","themeFontCalendar","themeFontEvent","themeFontFallback"].forEach(id=>el(id).addEventListener("input",updateFontPreview));
el("saveMasterSettingsBtn").addEventListener("click",()=>{snapshot();const m=project.template.masters;m.calendar.monthTitleSize=Number(el("masterSettingMonthTitle").value);applyCoverTitleSize(Number(el("masterSettingCoverTitle").value));m.calendar.eventMaxVisiblePerDay=Number(el("masterSettingMaxEvents").value);m.calendar.showAdjacentMonths=el("masterSettingAdjacent").value==='true';m.calendar.rangeEventStyle.enabled=el("masterSettingRange").value==='true';markDirty();render();populateMasterManager();showEditorToast("Master 기본값을 저장했습니다.")});
el("addEventCategoryBtn").addEventListener("click",()=>{ensureTemplateResources();const name=el("newCategoryName").value.trim();if(!name)return alert("분류명을 입력하세요.");project.template.resources.eventCategories.push({id:`category.${Date.now()}`,name,color:el("newCategoryColor").value,priority:Number(el("newCategoryPriority").value)});el("newCategoryName").value="";populateEventCategories()});
el("saveEventCategoriesBtn").addEventListener("click",()=>{snapshot();syncEventCategoryForm();markDirty();render();showEditorToast("일정 분류를 저장했습니다.")});
["exportFormat","exportDpi","exportBleed","exportCropMarks","exportColorMode","exportPageRange","exportImageQuality","exportGuides"].forEach(id=>el(id).addEventListener("input",updateExportSummary));
el("saveExportSettingsBtn").addEventListener("click",()=>{snapshot();ensureTemplateResources();project.template.resources.exportSettings={format:el("exportFormat").value,dpi:Number(el("exportDpi").value),bleed:Number(el("exportBleed").value),cropMarks:el("exportCropMarks").value==='true',colorMode:el("exportColorMode").value,pageRange:el("exportPageRange").value,imageQuality:el("exportImageQuality").value,guides:el("exportGuides").value==='true'};markDirty();render();populateExportSettings();showEditorToast("출력 설정을 저장했습니다. 미리보기에서 가이드·재단선 설정을 확인할 수 있습니다.")});
el("prepareAIDesignMockBtn").addEventListener("click",showCompletedAIDesignResults);
el("aiDesignProposalSection").addEventListener("click",event=>{const regenerateDesignButton=event.target.closest("[data-regenerate-ai-design]");if(regenerateDesignButton){regenerateRepresentativeAIDesign();return}if(!aiDesignMockSession)return;const selectButton=event.target.closest("[data-select-ai-design]");if(selectButton){aiDesignMockSession=window.ACDLAIDesignSettings.selectVariant(aiDesignMockSession,selectButton.dataset.selectAiDesign);aiMonthlyExpansionState="idle";renderAIDesignMockSession();showEditorToast("대표 디자인을 선택했습니다. 월력 뒷면 배치안을 확인한 뒤 월력 전체 생성을 진행해 주세요.");return}const layoutButton=event.target.closest("[data-select-ai-month-back-layout]");if(layoutButton&&aiDesignMockSession.selectedVariantId){aiDesignMockSession=window.ACDLAIDesignSettings.selectMonthBackLayout(aiDesignMockSession,aiDesignMockSession.selectedVariantId,layoutButton.dataset.selectAiMonthBackLayout);const selected=selectedAIDesignVariant();if(selected){delete selected.monthlyAssets;delete selected.monthlyExpansion}aiMonthlyExpansionState="idle";renderAIDesignMockSession();showEditorToast("월력 뒷면 배치안을 선택했습니다. 월력 전체 생성 시 12개월의 편집 가능한 개체 구성에 적용됩니다.");return}const regenerateButton=event.target.closest("[data-regenerate-ai-page]");if(regenerateButton&&aiDesignMockSession.selectedVariantId){aiDesignMockSession=window.ACDLAIDesignSettings.regeneratePage(aiDesignMockSession,aiDesignMockSession.selectedVariantId,regenerateButton.dataset.regenerateAiPage);renderAIDesignMockSession();showEditorToast("선택한 페이지 역할만 모의 재생성했습니다. 실제 AI 이미지는 아직 만들지 않습니다.")}});
el("registerResourceAssetBtn").addEventListener("click",()=>el("resourceAssetInput").click());
el("resetResourceAssetsBtn").addEventListener("click",()=>{if(confirm("현재 템플릿에 직접 등록한 학교 이미지 자산을 모두 초기화할까요?")){snapshot();ensureAssetResources();project.template.resources.sampleAssets=[];Object.values(project.book.school.profile||{}).forEach(v=>{if(v&&v.assetId?.startsWith("asset.project.")){v.assetId=null;v.image=""}});markDirty();renderResourceAssetManager();renderRegisteredAssetLibrary();showEditorToast("현재 템플릿의 등록 자산을 초기화했습니다.")}});
el("resourceAssetInput").addEventListener("change",async e=>{const file=e.target.files[0];e.target.value="";if(!file)return;const role=el("resourceAssetRole").value,name=el("resourceAssetName").value.trim()||file.name;try{const image=await compressImageFile(file);snapshot();ensureAssetResources();ensureSchoolProfile();const id=`asset.project.${role}.${Date.now()}`,asset={id,name,role,binding:defaultBindingForRole(role),kind:semanticRoleLabel(role),image,fileName:file.name,mimeType:file.type};project.template.resources.sampleAssets=role==="school-custom-image"?projectSampleAssets():projectSampleAssets().filter(a=>a.role!==role);project.template.resources.sampleAssets.push(asset);const key=semanticProfileKey(role);if(key){const profile=project.book.school.profile[key]||={};profile.image=image;profile.assetId=id;profile.name=profile.name||name}else{project.book.school.customAssets ||= [];project.book.school.customAssets.push({id,name,image,binding:asset.binding})}el("resourceAssetName").value="";markDirty();renderResourceAssetManager();renderRegisteredAssetLibrary();render();showEditorToast(`${semanticRoleLabel(role)} 이미지를 등록했습니다. 개체 추가에서 바로 사용할 수 있습니다.`)}catch(err){alert(err.message||"이미지 등록에 실패했습니다.")}});

el("editCalendarBtn").addEventListener("click",()=>{
 calendarEditing=!calendarEditing;selectedElementId=null;selectedElementScope=null;render();
 showEditorToast(calendarEditing?"월력 Master를 선택했습니다. 이동하거나 크기를 조절하세요.":"월력 선택을 해제했습니다.")
});
el("addMiniCalendarBtn").addEventListener("click",()=>addBackWidget("mini-calendar"));
el("addYearCalendarBtn").addEventListener("click",()=>addBackWidget("year-calendar"));
el("addMemoBtn").addEventListener("click",()=>addBackWidget("memo"));
el("addScheduleBtn").addEventListener("click",()=>addBackWidget("monthly-schedule"));

el("addTextBtn").addEventListener("click",()=>addElement("text"));
el("addImageBtn").addEventListener("click",()=>addElement("image"));
el("duplicateElementBtn").addEventListener("click",duplicateSelected);
el("deleteElementBtn").addEventListener("click",deleteSelected);
el("elementImageInput").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;
 const targetId=pendingImageElementId||selectedElementId;
 const targetScope=pendingImageElementScope||selectedElementScope;
 const reader=new FileReader();
 reader.onload=()=>{
  const arr=targetScope==="master"?masterElements():pageElements();
  const item=arr.find(x=>x.id===targetId);
  if(item&&item.type==="image"){snapshot();item.src=reader.result;item.alt=file.name;selectedElementId=item.id;selectedElementScope=targetScope;render()}
  pendingImageElementId=null;pendingImageElementScope=null
 };
 reader.readAsDataURL(file);e.target.value=""
});



// v21 role entry and user calendar creation flow
function v21Escape(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}
function v21FileToDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(reader.error||new Error("이미지를 읽지 못했습니다."));reader.readAsDataURL(file)})}
let appMode="designer", userWizardStep=1, selectedUserTemplate={template:"",type:"",libraryId:null};
let projectTransitionId=0;
function beginProjectTransition({clearProject=false}={}){
 projectTransitionId+=1;
 if(clearProject){project=null;selectedPageId=null;history=[];future=[];savedHash="";const page=el("page");page?.classList.remove("editor-bleed-visible","export-crop-marks","export-guides-visible");page?.style.removeProperty("--export-bleed-x-pct");page?.style.removeProperty("--export-bleed-y-pct");page?.style.removeProperty("--export-safe-x-pct");page?.style.removeProperty("--export-safe-y-pct");}
 resetEditorViewState();
 return projectTransitionId;
}
function isCurrentProjectTransition(id){return id===projectTransitionId}
window.ACDLProjectNavigation={begin:beginProjectTransition,current:()=>projectTransitionId,isCurrent:isCurrentProjectTransition};
const wizardStateApi=window.ACDLDesignerStudioWizard;
const userImages={building:"",logo:"",flower:"",tree:""};
function showEntry(){clearNewTemplateBase();beginProjectTransition({clearProject:true});el("entryScreen").classList.remove("hidden");el("setup").classList.add("hidden");el("userSetup").classList.add("hidden")}
function enterDesigner(){openDesignerStudio({mode:"designer",source:"entry"});}
function enterUser(){openDesignerStudio({mode:"user",source:"entry"});}
el("enterDesignerFlow")?.addEventListener("click",()=>openDesignerStudio({mode:"designer",source:"entry"}));el("enterUserFlow")?.addEventListener("click",()=>openDesignerStudio({mode:"user",source:"entry"}));el("designerBackBtn").addEventListener("click",showEntry);el("userCancelBtn").addEventListener("click",showEntry);
for(let m=1;m<=12;m++)el("userStartMonth").innerHTML+=`<option value="${m}" ${m===3?"selected":""}>${m}월</option>`;
for(let n=0;n<=5;n++){el("userFrontInserts").innerHTML+=`<option value="${n}" ${n===1?"selected":""}>${n}장</option>`;el("userRearInserts").innerHTML+=`<option value="${n}">${n}장</option>`}
function renderUserSizeOptions(){const list=SIZE_PRESETS[selectedUserTemplate.type]||SIZE_PRESETS.desk;el("userSize").innerHTML=list.map(x=>`<option value="${x.id}" ${x.recommended?"selected":""}>${x.label}${x.recommended?" · 추천":""}</option>`).join("");el("userRearInsertField").classList.toggle("hidden",selectedUserTemplate.type!=="desk")}
document.querySelectorAll("[data-user-template]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-user-template]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");selectedUserTemplate={template:btn.dataset.userTemplate,type:btn.dataset.userType};renderUserSizeOptions();updateWizardActions();if(wizardStateApi?.persistWizardState)wizardStateApi.persistWizardState({selectedType:selectedCalendarType||selectedUserTemplate.type,template:selectedUserTemplate.template,step:userWizardStep});}));
function setUserWizardStep(step){
 userWizardStep=Math.max(1,Math.min(5,step));
 document.querySelectorAll("[data-user-step]").forEach(x=>x.classList.toggle("active",Number(x.dataset.userStep)===userWizardStep));
 document.querySelectorAll(".wizard-step-dot").forEach((x,i)=>x.classList.toggle("active",i<userWizardStep));
 el("userPrevBtn").classList.toggle("hidden",userWizardStep===1);
 el("userNextBtn").classList.toggle("hidden",userWizardStep===5);
 el("userCreateBtn").classList.toggle("hidden",userWizardStep!==5);
 updateWizardActions();
 if(userWizardStep===5)renderUserSummary();
 const wizardState=wizardStateApi?.persistWizardState?.({selectedType:selectedCalendarType||selectedUserTemplate.type,template:selectedUserTemplate.template,step:userWizardStep});
 if(wizardState)selectedUserTemplate={...selectedUserTemplate,template:wizardState.template||selectedUserTemplate.template};
}
el("userNextBtn").addEventListener("click",()=>{setUserWizardStep(userWizardStep+1);});el("userPrevBtn").addEventListener("click",()=>{setUserWizardStep(userWizardStep-1);});
function renderUserSummary(){const tpl=document.querySelector("[data-user-template].selected strong")?.textContent||"템플릿";el("userWizardSummary").innerHTML=`<div class="summary-card"><h3>달력 구성</h3><div class="summary-row"><span>템플릿</span><strong>${v21Escape(tpl)}</strong></div><div class="summary-row"><span>연도·시작월</span><strong>${el("userYear").value}년 · ${el("userStartMonth").value}월</strong></div><div class="summary-row"><span>월력</span><strong>${el("userCalendarRows").value}×7 · ${el("userWeekStart").value==="monday"?"월요일":"일요일"} 시작</strong></div></div><div class="summary-card"><h3>학교 정보</h3><div class="summary-row"><span>학교명</span><strong>${v21Escape(el("userSchoolName").value||"미입력")}</strong></div><div class="summary-row"><span>학교 전경</span><strong>${userImages.building?"등록":"미등록"}</strong></div><div class="summary-row"><span>교표·교화</span><strong>${userImages.logo?"교표 등록":"교표 미등록"} · ${userImages.flower?"교화 등록":"교화 미등록"}</strong></div></div>`}
function bindUserImage(kind){const cap=kind[0].toUpperCase()+kind.slice(1),input=el(`user${cap}Input`),preview=el(`user${cap}Preview`);document.querySelector(`[data-user-upload="${kind}"]`).addEventListener("click",()=>input.click());input.addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;userImages[kind]=await v21FileToDataURL(f);preview.innerHTML=`<img src="${userImages[kind]}" alt="">`})}
["building","logo","flower","tree"].forEach(bindUserImage);
function applyUserSchoolData(){normalizeElementData();ensureSchoolProfile();const school=project.book.school;school.name=el("userSchoolName").value.trim()||"학교명 미입력";school.englishName=el("userSchoolEnglishName").value.trim();school.slogan=el("userSchoolSlogan").value.trim();school.address=el("userSchoolAddress").value.trim();school.phone=el("userSchoolPhone").value.trim();school.fax=el("userSchoolFax").value.trim();school.website=el("userSchoolWebsite").value.trim();school.profile.motto.description=el("userSchoolMotto").value.trim();school.profile.song.description=el("userSchoolSong").value.trim();school.profile.building.name=school.name;school.profile.building.image=userImages.building;school.profile.logo.image=userImages.logo;school.profile.flower.image=userImages.flower;school.profile.tree.image=userImages.tree;project.settings.calendarData={includeHolidays:el("userIncludeHolidays").checked,includeSolarTerms:el("userIncludeSolarTerms").checked,includeLunar:el("userIncludeLunar").checked,lunarDisplayRule:"1,5,10,15,20,25"};project.book.scheduleImport=window.userScheduleImport||null;window.ACDLScheduleApiClient?.ensureCalendarReferences?.(project).catch(error=>showEditorToast?.(error.message));if(window.userScheduleImport?.events?.length)project.book.events=[...(project.book.events||[]).filter(e=>e.source!=="user-import"),...window.userScheduleImport.events];project.book.pageInstances.filter(p=>p.role==="cover-front").forEach(p=>(project.book.elementsByPage[p.id]||[]).forEach(item=>{if(item.role==="school-name")item.binding="school.name";if(item.role==="slogan")item.content=school.slogan;if(item.role==="school-image"&&userImages.building)item.src=userImages.building}))}
function createUserCalendar(){resetEditorViewState();const opts={type:selectedUserTemplate.type,year:Number(el("userYear").value),startMonth:Number(el("userStartMonth").value),template:selectedUserTemplate.template,frontInsertCount:Number(el("userFrontInserts").value),rearInsertCount:Number(el("userRearInserts").value),calendarRows:Number(el("userCalendarRows").value),weekStart:el("userWeekStart").value,showAdjacentMiniCalendars:el("userAdjacentMini").checked,posterColumns:4,sizePresetId:el("userSize").value};project=makeProject(opts);project.mode="calendar-workspace";applyUserSchoolData();selectedPageId=project.book.pageInstances[0].id;selectedElementId=null;selectedElementScope=null;history=[];future=[];el("userSetup").classList.add("hidden");el("setup").classList.add("hidden");el("appBrand").childNodes[0].nodeValue="ACDL 사용자 달력 에디터 ";el("currentTemplateTitle").textContent=`${project.book.school.name} ${project.settings.year} 달력`;el("newBtn").textContent="새 달력";el("saveBtn").textContent="달력 저장";el("templateMode").textContent="달력 편집";el("modeHelp").textContent="학교 정보와 월별 콘텐츠를 입력하고, 템플릿이 허용한 영역을 편집합니다.";setEditorContext("새 달력 만들기");stable();render();updateRoleIndicator();showEditorToast("학교 정보가 적용된 새 달력을 만들었습니다.")}
el("userCreateBtn").addEventListener("click",createUserCalendar);
// The New button follows the current workspace role.
el("newBtn").addEventListener("click",()=>{if(appMode==="user"){openDesignerStudio({mode:"user",source:"entry"});}else{openDesignerStudio({mode:"designer",source:"entry"});}});

// v22: role indicator, streamlined page preview, type-first wizard and template library
const originalEnterDesigner=enterDesigner;enterDesigner=function(){originalEnterDesigner();updateRoleIndicator()};
const originalEnterUser=enterUser;enterUser=function(){originalEnterUser();updateRoleIndicator()};
const originalCreateUserCalendar=createUserCalendar;createUserCalendar=function(){originalCreateUserCalendar();updateRoleIndicator()};
let selectedCalendarType="";
function updateWizardActions(){
 const hasSelectedTemplate=!!selectedUserTemplate.template&&selectedUserTemplate.type===selectedCalendarType;
 const canContinue=userWizardStep===1?!!selectedCalendarType:userWizardStep===2?hasSelectedTemplate:true;
 el("userNextBtn").disabled=!canContinue;
 el("userCreateBtn").disabled=userWizardStep===5&&!hasSelectedTemplate;
}
function applyCalendarType(type){
 selectedCalendarType=type;
 document.querySelectorAll("[data-calendar-type]").forEach(x=>{const selected=x.dataset.calendarType===type;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected))});
 document.querySelectorAll("[data-user-template]").forEach(x=>x.classList.toggle("hidden-by-type",x.dataset.userType!==type));
 document.querySelectorAll("[data-user-template]").forEach(x=>x.classList.remove("selected"));
 selectedUserTemplate={template:"",type,libraryId:null};
 el("selectedTypeLabel").textContent={desk:"탁상형",wall:"벽걸이형",poster:"연간 포스터형",postcard:"엽서형"}[type]||type;
 renderUserSizeOptions();
 updateWizardActions();
 if(wizardStateApi?.persistWizardState)wizardStateApi.persistWizardState({selectedType:type,template:selectedUserTemplate.template,step:userWizardStep});
}
document.querySelectorAll("[data-calendar-type]").forEach(btn=>btn.addEventListener("click",()=>applyCalendarType(btn.dataset.calendarType)));
setUserWizardStep=function(step){
 userWizardStep=Math.max(1,Math.min(5,step));
 document.querySelectorAll("[data-user-step]").forEach(x=>x.classList.toggle("active",Number(x.dataset.userStep)===userWizardStep));
 document.querySelectorAll(".wizard-step-dot").forEach((x,i)=>x.classList.toggle("active",i<userWizardStep));
 el("userPrevBtn").classList.toggle("hidden",userWizardStep===1);
 el("userNextBtn").classList.toggle("hidden",userWizardStep===5);
 el("userCreateBtn").classList.toggle("hidden",userWizardStep!==5);
 updateWizardActions();
 if(userWizardStep===5)renderUserSummary();
 if(wizardStateApi?.persistWizardState)wizardStateApi.persistWizardState({selectedType:selectedCalendarType||selectedUserTemplate.type,template:selectedUserTemplate.template,step:userWizardStep});
};
window.el=el;
window.SIZE_PRESETS=SIZE_PRESETS;
window.makeProject=makeProject;
window.render=render;
window.renderPage=renderPage;
window.renderFreeElements=renderFreeElements;
window.renderNavigator=renderNavigator;
window.renderSizeOptions=renderSizeOptions;
window.graphicMarkup=graphicMarkup;
window.resolveTextContent=resolveTextContent;
window.setUserWizardStep=setUserWizardStep;
Object.defineProperty(window,'project',{get:()=>project,set:value=>{project=value},configurable:true});
Object.defineProperty(window,'selectedCalendarType',{get:()=>selectedCalendarType,set:value=>{selectedCalendarType=value},configurable:true});
Object.defineProperty(window,'selectedUserTemplate',{get:()=>selectedUserTemplate,set:value=>{selectedUserTemplate=value},configurable:true});
Object.defineProperty(window,'userWizardStep',{get:()=>userWizardStep,set:value=>{userWizardStep=value},configurable:true});
el("libraryBtn")?.addEventListener("click",()=>{if(appMode!=="designer")return;el("templateLibraryModal").classList.remove("hidden");renderTemplateLibrary();refreshRemoteTemplateLibrary()});el("closeTemplateLibraryBtn")?.addEventListener("click",closeTemplateLibrary);el("newLibraryTemplateBtn")?.addEventListener("click",()=>{clearNewTemplateBase();el("templateLibraryModal").classList.add("hidden");enterDesigner()});
// Designer save now opens metadata/state dialog; user save keeps original file save behavior.
el("saveBtn").addEventListener("click",e=>{if(appMode!=="designer")return;e.stopImmediatePropagation();normalizeElementData();const m=project?.template?.metadata||{},dialog=el("templateSaveDialog");dialog.dataset.mode="content";delete dialog.dataset.recordId;el("deleteTemplatePermanentlyBtn")?.classList.add("hidden");el("templateSaveDialogTitle").textContent=project?.template?.id?"현재 템플릿 저장":"새 템플릿 저장";el("templateSaveDialogHelp").textContent=project?.template?.id?"현재 템플릿의 새 버전으로 저장합니다.":"새 템플릿을 라이브러리에 초안으로 등록합니다.";el("saveTemplateName").value=m.name||"학교 기본형";el("saveTemplateDescription").value=m.description||"";el("saveTemplateEdition").value=project?.settings?.year||2027;el("saveTemplateState").value=m.state||"draft";el("saveTemplateStandard").checked=m.isStandard===true;dialog.classList.remove("hidden")},true);
el("cancelTemplateSaveBtn")?.addEventListener("click",()=>{const dialog=el("templateSaveDialog");dialog.classList.add("hidden");if(!window.ACDLReturnToLibraryOnSaveCancel)return;window.ACDLReturnToLibraryOnSaveCancel=false;beginProjectTransition({clearProject:true});el("templateLibraryModal").classList.remove("hidden");renderTemplateLibrary();refreshRemoteTemplateLibrary()});
el("confirmTemplateSaveBtn")?.addEventListener("click",async ()=>{
 const saveDialog=el("templateSaveDialog");if(!project&&saveDialog.dataset.mode!=="settings")return;
 const feedback=el("templateSaveFeedback");feedback.className="save-feedback hidden";feedback.textContent="";
 try{
  const dialog=el("templateSaveDialog");
  if(dialog.dataset.mode==="settings"){await window.ACDLTemplateLibrarySettings.save(dialog.dataset.recordId,{name:el("saveTemplateName").value.trim(),description:el("saveTemplateDescription").value.trim(),edition:Number(el("saveTemplateEdition").value),state:el("saveTemplateState").value,isStandard:el("saveTemplateStandard").checked});dialog.classList.add("hidden");return}
  normalizeElementData();ensureV22Metadata();
  const name=el("saveTemplateName").value.trim()||"이름 없는 템플릿",description=el("saveTemplateDescription").value.trim(),edition=Number(el("saveTemplateEdition").value)||2027,state=el("saveTemplateState").value,isStandard=el("saveTemplateStandard").checked;
  const id=project.template.id||("tpl-"+Date.now()),stableKey=project.template.remoteStableKey||id;project.template.id=id;
  Object.assign(project.template.metadata,{name,description,edition,state,isStandard});window.ACDLTemplateYearSynchronizer.synchronize(project,{year:edition,startMonth:project.settings.startMonth||3});
  const projectCopy=window.ACDLPersistenceProject.clone(project);await saveTemplateProjectData(id,projectCopy);let savedId=id,remoteSaved=false,remoteError=null,remoteVersion=Number(project.template.remoteVersionNumber)||0;
  const remote=window.ACDLTemplateRemotePersistence;
  if(remote?.isRemote?.())try{const result=await remote.save({templateId:project.template.remoteId||null,stableKey,name,description,edition,state,isStandard,productType:project.productType?.category||project.settings?.type||"desk",templateKey:project.template?.preset||project.settings?.template||"school-basic",saveKind:state==="published"?"publish":"manual",saveNote:`${name} 저장`,schemaVersion:"2.0",projectData:projectCopy},{onProgress:window.ACDLTemplateSaveProgress});savedId=result.template.id;remoteVersion=result.version.versionNumber;remoteSaved=true;project.template.id=savedId;project.template.remoteId=savedId;project.template.remoteStableKey=result.template.stableKey;project.template.remoteVersionNumber=remoteVersion;await saveTemplateProjectData(savedId,window.ACDLPersistenceProject.clone(project))}catch(error){remoteError=error;console.warn("원격 템플릿 저장 실패",error)}
  project.template.librarySource="local";
  const list=v22Library(),record={id:savedId,remoteId:remoteSaved?savedId:undefined,stableKey,name,description,edition,state,isStandard,type:project.productType?.category||project.settings?.type||"desk",template:project.template?.preset||project.settings?.template||"school-basic",packageVersion:project.template?.package?.version,packageBase:project.template?.package?.base,derivedFromPackage:project.template?.derivedFromPackage||undefined,source:"local",thumbnail:project.template?.thumbnail||{kind:"renderer",source:"templateData"},version:remoteVersion||1,updatedAt:new Date().toISOString(),storage:remoteSaved?"supabase":"indexeddb"};
  const filtered=list.filter(x=>x.id!==id&&x.id!==savedId&&(!stableKey||x.stableKey!==stableKey));filtered.unshift(record);list.splice(0,list.length,...filtered);
  v22SaveLibrary(list);
  renderUserTemplateChoices();
  const verified=v22Library().find(x=>x.id===savedId);if(!verified)throw new Error("저장 후 라이브러리에서 템플릿을 확인하지 못했습니다.");
  window.ACDLReturnToLibraryOnSaveCancel=false;stable();el("templateSaveDialog").classList.add("hidden");if(isStandard||state==="published"||state==="archived"){el("templateLibraryModal").classList.remove("hidden");renderTemplateLibrary("all")}else render();
  showEditorToast(`${name} ${edition} Edition ${remoteSaved?`원격 저장 완료 · v${remoteVersion}`:"브라우저 저장 완료"}`);
  if(remoteSaved)alert(`템플릿 저장 완료\n\n저장 위치: Supabase 원격 저장\n버전: v${remoteVersion}`);else alert(`템플릿은 이 브라우저에만 저장되었습니다.\n\n원격 저장 실패: ${remoteError?.message||"원격 저장이 연결되지 않았습니다."}\n\n버전 이력을 사용하려면 Supabase 원격 저장이 필요합니다.`);
 }catch(err){
  feedback.className="save-feedback error";feedback.textContent=`저장 실패: ${err?.message||"브라우저 데이터베이스 저장 오류"}`;
 }
});
// Current edition/state metadata defaultsults
const v22OldRender=render;render=function(){ensureV22Metadata();v22OldRender();updateRoleIndicator()};
el("enterDesignerFlow")?.addEventListener("click",()=>setTimeout(updateRoleIndicator,0));
el("enterUserFlow")?.addEventListener("click",()=>setTimeout(updateRoleIndicator,0));
el("userCreateBtn")?.addEventListener("click",()=>setTimeout(updateRoleIndicator,0));

window.userScheduleImport=null;
function parseScheduleText(text,year){
 const events=[];let idx=0;
 const lines=String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const fmt=(m,d)=>`${year}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
 for(const line of lines){
  let m=line.match(/^(\d{1,2})[\/.](\d{1,2})\s*[-~～]\s*(\d{1,2})[\/.](\d{1,2})\s*[,\t ]+(.+)$/);
  if(m){events.push({id:`import-${Date.now()}-${idx++}`,title:m[5].trim(),startDate:fmt(m[1],m[2]),endDate:fmt(m[3],m[4]),category:"school",source:"user-import",priority:70});continue}
  m=line.match(/^(\d{1,2})[\/.](\d{1,2})\s*[,\t ]+(.+)$/);
  if(m)events.push({id:`import-${Date.now()}-${idx++}`,title:m[3].trim(),startDate:fmt(m[1],m[2]),endDate:fmt(m[1],m[2]),category:"school",source:"user-import",priority:70})
 }
 return events;
}
async function registerScheduleFile(file,target){
 const isText=/\.(csv|txt)$/i.test(file.name);let events=[];
 if(isText){events=parseScheduleText(await file.text(),Number(el(target==="user"?"userYear":"resourceCalendarYear")?.value)||2027)}
 const payload={fileName:file.name,fileType:file.type||file.name.split('.').pop(),size:file.size,registeredAt:new Date().toISOString(),events,status:isText?"parsed":"registered-for-conversion"};
 if(target==="user"){window.userScheduleImport=payload;el("userScheduleFileName").textContent=file.name;el("userScheduleFileStatus").textContent=isText?`${events.length}개 일정을 인식했습니다. 단일·구간 일정으로 변환됩니다.`:"파일 등록 완료 · 워드/엑셀 변환 모듈 연동 대상";const pv=el("userSchedulePreview");pv.classList.remove("hidden");pv.innerHTML=events.length?`인식 예시: ${events.slice(0,5).map(e=>`${e.startDate}${e.endDate!==e.startDate?` ~ ${e.endDate}`:""} · ${v21Escape(e.title)}`).join("<br>")}${events.length>5?`<br>외 ${events.length-5}개`:""}`:"파일 원본은 등록되었으며, 실제 서비스의 워드·엑셀 일정 변환 API와 연결됩니다."}
 else{project.book.scheduleImport=payload;if(events.length)project.book.events=[...(project.book.events||[]).filter(e=>e.source!=="user-import"),...events];el("resourceScheduleFileName").textContent=file.name;el("resourceScheduleFileStatus").textContent=isText?`${events.length}개 샘플 일정을 변환했습니다.`:"샘플 파일 등록 완료 · 변환 연동 대상";const pv=el("resourceSchedulePreview");pv.classList.remove("hidden");pv.innerHTML=events.length?`${events.slice(0,6).map(e=>`${e.startDate}${e.endDate!==e.startDate?` ~ ${e.endDate}`:""} · ${v21Escape(e.title)}`).join("<br>")}`:"템플릿에는 calendar.events 데이터 슬롯과 파일 메타데이터가 저장됩니다.";markDirty();render()}
}
el("userScheduleUploadBtn")?.addEventListener("click",()=>el("userScheduleInput").click());
el("userScheduleInput")?.addEventListener("change",async e=>{const f=e.target.files[0];if(f)await registerScheduleFile(f,"user")});
el("resourceScheduleUploadBtn")?.addEventListener("click",()=>el("resourceScheduleInput").click());
el("resourceScheduleInput")?.addEventListener("change",async e=>{const f=e.target.files[0];if(f)await registerScheduleFile(f,"resource")});

function openDesignerStudio(options){
 const mode=options?.mode||'designer';
 const source=options?.source||'entry';
 beginProjectTransition({clearProject:true});
 appMode=mode;
 document.body.classList.toggle('user-mode', mode==='user');
 el('entryScreen').classList.add('hidden');
 el('setup').classList.add('hidden');
 el('userSetup').classList.add('hidden');
 el('designerHome').classList.add('hidden');
 el('templateLibraryModal').classList.add('hidden');
 const isUser=mode==='user';
 el('appBrand').childNodes[0].nodeValue=isUser?'ACDL 사용자 달력 에디터 ':'우리학교인쇄 CALENDAR EDITOR ';
 setEditorContext(isUser?'새 달력 만들기':'새 템플릿 만들기');
 el('newBtn').textContent=isUser?'새 달력':'새 템플릿';
 el('saveBtn').textContent=isUser?'달력 저장':'템플릿 저장';
 el('templateMode').textContent=isUser?'달력 편집':'템플릿 설계';
 el('modeHelp').textContent=isUser?'학교 정보와 월별 콘텐츠를 입력하고, 템플릿이 허용한 영역을 편집합니다.':'샘플 콘텐츠, 데이터 연결, 위치와 스타일을 한 화면에서 설계합니다.';
 if(isUser){
  selectedCalendarType='';
  selectedUserTemplate={template:'',type:'',libraryId:null};
  document.querySelectorAll('[data-calendar-type]').forEach(card=>{card.classList.remove('selected');card.setAttribute('aria-pressed','false')});
  document.querySelectorAll('[data-user-template]').forEach(card=>card.classList.remove('selected'));
  el('userSetup').classList.remove('hidden');
  if(typeof setUserWizardStep==='function')setUserWizardStep(1);
  renderUserSizeOptions();
  window.scrollTo?.(0,0);
  const label=el('selectedTypeLabel');if(label)label.textContent={desk:'탁상형',wall:'벽걸이형',poster:'연간 포스터형',postcard:'엽서형'}[selectedCalendarType]||selectedCalendarType;
  showEditorToast('새 달력 생성 흐름을 다시 시작합니다.');
  updateRoleIndicator();
  return;
 }
 if(options?.templateId){
  const record=window.TemplateLibraryRepository?.get?.(options.templateId) || null;
  if(record)openDesignerProjectFromRecord(record).catch(()=>{});
  return;
 }
 if(options?.projectId){
  const stored=window.TemplateLibraryRepository?.loadProject?.(options.projectId);
  if(stored)Promise.resolve(stored).then(data=>{if(data){project=structuredClone(data);selectedPageId=project.book?.pageInstances?.[0]?.id||null;selectedElementId=null;selectedElementScope=null;history=[];future=[];stable();render();updateRoleIndicator();}});
  return;
 }
 if(options?.source==='setup'){el('setup').classList.remove('hidden');return;}
 if(source==='designer-home' || source==='library'){el('setup').classList.remove('hidden');return;}
 if(source==='entry'){el('designerHome').classList.remove('hidden');return;}
 stable();render();updateRoleIndicator();
}
function startDesignerWorkspace(){openDesignerStudio({mode:'designer',source:'entry'});}
function startUserWorkspace(){openDesignerStudio({mode:'user',source:'entry'});}
enterDesigner=function(){openDesignerStudio({mode:'designer',source:'entry'});}
if(el('enterDesignerFlow'))el('enterDesignerFlow').onclick=enterDesigner;
el('designerHomeNew')?.addEventListener('click',()=>openDesignerStudio({mode:'designer',source:'designer-home'}));
el('designerHomeLibrary')?.addEventListener('click',()=>{el('entryScreen').classList.add('hidden');el('designerHome').classList.add('hidden');el('templateLibraryModal').classList.remove('hidden');renderTemplateLibrary('all');refreshRemoteTemplateLibrary()});
el('designerHomeOpen')?.addEventListener('click',()=>{setEditorContext('기존 템플릿 열기');el('fileInput').click()});
el('designerHomeBackBtn')?.addEventListener('click',()=>showEntry());
const oldShowEntry=showEntry;showEntry=function(){el('designerHome')?.classList.add('hidden');oldShowEntry()};

// Header template dropdown
el("templateMenuBtn")?.addEventListener("click",e=>{e.stopPropagation();el("templateMenuDropdown").classList.toggle("hidden")});
document.addEventListener("click",()=>el("templateMenuDropdown")?.classList.add("hidden"));
el("templateMenuDropdown")?.addEventListener("click",e=>e.stopPropagation());
el("newBtn")?.addEventListener("click",()=>{if(appMode==="designer"){el("designerHome")?.classList.add("hidden");el("setup").classList.remove("hidden")}el("templateMenuDropdown")?.classList.add("hidden")},true);

// Resource form compatibility for newly added fields and schedule metadata
const oldPopulateSchoolResourceForm=populateSchoolResourceForm;populateSchoolResourceForm=function(){oldPopulateSchoolResourceForm();const school=project?.book?.school||{};if(el("resourceSchoolFax"))el("resourceSchoolFax").value=school.fax||"";if(el("resourceSchoolSong"))el("resourceSchoolSong").value=school.profile?.song?.description||"";const imp=project?.book?.scheduleImport,preview=el("resourceSchedulePreview"),input=el("resourceScheduleInput");if(imp){el("resourceScheduleFileName").textContent=imp.fileName||"샘플 일정 파일";el("resourceScheduleFileStatus").textContent=imp.events?.length?`${imp.events.length}개 샘플 일정 저장됨`:"변환 연동 대상 파일 등록됨"}else{el("resourceScheduleFileName").textContent="샘플 일정 파일 없음";el("resourceScheduleFileStatus").textContent="XLSX·CSV·TXT 등록 가능";if(preview){preview.classList.add("hidden");preview.innerHTML=""}if(input)input.value=""}}

const v23OldRenderUserSummary=renderUserSummary;renderUserSummary=function(){
 const tpl=document.querySelector("[data-user-template].selected strong")?.textContent||"템플릿", opts=[];
 if(el("userIncludeHolidays")?.checked)opts.push("국경일·기념일·휴일");if(el("userIncludeSolarTerms")?.checked)opts.push("24절기");if(el("userIncludeLunar")?.checked)opts.push("음력");
 el("userWizardSummary").innerHTML=`<div class="summary-card"><h3>달력 구성</h3><div class="summary-row"><span>템플릿</span><strong>${v21Escape(tpl)}</strong></div><div class="summary-row"><span>연도·시작월</span><strong>${el("userYear").value}년 · ${el("userStartMonth").value}월</strong></div><div class="summary-row"><span>월력</span><strong>${el("userCalendarRows").value}×7 · ${el("userWeekStart").value==="monday"?"월요일":"일요일"} 시작</strong></div><div class="summary-row"><span>공공 달력 정보</span><strong>${opts.join(" · ")||"미포함"}</strong></div><div class="summary-row"><span>학교 일정</span><strong>${window.userScheduleImport?.fileName?v21Escape(window.userScheduleImport.fileName):"미등록"}</strong></div></div><div class="summary-card"><h3>학교 정보</h3><div class="summary-row"><span>학교명</span><strong>${v21Escape(el("userSchoolName").value||"미입력")}</strong></div><div class="summary-row"><span>교훈·교가</span><strong>${el("userSchoolMotto").value?"교훈 등록":"교훈 미등록"} · ${el("userSchoolSong").value?"교가 등록":"교가 미등록"}</strong></div><div class="summary-row"><span>학교 이미지</span><strong>${[userImages.building,userImages.logo,userImages.flower,userImages.tree].filter(Boolean).length}/4 등록</strong></div><div class="summary-row"><span>연락처</span><strong>${el("userSchoolPhone").value||"전화 미입력"}${el("userSchoolFax").value?" · 팩스 등록":""}</strong></div></div>`
};


// v24 contacts and binding-slot model
function contactRowHtml(c={}){return `<div class="contact-row" data-contact-row><label>제목<input class="contact-label" value="${v21Escape(c.label||"")}" placeholder="비우면 연락처"></label><label>전화번호<input class="contact-phone" value="${v21Escape(c.phone||"")}" placeholder="02-0000-0000"></label><label>팩스<input class="contact-fax" value="${v21Escape(c.fax||"")}" placeholder="02-0000-0000"></label><button type="button" class="remove-contact">삭제</button></div>`}
function bindContactEditor(container){if(!container)return;container.querySelectorAll(".remove-contact").forEach(b=>b.onclick=()=>{if(container.querySelectorAll("[data-contact-row]").length>1)b.closest("[data-contact-row]").remove()})}
function readContacts(container){return [...container.querySelectorAll("[data-contact-row]")].map(r=>({label:r.querySelector(".contact-label").value.trim()||"연락처",phone:r.querySelector(".contact-phone").value.trim(),fax:r.querySelector(".contact-fax").value.trim()})).filter(c=>c.phone||c.fax||c.label!=="연락처")}
function fillContactEditor(container,contacts){container.innerHTML=(contacts?.length?contacts:[{label:"교무실"},{label:"행정실"}]).map(contactRowHtml).join("");bindContactEditor(container)}
el("addUserContactBtn")?.addEventListener("click",()=>{el("userContactEditor").insertAdjacentHTML("beforeend",contactRowHtml({}));bindContactEditor(el("userContactEditor"))});bindContactEditor(el("userContactEditor"));
el("addResourceContactBtn")?.addEventListener("click",()=>{el("resourceContactEditor").insertAdjacentHTML("beforeend",contactRowHtml({}));bindContactEditor(el("resourceContactEditor"))});
const v24OldPopulate=populateSchoolResourceForm;populateSchoolResourceForm=function(){v24OldPopulate();ensureSchoolProfile();const school=project.book.school;school.contacts ||= [{label:"교무실",phone:school.phone||"",fax:""},{label:"행정실",phone:"",fax:school.fax||""}];fillContactEditor(el("resourceContactEditor"),school.contacts)};
const v24OldApplyUser=applyUserSchoolData;applyUserSchoolData=function(){v24OldApplyUser();const contacts=readContacts(el("userContactEditor"));project.book.school.contacts=contacts;project.book.school.phone=contacts[0]?.phone||"";project.book.school.fax=contacts.find(c=>c.fax)?.fax||""};
el("saveSchoolInfoBtn")?.addEventListener("click",()=>{if(!project)return;const contacts=readContacts(el("resourceContactEditor"));project.book.school.contacts=contacts;project.book.school.phone=contacts[0]?.phone||"";project.book.school.fax=contacts.find(c=>c.fax)?.fax||"";markDirty()},true);
const v24OldUserSummary=renderUserSummary;renderUserSummary=function(){v24OldUserSummary();const contacts=readContacts(el("userContactEditor"));const row=[...el("userWizardSummary").querySelectorAll(".summary-row")].find(r=>r.querySelector("span")?.textContent==="연락처");if(row)row.querySelector("strong").textContent=contacts.length?contacts.map(c=>`${c.label} ${c.phone||c.fax||"미입력"}`).join(" · "):"미입력"};
function ensureContactBindings(){if(!project)return;project.book.school.contacts ||= [];project.template.dataSlots ||= {};project.template.dataSlots.school={name:"school.name",englishName:"school.englishName",address:"school.address",website:"school.website",contacts:"school.contacts[]",motto:"school.profile.motto",song:"school.profile.song",building:"school.profile.building",logo:"school.profile.logo",flower:"school.profile.flower",tree:"school.profile.tree",events:"calendar.events"}}
const v24Render=typeof window.render==='function'?window.render:render; if(typeof v24Render==='function')render=function(){ensureContactBindings();v24Render()};
fillContactEditor(el("userContactEditor"),[{label:"교무실"},{label:"행정실"}]);



// v26 designer-to-user template integration and complete school asset binding
(function(){
  // Extend user-side school image inputs with school song artwork and custom assets.
  const imageSection=document.querySelector('#userSetup .school-profile-section:nth-of-type(2)');
  if(imageSection && !document.getElementById('userSongImageInput')){
    const extra=document.createElement('div');
    extra.className='v26-extra-assets';
    extra.innerHTML=`<div class="profile-upload-grid profile-upload-grid-4" style="margin-top:10px">
      <div class="profile-upload"><strong>교가 악보·이미지</strong><div id="userSongImagePreview" class="profile-upload-preview">이미지 미등록</div><button type="button" id="userSongImageBtn">이미지 선택</button><input id="userSongImageInput" class="hidden" type="file" accept="image/*"></div>
      <div class="profile-upload" style="grid-column:span 3"><strong>사용자 지정 이미지</strong><div id="userCustomAssetPreview" class="schedule-preview">등록된 이미지가 없습니다.</div><button type="button" id="userCustomAssetBtn">이미지 추가</button><input id="userCustomAssetInput" class="hidden" type="file" accept="image/*" multiple></div>
    </div>`;
    imageSection.appendChild(extra);
    userImages.song ||= '';
    userImages.customAssets ||= [];
    const preview=(id,src,label)=>{const n=el(id);if(!n)return;n.innerHTML=src?`<img src="${src}" alt="${label}">`:'이미지 미등록'};
    el('userSongImageBtn').onclick=()=>el('userSongImageInput').click();
    el('userSongImageInput').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{userImages.song=await compressImageFile(f);preview('userSongImagePreview',userImages.song,'교가 이미지')}catch(err){alert(err.message||'이미지를 읽지 못했습니다.')}};
    el('userCustomAssetBtn').onclick=()=>el('userCustomAssetInput').click();
    el('userCustomAssetInput').onchange=async e=>{const files=[...e.target.files];e.target.value='';for(const f of files){try{userImages.customAssets.push({id:`user-custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,name:f.name,image:await compressImageFile(f)})}catch(_){}}renderUserCustomAssets()};
    window.renderUserCustomAssets=function(){const n=el('userCustomAssetPreview');if(!n)return;n.innerHTML=userImages.customAssets.length?userImages.customAssets.map((a,i)=>`<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><img src="${a.image}" alt="${v21Escape(a.name)}" style="width:42px;height:32px;object-fit:cover;border-radius:5px"><span style="flex:1">${v21Escape(a.name)}</span><button type="button" data-remove-user-custom="${i}">삭제</button></div>`).join(''):'등록된 이미지가 없습니다.';n.querySelectorAll('[data-remove-user-custom]').forEach(b=>b.onclick=()=>{userImages.customAssets.splice(Number(b.dataset.removeUserCustom),1);renderUserCustomAssets()})};
  }

  function deepClone(v){return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}
  function syncTemplateCalendarDates(prj,year,startMonth){
    if(window.ACDLTemplateYearSynchronizer){window.ACDLTemplateYearSynchronizer.synchronize(prj,{year,startMonth});return}
    const pages=prj.book?.pageInstances||[], fronts=pages.filter(page=>page.role==='monthly-front'), backs=pages.filter(page=>page.role==='monthly-back');
    fronts.forEach((page,index)=>{const d=new Date(year,startMonth-1+index,1);page.calendarYear=d.getFullYear();page.calendarMonth=d.getMonth()+1;page.monthKey=`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`;page.pairId=`month-pair.${page.monthKey}`});
    backs.forEach((page,index)=>{const front=fronts[index];if(front){page.calendarYear=front.calendarYear;page.calendarMonth=front.calendarMonth;page.monthKey=front.monthKey;page.pairId=front.pairId}});
    pages.filter(page=>page.role==='poster-annual').forEach(page=>{page.calendarYear=year;page.calendarMonth=1});
  }
  function roleImage(role,school,item){
    const map={'school-image':'building','school-building':'building','school-logo':'logo','school-flower':'flower','school-tree':'tree','school-song':'song'};
    if(role==='school-custom-image'){
      const arr=school.customAssets||[];const idx=Number(item?.customAssetIndex||0);return arr[idx]?.image||arr[0]?.image||'';
    }
    const key=map[role];return key?school.profile?.[key]?.image||'':'';
  }
  function applyAllBoundAssets(prj){
    const school=prj.book?.school||{};
    const all=[];
    Object.values(prj.book?.elementsByPage||{}).forEach(a=>Array.isArray(a)&&all.push(...a));
    Object.values(prj.template?.masterElements||{}).forEach(a=>Array.isArray(a)&&all.push(...a));
    all.forEach(item=>{
      const img=roleImage(item.role,school,item);if(img && (item.type==='image'||item.role==='school-image'))item.src=img;
      if(item.binding==='school.name')item.content=school.name||item.content;
      if(item.binding==='school.englishName')item.content=school.englishName||item.content;
      if(item.binding==='school.slogan')item.content=school.slogan||item.content;
      if(item.binding==='school.address')item.content=school.address||item.content;
      if(item.binding==='school.website')item.content=school.website||item.content;
      if(item.binding==='school.contacts')item.content=(school.contacts||[]).map(contact=>[contact.label,contact.phone,contact.fax&&`팩스 ${contact.fax}`].filter(Boolean).join(' ')).filter(Boolean).join(' · ')||[school.phone,school.fax&&`팩스 ${school.fax}`].filter(Boolean).join(' · ')||item.content;
      if(item.binding==='calendar.year')item.content=String(prj.settings?.year||item.content||'');
      if(item.binding==='school.profile.motto.description')item.content=school.profile?.motto?.description||item.content;
      if(item.binding==='school.profile.song.description')item.content=school.profile?.song?.description||item.content;
    });
  }

  // Bound semantic objects show the current project's registered school data in both workspaces.
  const oldSemanticData=semanticData;
  semanticData=function(item){
    if(!project?.book?.school||item.bindingEnabled===false)return oldSemanticData(item);
    ensureSchoolProfile();const school=project.book.school;
    const map={'school-logo':'logo','school-building':'building','school-flower':'flower','school-tree':'tree','school-motto':'motto','school-song':'song'};
    if(item.role==='school-custom-image'){
      const a=(school.customAssets||[])[Number(item.customAssetIndex||0)]||(school.customAssets||[])[0];
      return a?{name:a.name||'사용자 지정 이미지',description:a.description||'',image:a.image||''}:oldSemanticData(item);
    }
    const key=map[item.role],d=key?school.profile?.[key]:null;
    if(!d)return oldSemanticData(item);
    return {name:d.name||semanticRoleLabel(item.role),description:d.description||'',image:d.image||''};
  };

  const oldApply=applyUserSchoolData;
  applyUserSchoolData=function(){
    oldApply();ensureSchoolProfile();
    project.book.school.profile.song.image=userImages.song||project.book.school.profile.song.image||'';
    project.book.school.customAssets=deepClone(userImages.customAssets||[]);
    applyAllBoundAssets(project);
  };

  async function createCalendarFromSelectedTemplate(){
    resetEditorViewState();
    const opts={type:selectedUserTemplate.type,year:Number(el('userYear').value),startMonth:Number(el('userStartMonth').value),template:selectedUserTemplate.template,frontInsertCount:Number(el('userFrontInserts').value),rearInsertCount:Number(el('userRearInserts').value),calendarRows:Number(el('userCalendarRows').value),weekStart:el('userWeekStart').value,showAdjacentMiniCalendars:el('userAdjacentMini').checked,posterColumns:4,sizePresetId:el('userSize').value};
    let stored=null;
    if(selectedUserTemplate.libraryId){try{stored=await loadTemplateProjectData(selectedUserTemplate.libraryId)}catch(err){console.warn('Template load failed',err)}}
    project=stored?deepClone(stored):makeProject(opts);
    project.mode='calendar-workspace';
    project.settings ||= {};Object.assign(project.settings,{year:opts.year,startMonth:opts.startMonth,calendarRows:opts.calendarRows,weekStart:opts.weekStart,showAdjacentMiniCalendars:opts.showAdjacentMiniCalendars,sizePresetId:opts.sizePresetId,type:opts.type});
    project.template ||= {};project.template.sourceTemplateId=selectedUserTemplate.libraryId||null;project.template.sourceTemplateName=document.querySelector('[data-user-template].selected strong')?.textContent||project.template.metadata?.name||'템플릿';
    syncTemplateCalendarDates(project,opts.year,opts.startMonth);
    applyUserSchoolData();
    selectedPageId=project.book.pageInstances?.[0]?.id||null;selectedElementId=null;selectedElementScope=null;history=[];future=[];
    el('userSetup').classList.add('hidden');el('appBrand').childNodes[0].nodeValue='ACDL 사용자 달력 에디터 ';el('currentTemplateTitle').textContent=`${project.book.school.name} ${project.settings.year} 달력`;el('newBtn').textContent='새 달력';el('saveBtn').textContent='달력 저장';el('templateMode').textContent='달력 편집';el('modeHelp').textContent='학교 정보와 월별 콘텐츠를 입력하고, 템플릿이 허용한 영역을 편집합니다.';
    stable();render();updateRoleIndicator();showEditorToast(stored?'선택한 라이브러리 템플릿과 학교 정보를 적용했습니다.':'기본 템플릿으로 달력을 만들었습니다.');
  }
  const createButton=el('userCreateBtn');
  createButton?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();createCalendarFromSelectedTemplate().catch(err=>{console.error(err);alert(`달력 생성 실패: ${err.message||err}`)})},true);

  // Refresh the user template list immediately after a successful designer save.
  const saveButton=el('confirmTemplateSaveBtn');
  saveButton?.addEventListener('click',()=>setTimeout(()=>{try{renderUserTemplateChoices()}catch(_){}},350));

  // Re-rendering never chooses a template on the user's behalf.
  const oldRenderChoices=renderUserTemplateChoices;
  renderUserTemplateChoices=function(){
    oldRenderChoices();
    const visible=[...document.querySelectorAll('#userTemplateChoiceGrid [data-user-template]')].filter(x=>!x.classList.contains('hidden-by-type'));
    const current=visible.find(x=>x.classList.contains('selected'));
    if(current){selectedUserTemplate={template:current.dataset.userTemplate,type:current.dataset.userType,libraryId:current.dataset.userLibraryId};renderUserSizeOptions()}
    else selectedUserTemplate={template:'',type:selectedCalendarType,libraryId:null};
    updateWizardActions();
  };
  renderUserTemplateChoices();
})();


// v27 Academic Schedule Parser: Korean month/day text, year rollover and 12-month calendar window.
(function(){
  function pad2(n){return String(Number(n)).padStart(2,'0')}
  function iso(y,m,d){return `${Number(y)}-${pad2(m)}-${pad2(d)}`}
  function validDate(y,m,d){const x=new Date(Number(y),Number(m)-1,Number(d));return x.getFullYear()===Number(y)&&x.getMonth()===Number(m)-1&&x.getDate()===Number(d)}
  function calendarWindow(baseYear,startMonth){
    const start=new Date(Number(baseYear),Number(startMonth)-1,1);
    const end=new Date(Number(baseYear),Number(startMonth)-1+12,0);
    return {start:iso(start.getFullYear(),start.getMonth()+1,start.getDate()),end:iso(end.getFullYear(),end.getMonth()+1,end.getDate())};
  }
  function gradeInfo(raw){
    const map={'①':1,'②':2,'③':3};const grades=[];
    String(raw).replace(/[①②③]/g,ch=>{if(!grades.includes(map[ch]))grades.push(map[ch]);return ''});
    return {grades,title:String(raw).replace(/[①②③]/g,'').replace(/^[-•·]\s*/,'').trim()};
  }
  function cleanTitle(raw){
    let title=String(raw||'').trim(),memo='';
    const m=title.match(/\((\d{1,2})\s*[\/.]\s*(\d{1,2})\s*[~～-]\s*(?:(\d{1,2})\s*[\/.]\s*)?(\d{1,2})\)/);
    if(m){memo=m[0].slice(1,-1);title=title.replace(m[0],'').trim()}
    const g=gradeInfo(title);return {title:g.title,memo,grades:g.grades};
  }
  function splitTitles(raw){
    const value=String(raw||'').trim();if(!value)return [];
    // Commas and explicit numbered list markers are treated as separate same-day events.
    const commaParts=value.split(/\s*,\s*/).map(x=>x.trim()).filter(Boolean);
    return commaParts.flatMap(part=>/^[①②③]/.test(part)?part.split(/(?=[①②③])/).map(x=>x.trim()).filter(Boolean):[part]);
  }
  window.getAcademicCalendarWindow=calendarWindow;
  window.parseAcademicScheduleText=function(text,baseYear,startMonth){
    const source=String(text||'').replace(/\u00a0/g,' ').replace(/[：]/g,':');
    const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const windowRange=calendarWindow(baseYear,startMonth);
    const allEvents=[],warnings=[];let currentYear=Number(baseYear),currentMonth=null,previousMonth=null,lastDateSpec=null,idx=0;
    const pushEvent=(rawTitle,spec,lineNo)=>{
      for(const piece of splitTitles(rawTitle)){
        const c=cleanTitle(piece);if(!c.title)continue;
        const sy=spec.startYear,sm=spec.startMonth,sd=spec.startDay,ey=spec.endYear,em=spec.endMonth,ed=spec.endDay;
        if(!validDate(sy,sm,sd)||!validDate(ey,em,ed)){warnings.push(`${lineNo}행 날짜를 확인하세요: ${piece}`);continue}
        let startDate=iso(sy,sm,sd),endDate=iso(ey,em,ed);if(endDate<startDate){warnings.push(`${lineNo}행 종료일이 시작일보다 빠릅니다: ${piece}`);continue}
        allEvents.push({id:`import-${Date.now()}-${idx++}`,title:c.title,startDate,endDate,category:'school',source:'user-import',priority:70,range:startDate!==endDate,grades:c.grades,memo:c.memo,originalText:piece});
      }
    };
    lines.forEach((line,i)=>{
      const lineNo=i+1;
      // Explicit month header: "2028년 1월"
      let m=line.match(/^(\d{4})\s*년\s*(\d{1,2})\s*월(?:\s*일정)?\s*$/);
      if(m){currentYear=Number(m[1]);currentMonth=Number(m[2]);previousMonth=currentMonth;lastDateSpec=null;return}
      // Explicit year header, excluding period descriptions such as "2027년 3월부터..."
      m=line.match(/^#+?\s*(\d{4})\s*년(?:\s*일정)?\s*#*$/);
      if(m){currentYear=Number(m[1]);currentMonth=null;previousMonth=null;lastDateSpec=null;return}
      // Bare month header. When month order wraps (12 -> 1), advance year.
      m=line.match(/^(\d{1,2})\s*월\s*$/);
      if(m){const month=Number(m[1]);if(previousMonth!==null&&month<previousMonth)currentYear+=1;currentMonth=month;previousMonth=month;lastDateSpec=null;return}
      // Ignore title/period comment lines beginning with #.
      if(/^#/.test(line))return;
      if(!currentMonth){warnings.push(`${lineNo}행은 월 제목 뒤에 배치해야 합니다: ${line}`);return}
      // 9일-13일 / 18일- 21일 / 28(금) / 2월 27일-3월 3일 forms.
      m=line.match(/^(?:(\d{1,2})\s*월\s*)?(\d{1,2})(?:\s*일)?(?:\s*\([^)]*\))?\s*(?:[-~～]\s*(?:(\d{1,2})\s*월\s*)?(\d{1,2})(?:\s*일)?)?\s*:\s*(.*)$/);
      if(m){
        const sm=Number(m[1]||currentMonth),sd=Number(m[2]),em=Number(m[3]||sm),ed=Number(m[4]||sd);
        let sy=currentYear,ey=currentYear;if(sm<currentMonth-6)sy+=1;if(em<sm)ey=sy+1;else ey=sy;
        lastDateSpec={startYear:sy,startMonth:sm,startDay:sd,endYear:ey,endMonth:em,endDay:ed};
        if(m[5].trim())pushEvent(m[5],lastDateSpec,lineNo);return;
      }
      // Indented/continued lines become additional events on the previous date or range.
      if(lastDateSpec){pushEvent(line,lastDateSpec,lineNo);return}
      warnings.push(`${lineNo}행을 인식하지 못했습니다: ${line}`);
    });
    const included=allEvents.filter(e=>e.endDate>=windowRange.start&&e.startDate<=windowRange.end);
    const excluded=allEvents.filter(e=>e.endDate<windowRange.start||e.startDate>windowRange.end);
    return {events:included,allEvents,excluded,warnings,window:windowRange,stats:{recognized:allEvents.length,included:included.length,excluded:excluded.length}};
  };
  parseScheduleText=function(text,year,startMonth){return window.parseAcademicScheduleText(text,Number(year)||2027,Number(startMonth)||Number(el('userStartMonth')?.value)||1).events};

  function parserPreview(result){
    const s=result.stats,w=result.window;
    return `<strong>달력 적용 기간: ${w.start} ~ ${w.end}</strong><br>인식 ${s.recognized}개 · 달력 반영 ${s.included}개 · 기간 밖 제외 ${s.excluded}개`+
      (result.events.length?`<br><br>${result.events.slice(0,8).map(e=>`${e.startDate}${e.endDate!==e.startDate?` ~ ${e.endDate}`:''} · ${v21Escape(e.title)}`).join('<br>')}${result.events.length>8?`<br>외 ${result.events.length-8}개`:''}`:'')+
      (result.warnings.length?`<br><br><span style="color:#b54708">확인 필요 ${result.warnings.length}건</span>`:'');
  }
  registerScheduleFile=async function(file,target){
    const isSupported=/\.(xlsx|csv|txt)$/i.test(file.name);let events=[],result=null,rawText='',sourceInfo=null;
    const year=Number(el(target==='user'?'userYear':'resourceCalendarYear')?.value)||2027;
    const startMonth=Number(el(target==='user'?'userStartMonth':'resourceStartMonth')?.value)||1;
    if(isSupported){
      sourceInfo=await window.ACDLScheduleFileParser.extractText(file,year);
      rawText=sourceInfo.text;
      result=window.parseAcademicScheduleText(rawText,year,startMonth);
      events=result.events;
    }
    const payload={fileName:file.name,fileType:file.type||file.name.split('.').pop(),size:file.size,registeredAt:new Date().toISOString(),events,rawText,sourceInfo,parseResult:result,status:isSupported?'parsed':'unsupported'};
    if(target==='user'){
      window.userScheduleImport=payload;el('userScheduleFileName').textContent=file.name;el('userScheduleFileStatus').textContent=isSupported?`${events.length}개 일정을 달력 기간에 반영합니다.`:'지원하지 않는 파일 형식입니다.';const pv=el('userSchedulePreview');pv.classList.remove('hidden');pv.innerHTML=result?parserPreview(result):'파일 원본은 등록되었으며, 실제 서비스의 워드·엑셀 일정 변환 API와 연결됩니다.';
    }else{
      project.book.scheduleImport=payload;
      if(events.length){
        project.book.events=[...(project.book.events||[]).filter(e=>e.source!=='user-import'),...events];
        project.template.masters.calendar.rangeEventStyle ||= {enabled:true,contractId:'user-service-v1.1',contractRevision:'1.0.0',labelMode:'every',labelPosition:'inside',barHeight:14,laneGap:1,maxLanes:window.ACDLCalendarDomain.SCHEDULE_MAX_LANES,continuationStyle:'arrow',overflowStyle:'count'};
        project.template.masters.calendar.rangeEventStyle.enabled=true;
      }
      el('resourceScheduleFileName').textContent=file.name;el('resourceScheduleFileStatus').textContent=isSupported?`${events.length}개 샘플 일정을 달력 기간에 반영합니다.`:'지원하지 않는 파일 형식입니다.';const pv=el('resourceSchedulePreview');pv.classList.remove('hidden');pv.innerHTML=result?parserPreview(result):'템플릿에는 calendar.events 데이터 슬롯과 파일 메타데이터가 저장됩니다.';markDirty();render();
    }
  };

  // Direct text paste is useful for schedules copied from Word, HWP or email.
  const card=document.querySelector('#userScheduleInput')?.closest('.school-profile-section');
  if(card&&!el('userScheduleText')){
    const box=document.createElement('div');box.style.marginTop='12px';box.innerHTML=`<label style="display:block;font-size:10px;font-weight:700;margin-bottom:6px">텍스트 일정 붙여넣기</label><textarea id="userScheduleText" rows="9" placeholder="예:&#10;3월&#10;3일 : 개학식, 입학식&#10;9일-13일 : 학부모상담기간&#10;&#10;2028년 1월&#10;1일 : 신정" style="width:100%;box-sizing:border-box;border:1px solid #d7dce5;border-radius:8px;padding:10px;font:10px/1.55 sans-serif;resize:vertical"></textarea><div style="display:flex;justify-content:flex-end;margin-top:7px"><button id="parseUserScheduleTextBtn" type="button" style="height:30px;border:1px solid #d7dce5;border-radius:7px;background:#fff;padding:0 12px;font-size:9px">텍스트 일정 분석</button></div>`;card.appendChild(box);
    el('parseUserScheduleTextBtn').onclick=()=>{const rawText=el('userScheduleText').value;const result=window.parseAcademicScheduleText(rawText,Number(el('userYear').value),Number(el('userStartMonth').value));window.userScheduleImport={fileName:'붙여넣은 텍스트 일정',fileType:'text/plain',size:new Blob([rawText]).size,registeredAt:new Date().toISOString(),events:result.events,rawText,parseResult:result,status:'parsed'};el('userScheduleFileName').textContent='붙여넣은 텍스트 일정';el('userScheduleFileStatus').textContent=`${result.events.length}개 일정을 달력 기간에 반영합니다.`;el('userSchedulePreview').classList.remove('hidden');el('userSchedulePreview').innerHTML=parserPreview(result)};
  }

  // Reparse against the final year/start-month selection before calendar creation.
  const previousApplyUserSchoolData=applyUserSchoolData;
  applyUserSchoolData=function(){
    const imp=window.userScheduleImport;
    if(imp?.rawText){const result=window.parseAcademicScheduleText(imp.rawText,Number(el('userYear').value),Number(el('userStartMonth').value));imp.events=result.events;imp.parseResult=result}
    previousApplyUserSchoolData();
    if(project?.book){const win=calendarWindow(Number(project.settings?.year||el('userYear').value),Number(project.settings?.startMonth||el('userStartMonth').value));project.book.calendarWindow=win;project.book.events=(project.book.events||[]).filter(e=>e.source!=='user-import').concat(imp?.events||[])}
  };
})();


// v28: reliable library handoff, reusable template background assets, and month-clipped range lanes.
(function(){
  function clone(v){return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}
  function ensureBackgroundResources(){
    if(!project)return [];
    project.template ||= {}; project.template.resources ||= {}; project.template.resources.backgroundAssets ||= [];
    return project.template.resources.backgroundAssets;
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function projectStats(prj){
    const pages=prj?.book?.pageInstances||[], pageElements=Object.values(prj?.book?.elementsByPage||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0), masterElements=Object.values(prj?.template?.masterElements||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
    return {pages:pages.length,pageElements,masterElements,backgrounds:prj?.template?.resources?.backgroundAssets?.length||0};
  }

  // Keep the library id whenever calendar type filtering chooses a card.
  applyCalendarType=function(type){
    selectedCalendarType=type;
    document.querySelectorAll('[data-calendar-type]').forEach(x=>{const selected=x.dataset.calendarType===type;x.classList.toggle('selected',selected);x.setAttribute('aria-pressed',String(selected))});
    const cards=[...document.querySelectorAll('#userTemplateChoiceGrid [data-user-template]')];
    cards.forEach(x=>x.classList.toggle('hidden-by-type',x.dataset.userType!==type));
    cards.forEach(x=>x.classList.remove('selected'));
    selectedUserTemplate={template:'',type,libraryId:null};
    el('selectedTypeLabel').textContent={desk:'탁상형',wall:'벽걸이형',poster:'연간 포스터형'}[type]||type;
    renderUserSizeOptions();
    updateWizardActions();
  };

  function syncDates(prj,year,startMonth){
    const pages=prj.book?.pageInstances||[], fronts=pages.filter(page=>page.role==='monthly-front'), backs=pages.filter(page=>page.role==='monthly-back');
    fronts.forEach((page,index)=>{const d=new Date(year,startMonth-1+index,1);page.calendarYear=d.getFullYear();page.calendarMonth=d.getMonth()+1;page.monthKey=`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`;page.pairId=`month-pair.${page.monthKey}`});
    backs.forEach((page,index)=>{const front=fronts[index];if(front){page.calendarYear=front.calendarYear;page.calendarMonth=front.calendarMonth;page.monthKey=front.monthKey;page.pairId=front.pairId}});
    pages.filter(page=>page.role==='poster-annual').forEach(page=>{page.calendarYear=year;page.calendarMonth=1});
  }

  async function createCalendarV28(){
    resetEditorViewState();
    const opts={type:selectedUserTemplate.type,year:Number(el('userYear').value),startMonth:Number(el('userStartMonth').value),template:selectedUserTemplate.template,calendarRows:Number(el('userCalendarRows').value),weekStart:el('userWeekStart').value,showAdjacentMiniCalendars:el('userAdjacentMini').checked,sizePresetId:el('userSize').value};
    let stored=null;
    if(selectedUserTemplate.libraryId){
      stored=await loadTemplateProjectData(selectedUserTemplate.libraryId);
      if(!stored)throw new Error('선택한 라이브러리 템플릿의 전체 편집 데이터를 찾지 못했습니다. 기본 템플릿으로 대체하지 않습니다.');
      const before=projectStats(stored);
      if(!before.pages)throw new Error('저장된 템플릿에 페이지 데이터가 없습니다. 디자이너 라이브러리에서 다시 저장해 주세요.');
      project=clone(stored);
      project.template ||= {}; project.template.loadAudit={loadedAt:new Date().toISOString(),sourceTemplateId:selectedUserTemplate.libraryId,sourceStats:before};
    }else project=makeProject({...opts,frontInsertCount:Number(el('userFrontInserts').value),rearInsertCount:Number(el('userRearInserts').value),posterColumns:4});
    project.mode='calendar-workspace'; project.settings ||= {};
    Object.assign(project.settings,{year:opts.year,startMonth:opts.startMonth,calendarRows:opts.calendarRows,weekStart:opts.weekStart,showAdjacentMiniCalendars:opts.showAdjacentMiniCalendars,sizePresetId:opts.sizePresetId,type:opts.type});
    project.template ||= {}; project.template.sourceTemplateId=selectedUserTemplate.libraryId||null;
    syncDates(project,opts.year,opts.startMonth);
    applyUserSchoolData();
    const after=projectStats(project), before=project.template.loadAudit?.sourceStats;
    if(before&&(after.pages!==before.pages||after.pageElements!==before.pageElements||after.masterElements!==before.masterElements))throw new Error(`템플릿 복제 검증 실패: 페이지 ${before.pages}→${after.pages}, 페이지 개체 ${before.pageElements}→${after.pageElements}, Master 개체 ${before.masterElements}→${after.masterElements}`);
    selectedPageId=project.book.pageInstances[0]?.id||null;selectedElementId=null;selectedElementScope=null;history=[];future=[];
    el('userSetup').classList.add('hidden');el('appBrand').childNodes[0].nodeValue='ACDL 사용자 달력 에디터 ';el('currentTemplateTitle').textContent=`${project.book.school.name} ${project.settings.year} 달력`;el('newBtn').textContent='새 달력';el('saveBtn').textContent='달력 저장';el('templateMode').textContent='달력 편집';el('modeHelp').textContent='학교 정보와 월별 콘텐츠를 입력하고, 템플릿이 허용한 영역을 편집합니다.';
    stable();render();updateRoleIndicator();showEditorToast(selectedUserTemplate.libraryId?`라이브러리 템플릿 전체를 적용했습니다. 페이지 ${after.pages}, 개체 ${after.pageElements+after.masterElements}개`:'기본 템플릿으로 달력을 만들었습니다.');
  }
  el('userCreateBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();createCalendarV28().catch(err=>{console.error(err);alert(`달력 생성 실패: ${err.message||err}`)})},true);

  function addBackgroundObject(asset,scope){
    const arr=scope==='master'?masterElements():pageElements();
    const item={id:`template.background.${Date.now()}.${Math.random().toString(36).slice(2)}`,type:'image',role:'template-background',backgroundAssetId:asset.id,src:asset.image,alt:asset.name,x:0,y:0,width:100,height:100,zIndex:0,fit:'cover',opacity:1};
    snapshot();arr.push(item);selectedElementId=item.id;selectedElementScope=scope;markDirty();render();showEditorToast(`${asset.name}을 ${scope==='master'?'Master':'현재 페이지'} 배경 개체로 추가했습니다. 크기 조절점과 Inspector를 사용할 수 있습니다.`)
  }
  function renderBackgroundManager(){
    const grid=el('backgroundAssetManagerGrid');if(!grid||!project)return;const assets=ensureBackgroundResources();
    grid.innerHTML=assets.length?assets.map(a=>`<article class="background-asset-card"><img src="${a.image}" alt="${esc(a.name)}"><div class="body"><strong>${esc(a.name)}</strong><small>${esc(a.usage||'표지·간지·월력 뒷면 등')}</small><div class="background-asset-actions"><button class="primary" data-add-bg="${a.id}">개체로 추가</button><button data-del-bg="${a.id}">삭제</button></div></div></article>`).join(''):'<div class="resource-empty">등록된 배경 이미지가 없습니다.</div>';
    grid.querySelectorAll('[data-add-bg]').forEach(b=>b.onclick=()=>{const a=assets.find(x=>x.id===b.dataset.addBg);if(a){addBackgroundObject(a,el('elementScope').value);closeResourceModal()}});
    grid.querySelectorAll('[data-del-bg]').forEach(b=>b.onclick=()=>{if(!confirm('이 배경 이미지를 삭제할까요? 이미 배치한 개체는 유지됩니다.'))return;snapshot();project.template.resources.backgroundAssets=assets.filter(x=>x.id!==b.dataset.delBg);markDirty();renderBackgroundManager();renderBackgroundDrawer()});
  }
  function renderBackgroundDrawer(){
    const section=el('templateBackgroundSection'),grid=el('templateBackgroundGrid');if(!section||!grid||!project)return;const assets=ensureBackgroundResources();section.classList.toggle('hidden',!assets.length);
    grid.innerHTML=assets.map(a=>`<button type="button" class="registered-asset-card" data-drawer-bg="${a.id}"><img src="${a.image}" alt="${esc(a.name)}"><strong>${esc(a.name)}</strong><span>템플릿 배경 이미지</span></button>`).join('');
    grid.querySelectorAll('[data-drawer-bg]').forEach(b=>b.onclick=()=>{const a=assets.find(x=>x.id===b.dataset.drawerBg);if(a){addBackgroundObject(a,el('elementScope').value);el('objectDrawer').classList.add('hidden')}})
  }
  const schoolPage=document.querySelector('[data-resource-content="school"]');
  if(schoolPage&&!el('backgroundAssetManagerGrid')){
    const scheduleCard=schoolPage.querySelector('.settings-card:last-of-type');
    const card=document.createElement('div');card.className='settings-card';card.innerHTML=`<h4>템플릿 배경 이미지</h4><p class="resource-description">표지 뒷면, 월력 뒷면, 간지 등에 사용할 완성된 배경 이미지를 여러 개 등록합니다. 등록 후 현재 페이지 또는 선택한 Master에 추가하고 화면에서 위치와 크기를 조절할 수 있습니다.</p><div class="settings-grid"><label>배경 이름<input id="backgroundAssetName" placeholder="예: 3월 월력 뒷면 패턴"></label><label>추천 용도<input id="backgroundAssetUsage" placeholder="예: 월력 뒷면 / 표지 뒷면"></label></div><div class="resource-actions"><button id="registerBackgroundAssetBtn" class="save" type="button">배경 이미지 등록</button></div><input id="backgroundAssetInput" class="hidden" type="file" accept="image/*" multiple><div id="backgroundAssetManagerGrid" class="background-asset-grid"></div>`;
    schoolPage.insertBefore(card,scheduleCard);
    el('registerBackgroundAssetBtn').onclick=()=>el('backgroundAssetInput').click();
    el('backgroundAssetInput').onchange=async e=>{const files=[...e.target.files];e.target.value='';for(const file of files){const image=await compressImageFile(file);ensureBackgroundResources().push({id:`background.${Date.now()}.${Math.random().toString(36).slice(2)}`,name:el('backgroundAssetName').value.trim()||file.name,usage:el('backgroundAssetUsage').value.trim(),image,fileName:file.name,mimeType:file.type})}markDirty();renderBackgroundManager();renderBackgroundDrawer();showEditorToast(`${files.length}개의 배경 이미지를 등록했습니다.`)};
  }
  const registered=el('registeredAssetSection');
  if(registered&&!el('templateBackgroundSection')){const sec=document.createElement('section');sec.id='templateBackgroundSection';sec.className='object-section template-background-section hidden';sec.dataset.librarySection='basic';sec.innerHTML='<h3>템플릿 배경 이미지</h3><p class="resource-description">현재 페이지 또는 선택한 Master에 배경 개체로 추가합니다.</p><div id="templateBackgroundGrid" class="registered-asset-grid"></div>';registered.after(sec)}
  const calendarSection=el('calendarObjectSection'),backgroundSection=el('templateBackgroundSection');
  if(calendarSection){(backgroundSection||registered)?.after(calendarSection)}
  const oldOpen=el('openObjectDrawerBtn')?.onclick;
  el('openObjectDrawerBtn')?.addEventListener('click',()=>setTimeout(renderBackgroundDrawer,0));
  const oldSwitch=switchResourcePage;switchResourcePage=function(page){oldSwitch(page);if(page==='school')renderBackgroundManager()};
  const oldRenderV28=typeof window.render==='function'?window.render:render; if(typeof oldRenderV28==='function')render=function(){oldRenderV28();renderBackgroundDrawer()};
  renderBackgroundManager();renderBackgroundDrawer();

  // Range segments are clipped to the visible calendar month, never to adjacent-month cells.
  buildRangeSegments=function(grid){
    const p=selectedPage(),year=Number(p?.calendarYear),month=Number(p?.calendarMonth),rows=Math.ceil(grid.length/7),byDate=new Map(grid.map((d,i)=>[d.date,i])),segments=[];
    const monthStart=new Date(year,month-1,1),monthEnd=new Date(year,month,0);
    rangeEventsForGrid(grid).forEach(ev=>{
      const originalStart=dateFromISO(ev.startDate),originalEnd=dateFromISO(ev.endDate||ev.startDate),visibleStart=new Date(Math.max(originalStart,monthStart)),visibleEnd=new Date(Math.min(originalEnd,monthEnd));
      if(visibleStart>visibleEnd)return;
      for(let week=0;week<rows;week++){
        const weekStart=dateFromISO(grid[week*7].date),weekEnd=dateFromISO(grid[Math.min(week*7+6,grid.length-1)].date),segmentStart=new Date(Math.max(visibleStart,weekStart)),segmentEnd=new Date(Math.min(visibleEnd,weekEnd));
        if(segmentStart>segmentEnd)continue;const si=byDate.get(isoDate(segmentStart)),ei=byDate.get(isoDate(segmentEnd));if(si===undefined||ei===undefined)continue;
        segments.push({event:ev,week,startColumn:si%7,endColumn:ei%7,continuesBefore:originalStart<segmentStart,continuesAfter:originalEnd>segmentEnd,isFirstVisible:isoDate(segmentStart)===ev.startDate||isoDate(segmentStart)===isoDate(visibleStart),segmentStart:isoDate(segmentStart),duration:(originalEnd-originalStart)/86400000+1})
      }
    });return segments
  };
  assignRangeLanes=function(grid){
    const p=selectedPage(),weekStart=project.settings.weekStart==="monday"?"monday":"sunday",rows=Math.max(1,Math.ceil(grid.length/7));
    const displayEvents=window.ACDLCalendarDomain.assignCalendarScheduleColors((project.book.events||[]).filter(event=>!isPublicReferenceEvent(event)));
    const layout=window.ACDLCalendarDomain.buildCalendarScheduleLanes(
      Number(p?.calendarYear),
      Number(p?.calendarMonth),
      displayEvents,
      weekStart,
      rows
    );
    const eventsById=new Map(displayEvents.map(event=>[event.id,event]));
    return {
      segments:layout.segments.map(segment=>({
        ...segment,
        event:eventsById.get(segment.eventId),
        week:segment.row,
        startColumn:segment.startCol,
        endColumn:segment.startCol+segment.span-1
      })).filter(segment=>segment.event),
      hiddenByDate:layout.hiddenByDate,
      maxLanes:layout.maxLanes
    }
  };
  renderRangeEventLayer=function(grid,rows){
    const style=project.template.masters.calendar.rangeEventStyle;
    const hasSampleSchedule=Boolean(project.book.scheduleImport?.events?.length);
    if(!style || (style.enabled===false && !hasSampleSchedule))return '';
    const layout=assignRangeLanes(grid),rowHeight=100/rows,gap=Number(style.laneGap||1);
    const pageHeight=el("page")?.clientHeight||700,region=calendarRegion(),vertical=calendarVerticalLayout(),design=project.template.masters.calendar.design||{},presentation=vertical.preset?.presentation||design,chrome=calendarChromeLayout(presentation,vertical,region);
    const regionHeight=Math.max(1,pageHeight*(region.height/100));
    const titleHeight=regionHeight*vertical.title/100,stageHeight=Math.max(1,regionHeight-titleHeight);
    const weekdayHeight=stageHeight*chrome.weekdayStage/100;
    const cellHeight=Math.max(1,(stageHeight-weekdayHeight)/rows),reservedTop=32;
    const requestedHeight=Number(style.barHeight||14);
    const fittedHeight=Math.max(1,Math.floor((cellHeight-reservedTop-Math.max(0,layout.maxLanes-1)*gap)/Math.max(1,layout.maxLanes)));
    const barHeight=Math.min(requestedHeight,fittedHeight),activeGridStyle=calendarVerticalLayout().preset?.presentation?.gridStyle||project.template.masters.calendar.design?.gridStyle,detachedCards=activeGridStyle==='detached-cards';let html='<div class="range-event-layer">';
    layout.segments.forEach(seg=>{
      const left=seg.startColumn/7*100,width=(seg.endColumn-seg.startColumn+1)/7*100,classes=['range-event-bar',detachedCards?'detached-cell-range':'',style.labelPosition==='above'?'label-above':''].filter(Boolean).join(' '),color=eventColor(seg.event),bottomPx=3+(seg.lane+1)*(barHeight+gap)-gap,typography=window.ACDLCalendarDomain.calendarScheduleTypography(seg.title,seg.span),span=Math.max(1,seg.span||seg.endColumn-seg.startColumn+1),stops=Array.from({length:span},(_,i)=>`${color} ${i/span*100}% calc(${(i+1)/span*100}% - 3px),transparent calc(${(i+1)/span*100}% - 3px) ${(i+1)/span*100}%`).join(','),background=detachedCards&&span>1?`linear-gradient(90deg,${stops})`:color;
      html+=`<div class="${classes}" title="${escapeAttr(seg.event.title)} · ${seg.event.startDate} ~ ${seg.event.endDate}" style="left:calc(${left}% + 2px);width:calc(${width}% - 4px);top:calc(${(seg.week+1)*rowHeight}% - ${bottomPx}px);height:${barHeight}px;background:${background};font-size:${typography.fontPx}px;-webkit-line-clamp:${typography.maxLines}">${seg.title}</div>`
    });
    return html+'</div>'
  };
})();



/* ================= v29 GRAPHICS LIBRARY ================= */
const SHAPE_LIBRARY=[
 {id:"rect",name:"사각형"},{id:"rounded",name:"둥근 사각형"},{id:"circle",name:"원"},{id:"ellipse",name:"타원"},{id:"triangle",name:"삼각형"},{id:"diamond",name:"마름모"},{id:"pentagon",name:"오각형"},{id:"hexagon",name:"육각형"},{id:"octagon",name:"팔각형"},{id:"star",name:"별"},{id:"heart",name:"하트"},{id:"cross",name:"십자"},{id:"speech",name:"말풍선"},{id:"ribbon",name:"리본"},{id:"cloud",name:"구름"},{id:"arch",name:"아치"}
];
const FRAME_LIBRARY=[{id:"rect",name:"사각 사진"},{id:"rounded",name:"둥근 사진"},{id:"circle",name:"원형 사진"},{id:"ellipse",name:"타원 사진"},{id:"arch",name:"아치 사진"},{id:"hexagon",name:"육각 사진"},{id:"star",name:"별 사진"},{id:"heart",name:"하트 사진"}];
const VECTOR_LIBRARY=[
 {id:"school-building",name:"학교 건물",category:"school",icon:"🏫"},{id:"book-open",name:"펼친 책",category:"school",icon:"📖"},{id:"pencil",name:"연필",category:"school",icon:"✎"},{id:"ruler",name:"자",category:"school",icon:"📏"},{id:"globe",name:"지구본",category:"school",icon:"🌐"},{id:"board",name:"칠판",category:"school",icon:"▰"},{id:"graduation-cap",name:"졸업모",category:"school",icon:"🎓"},{id:"school-bell",name:"학교 종",category:"school",icon:"🔔"},{id:"backpack",name:"책가방",category:"school",icon:"🎒"},{id:"school-bus",name:"스쿨버스",category:"school",icon:"🚌"},{id:"microscope",name:"현미경",category:"school",icon:"🔬"},{id:"flask",name:"플라스크",category:"school",icon:"⚗"},
 {id:"cherry-blossom",name:"벚꽃",category:"season",icon:"✿"},{id:"sprout",name:"새싹",category:"season",icon:"🌱"},{id:"leaf",name:"나뭇잎",category:"season",icon:"🍃"},{id:"sun",name:"여름 해",category:"season",icon:"☀"},{id:"cloud",name:"구름",category:"season",icon:"☁"},{id:"rain",name:"빗방울",category:"season",icon:"💧"},{id:"maple",name:"단풍",category:"season",icon:"🍁"},{id:"snow",name:"눈송이",category:"season",icon:"❄"},
 {id:"entrance",name:"입학식",category:"event",icon:"🎒"},{id:"graduation",name:"졸업식",category:"event",icon:"🎓"},{id:"sports",name:"운동회",category:"event",icon:"🏃"},{id:"festival",name:"학교 축제",category:"event",icon:"🎉"},{id:"field-trip",name:"체험학습",category:"event",icon:"🚌"},{id:"exam",name:"시험",category:"event",icon:"📝"},{id:"vacation",name:"방학",category:"event",icon:"🏖"},{id:"counsel",name:"상담",category:"event",icon:"💬"},
 {id:"laurel",name:"월계수",category:"decoration",icon:"❧"},{id:"badge",name:"배지",category:"decoration",icon:"⬟"},{id:"corner",name:"코너 장식",category:"decoration",icon:"⌜"},{id:"wave",name:"물결 장식",category:"decoration",icon:"〰"}
];
const VECTOR_CATEGORY_LABELS={all:"전체",school:"학교·교육",season:"계절·자연",event:"학교 행사",decoration:"장식"};
function shapePath(id){
 const paths={triangle:"M50 4 L96 94 H4 Z",diamond:"M50 3 L97 50 L50 97 L3 50 Z",pentagon:"M50 3 L97 38 L79 94 H21 L3 38 Z",hexagon:"M25 4 H75 L98 50 L75 96 H25 L2 50 Z",octagon:"M30 3 H70 L97 30 V70 L70 97 H30 L3 70 V30 Z",star:"M50 2 L61 36 L97 36 L68 57 L79 94 L50 72 L21 94 L32 57 L3 36 L39 36 Z",heart:"M50 92 C15 68 0 48 5 25 C10 2 38 0 50 20 C62 0 90 2 95 25 C100 48 85 68 50 92 Z",cross:"M35 4 H65 V35 H96 V65 H65 V96 H35 V65 H4 V35 H35 Z",speech:"M7 8 H93 V72 H55 L35 94 L39 72 H7 Z",ribbon:"M5 18 H95 L82 50 L95 82 H5 L18 50 Z",cloud:"M20 78 C1 75 0 50 18 45 C13 20 43 10 57 28 C78 15 96 32 91 52 C106 66 91 83 72 78 Z",arch:"M7 96 V48 C7 18 28 3 50 3 C72 3 93 18 93 48 V96 Z"};return paths[id]||"";
}
function shapeSVG(id,fill="#4777bd",stroke="#172033",strokeWidth=1.5,dash="solid"){
 const open=`<svg viewBox="0 0 100 100" preserveAspectRatio="none">`;
 const dashAttr=dash==="dashed"?' stroke-dasharray="6 4"':'';
 if(id==="rect")return `${open}<rect x="0" y="0" width="100" height="100" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} vector-effect="non-scaling-stroke"/></svg>`;
 if(id==="rounded")return `${open}<rect x="1" y="1" width="98" height="98" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} vector-effect="non-scaling-stroke"/></svg>`;
 if(id==="circle")return `${open}<circle cx="50" cy="50" r="49" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} vector-effect="non-scaling-stroke"/></svg>`;
 if(id==="ellipse")return `${open}<ellipse cx="50" cy="50" rx="49" ry="49" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} vector-effect="non-scaling-stroke"/></svg>`;
 return `${open}<path d="${shapePath(id)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function vectorSVG(asset,colors={primary:"#4777bd",secondary:"#f4b740"}){
 const glyph=asset.icon||"✦";return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="${asset.name}"><circle cx="50" cy="50" r="44" fill="${colors.secondary}" opacity=".22"/><path d="M50 5 L58 35 L90 35 L64 54 L74 86 L50 67 L26 86 L36 54 L10 35 L42 35 Z" fill="${colors.primary}" opacity=".12"/><text x="50" y="61" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" fill="${colors.primary}">${glyph}</text></svg>`
}
function ensureGraphicsResources(){ensureTemplateResources();const r=project.template.resources;r.graphicsLibrary ||= {version:1,vectorAssetIds:VECTOR_LIBRARY.map(x=>x.id),customVectors:[]}}
function createGraphicElement(kind,id){
 const scope=el("elementScope").value,arr=scope==="master"?masterElements():pageElements(),placed=findSemanticPlacement({x:18,y:20,width:kind==="vector"?18:24,height:kind==="vector"?18:24},arr);
 let item={id:`element.${kind}.${Date.now()}`,type:kind,x:placed.x,y:placed.y,width:placed.width,height:placed.height,zIndex:maxZ(scope)+1,rotation:0,opacity:1,permissions:{move:true,resize:true,rotate:true,color:true,replaceImage:true,delete:true}};
 if(kind==="shape")Object.assign(item,{shapeType:id,style:{fill:"#4777bd",stroke:"#172033",strokeWidth:1.5}});
 if(kind==="vector")Object.assign(item,{assetId:id,colors:{primary:"#4777bd",secondary:"#f4b740"},flipX:false,flipY:false});
 if(kind==="image-frame")Object.assign(item,{frameType:id,image:{src:"",fit:"cover",scale:1,offsetX:0,offsetY:0,flipX:false,flipY:false,binding:""},style:{stroke:"#ffffff",strokeWidth:3,background:"#eef2f7"}});
 snapshot();arr.push(item);selectedElementId=item.id;selectedElementScope=scope;el("objectDrawer").classList.add("hidden");render();showEditorToast(`${kind==="shape"?"도형":kind==="vector"?"벡터":"사진 프레임"}을 추가했습니다.`)
}
function renderGraphicsLibraries(){
 const sg=el("shapeLibraryGrid"),fg=el("frameLibraryGrid"),vg=el("vectorLibraryGrid"),cr=el("vectorCategoryRow");if(!sg)return;
 sg.innerHTML=SHAPE_LIBRARY.map(a=>`<button class="object-card library-thumb-card" data-shape-add="${a.id}" data-search="${a.name}">${shapeSVG(a.id,"#d9e7f7","#4777bd",2)}<span class="vector-name">${a.name}</span><span class="vector-kind">도형</span></button>`).join("");
 fg.innerHTML=FRAME_LIBRARY.map(a=>`<button class="object-card library-thumb-card" data-frame-add="${a.id}" data-search="${a.name}"><div class="frame-shell frame-${a.id}" style="width:46px;height:46px;margin:0 auto 5px"><div class="frame-placeholder">사진</div><span class="frame-outline"></span></div><span class="vector-name">${a.name}</span><span class="vector-kind">이미지 마스크</span></button>`).join("");
 cr.innerHTML=Object.entries(VECTOR_CATEGORY_LABELS).map(([id,n])=>`<button class="${id==="all"?"active":""}" data-vector-category="${id}">${n}</button>`).join("");
 renderVectorCards("all");
 sg.querySelectorAll("[data-shape-add]").forEach(b=>b.onclick=()=>createGraphicElement("shape",b.dataset.shapeAdd));fg.querySelectorAll("[data-frame-add]").forEach(b=>b.onclick=()=>createGraphicElement("image-frame",b.dataset.frameAdd));cr.querySelectorAll("[data-vector-category]").forEach(b=>b.onclick=()=>{cr.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderVectorCards(b.dataset.vectorCategory)});
}
function renderVectorCards(category="all"){
 const vg=el("vectorLibraryGrid");if(!vg)return;const q=(el("objectLibrarySearch")?.value||"").trim().toLowerCase();const list=VECTOR_LIBRARY.filter(a=>(category==="all"||a.category===category)&&(!q||`${a.name} ${a.id}`.toLowerCase().includes(q)));vg.innerHTML=list.map(a=>`<button class="object-card library-thumb-card" data-vector-add="${a.id}" data-search="${a.name} ${a.id}">${vectorSVG(a)}<span class="vector-name">${a.name}</span><span class="vector-kind">${VECTOR_CATEGORY_LABELS[a.category]}</span></button>`).join("");vg.querySelectorAll("[data-vector-add]").forEach(b=>b.onclick=()=>createGraphicElement("vector",b.dataset.vectorAdd));
}
function switchObjectLibrary(tab="all"){
 document.querySelectorAll("[data-library-tab]").forEach(b=>b.classList.toggle("active",b.dataset.libraryTab===tab));document.querySelectorAll("[data-library-section]").forEach(sec=>sec.classList.toggle("library-filter-hidden",tab!=="all"&&sec.dataset.librarySection!==tab&&(tab!=="basic"||sec.dataset.librarySection!=="basic")));el("objectDrawer").classList.remove("hidden");
}
function graphicMarkup(view){
 const shadow=(style={})=>style.shadow?`drop-shadow(${style.shadowX||0}px ${style.shadowY||0}px ${style.shadowBlur||0}px ${style.shadowColor||"#000"})`:"none";
 if(view.type==="shape")return `<div class="free-shape" style="opacity:${view.opacity??1};transform:rotate(${view.rotation||0}deg);filter:${shadow(view.style)}">${shapeSVG(view.shapeType,view.style?.fill||"#4777bd",view.style?.stroke||"#172033",view.style?.strokeWidth||1.5,view.style?.dash)}</div>`;
 if(view.type==="vector"){const a=VECTOR_LIBRARY.find(x=>x.id===view.assetId)||{name:view.assetId,icon:"✦"};return `<div class="free-vector" style="opacity:${view.opacity??1};transform:rotate(${view.rotation||0}deg) scale(${view.flipX?-1:1},${view.flipY?-1:1});filter:${view.shadow?`drop-shadow(0 2px ${view.shadowBlur||0}px ${view.shadowColor||"#000"})`:"none"}">${vectorSVG(a,view.colors)}</div>`}
 if(view.type==="image-frame"){const im=view.image||{},cls=`frame-shell frame-${view.frameType||"rect"} ${im.src?"":"empty-frame"}`,transform=`translate(${im.offsetX||0}%,${im.offsetY||0}%) scale(${im.scale||1}) scaleX(${im.flipX?-1:1}) scaleY(${im.flipY?-1:1})`,filter=`brightness(${im.brightness??100}%) contrast(${im.contrast??100}%) saturate(${im.saturation??100}%)`;return `<div class="${cls}" style="background:${view.style?.background||"#eef2f7"};--frame-border:${view.style?.stroke||"#fff"};--frame-border-width:${view.style?.strokeWidth||3}px;opacity:${view.opacity??1};transform:rotate(${view.rotation||0}deg);filter:${shadow(view.style)}">${im.src?`<img src="${im.src}" style="object-fit:${im.fit||"cover"};transform:${transform};filter:${filter}">`:`<div class="frame-placeholder non-output editor-only">이미지를 선택하세요</div>`}<span class="frame-outline"></span></div>`}
 return "";
}
const v28RenderFreeElements=renderFreeElements;
renderFreeElements=function(pageNode){
 let backgroundLayer=document.createElement("div");backgroundLayer.className="ai-background-layer";let layer=document.createElement("div");layer.className="free-layer";
 allVisibleElements().forEach(view=>{
  const box=document.createElement("div");box.className=`free-element ${view._scope==="master"?"master-element":""} ${view.id===selectedElementId&&view._scope===selectedElementScope?"active":""}`;box.dataset.elementId=view.id;box.dataset.scope=view._scope;box.dataset.elementType=view.type;box.dataset.elementRole=view.role||"";box.style.left=view.x+"%";box.style.top=view.y+"%";box.style.width=view.width+"%";box.style.height=view.height+"%";box.style.zIndex=view.zIndex||1;
  if(["shape","vector","image-frame"].includes(view.type))box.innerHTML=graphicMarkup(view);
  else if(["mini-calendar","mini-calendar-prev","mini-calendar-next","year-calendar","memo","monthly-schedule","event-list","month-date-strip","monthly-quote"].includes(view.type))box.innerHTML=renderWidgetContent(view,selectedPage());
  else if(view.type==="semantic-object"){box.innerHTML=renderSemanticObject(view);const badge=document.createElement("span");badge.className=`semantic-role-badge non-output editor-only ${view.bindingEnabled===false?"binding-off":""}`;badge.textContent=`${semanticRoleLabel(view.role)} · ${view.bindingEnabled===false?"고정":"연결"}`;box.appendChild(badge)}
  else if(view.type==="text"){const t=document.createElement("div");t.className="free-text";t.textContent=resolveTextContent(view,selectedPage());applyTextElementStyles(t,view);box.appendChild(t)}
  else if(resolveElementImageSource(view)){const img=document.createElement("img"),s=view.imageStyle||{};img.className="free-image";img.src=resolveElementImageSource(view);img.alt=view.alt||"사용자 이미지";img.style.objectFit=view.fit||"cover";img.style.opacity=view.opacity??1;img.style.filter=`brightness(${s.brightness??100}%) contrast(${s.contrast??100}%) saturate(${s.saturation??100}%)`;img.style.transform=`scaleX(${s.flipX?-1:1}) scaleY(${s.flipY?-1:1})`;box.appendChild(img)}else{const empty=document.createElement("div");empty.className="free-image empty";empty.textContent="이미지를 선택하세요";box.appendChild(empty)}
  if(view.id===selectedElementId&&view._scope===selectedElementScope&&!preview){const lab=document.createElement("span");lab.className="elem-label";lab.textContent=view._scope==="master"?"MASTER":"PAGE";box.appendChild(lab);["e","s","se"].forEach(pos=>{const h=document.createElement("span");h.className="elem-handle "+pos;h.dataset.handle=pos;box.appendChild(h)})}
  if(view.role!=="ai-design-background")box.addEventListener("pointerdown",startElementPointer);if(view.type==="image-frame")box.addEventListener("dblclick",e=>{e.stopPropagation();pendingImageElementId=view.id;pendingImageElementScope=view._scope;el("frameImageInput").value="";el("frameImageInput").click()});(view.role==="ai-design-background"?backgroundLayer:layer).appendChild(box)
 });if(backgroundLayer.childElementCount)pageNode.appendChild(backgroundLayer);pageNode.appendChild(layer)
};
function permissionHTML(item){const p=item.permissions||{};return `<div class="section element-inspector"><div class="inspector-group"><div class="inspector-group-title"><span>사용자 편집 권한</span><small>Designer only</small></div><div class="permission-grid">${[["move","이동"],["resize","크기"],["rotate","회전"],["color","색상"],["replaceImage","이미지 교체"],["delete","삭제"]].map(([k,n])=>`<label><input type="checkbox" data-permission="${k}" ${p[k]!==false?"checked":""}>${n} 허용</label>`).join("")}</div><button id="applyGraphicPermissions" class="action">권한 저장</button></div></div>`}
function graphicShadowFields(style={}){return `<div class="grid2"><label>그림자<select id="graphicShadow"><option value="false" ${!style.shadow?"selected":""}>없음</option><option value="true" ${style.shadow?"selected":""}>표시</option></select></label><label>흐림<input id="graphicShadowBlur" type="number" min="0" max="50" value="${style.shadowBlur||0}"></label><label>가로 이동<input id="graphicShadowX" type="number" min="-50" max="50" value="${style.shadowX||0}"></label><label>세로 이동<input id="graphicShadowY" type="number" min="-50" max="50" value="${style.shadowY||0}"></label></div><label class="vector-color-swatch"><input id="graphicShadowColor" type="color" value="${style.shadowColor||"#000000"}"><span>그림자 색</span></label>`}
const v28ElementInspectorPanels=elementInspectorPanels;
elementInspectorPanels=function(){
 const item=sourceElement();if(!item||!["shape","vector","image-frame"].includes(item.type))return v28ElementInspectorPanels();const head=`<div class="section element-inspector"><span class="layer-chip">${selectedElementScope==="master"?"Master 공통 요소":"현재 페이지 요소"} · ${item.type==="shape"?"도형":item.type==="vector"?"벡터 일러스트":"사진 프레임"}</span>`;let content="",design="",data="";
 if(item.type==="shape"){content=head+`<div class="inspector-group"><div class="inspector-group-title"><span>도형</span><small>${item.shapeType}</small></div><label>도형 유형<select id="graphicShapeType">${SHAPE_LIBRARY.map(a=>`<option value="${a.id}" ${a.id===item.shapeType?"selected":""}>${a.name}</option>`).join("")}</select></label></div></div>`;design=head+`<div class="inspector-group"><div class="inspector-group-title"><span>채우기와 선</span></div><label class="vector-color-swatch"><input id="graphicFill" type="color" value="${item.style?.fill||"#4777bd"}"><span>채우기 색</span></label><label class="vector-color-swatch"><input id="graphicStroke" type="color" value="${item.style?.stroke||"#172033"}"><span>테두리 색</span></label><div class="grid2"><label>테두리 두께<input id="graphicStrokeWidth" type="number" min="0" max="20" step=".5" value="${item.style?.strokeWidth||1.5}"></label><label>선 종류<select id="graphicDash"><option value="solid" ${item.style?.dash!=="dashed"?"selected":""}>실선</option><option value="dashed" ${item.style?.dash==="dashed"?"selected":""}>점선</option></select></label></div>${graphicShadowFields(item.style)}<button id="applyGraphicStyle" class="action">도형 스타일 저장</button></div></div>`}
 if(item.type==="vector"){const asset=VECTOR_LIBRARY.find(a=>a.id===item.assetId);content=head+`<div class="inspector-group"><div class="inspector-group-title"><span>벡터 자산</span><small>${asset?.category||""}</small></div><label>벡터 선택<select id="graphicVectorAsset">${VECTOR_LIBRARY.map(a=>`<option value="${a.id}" ${a.id===item.assetId?"selected":""}>${a.name}</option>`).join("")}</select></label><div class="hint">검수된 벡터 자산을 자유롭게 늘리고 색상·회전·반전을 변경합니다.</div></div></div>`;design=head+`<div class="inspector-group"><div class="inspector-group-title"><span>색상과 효과</span></div><label class="vector-color-swatch"><input id="graphicPrimary" type="color" value="${item.colors?.primary||"#4777bd"}"><span>주 색상</span></label><label class="vector-color-swatch"><input id="graphicSecondary" type="color" value="${item.colors?.secondary||"#f4b740"}"><span>보조 색상</span></label><div class="grid2"><label>좌우 반전<select id="graphicFlipX"><option value="false" ${!item.flipX?"selected":""}>아니오</option><option value="true" ${item.flipX?"selected":""}>예</option></select></label><label>상하 반전<select id="graphicFlipY"><option value="false" ${!item.flipY?"selected":""}>아니오</option><option value="true" ${item.flipY?"selected":""}>예</option></select></label></div>${graphicShadowFields({shadow:item.shadow,shadowColor:item.shadowColor,shadowBlur:item.shadowBlur})}<button id="applyGraphicStyle" class="action">벡터 스타일 저장</button></div></div>`}
 if(item.type==="image-frame"){content=head+`<div class="inspector-group"><div class="inspector-group-title"><span>프레임 이미지</span><small>더블클릭으로도 선택할 수 있습니다</small></div><button id="replaceFrameImageBtn" class="action secondary">${item.image?.src?"이미지 교체":"이미지 선택"}</button><label>이미지 데이터 연결<select id="frameBinding"><option value="" ${!item.image?.binding?"selected":""}>고정 이미지</option><option value="school.profile.building" ${item.image?.binding==="school.profile.building"?"selected":""}>학교 전경</option><option value="school.profile.logo" ${item.image?.binding==="school.profile.logo"?"selected":""}>교표</option><option value="school.profile.flower" ${item.image?.binding==="school.profile.flower"?"selected":""}>교화</option><option value="school.profile.tree" ${item.image?.binding==="school.profile.tree"?"selected":""}>교목</option></select></label><label>맞춤<select id="frameFit"><option value="cover" ${item.image?.fit!=="contain"?"selected":""}>프레임 채우기</option><option value="contain" ${item.image?.fit==="contain"?"selected":""}>이미지 전체 보기</option></select></label><div class="grid2"><label>확대<input id="frameScale" type="number" min=".2" max="5" step=".05" value="${item.image?.scale||1}"></label><label>X 이동 %<input id="frameOffsetX" type="number" min="-100" max="100" value="${item.image?.offsetX||0}"></label><label>Y 이동 %<input id="frameOffsetY" type="number" min="-100" max="100" value="${item.image?.offsetY||0}"></label><label>밝기 %<input id="frameBrightness" type="number" min="0" max="300" value="${item.image?.brightness??100}"></label><label>대비 %<input id="frameContrast" type="number" min="0" max="300" value="${item.image?.contrast??100}"></label><label>채도 %<input id="frameSaturation" type="number" min="0" max="300" value="${item.image?.saturation??100}"></label><label>좌우 반전<select id="frameFlipX"><option value="false" ${!item.image?.flipX?"selected":""}>아니오</option><option value="true" ${item.image?.flipX?"selected":""}>예</option></select></label><label>상하 반전<select id="frameFlipY"><option value="false" ${!item.image?.flipY?"selected":""}>아니오</option><option value="true" ${item.image?.flipY?"selected":""}>예</option></select></label></div><button id="applyFrameImage" class="action">프레임 이미지 저장</button></div></div>`;design=head+`<div class="inspector-group"><div class="inspector-group-title"><span>프레임 스타일</span></div><label>프레임 형태<select id="graphicFrameType">${FRAME_LIBRARY.map(a=>`<option value="${a.id}" ${a.id===item.frameType?"selected":""}>${a.name}</option>`).join("")}</select></label><label class="vector-color-swatch"><input id="graphicBackground" type="color" value="${item.style?.background||"#eef2f7"}"><span>배경 색</span></label><label class="vector-color-swatch"><input id="graphicStroke" type="color" value="${item.style?.stroke||"#ffffff"}"><span>테두리 색</span></label><label>테두리 두께<input id="graphicStrokeWidth" type="number" min="0" max="20" value="${item.style?.strokeWidth||3}"></label>${graphicShadowFields(item.style)}<button id="applyGraphicStyle" class="action">프레임 스타일 저장</button></div></div>`;data=head+`<div class="inspector-group"><div class="inspector-group-title"><span>이미지 슬롯</span><small>semantic binding</small></div><div class="binding-path">${item.image?.binding||"고정 이미지 — 사용자 데이터와 연결되지 않음"}</div><div class="hint">디자이너가 데이터 연결과 이미지 교체 권한을 지정하면 사용자 Workspace에서는 허용된 항목만 편집하게 됩니다.</div></div></div>`}
 const layout=head+`<div class="inspector-group"><div class="inspector-group-title"><span>크기와 위치</span></div><div class="grid2"><label>X<input id="elemX" type="number" step=".1" value="${item.x}"></label><label>Y<input id="elemY" type="number" step=".1" value="${item.y}"></label><label>폭<input id="elemW" type="number" step=".1" value="${item.width}"></label><label>높이<input id="elemH" type="number" step=".1" value="${item.height}"></label></div><div class="grid2"><label>회전<input id="graphicRotation" type="number" min="-360" max="360" value="${item.rotation||0}"></label><label>투명도<input id="graphicOpacity" type="number" min="0" max="1" step=".05" value="${item.opacity??1}"></label></div><button id="applyGraphicLayout" class="action">배치 저장</button></div></div>`;
 return {content,design,layout,data:data||`<div class="inspector-tab-empty">이 개체는 별도 데이터 연결이 없습니다.</div>`,permission:project.mode==="calendar-workspace"?`<div class="inspector-tab-empty">편집 권한은 템플릿 디자이너가 설정합니다.</div>`:permissionHTML(item)}
};
const v28InspectorTabsHTML=inspectorTabsHTML;
inspectorTabsHTML=function(){return `<div class="inspector-tabs" role="tablist"><button type="button" class="inspector-tab ${inspectorActiveTab==="content"?"active":""}" data-tab="content">콘텐츠</button><button type="button" class="inspector-tab ${inspectorActiveTab==="design"?"active":""}" data-tab="design">스타일</button><button type="button" class="inspector-tab ${inspectorActiveTab==="layout"?"active":""}" data-tab="layout">배치</button><button type="button" class="inspector-tab ${inspectorActiveTab==="data"?"active":""}" data-tab="data">데이터</button><button type="button" class="inspector-tab ${inspectorActiveTab==="permission"?"active":""}" data-tab="permission">권한</button></div>`};
const v28RenderInspector=renderInspector;
renderInspector=function(){v28RenderInspector();const ins=el("inspector"),panels=elementInspectorPanels();if(!sourceElement()||!["shape","vector","image-frame"].includes(sourceElement().type))return;["data","permission"].forEach(tab=>{let panel=ins.querySelector(`[data-panel="${tab}"]`);if(!panel){panel=document.createElement("div");panel.className=`inspector-tab-panel ${inspectorActiveTab===tab?"active":""}`;panel.dataset.panel=tab;ins.appendChild(panel)}panel.innerHTML=panels[tab]||""});ins.querySelectorAll(".inspector-tab").forEach(button=>button.addEventListener("click",()=>{inspectorActiveTab=button.dataset.tab;ins.querySelectorAll(".inspector-tab").forEach(n=>n.classList.toggle("active",n.dataset.tab===inspectorActiveTab));ins.querySelectorAll(".inspector-tab-panel").forEach(n=>n.classList.toggle("active",n.dataset.panel===inspectorActiveTab))}))};
function applyGraphicInspector(action){snapshot();const target=ensureCurrentPageEditTarget(),item=target.item;if(!item){history.pop();return}const values=action==="style"?{shapeType:el("graphicShapeType")?.value,fill:el("graphicFill")?.value,stroke:el("graphicStroke")?.value,strokeWidth:el("graphicStrokeWidth")?.value,dash:el("graphicDash")?.value,background:el("graphicBackground")?.value,shadow:el("graphicShadow")?.value,shadowColor:el("graphicShadowColor")?.value,shadowBlur:el("graphicShadowBlur")?.value,shadowX:el("graphicShadowX")?.value,shadowY:el("graphicShadowY")?.value,assetId:el("graphicVectorAsset")?.value,primary:el("graphicPrimary")?.value,secondary:el("graphicSecondary")?.value,flipX:el("graphicFlipX")?.value,flipY:el("graphicFlipY")?.value,frameType:el("graphicFrameType")?.value}:action==="layout"?{x:el("elemX").value,y:el("elemY").value,width:el("elemW").value,height:el("elemH").value,rotation:el("graphicRotation").value,opacity:el("graphicOpacity").value}:action==="frame"?{binding:el("frameBinding").value,fit:el("frameFit").value,scale:el("frameScale").value,offsetX:el("frameOffsetX").value,offsetY:el("frameOffsetY").value,flipX:el("frameFlipX")?.value,flipY:el("frameFlipY")?.value,brightness:el("frameBrightness")?.value,contrast:el("frameContrast")?.value,saturation:el("frameSaturation")?.value}:{permissions:Object.fromEntries([...document.querySelectorAll("[data-permission]")].map(n=>[n.dataset.permission,n.checked]))};window.ACDLInspectorGraphic.apply(item,action,values);markDirty();render();showEditorToast(target.created?"현재 페이지의 그래픽 개체만 저장했습니다.":"그래픽 개체 설정을 저장했습니다.")}
document.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;if(t.id==="applyGraphicStyle")applyGraphicInspector("style");if(t.id==="applyGraphicLayout")applyGraphicInspector("layout");if(t.id==="applyFrameImage")applyGraphicInspector("frame");if(t.id==="applyGraphicPermissions")applyGraphicInspector("permission");if(t.id==="replaceFrameImageBtn"){pendingImageElementId=selectedElementId;pendingImageElementScope=selectedElementScope;el("frameImageInput").value="";el("frameImageInput").click()}});
el("frameImageInput").addEventListener("change",async e=>{const file=e.target.files?.[0],targetId=pendingImageElementId||selectedElementId,targetScope=pendingImageElementScope||selectedElementScope;e.target.value="";if(!file||!targetId)return;const arr=targetScope==="master"?masterElements():pageElements(),item=arr.find(x=>x.id===targetId);if(item?.type!=="image-frame"){pendingImageElementId=null;pendingImageElementScope=null;return}try{showEditorToast("이미지를 최적화하고 있습니다…");const stored=await window.ACDLAssetStore.storeImage(file,{previewMax:900,previewQuality:.78});snapshot();item.image||={};item.image.assetId=stored.assetId;item.image.src=stored.preview;item.image.originalName=file.name;item.image.originalBytes=file.size;item.image.fit||="cover";item.image.scale||=1;item.image.offsetX??=0;item.image.offsetY??=0;selectedElementId=item.id;selectedElementScope=targetScope;markDirty();render();showEditorToast(`프레임 이미지를 최적화했습니다. ${window.ACDLAssetStore.formatBytes(file.size)} → ${window.ACDLAssetStore.formatBytes(stored.previewBytes)}`)}catch(err){showEditorToast(err?.message||"이미지를 읽지 못했습니다.")}finally{pendingImageElementId=null;pendingImageElementScope=null;window.__acdlUpdateMemoryMonitor?.()}});
function alignSelected(action){const item=sourceElement();if(!item)return;snapshot();if(action==="align-left")item.x=0;if(action==="align-center")item.x=(100-item.width)/2;if(action==="align-right")item.x=100-item.width;if(action==="align-top")item.y=0;if(action==="align-middle")item.y=(100-item.height)/2;if(action==="align-bottom")item.y=100-item.height;if(action==="front")item.zIndex=maxZ(selectedElementScope)+1;if(action==="back")item.zIndex=0;markDirty();render()}
document.querySelectorAll(".menu-root>button").forEach(b=>b.onclick=e=>{e.stopPropagation();const root=b.parentElement;document.querySelectorAll(".menu-root").forEach(x=>x.classList.toggle("open",x===root&&!root.classList.contains("open")))});document.addEventListener("click",()=>document.querySelectorAll(".menu-root").forEach(x=>x.classList.remove("open")));
document.querySelectorAll("[data-open-library]").forEach(b=>b.onclick=e=>{e.stopPropagation();switchObjectLibrary(b.dataset.openLibrary);document.querySelectorAll(".menu-root").forEach(x=>x.classList.remove("open"))});document.querySelectorAll('[data-menu-action]:not([data-menu-action^="preview-"])').forEach(b=>b.onclick=e=>{const a=b.dataset.menuAction;if(a==="undo")undo();else if(a==="redo")redo();else if(a==="duplicate")duplicateSelected();else if(a==="delete")deleteSelected();else if(a==="toggle-guides"){ensureTemplateResources();project.template.resources.exportSettings.guides=!project.template.resources.exportSettings.guides;render()}else alignSelected(a)});
document.querySelectorAll("[data-library-tab]").forEach(b=>b.onclick=()=>switchObjectLibrary(b.dataset.libraryTab));el("objectLibrarySearch")?.addEventListener("input",()=>{const q=el("objectLibrarySearch").value.trim().toLowerCase();document.querySelectorAll("[data-search]").forEach(n=>n.style.display=!q||n.dataset.search.toLowerCase().includes(q)?"":"none");const active=el("vectorCategoryRow")?.querySelector("button.active")?.dataset.vectorCategory||"all";renderVectorCards(active)});
el("exportVectorManifestBtn")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:1,categories:VECTOR_CATEGORY_LABELS,assets:VECTOR_LIBRARY},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="acdl-vector-library.json";a.click();URL.revokeObjectURL(a.href)});
const v28SwitchResourcePage=switchResourcePage;switchResourcePage=function(page){v28SwitchResourcePage(page);if(page==="graphics")ensureGraphicsResources()};
renderGraphicsLibraries();


// v33: task-oriented Calendar Workspace menus, review and preview quality controls
let activeWorkflow='review';
function workflowCompletion(){if(!project)return {done:0,total:5};const school=project.book.school||{},profile=school.profile||{};const checks=[school.name&&school.name!=='학교명 미입력',profile.logo?.image,profile.building?.image,(project.book.events||[]).length>0,project.book.pageInstances?.length>0];return {done:checks.filter(Boolean).length,total:checks.length}}
function updateWorkflowProgress(){const n=el('workflowProgress');if(!n||!project)return;const c=workflowCompletion();n.textContent=`기본 입력 ${c.done}/${c.total} 완료 · 일정 ${(project.book.events||[]).length}건`}
function workflowSchoolHtml(){const s=project.book.school||{};return `<div class="workflow-form"><label>학교명<input id="wfSchoolName" value="${v21Escape(s.name||'')}"></label><label>영문 학교명<input id="wfSchoolEnglish" value="${v21Escape(s.englishName||'')}"></label><label class="full">슬로건<input id="wfSchoolSlogan" value="${v21Escape(s.slogan||'')}"></label><label class="full">주소<input id="wfSchoolAddress" value="${v21Escape(s.address||'')}"></label><label>전화<input id="wfSchoolPhone" value="${v21Escape(s.phone||'')}"></label><label>팩스<input id="wfSchoolFax" value="${v21Escape(s.fax||'')}"></label><label class="full">홈페이지<input id="wfSchoolWebsite" value="${v21Escape(s.website||'')}"></label></div><div class="workflow-card" style="margin-top:12px"><h3>이미지 연결 현황</h3>${[['교표',s.profile?.logo?.image],['학교 전경',s.profile?.building?.image],['교화',s.profile?.flower?.image],['교목',s.profile?.tree?.image]].map(([k,v])=>`<div class="workflow-stat"><span>${k}</span><b class="workflow-status ${v?'ok':'warn'}">${v?'연결됨':'미입력'}</b></div>`).join('')}</div>`}
function workflowScheduleHtml(){const events=project.book.events||[];return `<div class="workflow-grid"><div class="workflow-card"><h3>학사일정 현황</h3><div class="workflow-stat"><span>전체 일정</span><b>${events.length}건</b></div><div class="workflow-stat"><span>기간 일정</span><b>${events.filter(e=>e.endDate&&e.endDate!==e.startDate).length}건</b></div><div class="workflow-stat"><span>날짜 오류</span><b class="workflow-status ${events.some(e=>e.endDate<e.startDate)?'error':'ok'}">${events.filter(e=>e.endDate<e.startDate).length}건</b></div></div><div class="workflow-card"><h3>최근 일정</h3>${events.slice().sort((a,b)=>(a.startDate||'').localeCompare(b.startDate||'')).slice(0,8).map(e=>`<div class="workflow-stat"><span>${e.startDate}${e.endDate&&e.endDate!==e.startDate?' ~ '+e.endDate:''}</span><b>${v21Escape(e.title||'')}</b></div>`).join('')||'<p>등록된 일정이 없습니다.</p>'}</div></div><p style="font-size:10px;color:var(--muted);margin-top:14px">일정의 직접 추가·수정은 월력 날짜를 선택한 뒤 Inspector에서 진행할 수 있습니다.</p>`}
function workflowMonthlyHtml(){const pages=(project.book.pageInstances||[]).filter(p=>p.role==='monthly-front');return `<div class="monthly-content-grid">${pages.map(p=>{const prefix=`${p.calendarYear}-${String(p.calendarMonth).padStart(2,'0')}`,count=(project.book.events||[]).filter(e=>(e.startDate||'').startsWith(prefix)||(e.endDate||'').startsWith(prefix)).length;return `<div class="monthly-content-row"><b>${p.calendarMonth}월</b><span>일정 ${count}건</span><span>${(project.book.elementsByPage?.[p.id]||[]).filter(i=>i.type==='image'||i.type==='image-frame').length}개 이미지 영역</span><button data-jump-page="${p.id}">페이지 열기</button></div>`}).join('')}</div>`}
function workflowReviewHtml(){const rows=(project.book.pageInstances||[]).map(p=>({p,issues:pageQualityIssues(p)}));const errors=rows.filter(r=>r.issues.length);return `<div class="workflow-grid"><div class="workflow-card"><h3>제작 상태</h3><div class="workflow-stat"><span>전체 페이지</span><b>${rows.length}</b></div><div class="workflow-stat"><span>확인 필요 페이지</span><b class="workflow-status ${errors.length?'warn':'ok'}">${errors.length}</b></div><div class="workflow-stat"><span>학사일정</span><b>${(project.book.events||[]).length}건</b></div></div><div class="workflow-card"><h3>출력 전 기본 점검</h3><div class="workflow-stat"><span>학교명</span><b class="workflow-status ${project.book.school?.name?'ok':'error'}">${project.book.school?.name?'완료':'미입력'}</b></div><div class="workflow-stat"><span>교표</span><b class="workflow-status ${project.book.school?.profile?.logo?.image?'ok':'warn'}">${project.book.school?.profile?.logo?.image?'완료':'확인 필요'}</b></div><div class="workflow-stat"><span>학교 전경</span><b class="workflow-status ${project.book.school?.profile?.building?.image?'ok':'warn'}">${project.book.school?.profile?.building?.image?'완료':'확인 필요'}</b></div></div><div class="workflow-card full"><h3>페이지별 확인 항목</h3><div class="workflow-page-list">${rows.map(({p,issues})=>`<div class="workflow-page-row"><span>${roleLabel(p)}</span><b class="workflow-status ${issues.length?'warn':'ok'}">${issues.length?issues.join(' · '):'정상'}</b><button data-jump-page="${p.id}">이동</button></div>`).join('')}</div></div></div>`}
function openWorkflow(kind){if(!project)return;activeWorkflow=kind;const map={school:['학교 정보','학교 기본 정보와 연결 상태를 확인하고 수정합니다.'],schedule:['학사일정','등록된 일정과 기간 일정을 검토합니다.'],monthly:['월별 콘텐츠','월별 일정과 콘텐츠 영역을 빠르게 탐색합니다.'],review:['최종 검토','페이지별 누락 데이터와 혼잡 가능성을 확인합니다.']};const [t,d]=map[kind]||map.review;el('workflowTitle').textContent=t;el('workflowDesc').textContent=d;el('workflowBody').innerHTML=kind==='school'?workflowSchoolHtml():kind==='schedule'?workflowScheduleHtml():kind==='monthly'?workflowMonthlyHtml():workflowReviewHtml();el('workflowSaveBtn').style.display=kind==='school'?'':'none';el('workflowModal').classList.remove('hidden');el('workflowBody').querySelectorAll('[data-jump-page]').forEach(b=>b.onclick=()=>{selectedPageId=b.dataset.jumpPage;selectedElementId=null;selectedElementScope=null;el('workflowModal').classList.add('hidden');render()})}
function saveWorkflow(){if(activeWorkflow==='school'){snapshot();ensureSchoolProfile();const s=project.book.school;s.name=el('wfSchoolName').value.trim()||'학교명 미입력';s.englishName=el('wfSchoolEnglish').value.trim();s.slogan=el('wfSchoolSlogan').value.trim();s.address=el('wfSchoolAddress').value.trim();s.phone=el('wfSchoolPhone').value.trim();s.fax=el('wfSchoolFax').value.trim();s.website=el('wfSchoolWebsite').value.trim();recalculateBoundAutoSizes?.();markDirty();render();updateWorkflowProgress();showEditorToast('학교 정보를 저장하고 연결 개체에 적용했습니다.')}el('workflowModal').classList.add('hidden')}
document.querySelectorAll('[data-workflow]').forEach(b=>b.onclick=()=>{const k=b.dataset.workflow;if(k==='preview')openFullPreview();else openWorkflow(k)});el('closeWorkflowBtn').onclick=el('workflowCancelBtn').onclick=()=>el('workflowModal').classList.add('hidden');el('workflowSaveBtn').onclick=saveWorkflow;el('closePreviewFocusBtn').onclick=()=>el('previewFocusModal').classList.add('hidden');
el('previewCardSize').onchange=()=>{el('fullPreviewGrid').style.setProperty('--preview-card-min',el('previewCardSize').value+'px');requestAnimationFrame(()=>document.querySelectorAll('.full-preview-card').forEach(c=>fitFullPreviewPage(c.querySelector('.preview-only-page'),c.querySelector('.full-preview-stage'),Number(el('previewZoom').value))))};el('previewZoom').onchange=()=>document.querySelectorAll('.full-preview-card').forEach(c=>fitFullPreviewPage(c.querySelector('.preview-only-page'),c.querySelector('.full-preview-stage'),Number(el('previewZoom').value)));
const v33OldRender=typeof window.render==='function'?window.render:render; if(typeof v33OldRender==='function')render=function(){v33OldRender();if(project?.mode==='calendar-workspace'){document.querySelector('#editorMenubar .menu-root:nth-child(2)')?.classList.add('hidden');const align=document.querySelector('#editorMenubar .menu-root:nth-child(3)>button');if(align)align.textContent='배치'}};


// v33.2: resilient full preview and recovery after preview/render errors.
(function(){
  function hardResetPreviewState(){
    preview=false;previewType=null;
    document.body.classList.remove('preview-only');
    el('fullPreviewOverlay')?.classList.add('hidden');
    el('previewFocusModal')?.classList.add('hidden');
    const btn=el('previewBtn');if(btn){btn.textContent='현재 페이지 미리보기';btn.classList.remove('active')}
  }
  function previewErrorCard(pageInfo,err){
    const card=document.createElement('section');card.className='full-preview-card preview-error-card';
    card.innerHTML=`<div class="full-preview-card-title"><span>${roleLabel(pageInfo)}</span><small>이 페이지 미리보기 오류</small></div><div class="full-preview-error"><b>페이지를 표시하지 못했습니다.</b><span>${v21Escape(err?.message||String(err)||'알 수 없는 오류')}</span></div>`;
    return card;
  }
  window.openFullPreview=openFullPreview=function(){
    if(!project?.book?.pageInstances?.length){showEditorToast('미리보기할 페이지가 없습니다.');return}
    hardResetPreviewState();
    const state={pageId:selectedPageId,elementId:selectedElementId,scope:selectedElementScope,calendarEditing};
    const grid=el('fullPreviewGrid');
    grid.innerHTML='';
    grid.style.setProperty('--preview-card-min',(el('previewCardSize')?.value||410)+'px');
    selectedElementId=null;selectedElementScope=null;calendarEditing=false;
    let failed=0;
    try{
      for(const pageInfo of project.book.pageInstances){
        try{
          selectedPageId=pageInfo.id;
          if(!selectedPage())throw new Error('페이지 데이터를 찾을 수 없습니다.');
          renderPage();applyThemeTokens();
          const live=el('page');if(!live)throw new Error('페이지 렌더러가 결과를 만들지 못했습니다.');
          const computed=getComputedStyle(live),rect=live.getBoundingClientRect();
          const naturalWidth=Math.max(1,live.offsetWidth,parseFloat(computed.width)||0,Math.round(rect.width)||0);
          const naturalHeight=Math.max(1,live.offsetHeight,parseFloat(computed.height)||0,Math.round(rect.height)||0);
          if(naturalWidth<=1||naturalHeight<=1)throw new Error('페이지 크기를 계산할 수 없습니다.');
          const source=live.cloneNode(true);source.removeAttribute('id');source.classList.add('preview-only-page');
          source.dataset.previewWidth=String(naturalWidth);source.dataset.previewHeight=String(naturalHeight);
          source.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
          source.querySelectorAll('.editor-only,.non-output,.resize-handle,.elem-handle,.elem-label,.semantic-role-badge,.binding-status-badge,.workspace-binding-badge').forEach(n=>n.remove());
          source.querySelectorAll('.selected,.element-selected,.workspace-locked,.binding-missing').forEach(n=>n.classList.remove('selected','element-selected','workspace-locked','binding-missing'));
          let issues=[];try{issues=pageQualityIssues(pageInfo)}catch(_){issues=[]}
          const card=document.createElement('section');card.className='full-preview-card';
          const title=document.createElement('div');title.className='full-preview-card-title';
          title.innerHTML=`<span>${roleLabel(pageInfo)}</span><small>${issues.length?`⚠ ${issues.join(' · ')}`:(pageInfo.calendarYear&&pageInfo.calendarMonth?`${pageInfo.calendarYear}.${String(pageInfo.calendarMonth).padStart(2,'0')}`:pageInfo.id)}</small><button type="button">원본 보기</button>`;
          const stage=document.createElement('div');stage.className='full-preview-stage';stage.appendChild(source);card.append(title,stage);grid.appendChild(card);
          title.querySelector('button').onclick=()=>openPreviewFocus(card);stage.ondblclick=()=>openPreviewFocus(card);
        }catch(pageErr){failed++;console.error('Full preview page failed',pageInfo?.id,pageErr);grid.appendChild(previewErrorCard(pageInfo,pageErr))}
      }
    }finally{
      selectedPageId=project.book.pageInstances.some(p=>p.id===state.pageId)?state.pageId:project.book.pageInstances[0]?.id||null;
      selectedElementId=state.elementId;selectedElementScope=state.scope;calendarEditing=state.calendarEditing;
      hardResetPreviewState();
      try{render()}catch(renderErr){console.error('Editor recovery render failed',renderErr);selectedElementId=null;selectedElementScope=null;selectedPageId=project.book.pageInstances[0]?.id||null;try{render()}catch(_){}}
    }
    preview=true;previewType='template';
    el('fullPreviewSummary').textContent=`${project.book.pageInstances.length}개 페이지 · ${failed?failed+'개 페이지 오류 · ':''}실제 페이지 렌더링 미리보기 · ${project.template?.metadata?.name||project.book.id}`;
    el('fullPreviewOverlay').classList.remove('hidden');
    requestAnimationFrame(()=>requestAnimationFrame(()=>grid.querySelectorAll('.full-preview-card:not(.preview-error-card)').forEach(card=>fitFullPreviewPage(card.querySelector('.preview-only-page'),card.querySelector('.full-preview-stage'),Number(el('previewZoom')?.value||100)))));
  };
  const originalOpenDesignerProjectFromRecord=openDesignerProjectFromRecord;
  openDesignerProjectFromRecord=async function(t){
    hardResetPreviewState();
    el('fullPreviewGrid')&&(el('fullPreviewGrid').innerHTML='');
    try{return await originalOpenDesignerProjectFromRecord(t)}catch(err){
      console.error('Template switch failed',err);hardResetPreviewState();
      selectedElementId=null;selectedElementScope=null;
      if(project?.book?.pageInstances?.length){selectedPageId=project.book.pageInstances[0].id;try{render()}catch(_){}}
      alert(`템플릿을 열지 못했습니다: ${err?.message||err}`);
    }
  };
  window.el=el;
  window.SIZE_PRESETS=SIZE_PRESETS;
  window.makeProject=makeProject;
  window.render=render;
  window.renderPage=renderPage;
  window.renderFreeElements=renderFreeElements;
  window.renderNavigator=renderNavigator;
  window.renderSizeOptions=renderSizeOptions;
  window.graphicMarkup=graphicMarkup;
  window.resolveTextContent=resolveTextContent;
  window.setUserWizardStep=setUserWizardStep;
  Object.defineProperty(window,'project',{get:()=>project,set:value=>{project=value},configurable:true});
  Object.defineProperty(window,'selectedCalendarType',{get:()=>selectedCalendarType,set:value=>{selectedCalendarType=value},configurable:true});
  Object.defineProperty(window,'selectedUserTemplate',{get:()=>selectedUserTemplate,set:value=>{selectedUserTemplate=value},configurable:true});
  Object.defineProperty(window,'userWizardStep',{get:()=>userWizardStep,set:value=>{userWizardStep=value},configurable:true});
  window.addEventListener('error',()=>{if(previewType==='template')hardResetPreviewState()});
  window.addEventListener('unhandledrejection',()=>{if(previewType==='template')hardResetPreviewState()});
})();
