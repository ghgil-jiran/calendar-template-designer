(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const safeFilePart=value=>String(value||"template").trim().replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").slice(0,80)||"template";
 const text=(tag,value,className="")=>{const node=document.createElement(tag);node.textContent=String(value??"");if(className)node.className=className;return node};
 const bytes=value=>{const size=Number(value)||0;if(!size)return "확인 불가";if(size>=1048576)return `${(size/1048576).toFixed(2)} MB`;if(size>=1024)return `${(size/1024).toFixed(1)} KB`;return `${size} B`};
 function pageLabel(page){if(!page)return "";if(page.calendarYear&&page.calendarMonth)return `${page.calendarYear}.${String(page.calendarMonth).padStart(2,"0")} · ${page.role}`;return page.label||page.name||page.role||page.id||""}
 function collectAssets(){
  const resources=(project?.template?.resources?.aiDesignAssets||[]).filter(asset=>asset?.source?.type==="live-ai-generation"&&typeof asset.src==="string"&&asset.src.startsWith("data:image/"));
  const pages=project?.book?.pageInstances||[],elements=project?.book?.elementsByPage||{},byId=new Map();
  resources.forEach(asset=>{const key=asset.source?.assetId||asset.id||asset.src;if(!byId.has(key))byId.set(key,{...asset,assignments:[]})});
  pages.forEach(page=>(elements[page.id]||[]).filter(item=>item.role==="ai-design-background").forEach(item=>{const resource=resources.find(asset=>asset.id===(item.assetId||item.aiDesign?.resourceId));if(!resource)return;const key=resource.source?.assetId||resource.id||resource.src,entry=byId.get(key);if(entry)entry.assignments.push({pageId:page.id,label:pageLabel(page),generatedRole:item.aiDesign?.generatedRole||resource.generation?.generatedRole||"",monthKey:item.aiDesign?.monthKey||""})}));
  return [...byId.values()];
 }
 function metaRows(asset){
  const generation=asset.generation||{},evidence=generation.generationEvidence||{},assignment=asset.assignments?.[0]||{};
  return [
   ["페이지·용도",asset.assignments?.map(item=>item.label).filter(Boolean).join(", ")||asset.name||"연결 정보 없음"],
   ["생성 역할",assignment.generatedRole||generation.generatedRole||asset.role||"확인 불가"],
   ["월",assignment.monthKey||generation.pageInstance?.monthKey||"해당 없음"],
   ["모델·품질",generation.id||asset.source?.assetId||"확인 불가"],
   ["품질",generation.quality||evidence.quality||"증거 없음"],
   ["요청 크기",generation.size||evidence.requestedSize||"확인 불가"],
   ["실제 크기",generation.actualSize||evidence.actualSize||"확인 불가"],
   ["원본 용량",bytes(generation.byteLength||evidence.byteLength)],
   ["포맷·압축",`${evidence.outputFormat||"확인 불가"} · ${evidence.outputCompression??"확인 불가"}`],
   ["프롬프트",generation.promptVersion||asset.source?.promptVersion||"확인 불가"],
   ["생성 계약",evidence.schemaVersion||"이전 생성물"],
   ["자동 검증",evidence.status==="passed"?"통과":evidence.status||"검증 증거 없음"],
   ["색상 원본",asset.print?.colorSpace==="RGB"&&asset.print?.sourcePreserved?"RGB 원본 보존":"확인 필요"]
  ];
 }
 function createSummarySheet(assets){
  const verified=assets.filter(asset=>asset.generation?.generationEvidence?.status==="passed").length,high=assets.filter(asset=>(asset.generation?.quality||asset.generation?.generationEvidence?.quality)==="high").length;
  const sheet=document.createElement("section");sheet.className="ai-review-sheet ai-review-summary";
  sheet.append(text("p","AI IMAGE REVIEW","ai-review-kicker"),text("h1","AI 생성 이미지 검토용 PDF"),text("p","AI가 생성한 RGB 원본 이미지 세트 자체를 검토합니다. 템플릿 배치·CMYK·PDF/X-4 판정용 문서가 아닙니다.","ai-review-lead"));
  const grid=document.createElement("div");grid.className="ai-review-summary-grid";
  [["AI 원본 이미지",`${assets.length}개`],["high 품질",`${high}/${assets.length}`],["생성 계약 통과",`${verified}/${assets.length}`],["검증 필요",`${assets.length-verified}개`]].forEach(([label,value])=>{const card=document.createElement("div");card.append(text("span",label),text("strong",value));grid.append(card)});sheet.append(grid);
  const note=document.createElement("div");note.className="ai-review-note";note.append(text("strong","검토 기준"),text("p","흐림·노이즈·문자 생성·비정상 형상·월별 과도한 반복과 역할 연결을 확인합니다. 이미지는 JPEG 변환이나 축소 없이 저장된 data URL을 직접 사용합니다."));sheet.append(note);
  sheet.append(text("p",`${project?.template?.metadata?.name||project?.book?.id||"template"} · ${new Date().toLocaleString("ko-KR")}`,"ai-review-footer"));return sheet;
 }
 function createAssetSheet(asset,index,total){
  const generation=asset.generation||{},evidence=generation.generationEvidence||{},width=Number(generation.width||evidence.width)||0,height=Number(generation.height||evidence.height)||0;
  const sheet=document.createElement("section");sheet.className="ai-review-sheet ai-review-asset";
  const header=document.createElement("header");header.append(text("div",`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`,"ai-review-counter"),text("h2",asset.name||asset.id||`AI 이미지 ${index+1}`));sheet.append(header);
  const body=document.createElement("div");body.className="ai-review-body";
  const visual=document.createElement("div");visual.className="ai-review-visual";
  const full=document.createElement("div");full.className="ai-review-full";const fullImage=new Image();fullImage.src=asset.src;fullImage.alt=asset.name||"AI generated image";fullImage.dataset.reviewSource="original";full.append(fullImage);
  const detail=document.createElement("div");detail.className="ai-review-detail";detail.append(text("span","중앙부 확대"));const detailImage=new Image();detailImage.src=asset.src;detailImage.alt="중앙부 확대";detailImage.dataset.reviewSource="original";if(width&&height){detailImage.style.width=`${width}px`;detailImage.style.height=`${height}px`}detail.append(detailImage);visual.append(full,detail);
  const aside=document.createElement("aside");const status=evidence.status==="passed"?"통과":evidence.status||"확인 필요";aside.append(text("strong",status,`ai-review-status ${evidence.status==="passed"?"passed":"review"}`));metaRows(asset).forEach(([label,value])=>{const row=document.createElement("dl");row.append(text("dt",label),text("dd",value));aside.append(row)});body.append(visual,aside);sheet.append(body);return sheet;
 }
 async function waitForImages(root){
  const images=[...root.querySelectorAll("img")];await Promise.all(images.map(async image=>{if(!image.complete)await new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true})});try{await image.decode?.()}catch{}}));
  return images.filter(image=>!image.naturalWidth);
 }
 async function exportAiImageReviewPdf(){
  const assets=collectAssets();$("templateMenuDropdown")?.classList.add("hidden");
  if(!assets.length){showEditorToast("검토할 실제 AI 생성 이미지가 없습니다. AI 디자인 전체 생성을 먼저 완료해 주세요.");return}
  const button=$("aiImageReviewPdfBtn");if(button)button.disabled=true;showEditorToast(`${assets.length}개 AI 원본 이미지 검토 PDF를 준비하고 있습니다.`);
  const root=document.createElement("main");root.className="ai-image-review-root";root.setAttribute("aria-hidden","true");root.append(createSummarySheet(assets));assets.forEach((asset,index)=>root.append(createAssetSheet(asset,index,assets.length)));
  const style=document.createElement("style");style.id="aiImageReviewPdfStyle";style.textContent=`@page{size:A4 landscape;margin:0}.ai-image-review-root{display:none}.ai-image-review-printing .editor-chrome,.ai-image-review-printing #workspace,.ai-image-review-printing .modal,.ai-image-review-printing .overlay{display:none!important}.ai-image-review-printing .ai-image-review-root{display:block!important;background:#fff;color:#172033;font-family:Arial,"Noto Sans KR",sans-serif}.ai-review-sheet{width:297mm;height:210mm;box-sizing:border-box;padding:12mm;break-after:page;page-break-after:always;overflow:hidden;background:#fff}.ai-review-sheet:last-child{break-after:auto;page-break-after:auto}.ai-review-kicker{margin:0 0 6mm;color:#2463eb;font-weight:800;letter-spacing:.12em}.ai-review-summary h1{margin:0;font-size:30pt}.ai-review-lead{width:220mm;margin:6mm 0 10mm;font-size:13pt;line-height:1.6;color:#526079}.ai-review-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm}.ai-review-summary-grid div{border:1px solid #dce3ee;border-radius:3mm;padding:6mm}.ai-review-summary-grid span{display:block;color:#66748b;font-size:10pt}.ai-review-summary-grid strong{display:block;margin-top:3mm;font-size:22pt}.ai-review-note{margin-top:10mm;padding:7mm;background:#f3f6fb;border-radius:3mm}.ai-review-note strong{font-size:13pt}.ai-review-note p{margin:3mm 0 0;line-height:1.55}.ai-review-footer{position:absolute;left:12mm;bottom:10mm;color:#7b879a}.ai-review-asset header{display:flex;align-items:baseline;gap:6mm;height:15mm;border-bottom:1px solid #dce3ee}.ai-review-asset h2{margin:0;font-size:17pt}.ai-review-counter{font-weight:800;color:#2463eb}.ai-review-body{display:grid;grid-template-columns:198mm 67mm;gap:7mm;margin-top:7mm;height:164mm}.ai-review-visual{display:grid;grid-template-columns:1fr 62mm;gap:5mm;min-width:0}.ai-review-full{display:flex;align-items:center;justify-content:center;background:#eef1f6;overflow:hidden}.ai-review-full img{display:block;max-width:100%;max-height:100%;object-fit:contain}.ai-review-detail{position:relative;overflow:hidden;background:#eef1f6}.ai-review-detail>span{position:absolute;z-index:2;left:2mm;top:2mm;padding:1.5mm 2mm;background:rgba(255,255,255,.9);font-size:8pt;font-weight:700}.ai-review-detail img{position:absolute;left:50%;top:50%;max-width:none;max-height:none;transform:translate(-50%,-50%)}.ai-review-body aside{overflow:hidden}.ai-review-status{display:inline-block;margin-bottom:3mm;padding:2mm 3mm;border-radius:2mm;background:#fff1cf;color:#9a5a00}.ai-review-status.passed{background:#e3f7eb;color:#08733c}.ai-review-body dl{display:grid;grid-template-columns:23mm 1fr;gap:2mm;margin:0;padding:2mm 0;border-bottom:1px solid #edf0f5;font-size:8.5pt;line-height:1.35}.ai-review-body dt{color:#68758a}.ai-review-body dd{margin:0;overflow-wrap:anywhere;font-weight:600}`;document.head.append(style);document.body.append(root);
  const title=document.title,metadata=project?.template?.metadata||{};document.title=`${safeFilePart(metadata.name||project?.book?.id)}-AI-image-review-${safeFilePart(metadata.version||"draft")}`;
  const cleanup=()=>{document.body.classList.remove("ai-image-review-printing");root.remove();style.remove();document.title=title;if(button)button.disabled=false};
  try{if(document.fonts?.ready)await document.fonts.ready;const failed=await waitForImages(root);if(failed.length)throw new Error(`${failed.length}개 AI 원본 이미지를 불러오지 못했습니다.`);await nextFrame();document.body.classList.add("ai-image-review-printing");await nextFrame();showEditorToast("인쇄 화면에서 대상을 ‘PDF로 저장’으로 선택하세요. 이 문서는 AI 생성 이미지 검토 전용입니다.");window.print()}catch(error){console.error("AI image review PDF failed",error);showEditorToast(`AI 이미지 검토 PDF를 만들지 못했습니다: ${error.message||error}`)}finally{setTimeout(cleanup,0)}
 }
 $("aiImageReviewPdfBtn")?.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();exportAiImageReviewPdf()},true);
 window.ACDLAIImageReviewPdf=Object.freeze({collect:collectAssets,export:exportAiImageReviewPdf});
})();