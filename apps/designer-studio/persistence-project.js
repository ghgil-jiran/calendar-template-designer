(function(root){
 function serialize(project){return JSON.stringify(project)}
 function deserialize(text){return JSON.parse(text)}
 function clone(project){return deserialize(serialize(project))}
 function hash(project){return serialize(project)}
 function createRecoveryRecord(project,selectedPageId,options={}){
  const compact=typeof options.compact==="function"?options.compact:value=>value;
  const now=typeof options.now==="function"?options.now:()=>new Date();
  return {id:"latest",project:compact(project),selectedPageId:selectedPageId||null,updatedAt:now().toISOString()}
 }
 root.ACDLPersistenceProject=Object.freeze({serialize,deserialize,clone,hash,createRecoveryRecord})
})(typeof window!=="undefined"?window:globalThis);
