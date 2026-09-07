(()=>{
 const $=id=>document.getElementById(id);
 function showDesignerHome(){
  $('entryScreen')?.classList.add('hidden');
  $('setup')?.classList.add('hidden');
  $('userSetup')?.classList.add('hidden');
  $('designerHome')?.classList.remove('hidden');
 }
 function openDesignerSetup(){
  $('designerHome')?.classList.add('hidden');
  $('setup')?.classList.remove('hidden');
  $('userSetup')?.classList.add('hidden');
  if(typeof openDesignerStudio==='function'){
   try{openDesignerStudio({mode:'designer',source:'designer-home'})}catch(error){console.warn('designer setup bootstrap fallback',error)}
  }
 }
 function bind(id,handler){
  const node=$(id);if(!node)return;
  node.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();handler()},true);
 }
 bind('enterDesignerFlow',showDesignerHome);
 bind('designerHomeNew',openDesignerSetup);
})();
