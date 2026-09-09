(function(root){
 function serialize(project){return JSON.stringify(project)}
 function deserialize(text){return JSON.parse(text)}
 function clone(project){return deserialize(serialize(project))}
 function hash(project){return JSON.stringify(project,(_key,value)=>typeof value==='string'&&value.startsWith('data:image/')&&value.length>512?`data-image:${value.length}:${value.slice(0,96)}:${value.slice(-96)}`:value)}
 function createRecoveryRecord(project,selectedPageId,options={}){
  const compact=typeof options.compact==="function"?options.compact:value=>value;
  const now=typeof options.now==="function"?options.now:()=>new Date();
  return {id:"latest",project:compact(project),selectedPageId:selectedPageId||null,updatedAt:now().toISOString()}
 }
 root.ACDLPersistenceProject=Object.freeze({serialize,deserialize,clone,hash,createRecoveryRecord})
})(typeof window!=="undefined"?window:globalThis);
