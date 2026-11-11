(()=>{
const auth=window.ACDLAdminAuth,$=id=>document.getElementById(id),id='cd82064c-12e3-4be4-973b-352327f6568b',oldHash='010a9ea910d41e4781c5f3a8936c84d3778ae8bb01ca9cb7983596a0ad6f1f22';
const update=()=>{$('login').hidden=auth.isSignedIn();$('apply').hidden=!auth.isSignedIn()};auth.onChange(update);update();
$('login').onsubmit=async e=>{e.preventDefault();try{await auth.signIn($('email').value,$('password').value);$('password').value='';$('status').textContent='로그인 완료'}catch(e){$('status').textContent=e.message}};
async function req(url,body){const r=await auth.authorizedFetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined),x=await r.json();if(!r.ok)throw Error(x.error||'요청 실패');return x}
const load=()=>req('/api/templates?id='+id),api=body=>req('/api/template-assets?graphicLibrary=1',body),hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
$('apply').onclick=async()=>{try{
$('apply').disabled=true;const file=$('pdf').files[0];if(!file)throw Error('교정 PDF를 선택해주세요');const bytes=new Uint8Array(await file.arrayBuffer()),sha256=await hash(bytes);if(sha256!=='04a56f2c7112c1c5891fd9d192cb1a77b728a15eb3fba4609b44768f56d696d6')throw Error('검증된 교정 PDF가 아닙니다');
const a=await load(),p=structuredClone(a.version.projectData),bg=p.book.elementsByPage['surface.2.front'].find(e=>e.graphicSource?.pdfSource?.sha256===oldHash);if(!bg)throw Error('기존 학교 상징 원본이 변경되었습니다. 덮어쓰지 않습니다.');const old=bg.graphicSource.pdfSource,packageId=bg.graphicSource.packageId;
$('status').textContent=`v${a.version.versionNumber} 원본 확인 · 교정 PDF 업로드 중`;
const {document:d}=await api({operation:'pdf-start',packageId,kind:'background',fileName:file.name,byteSize:bytes.length,sha256,pages:[{widthPt:old.widthPt,heightPt:old.heightPt}]});
for(let offset=0,index=0;offset<bytes.length;offset+=1048576,index++){const part=bytes.slice(offset,offset+1048576);let binary='';for(let i=0;i<part.length;i+=8192)binary+=String.fromCharCode(...part.subarray(i,i+8192));await api({operation:'pdf-chunk',packageId,documentId:d.id,index,data:btoa(binary),sha256:await hash(part)});}
await api({operation:'pdf-complete',packageId,documentId:d.id});
let changed=0;function replace(v){if(!v||typeof v!=='object')return;if(v.schemaVersion==='graphic-pdf-source.v1'&&v.sha256===oldHash){Object.assign(v,{documentId:d.id,sha256,byteSize:bytes.length,fileName:file.name});changed++;return}for(const x of Object.values(v))replace(x)}replace(p);if(!changed)throw Error('교체 대상 없음');
const current=await load();if(current.version.id!==a.version.id)throw Error('작업 중 다른 버전이 저장되어 템플릿 변경을 중단했습니다');const t=a.template;
const saved=await req('/api/templates',{templateId:t.id,stableKey:t.stableKey,name:t.name,description:t.description,edition:t.edition,state:t.state,isStandard:t.isStandard,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',saveNote:'학교 상징 원본 PDF RGB 테두리만 CMYK 교정 · 이미지와 벡터 보존',schemaVersion:p.version||'2.18.0',projectData:p});
const check=await load();if(check.version.id!==saved.version.id||check.version.projectData.book.elementsByPage['surface.2.front'].find(e=>e.id===bg.id)?.graphicSource.pdfSource.sha256!==sha256)throw Error('저장 후 검증 실패');$('status').textContent=`적용·재조회 완료: 샘플 C v${check.version.versionNumber} · 교정 CMYK 배경 원본 연결 완료 · ${changed}개 참조 교체`;
}catch(e){$('status').textContent=e.message;$('apply').disabled=false}};
})();
