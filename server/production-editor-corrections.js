import '../apps/designer-studio/shared-screen-composition.js';
import '../apps/designer-studio/production-editor-adapter.js';
import { loadProductionEditorSource } from './production-editor-source.js';

export async function validateEditorCorrection(input,baseDocument,snapshot,requestId,assets,{loadSource=loadProductionEditorSource}={}){
 if(input?.format!=='acdl-project'||input.productionCorrection?.requestId!==requestId||!input.book||!input.productType)throw Error('접수 건과 교정 프로젝트가 일치하지 않습니다.');
 const adapter=globalThis.ACDLProductionEditorAdapter;
 const trusted=baseDocument.editorProject||adapter.createProject((await loadSource(snapshot)).projectData,baseDocument,requestId);
 const project=JSON.parse(JSON.stringify(input));project.productionCorrection=structuredClone(trusted.productionCorrection);
 if(JSON.stringify(project.productType.pageSize)!==JSON.stringify(trusted.productType.pageSize))throw Error('교정본 규격 변경은 지원하지 않습니다.');
 if(Object.values(project.template?.masterElements||{}).some(items=>items.length))throw Error('교정본은 각 면의 개체를 수정해 주세요.');
 project.template.id=`production-${requestId}`;delete project.template.remoteId;delete project.template.remoteStableKey;delete project.template.remoteVersionNumber;project.template.publishing={};project.template.metadata={...project.template.metadata,state:'draft',isStandard:false};project.productionCorrection.printInspection=null;
 for(const items of Object.values(project.book.elementsByPage||{}))for(const e of items){
  if(!['x','y','width','height'].every(k=>Number.isFinite(e[k])&&Math.abs(e[k])<=2000)||e.width<=0||e.height<=0)throw Error('개체 위치와 크기가 올바르지 않습니다.');
 }
 const allowed=new Set(assets.map(a=>a.id));
 const trustedImages=new Set();
 function collect(value){if(typeof value==='string'&&value.startsWith('data:image/'))trustedImages.add(value);else if(value&&typeof value==='object')Object.values(value).forEach(collect);}
 collect(trusted);
 function check(value){if(typeof value==='string'){
  if(value.startsWith('production-asset://')&&!allowed.has(value.slice(19)))throw Error('이 접수 건에 보관된 원본만 사용해 주세요.');
  if(value.startsWith('blob:')||value.startsWith('data:image/')&&!trustedImages.has(value)||/\/storage\/v1\/object\/sign\//.test(value))throw Error('이미지를 먼저 교정 원본으로 업로드해 주세요.');
 }else if(value&&typeof value==='object')Object.values(value).forEach(check);}
 try{check(project);}catch(error){
  for(const [pageId,items] of Object.entries(project.book.elementsByPage||{}))for(const item of items){try{check(item);}catch{throw Error(`${error.message} · 면 ${pageId} · 개체 ${item.id}`);}}
  throw error;
 }
 const document=adapter.toDocument(project);
 // A saved project starts a fresh editing baseline; approvals never carry forward.
 project.productionCorrection.baseDocument=adapter.withoutEditor(document);
 project.productionCorrection.baselineElements=structuredClone(project.book.elementsByPage);
 project.productionCorrection.baselinePages=structuredClone(project.book.pageInstances);
 project.productionCorrection.baselineSettings=structuredClone(project.settings);
 project.productionCorrection.baselineBook=Object.fromEntries(['school','events','monthlyImages','monthlyQuotes'].map(k=>[k,structuredClone(project.book[k])]));
 document.editorProject=project;
 return document;
}
