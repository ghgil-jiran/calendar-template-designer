import {assertInternalAccess, sendError, sendJson, supabaseRequest} from '../server/template-persistence.js';
import {uuid} from '../server/production-corrections.js';
import {productionImagePlan, applyProductionImageLayouts, inspectProductionImageBytes, readProductionImage} from '../server/production-print-images.js';

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request); response.setHeader('Cache-Control', 'no-store');
    if (!['GET','POST'].includes(request.method)) { response.setHeader('Allow', 'GET, POST'); return sendJson(response, 405, {message: '검사 요청만 가능합니다.'}); }
    const input=request.method==='POST'?(typeof request.body==='string'?JSON.parse(request.body):request.body):request.query;
    const {requestId, revisionId, assetId, contentHash, imageLayouts} = input || {};
    if (!uuid(requestId) || !uuid(revisionId) || assetId != null && !uuid(assetId)) return sendJson(response, 400, {message: '접수 건과 교정 버전을 확인해 주세요.'});
    const rows = await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`);
    if (!rows[0]) return sendJson(response, 404, {message: '해당 접수 건의 교정 버전을 찾지 못했습니다.'});
    let plan = productionImagePlan(rows[0]);
    if(contentHash != null && contentHash !== plan.contentHash) return sendJson(response,409,{message:'검사 중 교정 문서 내용이 변경되었습니다. 다시 열어 주세요.',error:'PRINT_DOCUMENT_CONTENT_CHANGED'});
    if(request.method==='POST'){
      if(contentHash!==plan.contentHash||!assetId)return sendJson(response,400,{message:'저장 버전과 원본의 검사 정보를 확인해 주세요.'});
      plan=applyProductionImageLayouts(plan,imageLayouts);
    }
    if (!assetId) return sendJson(response, 200, {plan});
    const source = `production-asset://${assetId}`;
    if (!plan.sources.includes(source)) return sendJson(response, 400, {message: '이 교정 버전에 사용된 원본만 검사할 수 있습니다.'});
    const receipts = await supabaseRequest(`calendar_production_requests?id=eq.${requestId}&select=id,owner_id,snapshot&limit=1`), receipt = receipts[0];
    if (!receipt) return sendJson(response, 404, {message: '접수 원본을 찾지 못했습니다.'});
    let asset = receipt.snapshot?.assets?.find(item => item.id === assetId), bucket = 'calendar-production-assets';
    if (asset) { if (asset.path !== `${receipt.owner_id}/${requestId}/${assetId}`) throw Error('접수 원본 경로가 일치하지 않습니다.'); }
    else {
      const assets = await supabaseRequest(`calendar_production_correction_assets?request_id=eq.${requestId}&id=eq.${assetId}&status=eq.ready&select=*&limit=1`);
      asset = assets[0]; bucket = 'calendar-correction-assets';
      if (!asset) return sendJson(response, 404, {message: '사용된 교정 원본의 보관 완료 기록이 없습니다.'});
      if (asset.path !== `${requestId}/${assetId}`) throw Error('교정 원본 경로가 일치하지 않습니다.');
    }
    return sendJson(response, 200, {report: inspectProductionImageBytes(plan, source, asset, await readProductionImage(asset, bucket))});
  } catch (error) {
    if(error.code?.startsWith('PRINT_DOCUMENT_')||error.code==='PRINT_IMAGE_LAYOUT_INVALID')return sendJson(response,error.statusCode||409,{error:error.code,message:error.message});
    return sendError(response, error);
  }
}
