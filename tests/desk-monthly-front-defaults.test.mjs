import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateCalendarType,saveCalendarType,listCalendarTypes} from '../server/calendar-type-persistence.js';

const context={window:{}};
for(const path of ['monthly-front-defaults.js','calendar-type-domain.js','shared-screen-composition.js','shared-screen-calendar-layout.js','calendar-preset-catalog.js'])vm.runInNewContext(fs.readFileSync(new URL(`../apps/designer-studio/${path}`,import.meta.url),'utf8'),context);
const defaults=context.window.ACDLMonthlyFrontDefaults,domain=context.window.ACDLCalendarTypeDomain,composition=context.ACDLSharedScreenComposition,layout=context.ACDLSharedCalendarLayout,catalog=context.ACDLCalendarPresetCatalog;
const plain=value=>JSON.parse(JSON.stringify(value));

test('four desk kinds carry independent fixed mm defaults through snapshots',()=>{
 const expected={'desk-standard':[13,45,234,120],'desk-large':[15,52,267,143],'desk-wide':[15,40,267,95],'desk-portrait':[12,67,156,174]};
 for(const [id,frame] of Object.entries(expected)){
  const type=domain.definition(id),value=type.monthlyFrontDefaults;
  assert.deepEqual(Object.values(plain(value.gridFrameMm)),frame);assert.equal(value.weekdayHeightMm,7);assert.equal(value.weekdayGapMm,0);
  const snapshot=domain.snapshot(type);type.monthlyFrontDefaults.gridFrameMm.x=99;assert.deepEqual(Object.values(plain(snapshot.definition.monthlyFrontDefaults.gridFrameMm)),frame);
 }
 assert.equal(defaults.initial('desk-mini'),null);
 assert.equal(domain.definition('wall-standard').monthlyFrontDefaults,undefined);
});

test('new project application uses trim mm and does not subtract a title a second time',()=>{
 for(const id of ['desk-standard','desk-large','desk-wide','desk-portrait']){
  const type=domain.definition(id),size=type.finishedSize;
  const project={productType:{pageSize:size},template:{masters:{calendar:{calendarRegion:{x:5,y:16,width:90,height:79},calendarLayout:{monthTitle:{style:{composition:'number-english',numberSize:68.5}}}}}},book:{pageInstances:[{id:'march',role:'monthly-front'}]}};
  defaults.applyNewProject(project,type,composition);const master=project.template.masters.calendar,before=JSON.stringify(master),content=composition.contentFrame(project,project.book.pageInstances[0]);
  layout.separateMonthTitle(master,catalog,master.calendarRegion,size.height);assert.equal(JSON.stringify(master),before);
  const pageFrame=composition.pageFrame(master.calendarRegion,content),expected=type.monthlyFrontDefaults.gridFrameMm;
  for(const key of ['x','y','width','height']){const total=['x','width'].includes(key)?size.width:size.height;assert.ok(Math.abs(pageFrame[key]*total/100-expected[key])<1e-9);}
  assert.equal(master.calendarLayout.monthTitle.style.numberSize,68.5);
  const vertical=layout.resolveVerticalLayout(master,catalog),chrome=layout.resolveChromeLayout({},vertical,pageFrame,size.height,catalog);
  assert.equal(vertical.title,0);assert.ok(Math.abs(chrome.weekdayStage/100*expected.height-7)<1e-9);
  for(const rows of [5,6])assert.ok(Math.abs((expected.height-7)/rows*rows+7-expected.height)<1e-9);
 }
});

test('server and authoring reject invalid or out-of-page defaults without silently clamping',()=>{
 const type=plain(domain.definition('desk-wide'));
 for(const change of [{gridFrameMm:{...type.monthlyFrontDefaults.gridFrameMm,width:300}},{weekdayHeightMm:0},{weekdayGapMm:-1},{weekdayHeightMm:95},{schemaVersion:'unknown'}]){
  const invalid={...type,monthlyFrontDefaults:{...type.monthlyFrontDefaults,...change}};
  assert.equal(domain.validate(invalid).valid,false);assert.throws(()=>validateCalendarType(invalid),error=>error.code==='INVALID_CALENDAR_TYPE');
 }
 const disabled=domain.normalize({...type,monthlyFrontDefaults:null});assert.equal(disabled.monthlyFrontDefaults,null);
});

