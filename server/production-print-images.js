import '../apps/designer-studio/production-editor-adapter.js';
import '../apps/designer-studio/image-quality-policy.js';
import { documentHash } from './production-corrections.js';
import { inspectRaster, MAX_BYTES, storage } from './production-correction-assets.js';

// Read the frozen Runtime objects, never the current template or an editing draft.
export function productionImagePlan(revision) {
  const contentHash = documentHash(revision.document), scheme = revision.document.productionIntegrity?.hashScheme;
  // Legacy hashes were computed before jsonb reordered keys; their original byte
  // serialization is unavailable. Keep the stored revision identity unchanged.
  if (scheme && scheme !== 'sorted-json.v1') throw Object.assign(Error('지원하지 않는 교정 문서 해시 형식입니다.'), {statusCode:409, code:'PRINT_DOCUMENT_HASH_SCHEME_UNSUPPORTED'});
  if (scheme === 'sorted-json.v1' && contentHash !== revision.document_hash) throw Object.assign(Error('저장된 교정 문서의 내용이 해시와 일치하지 않습니다.'), {statusCode:409, code:'PRINT_DOCUMENT_HASH_MISMATCH'});
  const imageQualityPolicy=globalThis.ACDLImageQualityPolicy.normalizePolicy(revision.document.editorProject?.template?.resources?.exportSettings?.imageQualityPolicy ?? revision.document.printProfile?.imageQualityPolicy ?? revision.document.imageQualityPolicy);
  const uses = [];
  function visit(object, page, pageNumber, nested = false) {
    if (object.visible === false) return;
    const refs = new Set();
    function collect(value) {
      if (typeof value === 'string' && /^(production|package)-asset:\/\//.test(value)) refs.add(value);
      else if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') {
        if (value.ref === 'package' && typeof value.id === 'string') refs.add(`package-asset://${value.id}`);
        Object.values(value).forEach(collect);
      }
    }
    collect(object.payload); collect(object.assetRef);
    // A visible raster with an absent/foreign reference must not disappear from the report.
    const hasImageField = object.payload && typeof object.payload === 'object' && ['image', 'imageRef', 'assetRef', 'src'].some(key => object.payload[key]);
    const original=revision.document.editorProject?.book?.elementsByPage?.[page.id]?.find(element=>element.id===object.id);
    const emptyPlaceholder=globalThis.ACDLProductionEditorAdapter.isEmptyPlaceholder(original)&&!globalThis.ACDLProductionEditorAdapter.hasImageReference(object.payload)&&!object.assetRef;
    if (!refs.size && !emptyPlaceholder && (['image', 'image-frame'].includes(object.type) || object.type === 'semantic-object' && hasImageField)) refs.add(`unresolved-image://${object.id}`);
    for (const source of refs) {
      const payload = object.payload?.image && typeof object.payload.image === 'object' ? object.payload.image : object.payload || {};
      const fullFrame = ['image', 'image-frame'].includes(object.type) || object.type === 'semantic-object' && ['school-logo', 'school-building'].includes(object.role);
      const frame = object.frame;
      const scale = Number(payload.placement?.scale ?? payload.imageTransform?.scale ?? 1);
      const fit = payload.fit ?? (object.role === 'school-logo' ? 'contain' : 'cover');
      const measurable = fullFrame && !nested && refs.size === 1 && page.size?.unit !== 'px' && page.size?.unit !== 'pt' && [frame?.width, frame?.height, scale].every(v => Number.isFinite(v) && v > 0) && ['cover', 'contain'].includes(fit);
      uses.push({pageId: page.id, pageNumber, objectId: object.id, role: object.role || object.type, source, frameMm: structuredClone(frame), fit, scale, rotation:Number(object.rotation||0), unit:page.size?.unit||'mm', nested, measurable, ...(!measurable ? {reason: '복합 개체 내부의 실제 이미지 배치 연결이 필요합니다.'} : {})});
    }
    (object.children || []).forEach(child => visit(child, page, pageNumber, true));
  }
  (revision.document.template?.pages || []).forEach((page, index) => (page.objects || []).forEach(object => visit(object, page, index + 1)));
  return {schemaVersion: 'production-image-plan.v1', revisionId: revision.id, revisionNumber: revision.revision_number, documentHash: revision.document_hash, contentHash, integrity:{scheme:scheme || 'legacy-stored-identity',storedHashVerified:scheme === 'sorted-json.v1'}, minimumDpi: imageQualityPolicy.recommendedDpi, imageQualityPolicy, sources: [...new Set(uses.map(use => use.source))], uses};
}

