import { TemplateRuntime, type RuntimeDataset, type TemplateDocument } from "../src/index.js";

const template: TemplateDocument = {
  schemaVersion: "1.0", id: "example", revision: 1,
  pages: [{ id: "cover", role: "cover-front", size: { width: 260, height: 180, unit: "mm" }, objects: [
    { id: "title", type: "text", frame: { x: 20, y: 20, width: 220, height: 30 }, binding: "school.name", style: { fontSize: 28, autoFit: true } }
  ] }]
};
const dataset: RuntimeDataset = { schemaVersion: "1.0", school: { name: "샘플 학교" } };
console.log(JSON.stringify(new TemplateRuntime().execute(template, dataset).document, null, 2));
