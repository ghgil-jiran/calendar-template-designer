(function(root){
 function invalid(message,details={}){return Object.assign(new Error(message),{code:'TEMPLATE_PROJECT_INVALID',details})}
 function validate(project,{expectedPageCount}={}){
  if(!project||typeof project!=='object'||Array.isArray(project))throw invalid('저장된 템플릿 문서가 올바르지 않습니다.');
  const pages=project?.book?.pageInstances;
  if(!Array.isArray(pages)||!pages.length)throw invalid('저장된 템플릿에 편집할 페이지가 없습니다.',{pageCount:Array.isArray(pages)?pages.length:null});
  const ids=pages.map(page=>page?.id).filter(Boolean),uniqueIds=new Set(ids);
  if(ids.length!==pages.length||uniqueIds.size!==pages.length)throw invalid('저장된 템플릿의 페이지 식별자가 올바르지 않습니다.',{pageCount:pages.length,identifiedPageCount:ids.length,uniquePageCount:uniqueIds.size});
  if(!project.book.elementsByPage||typeof project.book.elementsByPage!=='object'||Array.isArray(project.book.elementsByPage))throw invalid('저장된 템플릿의 페이지 개체 정보가 없습니다.');
  if(Number.isInteger(expectedPageCount)&&expectedPageCount>0&&pages.length!==expectedPageCount)throw invalid(`저장된 템플릿의 페이지 수가 올바르지 않습니다. (${pages.length}/${expectedPageCount})`,{pageCount:pages.length,expectedPageCount});
  return project
 }
 function expectedPageCount(project){
  const declared=Number(project?.template?.pageComposition?.pageCount);
  if(Number.isInteger(declared)&&declared>0)return declared;
  const type=project?.productType?.category||project?.settings?.type;
  if(type==='desk'&&project?.template?.aiDesignDraft)return 28;
  return null
 }
 async function prepare(projectData,{hydrate,migrate,assertIntegrity,onProgress}={}){
  if(!projectData)throw invalid('불러올 템플릿 문서가 없습니다.');
  onProgress?.({phase:'document',completed:0,total:1});
  let project=structuredClone(projectData);
  if(typeof hydrate==='function')project=await hydrate(project,{onProgress});
  if(typeof migrate==='function')project=migrate(project)?.project||project;
  if(typeof assertIntegrity==='function')assertIntegrity(project);
  validate(project,{expectedPageCount:expectedPageCount(project)});
  onProgress?.({phase:'document',completed:1,total:1});
  return project
 }
 root.ACDLTemplateProjectLoader=Object.freeze({validate,expectedPageCount,prepare});
})(typeof window!=='undefined'?window:globalThis);
