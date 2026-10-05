import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../apps/designer-studio/image-quality-policy.js';
const q=globalThis.ACDLImageQualityPolicy;
test('common policy enforces exact minimum and recommendation boundaries',()=>{for(const [dpi,status] of [[199,'blocked'],[200,'upscale-candidate'],[299,'upscale-candidate'],[300,'passed'],[NaN,'unresolved'],[0,'unresolved']])assert.equal(q.classifyDpi(dpi),status);});
test('custom ordered thresholds are validated and never rounded into compliance',()=>{assert.throws(()=>q.normalizePolicy({orderMinimumDpi:400}),/주문 최소/);assert.throws(()=>q.normalizePolicy({recommendedDpi:299.5}),/정수/);assert.equal(q.placementDpi({width:1000,height:1000},100,100,'cover',2),127);assert.equal(q.placementDpi({width:3000,height:1500},127,127,'contain',1),600);});
test('existing output settings contain three editable thresholds and retain the 300DPI PDF profile',()=>{const html=readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');for(const id of ['imageRecommendedDpi','imageOrderMinimumDpi','imageUpscaleTargetDpi'])assert.ok(html.includes(`id="${id}"`));assert.match(html,/id="exportDpi" disabled/);assert.match(html,/image-quality-policy.js/);const runtime=readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');assert.match(runtime,/dpi:300,imageQualityPolicy/);});
