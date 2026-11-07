import assert from "node:assert/strict";
import test from "node:test";

import { TemplateRuntime } from "../dist/src/index.js";

const k100 = { space: "cmyk", c: 0, m: 0, y: 0, k: 1 };
const red = { space: "cmyk", c: 0, m: 0.95, y: 0.9, k: 0 };
const blue = { space: "cmyk", c: 0.9, m: 0.55, y: 0, k: 0 };
const font = { ref: "package", assetId: "fonts/pretendard-bold.otf", sha256: "b".repeat(64), postscriptName: "Pretendard-Bold", license: "OFL-1.1", outlineAllowed: true };
const vector = extra => ({ structure: "native-vector", ...extra });

const template = {
  schemaVersion: "1.0",
  id: "runtime-screen-print-parity",
  revision: 1,
  printContract: {
    schemaVersion: "print-contract.v1",
    profile: "Japan Color 2011 Coated",
    pdfStandard: "PDF/X-4",
    coordinateUnit: "mm",
    productionSizeMm: { width: 266, height: 186 },
    trimSizeMm: { width: 260, height: 180 },
    bleedMm: 3,
    safeInsetMm: 8,
    minimumImageDpi: 300
  },
  pages: [{
    id: "parity.page",
    role: "monthly-front",
    surfaceRole: "monthly-front",
    contentPurpose: "monthly-calendar",
    masterId: "monthly-master",
    size: { width: 260, height: 180, unit: "mm" },
    background: { color: "#f8f5ef", token: "paper.warm" },
    metadata: { calendarYear: 2028, calendarMonth: 3, layoutVersion: 4 },
    objects: [
      {
        id: "title",
        type: "text",
        role: "month-title",
        frame: { x: 12.5, y: 9.25, width: 68.5, height: 18.75 },
        binding: "variables.monthTitle",
        style: {
          fontFamily: "Pretendard",
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "left",
          letterSpacing: -0.3,
          color: "#111111"
        },
        print: vector({ textMode: "outline", font, blackMode: "k100", fill: k100 }),
        rotation: -2.5,
        opacity: 0.92,
        zIndex: 30,
        runtimeWidget: { variant: "stacked-number" },
        editPolicy: { content: true, position: false },
        metadata: { semanticKey: "month.heading" }
      },
      {
        id: "photo",
        type: "image-frame",
        role: "monthly-photo",
        frame: { x: 147, y: 12, width: 101, height: 54 },
        binding: "monthlyImages.2028-03",
        style: { fit: "cover", focusX: 0.35, focusY: 0.6, borderRadius: 2 },
        print: {
          structure: "raster-image",
          image: { kind: "photo", readiness: "print-ready", minimumDpi: 300, replaceableByUser: true }
        },
        opacity: 0.88,
        rotation: 1.25,
        zIndex: 10,
        userReplaceable: true
      },
      {
        id: "calendar",
        type: "calendar-grid",
        role: "calendar-grid",
        frame: { x: 12, y: 73, width: 236, height: 95 },
        value: { year: 2028, month: 3, weekStart: "monday", rows: 5 },
        style: { cellGap: 1.5, weekdayStyle: "filled-tabs", gridStyle: "boxed" },
        print: vector({ textMode: "outline", font, blackMode: "k100", stroke: k100 }),
        zIndex: 20
      },
      {
        id: "accent",
        type: "group",
        role: "accent-group",
        frame: { x: 92, y: 14, width: 42, height: 34 },
        style: { blendMode: "normal" },
        print: vector(),
        zIndex: 40,
        children: [
          {
            id: "accent.red",
            type: "shape",
            role: "accent-red",
            shapeType: "rect",
            frame: { x: 0, y: 0, width: 18, height: 18 },
            style: { fill: "#ed1c24", strokeWidth: 0 },
            print: vector({ fill: red }),
            rotation: 12,
            opacity: 0.75,
            zIndex: 1
          },
          {
            id: "accent.blue",
            type: "shape",
            role: "accent-blue",
            shapeType: "line",
            frame: { x: 4, y: 25, width: 34, height: 0 },
            style: { stroke: "#0072bc", strokeWidth: 0.6, dash: [2, 1] },
            print: vector({ stroke: blue }),
            zIndex: 2
          }
        ]
      }
    ]
  }]
};

const dataset = {
  schemaVersion: "1.0",
  variables: { monthTitle: "3월" },
  monthlyImages: { "2028-03": { assetId: "march-photo" } },
  assets: { "march-photo": { id: "march-photo", src: "march-photo.tif", widthPx: 2400, heightPx: 1600 } },
  calendar: { weekStart: "sunday", gridRows: 6 }
};

test("screen and print targets preserve the exact resolved page, object layout, style, and bindings", () => {
  const runtime = new TemplateRuntime();
  const screen = runtime.execute(structuredClone(template), structuredClone(dataset), {
    target: "screen",
    strictBindings: true,
    collisionPolicy: "ignore"
  });
  const print = runtime.execute(structuredClone(template), structuredClone(dataset), {
    target: "print",
    strictBindings: true,
    collisionPolicy: "ignore"
  });

  assert.equal(screen.hasErrors, false);
  assert.equal(print.hasErrors, false);
  assert.deepEqual(print.document.pages, screen.document.pages);
  assert.deepEqual(print.document.printContract, screen.document.printContract);

  const objects = new Map(print.document.pages[0].objects.map(object => [object.id, object]));
  const title = objects.get("title");
  const photo = objects.get("photo");
  const calendar = objects.get("calendar");
  const accent = objects.get("accent");
  assert.deepEqual(title.frame, template.pages[0].objects[0].frame);
  assert.equal(title.value, "3월");
  assert.equal(title.style.fontFamily, "Pretendard");
  assert.equal(title.style.fontWeight, 700);
  assert.equal(title.rotation, -2.5);
  assert.equal(title.opacity, 0.92);
  assert.equal(title.zIndex, 30);
  assert.equal(photo.payload.asset.src, "march-photo.tif");
  assert.equal(photo.style.fit, "cover");
  assert.equal(photo.userReplaceable, true);
  assert.equal(calendar.payload.weekStart, "monday");
  assert.equal(calendar.payload.rows, 5);
  assert.equal(accent.children[0].print.fill.m, 0.95);
  assert.deepEqual(accent.children[1].style.dash, [2, 1]);
  assert.equal(accent.children[1].shapeType, "line");
});

test("print validation diagnostics do not mutate screen layout or style", () => {
  const invalidForPrint = structuredClone(template);
  delete invalidForPrint.pages[0].objects[0].print;

  const runtime = new TemplateRuntime();
  const screen = runtime.execute(structuredClone(invalidForPrint), structuredClone(dataset), { target: "screen", collisionPolicy: "ignore" });
  const print = runtime.execute(structuredClone(invalidForPrint), structuredClone(dataset), { target: "print", collisionPolicy: "ignore" });

  assert.equal(screen.hasErrors, false);
  assert.equal(print.hasErrors, true);
  assert.ok(print.document.diagnostics.some(item => item.code === "PRINT_OBJECT_POLICY_MISSING" && item.objectId === "title"));
  assert.deepEqual(print.document.pages, screen.document.pages);
});
