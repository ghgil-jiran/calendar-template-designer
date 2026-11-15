export function measuredMonth({two=230,three=204,mode='auto',zoom=1,percent=50}={}){
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
export function withCss(fn){const old=globalThis.getComputedStyle;globalThis.getComputedStyle=node=>node.css;try{fn()}finally{globalThis.getComputedStyle=old}}
