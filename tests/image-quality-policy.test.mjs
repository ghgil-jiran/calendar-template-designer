import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../apps/designer-studio/image-quality-policy.js';
const q=globalThis.ACDLImageQualityPolicy;
test('common policy enforces exact minimum and recommendation boundaries',()=>{for(const [dpi,status] of [[199,'blocked'],[200,'upscale-candidate'],[299,'upscale-candidate'],[300,'passed'],[NaN,'unresolved'],[0,'unresolved']])assert.equal(q.classifyDpi(dpi),status);});
test('custom ordered thresholds are validated and never rounded into compliance',()=>{assert.throws(()=>q.normalizePolicy({orderMinimumDpi:400}),/주문 최소/);assert.throws(()=>q.normalizePolicy({recommendedDpi:299.5}),/정수/);assert.equal(q.placementDpi({width:1000,height:1000},100,100,'cover',2),127);assert.equal(q.placementDpi({width:3000,height:1500},127,127,'contain',1),600);});
test('existing output settings contain three editable thresholds and retain the 300DPI PDF profile',()=>{const html=readFileSync(new URL('../apps/designer-studio/index.html',import.meta.url),'utf8');for(const id of ['imageRecommendedDpi','imageOrderMinimumDpi','imageUpscaleTargetDpi'])assert.ok(html.includes(`id="${id}"`));assert.match(html,/id="exportDpi" disabled/);assert.match(html,/image-quality-policy.js/);const runtime=readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');assert.match(runtime,/dpi:300,imageQualityPolicy/);});

test('minimum and correction target remain independently configurable through save and reopen',()=>{
 const settings=readFileSync(new URL('../apps/designer-studio/features/template-settings-library.js',import.meta.url),'utf8');
 const core=readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');
 for(const [minimum,target] of [[150,230],[170,260],[180,250]]){
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',disabled:false,addEventListener:(_event,callback)=>{node(id).click=callback}});return nodes.get(id)};
  const context={window:{ACDLImageQualityPolicy:q},project:{template:{resources:{exportSettings:{}}},productType:{pageSize:{width:260,height:180}}},el:node,ensureTemplateResources(){},snapshot(){},markDirty(){},render(){},showEditorToast(){}};
  vm.createContext(context);
  for(const name of ['collectImageQualityPolicy','populateExportSettings','updateExportSummary'])vm.runInContext(settings.split('\n').find(line=>line.startsWith('function '+name+'(')),context);
  vm.runInContext(core.split('\n').find(line=>line.startsWith('el("saveExportSettingsBtn").addEventListener')),context);
  node('imageRecommendedDpi').value='300';node('imageOrderMinimumDpi').value=String(minimum);node('imageUpscaleTargetDpi').value=String(target);
  node('saveExportSettingsBtn').click();
  context.project=JSON.parse(JSON.stringify(context.project));
  node('imageOrderMinimumDpi').value='200';node('imageUpscaleTargetDpi').value='300';
  vm.runInContext('populateExportSettings()',context);
  assert.equal(Number(node('imageRecommendedDpi').value),300);assert.equal(Number(node('imageOrderMinimumDpi').value),minimum);assert.equal(Number(node('imageUpscaleTargetDpi').value),target);
  assert.equal(q.classifyDpi(minimum-1,context.project.template.resources.exportSettings.imageQualityPolicy),'blocked');
  assert.equal(q.classifyDpi(minimum,context.project.template.resources.exportSettings.imageQualityPolicy),'upscale-candidate');
 }
 assert.throws(()=>q.normalizePolicy({orderMinimumDpi:170,upscaleTargetDpi:150}),/주문 최소/);
});
