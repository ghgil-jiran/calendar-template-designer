// V2 boundary only. No implicit conversion of legacy documents or jobs.
const keys = ['platformId', 'releaseVersion', 'documentContractId', 'runtimeId', 'rendererId'];
export function assertReleaseCompatibility(expected, actual) {
  for (const key of keys) {
    if (typeof expected?.[key] !== 'string' || !expected[key]) throw new Error(`Invalid expected release: ${key}`);
    if (actual?.[key] !== expected[key]) throw new Error(`Release mismatch: ${key}`);
  }
  return true;
}
export function assertPrintJobCompatibility(release, job, worker) {
  assertReleaseCompatibility(release, job?.release);
  assertReleaseCompatibility(release, worker?.release);
  if (!release.components?.printWorker || worker.version !== release.components.printWorker) throw new Error('Worker version mismatch');
  // Hashes identify immutable snapshots, never live "latest" data.
  for (const key of ['documentSha256', 'assetManifestSha256']) {
    if (!/^[a-f0-9]{64}$/.test(job?.[key] || '')) throw new Error(`Missing snapshot hash: ${key}`);
  }
  if (typeof job.templateVersionId !== 'string' || !job.templateVersionId.trim()) throw new Error('Missing template version');
  return true;
}
