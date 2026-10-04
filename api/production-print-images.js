import {assertInternalAccess, sendError, sendJson, supabaseRequest} from '../server/template-persistence.js';
import {loadProductionEditorSource} from '../server/production-editor-source.js';
import {createHash} from 'node:crypto';
import {storage} from '../server/production-correction-assets.js';
import {uuid} from '../server/production-corrections.js';
import {productionImagePlan, applyProductionImageLayouts, inspectProductionImageBytes, readProductionImage} from '../server/production-print-images.js';

export default async function handler(request, response) {
  try {
    await assertInternalAccess(request); response.setHeader('Cache-Control', 'no-store');
    if (!['GET','POST'].includes(request.method)) { response.setHeader('Allow', 'GET, POST'); return sendJson(response, 405, {message: '검사 요청만 가능합니다.'}); }
    const input=request.method==='POST'?(typeof request.body==='string'?JSON.parse(request.body):request.body):request.query;
    const {requestId, revisionId, assetId, packageAssetId, contentHash, imageLayouts} = input || {};
    if (!uuid(requestId) || !uuid(revisionId) || assetId != null && !uuid(assetId) || packageAssetId != null && (!/^[a-zA-Z0-9_./-]{1,240}$/.test(packageAssetId)||packageAssetId.split('/').includes('..'))) return sendJson(response, 400, {message: '접수 건과 교정 버전을 확인해 주세요.'});
    const rows = await supabaseRequest(`calendar_production_revisions?request_id=eq.${requestId}&id=eq.${revisionId}&select=id,revision_number,document_hash,document&limit=1`);
    if (!rows[0]) return sendJson(response, 404, {message: '해당 접수 건의 교정 버전을 찾지 못했습니다.'});
    let plan = productionImagePlan(rows[0]);
    if(contentHash != null && contentHash !== plan.contentHash) return sendJson(response,409,{message:'검사 중 교정 문서 내용이 변경되었습니다. 다시 열어 주세요.',error:'PRINT_DOCUMENT_CONTENT_CHANGED'});
    if(request.method==='POST'){
      if(contentHash!==plan.contentHash||!(assetId||packageAssetId))return sendJson(response,400,{message:'저장 버전과 원본의 검사 정보를 확인해 주세요.'});
      plan=applyProductionImageLayouts(plan,imageLayouts);
    }
    if (!assetId&&!packageAssetId) return sendJson(response, 200, {plan});
    const source = packageAssetId?`package-asset://${packageAssetId}`:`production-asset://${assetId}`;
    if (!plan.sources.includes(source)) return sendJson(response, 400, {message: '이 교정 버전에 사용된 원본만 검사할 수 있습니다.'});
    const receipts = await supabaseRequest(`calendar_production_requests?id=eq.${requestId}&select=id,owner_id,snapshot&limit=1`), receipt = receipts[0];
    if (!receipt) return sendJson(response, 404, {message: '접수 원본을 찾지 못했습니다.'});
    if(packageAssetId){
      const editorSource=await loadProductionEditorSource(receipt.snapshot,{includeBundle:true,signAssets:false});
      const asset=editorSource.bundle.assets?.find(item=>item.id===packageAssetId||item.packagePath===packageAssetId);
      if(!asset||!asset.mimeType.startsWith('image/'))return sendJson(response,404,{message:'이 접수 템플릿의 이미지 원본을 찾지 못했습니다.'});
      const bytes=Buffer.from(await (await storage(`object/template-packages/${asset.storagePath.split('/').map(encodeURIComponent).join('/')}`)).arrayBuffer());
      if(asset.mimeType==='image/svg+xml'){
        if(bytes.length!==asset.byteLength||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('템플릿 벡터 원본의 SHA-256이 다릅니다.');
        return sendJson(response,200,{report:{revisionId,documentHash:plan.documentHash,contentHash:plan.contentHash,source,sourceHash:asset.sha256,mimeType:asset.mimeType,vector:true,inspectionBasis:'template-package-sha256-and-browser-decode',placements:plan.uses.filter(use=>use.source===source).map(use=>({...use,status:'passed',effectiveDpi:null})),finalApproved:false}});
      }
      return sendJson(response,200,{report:inspectProductionImageBytes(plan,source,{...asset,content_hash:asset.sha256},bytes)});
    }
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
