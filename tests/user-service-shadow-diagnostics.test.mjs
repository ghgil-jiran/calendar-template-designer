import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/user-service-shadow-diagnostics.js');
const diagnostics = globalThis.ACDLUserServiceShadowDiagnostics;

test('creates a stable diagnostic report without Dataset, HTML or image payloads', () => {
  const session = {
    status: 'ready', readyForReview: true, approvedForReplacement: false,
    adapted: { dataset: { schemaVersion: '1.0', school: { name: '비공개 학교' }, monthlyImages: { '2027-03': { src: 'data:image/png;base64,secret' } } } },
    rendered: { pageCount: 28, pages: [{ html: '<img src="secret">' }] },
    parity: { data: { matches: true, metrics: { pageCount: 28, eventCount: 2, contactCount: 3, monthlyImageCount: 12, resolvedMonthlyImageCount: 11 } }, visual: { structurallyReady: true, visuallyApproved: false } },
    diagnostics: [{ severity: 'warning', code: 'ASSET_NOT_FOUND', path: 'monthlyImages.2027-04', expected: { school: '비공개 학교' }, actual: 11, privateValue: 'secret' }]
  };
  const report = diagnostics.createReport(session, { generatedAt: '2026-08-18T03:00:00.000Z', documentId: 'doc-1', templateId: 'desk-v1.1' });
  assert.equal(report.status, 'ready');
  assert.equal(report.summary.pageCount, 28);
  assert.equal(report.summary.severities.warning, 1);
  assert.equal(report.approvedForReplacement, false);
  const json = JSON.stringify(report);
  assert.doesNotMatch(json, /비공개 학교|base64|<img|privateValue/);
  assert.match(json, /ASSET_NOT_FOUND/);
  assert.equal(report.issues[0].expected, undefined);
  assert.equal(report.issues[0].actual, 11);
});

test('normalizes blocked sessions and strips unknown diagnostic fields', () => {
  const report = diagnostics.createReport({ status: 'blocked', diagnostics: [{ severity: 'error', code: 'INVALID_DATASET', message: '오류', stack: 'secret stack' }] });
  assert.equal(report.readyForReview, false);
  assert.equal(report.summary.severities.error, 1);
  assert.deepEqual(report.issues[0], { severity: 'error', code: 'INVALID_DATASET', message: '오류' });
  assert.equal(report.generatedAt, null);
});

test('serializes the same redacted report as formatted JSON', () => {
  const json = diagnostics.toJson({ status: 'blocked', diagnostics: [] }, { documentId: 'doc-2' });
  assert.equal(JSON.parse(json).source.documentId, 'doc-2');
  assert.match(json, /\n  "schemaVersion"/);
});
