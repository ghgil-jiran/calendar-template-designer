import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Node {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.events={};this.isConnected=true;this.classList={add(){},remove(){}};this.style={setProperty(){}};this.contentWindow={postMessage(){}};}
 append(...nodes){this.children.push(...nodes);}
 prepend(...nodes){this.children.unshift(...nodes);}
 insertBefore(node,target){assert.ok(this.children.includes(target),'insertBefore requires an existing toolbar control');this.children.splice(this.children.indexOf(target),0,node);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(key,value){this.attrs[key]=value;}
 getAttribute(key){return this.attrs[key];}
 removeAttribute(key){delete this.attrs[key];}
 addEventListener(key,callback){this.events[key]=callback;}
 show(){this.open=true;this.modal=false;}
 showModal(){this.open=true;this.modal=true;}
 close(){this.open=false;}
 remove(){this.removed=true;this.isConnected=false;}
 querySelectorAll(){return [];}
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function dom(){const body=new Node('body'),elements=new Map();return {body,documentElement:new Node('html'),createElement:tag=>new Node(tag),querySelector:()=>null,getElementById:id=>{if(!elements.has(id))elements.set(id,new Node('div'));return elements.get(id);},addEventListener(){}};}
function boot(signed,ensure=()=>new Promise(()=>{})){
 const document=dom(),messages=[],parent={postMessage:data=>messages.push(data)},auth={isSignedIn:()=>signed,ensureSession:ensure,onChange(){}},window={parent,ACDLAdminAuth:auth,ACDLProductionEditorAdapter:{},addEventListener(){}},context={window,document,location:{search:'?productionRequest=receipt&productionEmbedded=1',origin:'https://editor.invalid'},URLSearchParams,ResizeObserver:class{observe(){}},setInterval:()=>0,setTimeout,clearTimeout,console,normalizeElementData(){},syncMonthlyGeometry(){},allVisibleElements(){return [];},renderPage(){},project:null};
 vm.runInNewContext(readFileSync(new URL('../apps/designer-studio/features/production-editor-workspace.js',import.meta.url),'utf8'),context);return {document,messages,window};
}
test('correction editor boots without retired control references and announces progress',()=>{const {document,messages,window}=boot(true);assert.equal(messages[0].type,'calendar:production-editor-progress');assert.ok(window.ACDLProductionEditor);assert.ok(!document.body.children[0].children.some(node=>/검사/.test(node.textContent||'')));assert.ok(document.body.children[0].children.some(node=>node.textContent==='새 교정 버전 저장'));});
test('missing admin session reports launch failure instead of waiting indefinitely',async()=>{const {messages}=boot(false,()=>Promise.resolve());await tick();assert.ok(messages.some(message=>message.type==='calendar:production-editor-error'));assert.ok(!messages.some(message=>message.type==='calendar:production-editor-ready'));});
test('launch reveals the shared editor only after matching origin/source/request readiness',async()=>{
 const document=dom(),events={},auth={isSignedIn:()=>true,authorizedFetch:async()=>({ok:true,json:async()=>({revisions:[{id:'v5',revision_number:5,created_at:'2026-10-04'}]})})},window={ACDLAdminAuth:auth,addEventListener:(key,callback)=>events[key]=callback};
 vm.runInNewContext(readFileSync(new URL('../apps/designer-studio/features/production-correction-workspace.js',import.meta.url),'utf8'),{window,document,location:{origin:'https://editor.invalid'},encodeURIComponent,setTimeout:()=>1,clearTimeout(){}});
 const host=new Node('section');window.ACDLProductionCorrection.mount(host,{receipt:{id:'receipt',status:'reviewing'}});await tick();const nodes=node=>[node,...node.children.flatMap(nodes)],link=nodes(host).find(node=>node.tag==='a');link.events.click({preventDefault(){}});const dialog=document.body.children[0],frame=dialog.children[0];assert.equal(dialog.open,true);assert.equal(dialog.modal,false);assert.ok(frame.src.includes('productionEmbedded=1'));
 const send=(origin,requestId)=>events.message({origin,source:frame.contentWindow,data:{type:'calendar:production-editor-ready',requestId}});send('https://foreign.invalid','receipt');assert.equal(dialog.open,true);assert.equal(dialog.modal,false);send('https://editor.invalid','foreign');assert.equal(dialog.open,true);assert.equal(dialog.modal,false);send('https://editor.invalid','receipt');assert.equal(dialog.open,true);assert.equal(dialog.modal,true);
 events.message({origin:'https://editor.invalid',source:frame.contentWindow,data:{type:'calendar:production-editor-return',requestId:'receipt'}});await tick();assert.equal(dialog.removed,true);assert.equal(link.getAttribute('aria-disabled'),'false');
});

test('embedded launch does not hide the editor body or abort on unrelated global errors',()=>{const html=readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');const code=html.match(/<script>(.*?)<\/script>/s)[1];let hidden=false;const window={addEventListener(){throw Error('global errors must not abort correction launch');}};vm.runInNewContext(code,{window,document:{documentElement:{classList:{add(){hidden=true;}}}},location:{search:'?productionRequest=receipt&productionEmbedded=1'},URLSearchParams});assert.equal(hidden,false);});
