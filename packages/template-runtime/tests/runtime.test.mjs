import assert from "node:assert/strict";
import test from "node:test";

import { TEMPLATE_RUNTIME_VERSION, TemplateRuntime } from "../dist/src/index.js";

const template = {
  schemaVersion: "1.0",
  id: "runtime-smoke",
  revision: 1,
  pages: [
    {
      id: "cover",
      role: "cover-front",
      size: { width: 260, height: 180, unit: "mm" },
      objects: [
        {
          id: "school-name",
          type: "text",
          frame: { x: 20, y: 20, width: 220, height: 30 },
          binding: "school.name",
          style: { fontSize: 28, autoFit: true }
        }
      ]
    }
  ]
};

test("runtime resolves a bound value into a render document", () => {
  const result = new TemplateRuntime().execute(template, {
    schemaVersion: "1.0",
    school: { name: "샘플 학교" }
  });

  assert.equal(result.hasErrors, false);
  assert.equal(result.document.runtimeVersion, TEMPLATE_RUNTIME_VERSION);
  assert.equal(result.document.pages.length, 1);
  assert.equal(result.document.pages[0].objects[0].value, "샘플 학교");
});

test("runtime rejects unsupported contract versions", () => {
  assert.throws(
    () => new TemplateRuntime().execute({ ...template, schemaVersion: "0.9" }, { schemaVersion: "1.0" }),
    /지원하지 않는 Template Contract 버전/
  );
});

test("runtime normalizes legacy monthly calendar design into the shared preset boundary", () => {
  const calendarTemplate={...template,pages:[{id:"month",role:"month-calendar",size:{width:260,height:180,unit:"mm"},objects:[{id:"calendar",type:"calendar",frame:{x:0,y:0,width:260,height:180},style:{design:{presetId:"sample-6",monthTitleStyle:"number-stack",weekdayStyle:"filled-tabs",gridStyle:"boxed"}},value:{rows:5,weekStart:"sunday"}}]}]};
  const result=new TemplateRuntime().execute(calendarTemplate,{schemaVersion:"1.0"});
  const payload=result.document.pages[0].objects[0].payload;
  assert.equal(payload.calendarPreset.schemaVersion,"monthly-calendar-preset.v1");
  assert.equal(payload.calendarPreset.presetId,"academic-boxed");
  assert.deepEqual(payload.calendarPreset.supportedRows,[5,6]);
  assert.equal(payload.calendarLayout.rowsMode,"fixed-5");
  assert.deepEqual(payload.calendarLayout.regions,{titlePercent:10,weekdayPercent:4,dateGridPercent:86});
});

test("runtime keeps six-row placement separate from the sample 3 presentation preset", () => {
  const calendarTemplate={...template,pages:[{id:"month",role:"month-calendar",size:{width:260,height:180,unit:"mm"},objects:[{id:"calendar",type:"calendar",frame:{x:0,y:0,width:260,height:180},style:{design:{presetId:"sample-3"}},value:{rows:6}}]}]};
  const payload=new TemplateRuntime().execute(calendarTemplate,{schemaVersion:"1.0"}).document.pages[0].objects[0].payload;
  assert.equal(payload.rows,6);
  assert.equal(payload.calendarLayout.rowsMode,"fixed-6");
  assert.equal(payload.calendarPreset.presetId,"segmented-underline");
  assert.deepEqual(payload.calendarLayout.regions,{titlePercent:21,weekdayPercent:4,dateGridPercent:75});
});

test("runtime resolves AI design widgets into renderer-ready payloads",()=>{
 const widgetTemplate={...template,pages:[{id:"back",role:"monthly-back",size:{width:260,height:180,unit:"mm"},objects:[
  {id:"mini",type:"mini-calendar-prev",frame:{x:0,y:0,width:60,height:50},value:{year:2027,month:2}},
  {id:"strip",type:"month-date-strip",frame:{x:0,y:55,width:260,height:20},value:{year:2027,month:3}},
  {id:"memo",type:"memo",frame:{x:0,y:80,width:100,height:80},value:{layout:"checklist",title:"TO DO",itemCount:7}}
 ]}]};
 const result=new TemplateRuntime().execute(widgetTemplate,{schemaVersion:"1.0"});
 assert.equal(result.hasErrors,false);
 assert.equal(result.document.pages[0].objects[0].payload.cells.length,35);
 assert.equal(result.document.pages[0].objects[1].payload.days.length,31);
 assert.equal(result.document.pages[0].objects[2].payload.title,"TO DO");
});

