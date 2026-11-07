import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
// DOM contract fixture executes the actual settings handlers and editor-start path.
class Element{
 constructor(tag='div',attrs={}){this.tag=tag;this.attrs=attrs;this.children=[];this.listeners={};this.value=attrs.value||'';this.hidden='hidden'in attrs;this.disabled=false;this.textContent='';this.style={setProperty(){},removeProperty(){}};this.classList={toggle(){}};}
 set innerHTML(html){this.children=[];const stack=[this],voids=new Set(['input','img','br','hr']);for(const token of html.matchAll(/<\/?([\w-]+)([^>]*)>/g)){const [raw,tag,attributes]=token;if(raw.startsWith('</')){if(stack.at(-1).tag===tag)stack.pop();continue;}const attrs={};for(const a of attributes.matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';const e=new Element(tag,attrs);stack.at(-1).appendChild(e);if(!voids.has(tag))stack.push(e);}for(const e of this.all())if(e.tag==='select')e.value=e.children.find(c=>c.tag==='option')?.attrs.value||'';}
 get name(){return this.attrs.name;}get id(){return this.attrs.id;}set id(v){this.attrs.id=v;}get innerHTML(){return '';}all(){return this.children.flatMap(e=>[e,...e.all()]);}appendChild(e){e.parent=this;this.children.push(e);return e;}
 matches(selector){if(selector.startsWith('#'))return this.attrs.id===selector.slice(1);const m=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);if(m)return m[1]in this.attrs&&(m[2]===undefined||this.attrs[m[1]]===m[2]);return this.tag===selector;}
 querySelectorAll(selector){return this.all().filter(e=>selector.split(',').some(s=>e.matches(s.trim())));}querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 get elements(){const entries=this.all().filter(e=>e.attrs.name);const result={namedItem:name=>entries.find(e=>e.attrs.name===name)};entries.forEach(e=>result[e.attrs.name]=e);return result;}
 get options(){return this.children.filter(e=>e.tag==='option');}get dataset(){return Object.fromEntries(Object.entries(this.attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}async fire(type,target=this){const event={target,preventDefault(){}};for(const fn of this.listeners[type]||[])await fn(event);if(this['on'+type])await this['on'+type](event);}
 closest(selector){return this.matches(selector)?this:this.parent?.closest(selector);}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getBoundingClientRect(){return {top:0,bottom:200};}scrollIntoView(){}showModal(){this.open=true;}close(){this.open=false;this.fire('close');}reset(){for(const e of this.all())if(e.attrs.name)e.value=e.tag==='select'?e.options[0]?.attrs.value||'':e.attrs.value||'';}
}
Element.prototype.replaceWith=function(e){const i=this.parent.children.indexOf(this);this.parent.children[i]=e;e.parent=this.parent;};
Element.prototype.after=function(e){const i=this.parent.children.indexOf(this);this.parent.children.splice(i+1,0,e);e.parent=this.parent;};
Element.prototype.append=Element.prototype.appendChild;
function setup(){
 const body=new Element('body');body.innerHTML='<section data-resource-content="design-types"><h3>디자인 유형 설정</h3><label><input id="noAIDesignCheckbox" type="checkbox">AI 디자인 생성 없음</label></section><section data-resource-content="page-settings"><h3>페이지 설정</h3><button id="savePageSettingsBtn"></button></section><button id="newTemplateEnterEditorBtn"></button><div id="resourceModal"></div>';
 const document={body,createElement:tag=>new Element(tag),querySelector:s=>body.querySelector(s),getElementById:id=>body.querySelector('#'+id)},$=id=>document.getElementById(id);
 let calls=[],snapshots=0,dirty=0,renders=0,toasts=[],fail=false;
 const project={settings:{year:2027},productType:{pageSize:{width:260,height:180}},template:{masters:{},masterElements:{},settings:{aiDesignSpec:{dividerPages:{inside:{purpose:'annual-calendar'}}}}},book:{pageInstances:[{id:'cover',role:'cover-front',number:1},{id:'inside',role:'cover-back',number:2},{id:'month',role:'monthly-front',number:3,calendarMonth:3}],elementsByPage:{cover:[{id:'original',type:'text',content:'학교명'}]}}};
 const window={ACDLAdminAuth:{authorizedFetch:async path=>{calls.push(path);if(fail)return {ok:false};return {ok:true,json:async()=>JSON.parse(JSON.stringify(catalog))}}}};
 const context=vm.createContext({window,document,project,structuredClone,aiDesignGenerationState:'idle',aiMonthlyExpansionState:'idle',newTemplateSetupInProgress:true,el:$,snapshot:()=>snapshots++,markDirty:()=>dirty++,stable(){},render:()=>renders++,showEditorToast:t=>toasts.push(t),switchResourcePage(){},updateNewTemplateSettingsActions(){ $('newTemplateEnterEditorBtn').disabled=false; },roleLabel:p=>p.role});
 for(const file of ['graphic-vector-design.js','graphic-package-model.js','graphic-template-mapping.js'])vm.runInContext(readFileSync(new URL('../apps/designer-studio/'+file,import.meta.url),'utf8'),context);
 const catalog={packages:[{id:'pkg',name:'기준 패키지',size:'desk-standard',status:'active',revision:2,pages:{cover:{graphicId:'cover'},year:{graphicId:'year'}}}],graphics:['cover','year'].map(page=>({id:page,name:page,design:window.ACDLGraphicVectorDesign.normalize({page,backgroundRevision:2}),originalAssetId:page}))};
 const old=$('noAIDesignCheckbox');old.addEventListener('change',()=>{context.project.template.settings.aiDesignDisabled=old.checked;context.updateNewTemplateSettingsActions()});window.ACDLNoAIDesign={refresh:()=>old.checked=context.project.template.settings.aiDesignDisabled===true};
 vm.runInContext(readFileSync(new URL('../apps/designer-studio/features/graphic-template-settings.js',import.meta.url),'utf8'),context);
 return {context,window,$,catalog,calls,toasts,get project(){return context.project},get dirty(){return dirty},get snapshots(){return snapshots},get renders(){return renders},fail:()=>fail=true};
}
async function select(env){env.$('vectorBackgroundCheckbox').checked=true;await env.$('vectorBackgroundCheckbox').fire('change');await env.$('graphicTemplatePackages').parent.fire('click',env.$('graphicTemplatePackages').querySelector('[data-graphic-template-package]'));}
test('vector mode keeps original no-AI control, uses authenticated library and requires a package before starting',async()=>{
 const e=setup();assert.equal(e.$('noAIDesignCheckbox').listeners.change.length,2);e.$('vectorBackgroundCheckbox').checked=true;await e.$('vectorBackgroundCheckbox').fire('change');assert.equal(e.project.template.settings.aiDesignDisabled,true);assert.equal(e.$('noAIDesignCheckbox').checked,true);assert.equal(e.$('newTemplateEnterEditorBtn').disabled,true);assert.deepEqual(e.calls,['/api/template-assets?graphicLibrary=1']);
 await e.$('graphicTemplatePackages').parent.fire('click',e.$('graphicTemplatePackages').querySelector('[data-graphic-template-package]'));assert.equal(e.$('newTemplateEnterEditorBtn').disabled,false);assert.equal(e.project.template.settings.graphicPackage.id,'pkg');assert.equal(e.$('graphicTemplateMapping').hidden,false);assert.ok(e.dirty>0);
});
test('existing template mapping dropdowns change only backgrounds on apply; none and disabling preserve original content',async()=>{
 const e=setup();await select(e);assert.equal(e.project.book.elementsByPage.cover.length,1);const host=e.$('graphicTemplateMapping'),control=host.querySelector('[data-graphic-template-page="inside"]');control.value='cover';await host.fire('change',control);await e.$('graphicTemplateApply').fire('click');assert.equal(e.project.book.elementsByPage.inside[0].graphicSource.graphicId,'cover');assert.equal(e.project.book.elementsByPage.cover[1].id,'original');
 const blank=host.querySelector('[data-graphic-template-page="cover"]');blank.value='none';await host.fire('change',blank);await e.$('graphicTemplateApply').fire('click');assert.equal(e.project.book.elementsByPage.cover.length,1);
 e.$('vectorBackgroundCheckbox').checked=false;await e.$('vectorBackgroundCheckbox').fire('change');assert.equal(host.hidden,true);assert.equal(e.project.book.elementsByPage.inside.length,0);assert.equal(e.project.book.elementsByPage.cover[0].content,'학교명');
});
test('saved package snapshot remains usable even when refreshing library no longer lists it; request failure preserves it',async()=>{
 const e=setup();await select(e);const saved=JSON.stringify(e.project.template.settings.graphicPackage);e.catalog.packages=[];e.catalog.graphics=[];await e.$('graphicTemplateRefresh').fire('click');assert.equal(JSON.stringify(e.project.template.settings.graphicPackage),saved);assert.ok(e.$('graphicTemplateSelected').textContent.includes('기준 패키지'));await e.$('graphicTemplateApply').fire('click');assert.equal(e.project.book.elementsByPage.cover[0].type,'vector');e.fail();await e.$('graphicTemplateRefresh').fire('click');assert.equal(JSON.stringify(e.project.template.settings.graphicPackage),saved);assert.ok(e.$('graphicTemplateFeedback').textContent.includes('불러오지'));
});
test('no-AI new-template start applies selected package after layout; guards missing package and rolls back incompatible size',async()=>{
 const e=setup();await select(e);let layouts=0;e.window.ACDLDesignSpec={read:()=>({})};e.window.ACDLDesignLayoutApplication={apply:()=>{layouts++;return {}}};e.window.ACDLMonthBackComposition={applyConfigured:()=>({})};e.context.prepareNeutralAIDesignBase=()=>{};e.context.setEditorContext=()=>{};e.context.document.body.classList={remove(){}};e.$('resourceModal').classList={add(){}};
 const source=readFileSync(new URL('../apps/designer-studio/features/no-ai-design-runtime.js',import.meta.url),'utf8');vm.runInContext(source.slice(source.indexOf('async function startTemplateEditorWithoutAI')),e.context);await vm.runInContext('startTemplateEditorWithoutAI()',e.context);assert.equal(e.project.book.elementsByPage.cover[0].role,'graphic-package-background');assert.equal(e.context.newTemplateSetupInProgress,false);assert.equal(layouts,1);
 e.context.newTemplateSetupInProgress=true;delete e.project.template.settings.graphicPackage;await vm.runInContext('startTemplateEditorWithoutAI()',e.context);assert.equal(layouts,1);assert.ok(e.toasts.at(-1).includes('패키지'));
 await e.$('graphicTemplatePackages').parent.fire('click',e.$('graphicTemplatePackages').querySelector('[data-graphic-template-package]'));e.project.productType.pageSize.width=297;const before=JSON.stringify(e.project);await vm.runInContext('startTemplateEditorWithoutAI()',e.context);assert.equal(JSON.stringify(e.project),before);assert.equal(e.context.newTemplateSetupInProgress,true);
});


test('actual editor renderer places vector background in background layer beneath content without drag handlers',async()=>{
 const e=setup();await select(e);e.window.ACDLGraphicTemplateSettings.apply();
 const source=readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8'),start=source.indexOf('renderFreeElements=function(pageNode)'),end=source.indexOf('function permissionHTML',start);
 Object.defineProperty(Element.prototype,'childElementCount',{get(){return this.children.length},configurable:true});
 Object.assign(e.context,{allVisibleElements:()=>e.project.book.elementsByPage.cover,selectedElementId:null,selectedElementScope:'page',preview:false,graphicMarkup:view=>e.window.ACDLGraphicTemplateMapping.svg(view.colors),resolveTextContent:()=> '학교명',selectedPage:()=>e.project.book.pageInstances[0],applyTextElementStyles(){},startElementPointer(){}});
 vm.runInContext(source.slice(start,end),e.context);const page=new Element();e.context.renderFreeElements(page);
 assert.equal(page.children[0].className,'ai-background-layer');assert.equal(page.children[0].childElementCount,1);assert.equal(page.children[0].children[0].querySelector('svg').attrs.viewBox,'-15 -15 1330 930');assert.equal(page.children[0].children[0].listeners.pointerdown,undefined);
 assert.equal(page.children[1].className,'free-layer');assert.equal(page.children[1].childElementCount,1);
});


test('top menus keep mapping in design types; monthly default visibly changes actual editor backgrounds independently',async()=>{
 const e=setup();for(const key of ['month-front','month-back']){e.catalog.packages[0].pages[key]={graphicId:key};e.catalog.graphics.push({id:key,name:key,design:e.window.ACDLGraphicVectorDesign.normalize({page:key,backgroundRevision:2,familyTuning:{tone:100,density:100,scale:100}})})}
 e.project.book.pageInstances.push({id:'april',role:'monthly-front',calendarMonth:4},{id:'back',role:'monthly-back',calendarMonth:3});await select(e);
 const host=e.$('graphicTemplateMapping');assert.equal(host.parent.parent.attrs['data-resource-content'],'design-types');assert.equal(e.$('graphicTemplateMonthly').hidden,true);
 const nav=host.parent.querySelector('nav');await nav.fire('click',nav.querySelector('[data-graphic-settings-tab="monthly"]'));assert.equal(host.hidden,true);assert.equal(e.$('graphicTemplateMonthly').hidden,false);
 const monthly=e.$('graphicTemplateMonthly');const front=monthly.querySelector('[data-graphic-month-role="monthly-front"]');assert.equal(front.value,'monthly');e.window.ACDLGraphicTemplateSettings.apply();const first=e.project.book.elementsByPage.month[0],next=e.project.book.elementsByPage.april[0];assert.notEqual(e.window.ACDLGraphicTemplateMapping.svg(first.colors),e.window.ACDLGraphicTemplateMapping.svg(next.colors));
 front.value='same';await monthly.fire('change',front);e.window.ACDLGraphicTemplateSettings.apply();assert.equal(e.window.ACDLGraphicTemplateMapping.svg(e.project.book.elementsByPage.month[0].colors),e.window.ACDLGraphicTemplateMapping.svg(e.project.book.elementsByPage.april[0].colors));assert.equal(e.project.book.elementsByPage.back[0].colors.graphicDesign.variation,'monthly');
 const tone=monthly.querySelector('[data-graphic-month-field="tone"]');tone.value='125';await monthly.fire('change',tone);e.window.ACDLGraphicTemplateSettings.apply();assert.equal(e.project.book.elementsByPage.month[0].colors.graphicDesign.familyTuning.tone,125);assert.equal(e.project.book.elementsByPage.back[0].colors.graphicDesign.familyTuning.tone,100);
});
test('footer enters editing for existing template after applying backgrounds and is also available for no-AI without vector',async()=>{
 const e=setup();await select(e);e.context.newTemplateSetupInProgress=false;e.context.document.body.classList={remove(){}};e.$('resourceModal').classList={add(){}};await e.$('graphicTemplateEnter').fire('click');assert.equal(e.project.book.elementsByPage.cover[0].role,'graphic-package-background');assert.ok(e.toasts.at(-1).includes('편집 화면'));e.$('vectorBackgroundCheckbox').checked=false;await e.$('vectorBackgroundCheckbox').fire('change');assert.equal(e.$('graphicTemplateEnter').parent.hidden,false);assert.equal(e.$('graphicTemplateEnter').textContent,'편집으로 이동');
});
