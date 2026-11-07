import assert from "node:assert/strict";
import {
  createUserServiceShadowDiagnosticReport,
  sanitizeShadowDiagnosticIssue,
  serializeUserServiceShadowDiagnosticReport
} from "../dist/index.js";

const session = {
  status: "ready",
  readyForReview: true,
  adapted: {
    dataset: {
      schemaVersion: "1.0",
      school: { name: "비공개 학교" },
      monthlyImages: { "2027-03": { src: "data:image/png;base64,secret" } }
    }
  },
  rendered: { pageCount: 28, pages: [{ html: '<img src="secret">' }] },
  parity: {
    data: {
      matches: true,
      metrics: {
        pageCount: 28,
        eventCount: 2,
        contactCount: 3,
        monthlyImageCount: 12,
        resolvedMonthlyImageCount: 11
      }
    },
    visual: { structurallyReady: true, visuallyApproved: false }
  },
  diagnostics: [
    { severity: "warning", code: "ASSET_NOT_FOUND", path: "monthlyImages.2027-04", expected: { school: "비공개 학교" }, actual: 11, privateValue: "secret" }
  ]
};

const report = createUserServiceShadowDiagnosticReport(session, {
  generatedAt: "2026-08-18T03:00:00.000Z",
  documentId: "doc-1",
  templateId: "desk-v1.1"
});
assert.equal(report.status, "ready");
assert.equal(report.summary.pageCount, 28);
assert.equal(report.summary.severities.warning, 1);
assert.equal(report.approvedForReplacement, false);
const json = JSON.stringify(report);
assert.doesNotMatch(json, /비공개 학교|base64|<img|privateValue/);
assert.match(json, /ASSET_NOT_FOUND/);
assert.equal(report.issues[0].expected, undefined);
assert.equal(report.issues[0].actual, 11);

assert.deepEqual(
  sanitizeShadowDiagnosticIssue({ severity: "error", code: "INVALID_DATASET", stack: "secret" }),
  { severity: "error", code: "INVALID_DATASET" }
);
assert.equal(
  JSON.parse(serializeUserServiceShadowDiagnosticReport({ status: "blocked", diagnostics: [] }, { documentId: "doc-2" })).source.documentId,
  "doc-2"
);

console.log("user service shadow diagnostic module tests passed");
