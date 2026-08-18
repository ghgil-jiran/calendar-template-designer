import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  composeDeskAcademicPackageDocument,
  createAcademicMonths,
  createDeskAcademicAdaptedDocument,
  createDeskAcademicSurfacePlan,
  validateDeskAcademicPackageDocument
} from "../dist/index.js";

const months = createAcademicMonths(2027, 3);
assert.equal(months.length, 12);
assert.equal(months[0].key, "2027-03");
assert.equal(months.at(-1).key, "2028-02");
assert.throws(() => createAcademicMonths(2027, 13), /between 1 and 12/);

const plan = createDeskAcademicSurfacePlan(2027, 3);
assert.equal(plan.length, 28);
assert.deepEqual(plan.slice(0, 4), [
  { index: 0, sheet: 1, side: "front", role: "cover-front" },
  { index: 1, sheet: 1, side: "back", role: "annual-calendar" },
  { index: 2, sheet: 2, side: "front", role: "school-symbols" },
  { index: 3, sheet: 2, side: "back", role: "monthly-photo-memo", monthKey: "2027-03" }
]);
assert.deepEqual(plan.slice(-2), [
  { index: 26, sheet: 14, side: "front", role: "monthly-calendar", monthKey: "2028-02" },
  { index: 27, sheet: 14, side: "back", role: "back-contact" }
]);

const dataset = {
  schemaVersion: "1.0",
  school: {
    name: "테스트 학교",
    profile: { building: "asset:school-building" },
    contact: { address: "서울", telAcademic: "02-1", telAdmin: "", fax: "", site: "" }
  },
  calendar: { year: 2027, startMonth: 3, events: [] },
  monthlyImages: Object.fromEntries(months.map(({ key }) => [key, `asset:${key}`]))
};
const before = JSON.stringify(dataset);
const adapted = createDeskAcademicAdaptedDocument(dataset);
assert.equal(adapted.template.pages.length, 28);
assert.equal(adapted.template.pages[3].monthKey, "2027-03");
assert.equal(adapted.template.pages[26].monthKey, "2028-02");
assert.equal(adapted.dataset, dataset);
assert.equal(JSON.stringify(dataset), before);

const template = JSON.parse(await readFile(new URL("../../../templates/desk-academic-standard/1.0.0/template.json", import.meta.url), "utf8"));
const document = composeDeskAcademicPackageDocument(dataset, template);
assert.equal(document.template.pages.length, 28);
assert.equal(document.template.pages.filter((page) => page.role === "monthly-calendar").length, 12);
assert.equal(document.template.pages.filter((page) => page.role === "monthly-photo-memo").length, 12);
assert.equal(document.template.pages[3].objects[0].contract.children[0].payload, "asset:2027-03");
assert.equal(document.template.pages.at(-1).role, "back-contact");
assert.deepEqual(validateDeskAcademicPackageDocument(document).filter((item) => item.severity === "error"), []);

console.log("desk academic surface plan tests passed");
