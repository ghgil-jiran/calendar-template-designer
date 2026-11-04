/* PDF sources stay immutable; previews and page assignments reference them. */
(function(root){
 'use strict';
 const CHUNK_BYTES=1048576,MAX_BYTES=250*CHUNK_BYTES,MAX_PAGES=160;
 const slots={'cover':'표지','cover-inside':'표지 안쪽','interleaf-front':'앞간지 앞면','interleaf-back':'앞간지 뒷면','rear-interleaf-front':'뒷간지 앞면','rear-interleaf-back':'뒷간지 뒷면','back-cover':'뒷표지'};
 for(let i=1;i<=12;i++){const n=String(i).padStart(2,'0');slots['month-back-'+n]='월력 뒷면 · '+i+'번째 월';slots['month-front-'+n]='월력 앞면 · '+i+'번째 월';}
 function error(message){throw new Error(message)}
 function uploadMetadata(value={}){
  const fileName=String(value.fileName||'').trim(),byteSize=Number(value.byteSize),sha256=String(value.sha256||'');
  if(!fileName||fileName.length>240||!/\.pdf$/i.test(fileName)||!Number.isSafeInteger(byteSize)||byteSize<8||byteSize>MAX_BYTES||!/^[a-f0-9]{64}$/.test(sha256)||!['reference','background'].includes(value.kind))error('PDF 파일명·용량·종류를 확인해주세요. PDF는 파일당 최대 250MB입니다.');
  const pages=value.pages;if(!Array.isArray(pages)||!pages.length||pages.length>MAX_PAGES)error('PDF는 1~160페이지까지 등록할 수 있습니다.');
  return {fileName,byteSize,sha256,kind:value.kind,chunkCount:Math.ceil(byteSize/CHUNK_BYTES),pages:pages.map((p,i)=>{const widthPt=Number(p.widthPt),heightPt=Number(p.heightPt);if(!(widthPt>0&&heightPt>0&&widthPt<15000&&heightPt<15000))error('PDF 페이지 크기를 확인해주세요.');return {pageNumber:i+1,widthPt,heightPt,widthMm:widthPt*25.4/72,heightMm:heightPt*25.4/72};})};
 }
 function pageKey(page){return slots[page]?page:null}
 function sourceRef(document,pageNumber){const p=document.pages[pageNumber-1];if(!p)error('PDF 페이지가 없습니다.');return {schemaVersion:'graphic-pdf-source.v1',documentId:document.id,sha256:document.sha256,byteSize:document.byteSize,fileName:document.fileName,pageNumber,widthPt:p.widthPt,heightPt:p.heightPt};}
 function suggestedSlot(name,pageNumber=1){const lower=String(name).toLowerCase();if(/표지|cover/.test(lower)&&!/뒤|뒷|back|안쪽|inside/.test(lower))return 'cover';if(/뒷표지|뒤표지|back.cover/.test(lower))return 'back-cover';if(/월력.*뒤|월력.*뒷|month.back/.test(lower)){const n=lower.match(/(?:^|[^0-9])(\d{1,2})월/);if(n){const m=Number(n[1]);if(m>=1&&m<=12)return 'month-back-'+String((m+9)%12+1).padStart(2,'0');}if(pageNumber<=12)return 'month-back-'+String(pageNumber).padStart(2,'0');}return '';}
 root.ACDLGraphicPdfPackageModel=Object.freeze({CHUNK_BYTES,MAX_BYTES,MAX_PAGES,slots:Object.freeze(slots),uploadMetadata,pageKey,sourceRef,suggestedSlot});
})(typeof window==='undefined'?globalThis:window);
