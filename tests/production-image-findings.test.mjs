import test from 'node:test';import assert from 'node:assert/strict';import {productionImageFindings} from '../apps/designer-studio/production-image-findings.js';
test('admin DPI below minimum warns rather than blocking PDF; unreadable source and unresolved layout remain errors',()=>{
 const plan={minimumDpi:300,imageQualityPolicy:{orderMinimumDpi:180}},item={source:'production-asset://a',placements:[{status:'blocked',effectiveDpi:149,pageNumber:1,role:'school-song'}]};let result=productionImageFindings({plan,results:[item]});assert.equal(result.errors.length,0);assert.equal(result.warnings[0].code,'IMAGE_BELOW_ORDER_MINIMUM');
 result=productionImageFindings({plan,results:[item,{source:'missing',status:'blocked',message:'원본 읽기 실패'},{source:'unknown',placements:[{status:'unresolved',pageNumber:2,role:'image'}]}]});assert.equal(result.errors.length,2);assert.equal(result.warnings.length,1);
});