test('existing size reconciliation and snapshot attachment never apply new grid defaults',()=>{
 const type=domain.definition('desk-standard'),frame={x:9,y:30,width:77,height:51};
 const project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{},template:{masters:{calendar:{calendarRegion:frame,calendarLayout:{monthTitle:{frame:{x:2,y:4,width:20,height:11}}}}}},book:{}};
 const before=JSON.stringify(project.template.masters.calendar);
 domain.attachSnapshot(project,type);domain.applyProjectSize(project,type);domain.reconcileProjectSize(project);
 assert.equal(JSON.stringify(project.template.masters.calendar),before);
});

test('physical weekday settings above the legacy 20% limit keep the requested millimetres',()=>{
 const vertical=layout.resolveVerticalLayout({calendarLayout:{fixedGeometry:{schemaVersion:'monthly-grid-geometry.v1',titlePercent:0,weekdayTrackMm:30,weekdayGapMm:2,measurementSpace:'trim-page'}}},catalog);
 const chrome=layout.resolveChromeLayout({},vertical,{height:100},100,catalog);
 assert.equal(chrome.weekdayStage,30);assert.equal(chrome.boxHeightMm,28);
});

test('REST save/read round trip preserves custom defaults and disabled defaults; missing column stops before writes',async()=>{
 const previousFetch=globalThis.fetch,previousUrl=process.env.SUPABASE_URL,previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://supabase.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
 const type=plain(domain.definition('desk-standard'));type.monthlyFrontDefaults.gridFrameMm.x=14;type.monthlyFrontDefaults.gridFrameMm.width=230;
 const sizes=[{calendar_type_id:type.id,id:`${type.id}-primary`,is_primary:true,finished_width_mm:260,finished_height_mm:180,production_width_mm:266,production_height_mm:186,monthly_front_defaults:null}];
 let missing=false,writes=0;
 globalThis.fetch=async(url,options={})=>{
  const parsed=new URL(url),table=parsed.pathname.split('/').pop(),method=options.method||'GET';
  if(table==='calendar_type_sizes'&&parsed.searchParams.get('select')==='monthly_front_defaults')return new Response(JSON.stringify(missing?{message:'column monthly_front_defaults does not exist'}:[]),{status:missing?400:200});
  if(method!=='GET'){writes++;if(table==='calendar_type_sizes'){Object.assign(sizes[0],JSON.parse(options.body));const saved=sizes[0].monthly_front_defaults;if(saved)sizes[0].monthly_front_defaults={weekdayHeightMm:saved.weekdayHeightMm,weekdayGapMm:saved.weekdayGapMm,gridFrameMm:{height:saved.gridFrameMm.height,width:saved.gridFrameMm.width,y:saved.gridFrameMm.y,x:saved.gridFrameMm.x},schemaVersion:saved.schemaVersion};}return new Response('null',{status:200});}
  const data={calendar_product_families:[{id:'desk',name:'탁상달력'}],calendar_type_definitions:[{id:type.id,name:type.name,product_family_id:'desk',status:'active'}],calendar_type_sizes:sizes,calendar_type_capabilities:[{calendar_type_id:type.id}],calendar_type_page_rules:[]};
  return new Response(JSON.stringify(data[table]||[]),{status:200});
 };
 try{
  const saved=await saveCalendarType(type);assert.deepEqual(plain(defaults.normalize(saved.monthlyFrontDefaults)),type.monthlyFrontDefaults);assert.equal(saved.monthlyFrontDefaultsStorageReady,true);
  assert.deepEqual(plain(defaults.normalize((await listCalendarTypes())[0].monthlyFrontDefaults)),type.monthlyFrontDefaults);
  const disabled=await saveCalendarType({...type,monthlyFrontDefaults:null});assert.equal(disabled.monthlyFrontDefaults,null);
  missing=true;const before=writes;await assert.rejects(saveCalendarType(type),error=>error.code==='MONTHLY_FRONT_DEFAULTS_MIGRATION_REQUIRED');assert.equal(writes,before);
 }finally{globalThis.fetch=previousFetch;if(previousUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=previousUrl;if(previousKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;}
});


test('JSONB key ordering cannot produce false dirty or failed save comparisons',()=>{
 const type=domain.definition('desk-standard'),value=type.monthlyFrontDefaults;
 const shuffled={weekdayGapMm:0,weekdayHeightMm:7,gridFrameMm:{height:120,width:234,y:45,x:13},schemaVersion:value.schemaVersion};
 assert.equal(JSON.stringify(domain.normalize({...type,monthlyFrontDefaults:shuffled}).monthlyFrontDefaults),JSON.stringify(value));
});
