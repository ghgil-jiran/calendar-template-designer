import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/wall-calendar-policy.js';
const wall=ACDLWallCalendar;
function measuredMonth({two=230,three=204,mode='auto',zoom=1,percent=50}={}){
 const css={paddingTop:'0',paddingBottom:'0',borderTopWidth:'0',borderBottomWidth:'0',marginTop:'0',marginBottom:'0'};
 const header={offsetHeight:38,css},weekday={offsetHeight:20,css};
 const cells=Array.from({length:42},()=>({dataset:{wallRegion:'day'},css:{...css,paddingTop:'2',paddingBottom:'2'},getBoundingClientRect:()=>({top:0}),children:[{getBoundingClientRect:()=>({bottom:22*zoom})}]}));
 const group={style:{columnCount:'2'}},grid={style:{},dataset:{},children:cells,clientWidth:452,clientHeight:144,scrollWidth:452,scrollHeight:144};
 const natural=()=>Number(group.style.columnCount)===3?three:two;
 const list={style:{},dataset:{wallRegion:'list',wallListLayout:mode,wallListPercent:String(percent)},css,clientWidth:452,scrollWidth:452,querySelectorAll:()=>[group],closest:()=>month,get clientHeight(){return this.style.height==='auto'||!this.style.height?natural():Number.parseFloat(this.style.height)},get offsetHeight(){return this.clientHeight},get scrollHeight(){return Math.max(natural(),this.clientHeight)}};
 const month={dataset:{posterMonth:'2027-05'},css:{...css,paddingTop:'5.5',paddingBottom:'5.5'},clientHeight:421,offsetHeight:421,clientWidth:463,scrollWidth:463,get scrollHeight(){return this.clientHeight+Math.max(0,list.scrollHeight-list.clientHeight-5.5)},getBoundingClientRect:()=>({height:421*zoom}),querySelector:()=>grid,children:[header,weekday,grid,list],closest(){return this}};
 grid.closest=()=>month;list.closest=()=>month;
 const scope={querySelectorAll(selector){return selector==='[data-wall-list-layout]'?[list]:selector==='[data-wall-region]'?[month,grid,list]:[]}};
 return {list,grid,month,scope,group};
}
function withCss(fn){const old=globalThis.getComputedStyle;globalThis.getComputedStyle=node=>node.css;try{fn()}finally{globalThis.getComputedStyle=old}}
test('preferred list ratio is not a cap, while date minimums remain protected',()=>{assert.deepEqual(wall.allocateMonthSpace({height:410,chrome:58,gridMinimum:144,listRequired:207,preferredPercent:45}),{available:208,listHeight:207,overflow:0});const full=wall.allocateMonthSpace({height:410,chrome:58,gridMinimum:160,listRequired:204,preferredPercent:50});assert.equal(full.listHeight,192);assert.equal(full.overflow,12)});
test('actual measured content chooses three columns and reclaims spare date-grid height without dropping items',()=>withCss(()=>{const f=measuredMonth();wall.fit(f.scope);assert.equal(f.list.dataset.wallResolvedColumns,'3');assert.equal(f.grid.style.minHeight,'144px');assert.equal(f.list.style.height,'205px');assert.equal(f.list.dataset.wallOverflow,'false');assert.equal(wall.assertFits(f.scope).length,0);const first=JSON.stringify(f.list.dataset);wall.fit(f.scope);assert.equal(JSON.stringify(f.list.dataset),first)}));
test('measurement uses layout pixels consistently under screen zoom and after resizing a print clone',()=>withCss(()=>{for(const zoom of [.5,1,2]){const f=measuredMonth({zoom});f.list.style.height='95px';f.grid.style.minHeight='90px';wall.fit(f.scope);assert.equal(f.grid.style.minHeight,'144px');assert.equal(f.list.style.height,'205px')}}));
test('fixed column count is respected and genuine overflow still blocks printing',()=>withCss(()=>{const f=measuredMonth({mode:'two'});wall.fit(f.scope);assert.equal(f.group.style.columnCount,'2');assert.equal(f.list.style.height,'208px');assert.equal(f.list.dataset.wallOverflow,'true');assert.throws(()=>wall.assertFits(f.scope),/벽보형 인쇄 공간 부족/)}));
test('zero-height allocations recover on the next fit and an empty third-column candidate is not forced',()=>withCss(()=>{const f=measuredMonth({two:180});f.list.style.height='0px';wall.fit(f.scope);assert.equal(f.list.dataset.wallResolvedColumns,'2');assert.equal(f.list.style.height,'205px')}));
