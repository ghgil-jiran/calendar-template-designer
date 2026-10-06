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
 let poll;const body=new Element('body'),document={body,createElement:tag=>new Element(tag)},events={},window={ACDLAdminAuth:{isSignedIn:()=>true,authorizedFetch:async()=>({ok:true,json:async()=>({revisions:[{id:'v5',revision_number:5,created_at:'2026-10-04'}]})})},addEventListener:(type,callback)=>events[type]=callback};
 vm.runInNewContext(readFileSync(new URL('../apps/designer-studio/features/production-print-workspace.js',import.meta.url),'utf8'),{window,document,location:{origin:'https://editor.invalid'},encodeURIComponent,setTimeout:()=>1,clearTimeout(){},setInterval:callback=>{poll=callback;return 2;},clearInterval(){},confirm:()=>true,URL,Blob,Date});
 const host=new Element('section');window.ACDLProductionPrint.mount(host,{receipt:{id:'receipt'}});await tick();const frame=all(host).find(item=>item.tag==='iframe'),generate=all(host).find(item=>item.textContent==='최종 인쇄 PDF 생성·검사'),quick=all(host).find(item=>item.textContent==='빠른 검사 시작'),checkbox=all(host).find(item=>item.tag==='input');
 assert.ok(frame.src.includes('productionRevision=v5'));assert.equal(generate.disabled,true);assert.equal(frame.contentWindow.messages.length,0);
 const send=(data,origin='https://editor.invalid')=>events.message({source:frame.contentWindow,origin,data:{requestId:'receipt',...data}});
 send({type:'calendar:production-editor-ready'},'https://foreign.invalid');assert.equal(frame.contentWindow.messages.length,0);
 send({type:'calendar:production-editor-ready'});assert.deepEqual(frame.contentWindow.messages.map(item=>item.action),['status']);
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'status',result:{jobs:[]}});quick.click();assert.equal(frame.contentWindow.messages.at(-1).action,'quick');
 const quickResult={errors:[],warnings:[{code:'IMAGE_LOW_DPI',origin:'template',source:'package-asset://background',role:'ai-design-background',effectiveDpi:144.5,minimumDpi:300,pageNumber:2,message:'low DPI'},{code:'IMAGE_LOW_DPI',origin:'template',source:'package-asset://background',role:'ai-design-background',effectiveDpi:144.5,minimumDpi:300,pageNumber:1,message:'low DPI'},{code:'IMAGE_LOW_DPI',origin:'receipt',source:'production-asset://school',role:'school-song',effectiveDpi:198,minimumDpi:300,pageNumber:2,message:'low DPI'}],images:{plan:{uses:[{}]}}};
 send({type:'calendar:production-inspection-result',revisionId:'v4',action:'quick',result:quickResult});assert.equal(generate.disabled,true);
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'quick',result:quickResult});assert.equal(generate.disabled,true);checkbox.checked=true;checkbox.onchange();assert.equal(generate.disabled,false);const skip=all(host).find(item=>item.textContent==='업스케일 없이 원본으로 진행');skip.click();assert.equal(generate.disabled,false);generate.click();assert.equal(frame.contentWindow.messages.at(-1).action,'request');assert.equal(frame.contentWindow.messages.at(-1).force,false);assert.ok(all(host).some(item=>item.textContent?.includes('준비가 끝나면 작업 번호와 기존 Worker 실행 명령')));assert.equal(all(host).some(item=>item.textContent==='아직 최종 PDF 작업을 요청하지 않았습니다.'),false);
 assert.ok(all(host).some(item=>item.textContent==='템플릿 이미지 · 배경 · 144.5 DPI / 기준 300 DPI · 보정 검토 대상 (자동 보정 미수행) · 1, 2면 · 2건'));
 assert.ok(all(host).some(item=>item.textContent==='접수 보관 이미지 · 교가 · 198 DPI / 기준 300 DPI · 보정 검토 대상 (자동 보정 미수행) · 2면'));
 assert.equal(all(host).filter(item=>item.tag==='li'&&item.textContent?.includes('템플릿 이미지')).length,1);
 const job={id:'queued-job',status:'queued'};
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'request',result:{job}});
 const status=all(host).find(item=>item.attrs.role==='status'),worker=all(host).find(item=>item.tag==='section'&&item.children.some(child=>child.textContent==='최종 인쇄 PDF·Worker 검사'));
 const beforeStatus=status.textContent,beforeChildren=worker.children;
 assert.ok(beforeStatus.includes('PC에서 기존 PDF Worker 실행이 필요'));poll();assert.equal(status.textContent,beforeStatus);assert.equal(quick.disabled,false);
 send({type:'calendar:production-inspection-result',revisionId:'v5',action:'status',result:{jobs:[job]}});assert.equal(status.textContent,beforeStatus);assert.equal(worker.children,beforeChildren);
 poll();send({type:'calendar:production-inspection-result',revisionId:'v5',action:'status',result:{jobs:[{...job,status:'processing'}]}});assert.ok(status.textContent.includes('생성·검사하고 있습니다'));assert.equal(all(host).some(item=>item.tag==='code'),false);
 window.ACDLProductionPrint.clear();assert.equal(frame.removed,true);
});
