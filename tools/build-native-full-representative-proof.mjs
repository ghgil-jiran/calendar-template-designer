import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=process.cwd();
const argument=name=>{const index=process.argv.indexOf(name);return index>=0&&process.argv[index+1]&&!process.argv[index+1].startsWith('--')?process.argv[index+1]:null};
const USER_SERVICE_ROOT=path.resolve(argument('--user-service-root')||'');
const OUTPUT=path.resolve(argument('--output')||path.join(ROOT,'output','pdf','native-full-representative.pdf'));
const INCLUDE_MONTHLY_BACK=process.argv.includes('--include-monthly-back');
const INCLUDE_SPECIAL_PAGES=process.argv.includes('--include-special-pages');
const INCLUDE_TRAILING_PAGES=process.argv.includes('--include-trailing-pages');
const ALL_PAGES=process.argv.includes('--all-pages');
const ICC=path.resolve(argument('--profile')||path.join(USER_SERVICE_ROOT,'scripts','icc-profiles','JapanColor2011Coated.icc'));
const CMYK_IMAGE=path.resolve(argument('--image')||path.join(ROOT,'templates','native-cmyk-image-layout','0.1.0','assets','images','proof-cmyk.jpg'));

if(!argument('--user-service-root')||!existsSync(USER_SERVICE_ROOT))throw new Error('유효한 --user-service-root가 필요합니다.');
for(const file of [ICC,CMYK_IMAGE])if(!existsSync(file))throw new Error(`필수 자산을 찾을 수 없습니다: ${file}`);

globalThis.window=globalThis;
await import('../apps/designer-studio/native-print-authoring.js');
await import('../apps/designer-studio/native-print-package-compiler.js');
await import('../apps/designer-studio/project-document.js');
await import('../apps/designer-studio/native-print-full-template.js');
await import('../apps/designer-studio/dataset-domain-bridge.js');
await import('../apps/designer-studio/runtime-project-adapter.js');
await import('../apps/designer-studio/template-publishing-runtime.js');

const dependencies={
  sizePresets:{desk:[{id:'desk-260x180',label:'탁상형 260 × 180 mm',width:260,height:180}]},
  buildMonths:(year,startMonth)=>Array.from({length:12},(_,index)=>{const date=new Date(Date.UTC(year,startMonth-1+index,1));return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1}})
};
const PHYSICAL_PAGE_LABELS=Object.freeze({
  'cover-front':'표지','cover-back':'표지 안쪽면',
  'front-insert-front':'앞 간지 앞면','front-insert-back':'앞 간지 뒷면',
  'rear-insert-front':'뒤 간지 앞면','rear-insert-back':'뒤 간지 뒷면',
  'monthly-front':'월력 앞면','monthly-back':'월력 뒷면',
  'back-cover-front':'뒷표지 안쪽면','back-cover-back':'뒷표지'
});
const CONTENT_LABELS=Object.freeze({
  'cover-front':'표지 디자인','yearly-calendar':'연력','school-symbols':'학교 상징',
  'academic-schedule':'학사 일정','month-calendar':'월력','month-back':'월력 뒷면 구성',
  'yearly-plan':'Yearly Plan','back-cover':'학교 정보 뒷표지'
});
const pageDescription=page=>({
  pageNumber:page.number,sheetNumber:page.sheetNumber,side:page.side,
  pageId:page.id,physicalRole:page.role,physicalLabel:PHYSICAL_PAGE_LABELS[page.role]||page.role,
  semanticRole:page.semanticPageRole||page.role,
  contentLabel:CONTENT_LABELS[page.semanticPageRole||page.role]||page.semanticPageRole||page.role,
  ...(page.calendarYear&&page.calendarMonth?{monthKey:`${page.calendarYear}-${String(page.calendarMonth).padStart(2,'0')}`}:{})
});
const fullProject=globalThis.ACDLNativePrintFullTemplate.create({year:2028,startMonth:3},dependencies);
const representativePages=[
  fullProject.book.pageInstances.find(page=>page.role==='cover-front'),
  fullProject.book.pageInstances.find(page=>page.semanticPageRole==='yearly-calendar'),
  ...(INCLUDE_SPECIAL_PAGES?[fullProject.book.pageInstances.find(page=>page.semanticPageRole==='school-symbols'),fullProject.book.pageInstances.find(page=>page.semanticPageRole==='academic-schedule')]:[]),
  fullProject.book.pageInstances.find(page=>page.role==='monthly-front'),
  ...(INCLUDE_MONTHLY_BACK?[fullProject.book.pageInstances.find(page=>page.role==='monthly-back')]:[]),
  ...(INCLUDE_TRAILING_PAGES?[fullProject.book.pageInstances.find(page=>page.semanticPageRole==='yearly-plan'),fullProject.book.pageInstances.find(page=>page.semanticPageRole==='back-cover')]:[])
];
if(representativePages.some(page=>!page))throw new Error('전체 30면에서 필수 대표면을 찾지 못했습니다.');
const selectedPages=ALL_PAGES?[...fullProject.book.pageInstances]:representativePages;

const project=structuredClone(fullProject);
const selectedIds=new Set(selectedPages.map(page=>page.id));
project.book.pageInstances=project.book.pageInstances.filter(page=>selectedIds.has(page.id));
project.book.elementsByPage=Object.fromEntries(Object.entries(project.book.elementsByPage).filter(([id])=>selectedIds.has(id)));
project.book.sheets=project.book.sheets.filter(sheet=>project.book.pageInstances.some(page=>page.sheetId===sheet.id));
const masterIds=new Set(project.book.pageInstances.map(page=>page.masterId));
project.template.masterElements=Object.fromEntries(Object.entries(project.template.masterElements).filter(([id])=>masterIds.has(id)));