test("runtime expands an academic year calendar across the year boundary",()=>{
 const yearTemplate={...template,pages:[{id:"annual",role:"annual-calendar",size:{width:260,height:180,unit:"mm"},objects:[{id:"year",type:"year-calendar",frame:{x:10,y:10,width:240,height:160},value:{year:2028,startMonth:3,monthCount:12,columns:4}}]}]};
 const result=new TemplateRuntime().execute(yearTemplate,{schemaVersion:"1.0"});
 const payload=result.document.pages[0].objects[0].payload;
 assert.equal(payload.months.length,12);
 assert.equal(payload.months[0].key,"2028-03");
 assert.equal(payload.months[10].key,"2029-01");
 assert.equal(payload.months[11].key,"2029-02");
 assert.equal(payload.columns,4);
 assert.equal(payload.months.every(month=>[5,6].includes(month.rows)&&month.cells.length===month.rows*7),true);
});

test("image and image-frame resolve package assets through the same runtime boundary",()=>{
 const imageTemplate={...template,pages:[{id:"images",role:"monthly-back",size:{width:260,height:180,unit:"mm"},objects:[
  {id:"plain-image",type:"image",frame:{x:10,y:10,width:100,height:80},value:{assetId:"photo"}},
  {id:"image-frame",type:"image-frame",frame:{x:120,y:10,width:100,height:80},value:{assetId:"photo"}}
 ]}]};
 const dataset={schemaVersion:"1.0",assets:[{id:"photo",src:"photo.jpg",widthPx:2400,heightPx:1800}]};
 const objects=new TemplateRuntime().execute(imageTemplate,dataset).document.pages[0].objects;
 assert.equal(objects[0].payload.asset.id,"photo");
 assert.equal(objects[1].payload.asset.id,"photo");
 assert.equal(objects[0].payload.effectiveDpi,objects[1].payload.effectiveDpi);
});

test("runtime preserves editor print intent without treating it as a final print policy",()=>{
 const printIntent={schemaVersion:"print-object-intent.v1",structure:"native-vector",paint:{fill:{requiredSpace:"cmyk",resolution:"pending-cmyk-authoring"}}};
 const intentTemplate={...template,pages:[{...template.pages[0],objects:[{...template.pages[0].objects[0],printIntent}]}]};
 const object=new TemplateRuntime().execute(intentTemplate,{schemaVersion:"1.0",school:{name:"의도 보존 학교"}}).document.pages[0].objects[0];
 assert.deepEqual(object.printIntent,printIntent);
 assert.equal(object.print,undefined);
});

test("print target uses an approved Package asset without replacing the screen payload",()=>{
 const printAsset={ref:"package",id:"assets/images/photo-cmyk.jpg",sha256:"b".repeat(64),mimeType:"image/jpeg",pixelWidth:1600,pixelHeight:1200,colorSpace:"cmyk",outputConditionIdentifier:"Japan Color 2011 Coated"};
 const imageTemplate={...template,pages:[{...template.pages[0],objects:[{id:"photo",type:"image",frame:{x:10,y:10,width:100,height:70},value:{assetId:"screen-photo"},printAsset}]}]};
 const dataset={schemaVersion:"1.0",assets:[{id:"screen-photo",src:"preview.webp",widthPx:1600,heightPx:1200}]};
 const screen=new TemplateRuntime().execute(imageTemplate,dataset,{target:"screen"}).document.pages[0].objects[0];
 const print=new TemplateRuntime().execute(imageTemplate,dataset,{target:"print"}).document.pages[0].objects[0];
 assert.equal(screen.payload.asset.id,"screen-photo");
 assert.deepEqual(print.payload,printAsset);
});
