import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.events={};this.isConnected=true;this.classList={add(){}};this.contentWindow={messages:[],postMessage:message=>this.contentWindow.messages.push(message)};}
 append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(key,value){this.attrs[key]=value;}remove(){this.removed=true;}click(){this.onclick?.();}
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0)),all=node=>[node,...node.children.flatMap(all)];
test('stage 4 initializes without queuing, gates final request on current quick results, and rejects foreign messages',async()=>{
 const body=new Element('body'),document={body,createElement:tag=>new Element(tag)},events={},window={ACDLAdminAuth:{isSignedIn:()=>true,authorizedFetch:async()=>({ok:true,json:async()=>({revisions:[{id:'v5',revision_number:5,created_at:'2026-10-04'}]})})},addEventListener:(type,callback)=>events[type]=callback};
 vm.runInNewContext(readFileSync(new URL('../apps/designer-studio/features/production-print-workspace.js',import.meta.url),'utf8'),{window,document,location:{origin:'https://editor.invalid'},encodeURIComponent,setTimeout:()=>1,clearTimeout(){},setInterval:()=>2,clearInterval(){},confirm:()=>true,URL,Blob});
 const host=new Element('section');window.ACDLProductionPrint.mount(host,{receipt:{id:'receipt'}});await tick();const frame=all(host).find(item=>item.tag==='iframe'),generate=all(host).find(item=>item.textContent==='최종 인쇄 PDF 생성·검사'),quick=all(host).find(item=>item.textContent==='빠른 검사 시작'),checkbox=all(host).find(item=>item.tag==='input');
 assert.ok(frame.src.includes('productionRevision=v5'));assert.equal(generate.disabled,true);assert.equal(frame.contentWindow.messages.length,0);
 const send=(data,origin='https://editor.invalid')=>events.message({source:frame.contentWindow,origin,data:{requestId:'receipt',...data}});
 send({type:'calendar:production-editor-ready'},'https://foreign.invalid');assert.equal(frame.contentWindow.messages.length,0);
 send({type:'calendar:production-editor-ready'});assert.deepEqual(frame.contentWindow.messages.map(item=>item.action),['status']);
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'status',result:{jobs:[]}});quick.click();assert.equal(frame.contentWindow.messages.at(-1).action,'quick');
 const quickResult={errors:[],warnings:[{code:'IMAGE_LOW_DPI',origin:'template',source:'package-asset://background',role:'ai-design-background',effectiveDpi:144.5,minimumDpi:300,pageNumber:2,message:'low DPI'},{code:'IMAGE_LOW_DPI',origin:'template',source:'package-asset://background',role:'ai-design-background',effectiveDpi:144.5,minimumDpi:300,pageNumber:1,message:'low DPI'},{code:'IMAGE_LOW_DPI',origin:'receipt',source:'production-asset://school',role:'school-song',effectiveDpi:198,minimumDpi:300,pageNumber:2,message:'low DPI'}],images:{plan:{uses:[{}]}}};
 send({type:'calendar:production-inspection-result',revisionId:'v4',action:'quick',result:quickResult});assert.equal(generate.disabled,true);
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'quick',result:quickResult});assert.equal(generate.disabled,true);checkbox.checked=true;checkbox.onchange();assert.equal(generate.disabled,false);generate.click();assert.equal(frame.contentWindow.messages.at(-1).action,'request');assert.equal(frame.contentWindow.messages.at(-1).force,false);
 assert.ok(all(host).some(item=>item.textContent==='템플릿 이미지 · 배경 · 144.5 DPI / 기준 300 DPI · 1, 2면 · 2건'));
 assert.ok(all(host).some(item=>item.textContent==='접수 보관 이미지 · 교가 · 198 DPI / 기준 300 DPI · 2면'));
 assert.equal(all(host).filter(item=>item.tag==='li'&&item.textContent?.includes('템플릿 이미지')).length,1);
 window.ACDLProductionPrint.clear();assert.equal(frame.removed,true);
});
