(function(root){
 function createDatabase(indexedDbApi,config){
  if(!indexedDbApi?.open)throw new Error("IndexedDB를 사용할 수 없습니다.");
  const databaseName=config.databaseName,version=Number(config.version||1),stores=config.stores||{};
  function open(){return new Promise((resolve,reject)=>{
   const request=indexedDbApi.open(databaseName,version);
   request.onupgradeneeded=()=>{const db=request.result;for(const [name,options] of Object.entries(stores)){if(!db.objectStoreNames.contains(name))db.createObjectStore(name,options)}};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  })}
  async function put(store,value){const db=await open();return new Promise((resolve,reject)=>{
   const transaction=db.transaction(store,"readwrite");
   transaction.objectStore(store).put(value);
   transaction.oncomplete=()=>{db.close();resolve(value)};
   transaction.onerror=()=>{db.close();reject(transaction.error)};
  })}
  async function get(store,key){const db=await open();return new Promise((resolve,reject)=>{
   const transaction=db.transaction(store,"readonly"),request=transaction.objectStore(store).get(key);
   request.onsuccess=()=>{db.close();resolve(request.result)};
   request.onerror=()=>{db.close();reject(request.error)};
  })}
  return Object.freeze({databaseName,version,stores:Object.freeze({...stores}),open,put,get})
 }
 root.ACDLPersistenceIndexedDB=Object.freeze({createDatabase})
})(typeof window!=="undefined"?window:globalThis);
