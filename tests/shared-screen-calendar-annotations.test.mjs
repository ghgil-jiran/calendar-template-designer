import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../apps/designer-studio/shared-screen-calendar-annotations.js';
const shared=globalThis.ACDLSharedCalendarAnnotations;
const refs={holidays:[{name:'선거일'}],anniversaries:[{name:'선 거 일'},{name:'제21대 대통령 및 전국동시지방선거일'}],solarTerms:[{name:'입춘'}],lunars:[{name:'음1.1'}]};
test('four layouts preserve category order, deduplicate names and retain long text',()=>{
 for(const layout of ['basic-1','basic-2','below','beside']){
  const html=shared.render({day:3,weekday:3,refs,style:{layout,fontSize:6}});
  assert.equal((html.match(/>선거일| · 선거일/g)||[]).length,1);
  assert.match(html,/제21대 대통령 및 전국동시지방선거일/);
  assert.match(html,/--ann-right:1.2mm/);
  if(layout==='basic-1')assert.ok(html.indexOf('입춘')<html.indexOf('제21대'));
  if(layout==='basic-2'||layout==='below'||layout==='beside')assert.ok(html.indexOf('제21대')<html.indexOf('입춘'));
 }
 assert.equal(shared.render({style:{}}),'');
});
test('configured sizes and inherited or custom day tones survive JSON reload',()=>{
 const style=JSON.parse(JSON.stringify(shared.normalize({layout:'beside',fontSize:7.5})));
 for(const [weekday,isHoliday,tone] of [[2,false,'#222222'],[6,false,'#0000aa'],[0,false,'#aa0000'],[3,true,'#aa0000']]){
  const html=shared.render({day:3,weekday,isHoliday,refs,style,colors:{color:'#222222',saturdayColor:'#0000aa',holidayColor:'#aa0000'}});
  assert.match(html,new RegExp('--ann-color:'+tone));assert.match(html,/--ann-size:7.5pt/);
 }
 assert.match(shared.render({day:3,weekday:2,refs,style:{layout:'below',colorMode:'custom',color:'#123456'}}),/--ann-color:#123456/);
 assert.match(shared.render({day:3,refs:{holidays:[{name:'<script>alert(1)</script>'}]},style}),/&lt;script&gt;/);
});
test('fitting shrinks only annotations to 80 percent and flags remaining overflow without deleting content',()=>{
 let size=10,warning=null;
 const node={dataset:{annBase:'10'},style:{setProperty(_key,value){size=parseFloat(value)}},querySelector(){return warning},getBoundingClientRect(){return {top:0,left:0,right:100,width:100}},get scrollHeight(){return size*5},closest(){return {getBoundingClientRect(){return {bottom:43,height:43}}}},ownerDocument:{createElement(){return {remove(){warning=null}}}},appendChild(value){warning=value}};
 const root={querySelectorAll(selector){return selector==='.calendar-annotations-day'?[node]:[]}};
 shared.fit(root);assert.ok(size>=8&&size<10);assert.equal(node.dataset.annOverflow,'false');assert.equal(warning,null);
 node.closest=()=>({getBoundingClientRect:()=>({bottom:30,height:30})});shared.fit(root);assert.equal(size,8);assert.equal(node.dataset.annOverflow,'true');assert.equal(warning.textContent,'부가정보 공간 부족');
});
test('annotation styles retain wrapping and inherited font without ellipsis',()=>{
 const module=fs.readFileSync(new URL('../apps/designer-studio/shared-screen-calendar-annotations.js',import.meta.url),'utf8');
 assert.match(module,/font-family:inherit/);assert.doesNotMatch(module,/text-overflow:ellipsis|line-clamp:2/);
});
