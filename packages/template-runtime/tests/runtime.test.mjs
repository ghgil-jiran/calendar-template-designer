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
