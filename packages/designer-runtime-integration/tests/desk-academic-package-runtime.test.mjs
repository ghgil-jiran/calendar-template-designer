import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildDeskAcademicPackageDocument,
  validateDeskAcademicPackageDocument
} from "../dist/index.js";

const template = JSON.parse(await readFile(new URL("../../../templates/desk-academic-standard/1.0.0/template.json", import.meta.url), "utf8"));
const size = { width: 260, height: 180, unit: "mm" };
const page = (role, month = null) => ({
  id: `page.${role}`,
  role,
  size,
  objects: [{ id: "legacy", type: "text" }],
  metadata: {},
  calendarYear: month ? 2027 : null,
  calendarMonth: month
});
const roles = ["cover-front", "annual-calendar", "school-symbols", "monthly-calendar", "monthly-photo-memo", "back-contact"];
const adapted = {
  template: { pages: roles.map((role) => page(role, role.startsWith("monthly-") ? 3 : null)) },
  dataset: {
    school: {
      name: "테스트 학교",
      profile: { building: "asset:school-building" },
      contact: { address: "서울", telAcademic: "02-1", telAdmin: "", fax: "", site: "" }
    },
    calendar: { year: 2027, startMonth: 3 },
    monthlyImages: { "2027-03": "asset:march" }
  },
  composition: { complete: true }
};

const document = buildDeskAcademicPackageDocument(adapted, template);
assert.equal(document.template.id, "desk-academic-standard");
assert.equal(document.template.pages.length, 6);
assert.equal(document.dataset.calendar.gridRows, 5);
assert.equal(document.template.pages[0].objects.length, 4);
assert.equal(document.template.pages[4].objects[0].type, "composite-master");
assert.equal(document.template.pages[4].objects[0].contract.children[0].binding, "monthlyImages.2027-03");
assert.equal(document.template.pages[4].objects[0].contract.children[0].payload, "asset:march");
const contact = document.template.pages[5].objects.find((object) => object.id === "back.contact-card");
assert.equal(contact.payload.address, "서울");
assert.equal(contact.payload.academicPhone, "02-1");
assert.deepEqual(contact.frame, { x: 12.74, y: 133.56, width: 234.52, height: 33.84 });
assert.equal(document.template.pages[5].objects.find((object) => object.id === "back.photo").payload, "asset:school-building");

const diagnostics = validateDeskAcademicPackageDocument(document);
assert.ok(diagnostics.some((item) => item.code === "PACKAGE_SURFACE_COUNT"));
assert.equal(diagnostics.some((item) => item.code === "PACKAGE_CALENDAR_ROWS"), false);

console.log("desk academic package runtime tests passed");