const imageBytes=readFileSync(CMYK_IMAGE);
const cover=project.book.pageInstances.find(page=>page.role==='cover-front');
const coverImage=project.book.elementsByPage[cover.id].find(element=>element.id==='cover.photo');
coverImage.printSource={
  assetId:'proof.cover.cmyk',dataUrl:`data:image/jpeg;base64,${imageBytes.toString('base64')}`,
  mimeType:'image/jpeg',width:1600,height:1200,components:4,colorSpace:'cmyk',eligible:true,
  approved:true,approvalRequired:true,proposedOutputConditionIdentifier:'Japan Color 2011 Coated',
  outputConditionIdentifier:'Japan Color 2011 Coated',approvalBasis:'explicit-editor-confirmation',approvedAt:'2026-09-18T00:00:00.000Z'
};
for(const page of project.book.pageInstances)for(const element of [...(project.template.masterElements[page.masterId]||[]),...(project.book.elementsByPage[page.id]||[])])if(element.type==='image-frame'&&!element.printSource)element.printSource={...coverImage.printSource,assetId:`proof.${element.id}.cmyk`};
globalThis.ACDLNativePrintAuthoring.syncProject(project);

const nativeFetch=globalThis.fetch;
globalThis.fetch=async resource=>{
  const value=String(resource);
  if(value.startsWith('/')){
    const file=path.join(ROOT,value.slice(1));
    if(!existsSync(file))return new Response(null,{status:404});
    return new Response(readFileSync(file),{status:200});
  }
  return nativeFetch(resource);
};
const externalized=await globalThis.ACDLTemplatePublishing.externalizeAssets({project},{templateId:'native-desk-academic-full',version:'0.1.0'});
globalThis.fetch=nativeFetch;
const packagedProject=externalized.project.project;
const readiness=globalThis.ACDLNativePrintPackageCompiler.compileProject(packagedProject);
if(readiness.status!=='ready')throw new Error(`${ALL_PAGES?'전체 30면':'대표면'} Package 승격 실패: ${JSON.stringify(readiness)}`);

const adapted=globalThis.ACDLRuntimeProjectAdapter.create().adapt(packagedProject,packagedProject.book.pageInstances);
const runtimeModule=await import(pathToFileURL(path.join(ROOT,'dist','user-service-runtime-bridge','dist','native-print-runtime.js')));
const runtimeResult=new runtimeModule.TemplateRuntime().execute(adapted.template,adapted.dataset,{target:'print',strictBindings:true,includeDiagnostics:true});
if(runtimeResult.hasErrors)throw new Error(`Runtime 검사 실패: ${JSON.stringify(runtimeResult.document.diagnostics)}`);
const expectedPages=ALL_PAGES?fullProject.book.pageInstances.length:3+(INCLUDE_SPECIAL_PAGES?2:0)+(INCLUDE_MONTHLY_BACK?1:0)+(INCLUDE_TRAILING_PAGES?2:0);
if(runtimeResult.document.pages.length!==expectedPages)throw new Error(`Runtime 문서는 ${expectedPages}면이어야 합니다: ${runtimeResult.document.pages.length}`);

const adapter=await import(pathToFileURL(path.join(USER_SERVICE_ROOT,'scripts','lib','resolved-print-contract-adapter.mjs')));
const writer=await import(pathToFileURL(path.join(USER_SERVICE_ROOT,'scripts','lib','native-cmyk-pdf-writer.mjs')));
const printDocument=adapter.resolvedPrintDocumentToPrintDocument(runtimeResult.document,{version:'0.1.0'});
const assetsByPath=new Map(externalized.assets.filter(asset=>asset.packagePath).map(asset=>[asset.packagePath,Buffer.from(asset.bytes)]));
const resolveAsset=asset=>{const bytes=assetsByPath.get(asset.id);if(!bytes)throw new Error(`Package 자산을 찾을 수 없습니다: ${asset.id}`);return bytes};
const pdf=writer.createNativeCmykPdf({document:printDocument,iccProfile:readFileSync(ICC),resolveFontAsset:resolveAsset,resolveImageAsset:resolveAsset});
const structure=writer.inspectNativeCmykPdf(pdf,{document:printDocument});
if(!structure.passed)throw new Error(`내부 구조검사 실패: ${JSON.stringify(structure.checks)}`);

mkdirSync(path.dirname(OUTPUT),{recursive:true});
writeFileSync(OUTPUT,pdf);
writeFileSync(OUTPUT.replace(/\.pdf$/i,'.resolved-document.json'),`${JSON.stringify(runtimeResult.document,null,2)}\n`);
writeFileSync(OUTPUT.replace(/\.pdf$/i,'.print-document.json'),`${JSON.stringify(printDocument,null,2)}\n`);
const pageMap=selectedPages.map(pageDescription);
writeFileSync(OUTPUT.replace(/\.pdf$/i,'.structure.json'),`${JSON.stringify({generatedAt:new Date().toISOString(),source:{fullSurfaceCount:fullProject.book.pageInstances.length,selectedPageIds:selectedPages.map(page=>page.id),selectedRoles:selectedPages.map(page=>page.semanticPageRole||page.role),pageMap},readiness,structure},null,2)}\n`);
const coverDpi=readiness.promoted.find(item=>item.objectId==='cover.photo')?.asset?.effectiveDpi;
console.log(`${ALL_PAGES?'NATIVE_FULL_30_SURFACES_OK':'NATIVE_FULL_REPRESENTATIVE_OK'}\npdf=${OUTPUT}\npages=${printDocument.pages.length}\nphysicalPages=${pageMap.map(page=>page.physicalLabel).join(',')}\ncontents=${pageMap.map(page=>page.contentLabel).join(',')}\nimageDpi=${coverDpi}`);
