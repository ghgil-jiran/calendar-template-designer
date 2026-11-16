import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertReleaseCompatibility, assertPrintJobCompatibility} from './version-boundary.mjs';
const release=JSON.parse(await readFile(new URL('./release.json',import.meta.url),'utf8'));
const valid=()=>({release:structuredClone(release),templateVersionId:'saved-version',documentSha256:'a'.repeat(64),assetManifestSha256:'b'.repeat(64)});
const worker=()=>({release:structuredClone(release),version:release.components.printWorker});
test('same pinned release and snapshots are accepted without mutating input',()=>{
 const job=valid(),before=structuredClone(job);assert.equal(assertPrintJobCompatibility(release,job,worker()),true);assert.deepEqual(job,before);
});
test('legacy or partially identified release is rejected rather than upgraded',()=>{
 assert.throws(()=>assertReleaseCompatibility(release,{schemaVersion:2}),/mismatch/);
 assert.throws(()=>assertReleaseCompatibility({},{}),/Invalid expected/);
});
test('a different renderer, runtime or release is rejected',()=>{
 for(const key of ['rendererId','runtimeId','releaseVersion','documentContractId']){const job=valid();job.release[key]='other';assert.throws(()=>assertPrintJobCompatibility(release,job,worker()),/mismatch/);}
});
test('wrong worker and unpinned document or assets are rejected',()=>{
 const w=worker();w.version='old';assert.throws(()=>assertPrintJobCompatibility(release,valid(),w),/Worker/);
 for(const key of ['documentSha256','assetManifestSha256','templateVersionId']){const job=valid();delete job[key];assert.throws(()=>assertPrintJobCompatibility(release,job,worker()));}
});
