import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/ai-design/page-composition-policy.js';
import '../apps/designer-studio/ai-design/design-type-catalog@0.3.0.js';
import '../apps/designer-studio/page-composition-runtime.js';

const policy=globalThis.ACDLPageCompositionPolicy;
const catalog=globalThis.ACDLDesignTypeCatalog;

test('every selectable page type has a semantic rule',()=>{
 for(const [role,meta] of Object.entries(catalog.roles)){
  const kind=role==='annual'?'divider':role;
  for(const [type] of meta.options){
   if(role==='annual'||role==='divider')continue; // Annual lives on a selected physical inside/divider surface.
   assert.ok(policy.rule(kind,type),`${role}/${type}`);
  }
 }
 assert.equal(Object.values(policy.rules).reduce((sum,items)=>sum+Object.keys(items).length,0),25);
});

test('photo and functional page types require the object that gives the type meaning',()=>{
 assert.deepEqual(policy.validate('cover','center-photo',['year','school-name'],'photo-wide').missing,['school-building']);
 assert.deepEqual(policy.validate('month','split-calendar-image',[]).missing,['image-frame']);
 assert.equal(policy.validate('month-back','photo-collage',['image'],'collage-date-strip',{imageCount:1}).reason,'too-few-images');
 assert.equal(policy.validate('divider','annual-calendar',['annual-calendar'],'content-led').reason,'unsupported-layout');
 assert.equal(policy.validate('divider','blank',[]).valid,true);
 assert.equal(policy.validate('divider','school-symbols',['title']).reason,'empty-content');
 assert.equal(policy.validate('divider','annual-calendar',['annual-calendar'],'open-grid').valid,true);
});

test('starting selections include required objects while preserving optional choices as explicit defaults',()=>{
 assert.deepEqual(policy.initial('cover','center-photo'),['year','school-building','school-name','school-logo','school-slogan']);
 assert.deepEqual(policy.initial('month-back','memo-calendar'),['current-calendar','memo']);
 assert.deepEqual(policy.initial('divider','yearly-plan'),['yearly-plan']);
});

test('annual choices render twelve real months with the selected grouping across the academic year',()=>{
 for(const [layout,groups] of [['open-grid',0],['individual-month-boxes',0],['vertical-three-month-groups',3],['horizontal-four-month-groups',4]]){
  const annual=globalThis.ACDLPageCompositionRuntime.resolveAnnualCalendar({layoutType:layout,startMonth:3,monthCount:12,columns:4},{calendarYear:2027},{year:2027,startMonth:3});
  assert.equal(annual.layout,layout);
  assert.equal(annual.groupSize,groups);
  assert.deepEqual([annual.months[0].year,annual.months[0].month,annual.months[11].year,annual.months[11].month],[2027,3,2028,2]);
  assert.ok(annual.months.every(month=>month.cells.length>=28));
 }
});

test('school symbol zones fit standard and wide trim sizes while reserving a readable song panel',()=>{
 const selected=['title','school-logo','school-motto','school-song','school-tree','school-flower'];
 for(const size of [{width:260,height:180},{width:297,height:148}]){
  const boxes=policy.schoolSymbolBoxes(selected,size),song=boxes.find(item=>item.id==='school-song');
  assert.equal(boxes.length,selected.length);
  assert.ok(song.width*size.width/100>=90);
  assert.ok(song.height*size.height/100>=95);
  assert.ok(boxes.every(item=>item.x>=0&&item.y>=0&&item.x+item.width<=100&&item.y+item.height<=100));
  assert.ok(boxes.filter(item=>['school-tree','school-flower'].includes(item.id)).every(item=>item.x+item.width<song.x));
 }
 const withoutSong=policy.schoolSymbolBoxes(['school-motto','school-tree'],{width:297,height:148});
 assert.ok(withoutSong.every(item=>item.width>60));
});

test('school introduction photo and optional school data share safe zones on standard and wide pages',()=>{
 for(const size of [{width:260,height:180},{width:297,height:148}]){
  for(const layout of ['school-intro-center-image','school-intro-left-image','school-intro-background-image']){
   const boxes=policy.schoolIntroductionBoxes(['title','school-building','school-logo','school-motto'],layout,size);
   assert.deepEqual(new Set(boxes.map(item=>item.id)),new Set(['title','school-building','school-logo','school-motto']));
   assert.ok(boxes.every(item=>item.x>=0&&item.y>=0&&item.x+item.width<=100&&item.y+item.height<=100));
   const onlyMotto=policy.schoolIntroductionBoxes(['title','school-building','school-motto'],layout,size);
   assert.equal(onlyMotto.some(item=>item.id==='school-logo'),false);
   if(layout==='school-intro-left-image')assert.equal(onlyMotto.find(item=>item.id==='school-motto').y,20);
  }
 }
});

