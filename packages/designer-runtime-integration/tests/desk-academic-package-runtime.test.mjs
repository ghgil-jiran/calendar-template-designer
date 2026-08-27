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

const sampleAsset = { ref: "url", src: "data:image/svg+xml;base64,PHN2Zy8+" };
const sampleTemplate = {
  ...template,
  sampleAssets: { schoolPhoto: sampleAsset },
  masterDefinitions: {
    ...template.masterDefinitions,
    "cover-front": template.masterDefinitions["cover-front"].map((item) =>
      item.id === "cover.school-image" ? { ...item, sampleAssetKey: "schoolPhoto" } : item
    ),
    "monthly-photo-memo": template.masterDefinitions["monthly-photo-memo"].map((item) => ({
      ...item,
      layout: {
        ...item.layout,
        children: item.layout.children.map((child) =>
          child.id === "monthly-photo" ? { ...child, sampleAssetKey: "schoolPhoto" } : child
        )
      }
    }))
  }
};
const emptyPhotoDataset = {
  ...adapted,
  dataset: {
    ...adapted.dataset,
    school: { ...adapted.dataset.school, profile: {} },
    monthlyImages: {}
  }
};
const sampleDocument = buildDeskAcademicPackageDocument(emptyPhotoDataset, sampleTemplate);
assert.deepEqual(sampleDocument.template.pages[0].objects.find((object) => object.id === "cover.school-image").payload, sampleAsset);
assert.deepEqual(sampleDocument.template.pages[4].objects[0].contract.children[0].payload, sampleAsset);

const userPhoto = { ref: "url", src: "/user-photo.jpg" };
const userDocument = buildDeskAcademicPackageDocument({
  ...emptyPhotoDataset,
  dataset: {
    ...emptyPhotoDataset.dataset,
    school: { ...emptyPhotoDataset.dataset.school, profile: { building: userPhoto } },
    monthlyImages: { "2027-03": { assetRef: userPhoto } }
  }
}, sampleTemplate);
assert.deepEqual(userDocument.template.pages[0].objects.find((object) => object.id === "cover.school-image").payload, userPhoto);
assert.deepEqual(userDocument.template.pages[4].objects[0].contract.children[0].payload, { assetRef: userPhoto });

const manualPhoto = { ref: "url", src: "/manually-selected.jpg" };
const selectableTemplate = {
  ...sampleTemplate,
  masterDefinitions: {
    ...sampleTemplate.masterDefinitions,
    "cover-front": sampleTemplate.masterDefinitions["cover-front"].map((item) =>
      item.id === "cover.school-image" ? { ...item, userReplaceable: true, defaultAssetKey: "schoolPhoto" } : item
    ),
    "monthly-photo-memo": sampleTemplate.masterDefinitions["monthly-photo-memo"].map((item) => ({
      ...item,
      layout: {
        ...item.layout,
        children: item.layout.children.map((child) =>
          child.id === "monthly-photo"
            ? { ...child, bindingPattern: undefined, userReplaceable: true, defaultAssetKey: "schoolPhoto" }
            : child
        )
      }
    }))
  }
};
const manualDocument = buildDeskAcademicPackageDocument({
  ...adapted,
  dataset: {
    ...adapted.dataset,
    variables: {
      imageSelections: {
        "page.cover-front": { "cover.school-image": manualPhoto },
        "page.monthly-photo-memo": { "monthly-photo": manualPhoto }
      }
    }
  }
}, selectableTemplate);
assert.deepEqual(manualDocument.template.pages[0].objects.find((object) => object.id === "cover.school-image").payload, manualPhoto);
assert.deepEqual(manualDocument.template.pages[4].objects[0].contract.children[0].payload, manualPhoto);

console.log("desk academic package runtime tests passed");
