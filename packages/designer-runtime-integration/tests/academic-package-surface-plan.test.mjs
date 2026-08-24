import assert from "node:assert/strict";
import { createAcademicPackageDocument, createAcademicPackageSurfacePlan } from "../dist/AcademicPackageSurfacePlan.js";

const template = {
  schemaVersion: "template.v2-draft",
  templateId: "wall-academic-standard",
  version: "0.1.0",
  extractionStatus: "package-contract-review",
  calendar: { defaultRows: 6, defaultWeekStart: "sunday" },
  pageSequence: [
    { page: 1, role: "cover-front" },
    { pages: "2..13", repeat: 12, role: "monthly-calendar", monthOffset: "0..11" },
  ],
  masterDefinitions: {
    "cover-front": [{ id: "cover.title", type: "text", role: "title", framePct: { x: 5, y: 5, width: 90, height: 10 }, binding: "school.name" }],
    "monthly-calendar": [{ id: "monthly.calendar", type: "calendar", role: "monthly-calendar", framePct: { x: 5, y: 35, width: 90, height: 60 } }],
  },
};

const plan = createAcademicPackageSurfacePlan(template, 2028, 3);
assert.equal(plan.length, 13);
assert.deepEqual(plan.slice(0, 3).map(({ role, monthKey }) => ({ role, monthKey })), [
  { role: "cover-front", monthKey: undefined },
  { role: "monthly-calendar", monthKey: "2028-03" },
  { role: "monthly-calendar", monthKey: "2028-04" },
]);
assert.equal(plan.at(-1).monthKey, "2029-02");

const document = createAcademicPackageDocument({
  school: { name: "벽걸이 검증 학교" },
  calendar: { year: 2028, startMonth: 3, gridRows: 5, events: [] },
}, template, { pageSize: { width: 297, height: 420, unit: "mm" }, expectedSurfaceCount: 13 });
assert.equal(document.template.id, "wall-academic-standard");
assert.equal(document.template.pages.length, 13);
assert.deepEqual(document.template.pages[1].size, { width: 297, height: 420, unit: "mm" });
assert.deepEqual(document.template.pages[1].objects[0].payload, { year: 2028, month: 3, gridRows: 6 });
assert.throws(
  () => createAcademicPackageDocument({ calendar: { year: 2028 } }, template, { pageSize: { width: 297, height: 420 }, expectedSurfaceCount: 28 }),
  /surface count mismatch/,
);

console.log("academic package surface plan tests passed");
