(function(root){
 function invalid(message,details={}){return Object.assign(new Error(message),{code:'TEMPLATE_PROJECT_INVALID',details})}
 function validate(project,{expectedPageCount}={}){
  if(!project||typeof project!=='object'||Array.isArray(project))throw invalid('저장된 템플릿 문서가 올바르지 않습니다.');
  const pages=project?.book?.pageInstances;
  if(!Array.isArray(pages)||!pages.length)throw invalid('저장된 템플릿에 편집할 페이지가 없습니다.',{pageCount:Array.isArray(pages)?pages.length:null});
  const ids=pages.map(page=>page?.id).filter(Boolean),uniqueIds=new Set(ids);
  if(ids.length!==pages.length||uniqueIds.size!==pages.length)throw invalid('저장된 템플릿의 페이지 식별자가 올바르지 않습니다.',{pageCount:pages.length,identifiedPageCount:ids.length,uniquePageCount:uniqueIds.size});
  if(!project.book.elementsByPage||typeof project.book.elementsByPage!=='object'||Array.isArray(project.book.elementsByPage))project.book.elementsByPage={};
  pages.forEach(page=>{if(!Array.isArray(project.book.elementsByPage[page.id]))project.book.elementsByPage[page.id]=[]});
  if(Number.isInteger(expectedPageCount)&&expectedPageCount>0&&pages.length!==expectedPageCount){project.template||={};project.template.pageRecovery={status:'opened-with-actual-pages',pageCount:pages.length,declaredPageCount:expectedPageCount}}
  return project
 }
 function expectedPageCount(project){
  const declared=Number(project?.template?.pageComposition?.pageCount);
  if(Number.isInteger(declared)&&declared>0)return declared;
  const type=project?.productType?.category||project?.settings?.type;
  if(type==='desk'&&project?.template?.aiDesignDraft)return 28;
  return null
 }
 async function prepare(projectData,{hydrate,migrate,assertIntegrity,onProgress,allowAssetFallback=false}={}){
  if(!projectData)throw invalid('불러올 템플릿 문서가 없습니다.');
  onProgress?.({phase:'document',completed:0,total:1});
  let project=structuredClone(projectData);
  if(typeof migrate==='function')project=migrate(project)?.project||project;
  const assetResolver=(typeof window!=='undefined'?window:globalThis).ACDLProjectAssetResolver;assetResolver?.normalize?.(project);
  validate(project,{expectedPageCount:expectedPageCount(project)});
  if(typeof hydrate==='function'){
   try{project=await hydrate(project,{onProgress})}
   catch(error){if(!allowAssetFallback)throw error;project.template||={};project.template.assetRecovery={status:'pending',code:error?.code||'ASSET_RECOVERY_FAILED',message:error?.message||String(error)}}
  }
  if(typeof assertIntegrity==='function'){
   try{assertIntegrity(project)}
   catch(error){if(!allowAssetFallback)throw error;project.template||={};project.template.assetRecovery={status:'pending',code:error?.code||'AI_DESIGN_INCOMPLETE',message:error?.message||String(error)}}
  }
  validate(project,{expectedPageCount:expectedPageCount(project)});
  onProgress?.({phase:'document',completed:1,total:1});
  return project
 }
 root.ACDLTemplateProjectLoader=Object.freeze({validate,expectedPageCount,prepare});
})(typeof window!=='undefined'?window:globalThis);
