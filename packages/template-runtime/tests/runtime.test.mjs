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
