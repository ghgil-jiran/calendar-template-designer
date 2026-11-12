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

test('side labels center against a single date line and keep the date at the top of multiline labels',()=>{
 assert.match(shared.css,/ann-heading\{[^}]*align-items:center/);
 assert.match(shared.css,/ann-date\{[^}]*align-self:flex-start/);
 assert.doesNotMatch(shared.css,/align-items:baseline/);
});

test('public holiday labels always use holiday color; non-holiday labels follow each actual day',()=>{
 const refs={holidays:[{name:'휴일',isHoliday:true},{name:'쉬지 않는 국경일',isHoliday:false}],anniversaries:[{name:'기념일'}],solarTerms:[{name:'절기'}],lunars:[{name:'음력'}]};
 const colors={color:'#222222',saturdayColor:'#0000aa',holidayColor:'#aa0000'};
 for(const [weekday,isHoliday,expected] of [[2,false,'#222222'],[6,false,'#0000aa'],[0,false,'#aa0000'],[3,true,'#aa0000']])for(const layout of ['basic-1','basic-2','below','beside',null]){
  const options={weekday,isHoliday,colors,style:layout?{layout}:undefined},html=layout?shared.render({...options,day:1,refs}):shared.renderLegacy(refs,options,['holidays','anniversaries','solarTerms','lunars']);
  assert.match(html,/>휴일<\/span>/);assert.ok(html.includes('data-reference-kind="holidays" style="color:#aa0000">휴일'));
  for(const name of ['쉬지 않는 국경일','기념일','절기','음력'])assert.ok(html.includes('style="color:'+expected+'">'+name),html);
 }
});
test('independent custom colors survive a save and affect all layouts without changing holiday labels',()=>{
 const referenceColors=JSON.parse(JSON.stringify(shared.normalizeColors({anniversaries:{mode:'custom',color:'#112233'},solarTerms:{mode:'custom',color:'#445566'},lunars:{mode:'custom',color:'#778899'}})));
 const refs={holidays:[{name:'공휴일'}],anniversaries:[{name:'기념일'}],solarTerms:[{name:'절기'}],lunars:[{name:'음력'}]};
 const options={weekday:0,isHoliday:true,referenceColors,colors:{holidayColor:'#cc0000'}};
 for(const html of [shared.render({...options,day:1,refs,style:{layout:'below'}}),shared.renderLegacy(refs,options,['holidays','anniversaries','solarTerms','lunars'])]){
  for(const [name,c] of [['공휴일','#cc0000'],['기념일','#112233'],['절기','#445566'],['음력','#778899']])assert.ok(html.includes('style="color:'+c+'">'+name));
 }
 assert.equal(shared.normalizeColors({anniversaries:{mode:'custom',color:'red;bad'}}).anniversaries.color,'#344054');
});
test('old projects receive saved color policy without forcing another annotation layout or editing frozen corrections',()=>{
 const project={book:{elementsByPage:{}},template:{masters:{calendar:{calendarLayout:{gridAppearance:{dateColor:'#222222'},annotations:{layout:'basic-2',fontSize:8}}}}}};
 shared.normalizeProject(project);assert.equal(project.template.masters.calendar.calendarLayout.referenceColors.anniversaries.mode,'inherit');assert.equal(project.template.masters.calendar.calendarLayout.annotations.layout,'basic-2');assert.equal(project.template.masters.calendar.calendarLayout.annotations.fontSize,8);
 const fixed=structuredClone(project);fixed.productionCorrection=true;delete fixed.template.masters.calendar.calendarLayout.referenceColors;shared.normalizeProject(fixed);assert.equal(fixed.template.masters.calendar.calendarLayout.referenceColors,undefined);
 const missing={book:{},template:{masters:{calendar:{}}}};shared.normalizeProject(missing);assert.equal(missing.template.masters.calendar.calendarLayout.annotations,undefined);
});

test('saved new category policy follows actual date palette even with obsolete global custom colors',()=>{
 const html=shared.render({day:1,weekday:2,refs:{holidays:[{name:'휴일'}],anniversaries:[{name:'기념일'}]},style:{layout:'below',colorMode:'custom',color:'#ff0000',holidayColor:'#ff0000'},referenceColors:shared.normalizeColors(),colors:{color:'#222222',holidayColor:'#cc0000'}});
 assert.ok(html.includes('style="color:#222222">기념일'));assert.ok(html.includes('style="color:#cc0000">휴일'));
});

test('poster date labels use the shared category color policy',async()=>{
 await import('../apps/designer-studio/shared-screen-mini-calendar.js');
 const p={settings:{calendarData:{}},template:{masters:{calendar:{calendarLayout:{referenceColors:shared.normalizeColors({solarTerms:{mode:'custom',color:'#123456'}})}}}},book:{events:[],calendarReference:{years:{2027:{public_holiday:{items:[{date:'2027-03-02',name:'공휴일',isHoliday:true}]},anniversary:{items:[{date:'2027-03-03',name:'기념일'}]},solar_term:{items:[{date:'2027-03-03',name:'절기'}]}}}}}};
 const cells=[{date:'2027-03-02',weekday:2,month:3,day:2},{date:'2027-03-03',weekday:3,month:3,day:3}],annual={columns:1,months:[{year:2027,month:3,rows:1,cells,headers:[]}]};
 const html=globalThis.ACDLSharedMiniCalendar.renderPosterCalendarMarkup(annual,{style:{dateColor:'#222222'},posterShowList:false},p);
 assert.match(html,/color:#d92d20">공휴일/);assert.match(html,/color:#222222">기념일/);assert.match(html,/color:#123456">절기/);
});
