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
    { page: 2, role: "school-symbols" },
    { pages: "3..14", repeat: 12, role: "monthly-calendar", monthOffset: "0..11" },
    { page: 15, role: "back-contact" },
  ],
  masterDefinitions: {
    "cover-front": [{ id: "cover.title", type: "text", role: "title", framePct: { x: 5, y: 5, width: 90, height: 10 }, binding: "school.name" }],
    "monthly-calendar": [{ id: "monthly.calendar", type: "calendar", role: "monthly-calendar", framePct: { x: 5, y: 35, width: 90, height: 60 } }],
  },
};

const plan = createAcademicPackageSurfacePlan(template, 2028, 3);
assert.equal(plan.length, 15);
assert.deepEqual(plan.slice(0, 3).map(({ role, monthKey }) => ({ role, monthKey })), [
  { role: "cover-front", monthKey: undefined },
  { role: "school-symbols", monthKey: undefined },
  { role: "monthly-calendar", monthKey: "2028-03" },
]);
assert.equal(plan[13].monthKey, "2029-02");
assert.equal(plan.at(-1).role, "back-contact");

const document = createAcademicPackageDocument({
  school: { name: "벽걸이 검증 학교" },
  calendar: { year: 2028, startMonth: 3, gridRows: 5, events: [] },
}, template, { pageSize: { width: 297, height: 420, unit: "mm" }, expectedSurfaceCount: 15 });
assert.equal(document.template.id, "wall-academic-standard");
assert.equal(document.template.pages.length, 15);
assert.deepEqual(document.template.pages[2].size, { width: 297, height: 420, unit: "mm" });
assert.deepEqual(document.template.pages[2].objects[0].payload, { year: 2028, month: 3, gridRows: 6 });
assert.throws(
  () => createAcademicPackageDocument({ calendar: { year: 2028 } }, template, { pageSize: { width: 297, height: 420 }, expectedSurfaceCount: 28 }),
  /surface count mismatch/,
);

console.log("academic package surface plan tests passed");
