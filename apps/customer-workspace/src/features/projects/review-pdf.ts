import {loadEngine} from '@/features/materials/native-preview';
import {hydrateSnapshot,readSnapshot} from '@/lib/projects/store';

// Same shared page runtime and browser PDF output as the designer's review export.
export async function downloadReviewPdf(id:string,onReady?:(count:number)=>void){
 const restored=hydrateSnapshot(await readSnapshot(id));
 const frame=document.createElement('iframe');frame.title='확인용 PDF';frame.style.cssText='position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0';document.body.append(frame);
 const cleanup=()=>{frame.remove();restored.urls.forEach(url=>URL.revokeObjectURL(url));};
 try{
  const project=restored.appliedProject;if(!project)throw Error('저장된 달력 반영본이 없습니다. 편집 화면에서 먼저 저장해 주세요.');
  const manifest=await loadEngine(),doc=frame.contentDocument!,win=frame.contentWindow!;
  doc.title=restored.record.name+'-확인용';doc.documentElement.lang='ko';
  await Promise.all(manifest.styles.map(file=>new Promise<void>((resolve,reject)=>{const link=doc.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/'+file;link.onload=()=>resolve();link.onerror=()=>reject(Error('PDF 스타일을 불러오지 못했어요.'));doc.head.append(link);}))); 
  const width=Number(project.productType.pageSize.width),height=Number(project.productType.pageSize.height);
  const style=doc.createElement('style');style.textContent=`@page{size:${width}mm ${height}mm;margin:0}html,body{margin:0;padding:0}*{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}.review-sheet{width:${width}mm;height:${height}mm;overflow:hidden;break-after:page;page-break-after:always}.review-sheet:last-child{break-after:auto;page-break-after:auto}.page{width:850px!important;max-width:none!important;margin:0!important;box-shadow:none!important;border:0!important;transform-origin:top left;transform:scale(${width*96/25.4/850})}.non-output,.editor-only,.cover-role-badge{display:none!important}`;doc.head.append(style);
  const host=document.createElement('div'),shadow=host.attachShadow({mode:'open'}),page=document.createElement('div');page.id='page';shadow.append(page);doc.body.append(host);await Promise.all(manifest.styles.map(file=>new Promise<void>((resolve,reject)=>{const link=doc.createElement('link');link.rel='stylesheet';link.href='/generated/page-runtime/'+file;link.onload=()=>resolve();link.onerror=()=>reject(Error('PDF 스타일을 불러오지 못했어요.'));shadow.append(link);})));const layout=doc.createElement('style');layout.textContent='.page{width:850px!important;max-width:none!important;margin:0!important}';shadow.append(layout);await doc.fonts.ready;const engine=window.ACDLCustomerPageRuntime!.create(shadow,project);
  try{for(const info of project.book.pageInstances){const rendered=engine.render(info.id),sheet=doc.createElement('section');sheet.className='review-sheet';sheet.append(rendered.cloneNode(true));doc.body.append(sheet);}shadow.querySelectorAll('style').forEach(s=>doc.head.append(s.cloneNode(true)));}finally{engine.dispose();host.remove();}
  await doc.fonts.ready;
  await Promise.all(Array.from(doc.images).map(async img=>{await img.decode();if(!img.naturalWidth)throw Error('이미지를 불러오지 못했어요. 다시 시도해 주세요.');}));
  onReady?.(project.book.pageInstances.length);win.addEventListener('afterprint',cleanup,{once:true});win.focus();win.print();
 }catch(error){cleanup();throw error;}
}