export function applyProductionImageLayouts(plan, layouts){
 const invalid=()=>{throw Object.assign(Error('저장 버전의 내부 이미지 영역과 측정 정보가 일치하지 않습니다.'),{statusCode:400,code:'PRINT_IMAGE_LAYOUT_INVALID'});};
 if(!Array.isArray(layouts)||layouts.length>100)invalid();
 const copy=structuredClone(plan),seen=new Set();
 for(const layout of layouts){
  const key=JSON.stringify([layout.pageId,layout.objectId,layout.source]),matches=copy.uses.filter(use=>use.pageId===layout.pageId&&use.objectId===layout.objectId&&use.source===layout.source),use=matches[0];
  if(seen.has(key)||matches.length!==1||copy.uses.filter(item=>item.pageId===layout.pageId&&item.objectId===layout.objectId).length!==1||use.measurable||use.nested||(use.unit||'mm')!=='mm'||!['school-song','school-tree','school-flower'].includes(use.role)||use.rotation!==0||layout.basis!=='common-editor-dom.v1'||!['cover','contain'].includes(layout.fit)||layout.scale!==1)invalid();
  seen.add(key);const f=layout.frameMm,p=use.frameMm;
  if(!f||!['x','y','width','height'].every(k=>typeof f[k]==='number'&&Number.isFinite(f[k]))||f.width<=0||f.height<=0||f.x<p.x-.01||f.y<p.y-.01||f.x+f.width>p.x+p.width+.01||f.y+f.height>p.y+p.height+.01)invalid();
  use.parentFrameMm=use.frameMm;use.frameMm={...f};use.fit=layout.fit;use.scale=layout.scale;use.measurable=true;use.layoutBasis=layout.basis;use.layoutVerification='admin-renderer-measurement';delete use.reason;
 }
 return copy;
}

export function inspectProductionImageBytes(plan, source, asset, bytes) {
  if (!plan.sources.includes(source)) throw Error('이 교정 버전에 사용된 원본만 검사할 수 있습니다.');
  const expectedSize = Number(asset.byte_size ?? asset.byteSize);
  if (bytes.length > MAX_BYTES || bytes.length !== expectedSize) throw Error('보관 원본의 파일 크기가 일치하지 않습니다.');
  const info = inspectRaster(bytes);
  if (info.mimeType !== (asset.mime_type ?? asset.mimeType)) throw Error('보관 원본의 파일 형식이 일치하지 않습니다.');
  if (asset.content_hash && asset.content_hash !== info.contentHash) throw Error('보관 원본의 SHA-256이 일치하지 않습니다.');
  const placements = plan.uses.filter(use => use.source === source).map(use => {
    const dpi = use.measurable ? globalThis.ACDLImageQualityPolicy.placementDpi({width:info.width,height:info.height},use.frameMm.width,use.frameMm.height,use.fit,use.scale) : null;
    const qualityStatus=globalThis.ACDLImageQualityPolicy.classifyDpi(dpi,plan.imageQualityPolicy);
    return {...use,effectiveDpi:dpi,qualityStatus,status:qualityStatus==='upscale-candidate'?'warning':qualityStatus,upscaleApplied:false};
  });
  return {revisionId: plan.revisionId, documentHash: plan.documentHash, contentHash:plan.contentHash, integrity:plan.integrity, source, sourceHash: info.contentHash, byteSize: bytes.length, pixelWidth: info.width, pixelHeight: info.height, mimeType: info.mimeType, inspectionBasis: 'file-size-header-sha256', imageQualityPolicy:plan.imageQualityPolicy, placements, cmykDerived: false, finalApproved: false};
}

export async function readProductionImage(asset, bucket) {
  const response = await storage(`object/${bucket}/${asset.path.split('/').map(encodeURIComponent).join('/')}`);
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) throw Error('보관 원본은 최대 25MiB까지 검사할 수 있습니다.'); chunks.push(Buffer.from(value)); }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}