test('academic schedule and Yearly Plan reserve distinct twelve-month content regions',()=>{
 const schedule=policy.twelveMonthZones('academic-schedule',{title:true});
 const plan=policy.twelveMonthZones('yearly-plan',{title:false});
 assert.deepEqual(schedule.content,{x:5,y:15,width:90,height:80});
 assert.deepEqual(plan.content,{x:5,y:5,width:90,height:90});
 assert.ok(schedule.title.y+schedule.title.height<=schedule.content.y);
 assert.ok(plan.content.width*260/100>=220&&plan.content.height*180/100>=145);
 assert.equal(policy.twelveMonthZones('yearly-plan',{title:true}).content.y,13);
});

test('annual card and annual editor object use a title band above the calendar',()=>{
 for(const layout of ['open-grid','individual-month-boxes','vertical-three-month-groups','horizontal-four-month-groups']){
  const zones=policy.annualZones(layout);
  assert.ok(zones.title.y+zones.title.height<zones.content.y);
  assert.ok(zones.logo.x+zones.logo.width<zones.title.x);
  assert.equal(zones.content.height,73);
 }
 assert.equal(policy.annualZones('vertical-three-month-groups').content.width,88);
});

test('cover layouts place the photo differently and keep year and identity in the safe area',()=>{
 const imageZones=['photo-low','photo-wide','photo-feature'].map(id=>policy.coverZones('center-photo',id).image);
 assert.deepEqual(imageZones.map(zone=>zone[2]),[50,84,84]);
 for(const type of ['center-photo','left-photo','right-photo','free'])for(const layout of ['photo-low','photo-wide','photo-feature']){
  const zones=policy.coverZones(type,layout);
  for(const zone of [zones.image,zones.year,zones.identity].filter(Boolean))assert.ok(zone[0]>=0&&zone[1]>=0&&zone[0]+zone[2]<=100&&zone[1]+zone[3]<=95,`${type}/${layout}`);
 }
});

test('monthly header layouts reserve the same calendar field while moving title and school data',()=>{
 const ids=['distributed-header','center-title-school-left','center-title-block','left-title-split'];
 const profiles=ids.map(id=>policy.monthHeaderZones(id));
 assert.ok(profiles.every(item=>JSON.stringify(item.calendar)===JSON.stringify([5,8,90,87])));
 assert.ok(profiles[3].title[0]<profiles[0].title[0]);
 assert.ok(profiles.every(item=>item.title[1]+item.title[3]<=20));
});

test('back-cover layouts keep primary, photo and identity zones within the standard trim',()=>{
 const cases=[['school-information',['centered-information','lower-information','left-information']],['year-school-information',['centered-year','split-year-information','top-year-information']],['school-photo-information',['center-photo','left-photo','right-photo']]];
 for(const [type,layouts] of cases)for(const id of layouts){
  const zones=policy.backCoverZones(type,id);
  for(const zone of Object.values(zones))assert.ok(zone[0]>=0&&zone[1]>=0&&zone[0]+zone[2]<=100&&zone[1]+zone[3]<=100,`${type}/${id}`);
 }
 assert.deepEqual(policy.backCoverZones('school-photo-information','left-photo').image,[7,14,48,67]);
});

test('back-cover identity boxes reserve a logo, name and contact without overlap',()=>{
 for(const [layout,zone] of [['centered-information',[25,54,50,32]],['left-information',[51,25,41,50]]]){
  const placement=policy.backCoverIdentityBoxes(zone,layout,{logo:true,names:2,details:3});
  assert.equal(placement.names.length,2);
  assert.equal(placement.details.length,3);
  assert.ok(placement.logo.x>=zone[0]);
  assert.ok(placement.names.every(item=>item.x>=zone[0]&&item.x+item.width<=zone[0]+zone[2]));
  assert.ok(placement.details[0].y>=placement.names.at(-1).y+placement.names.at(-1).height);
 }
});
