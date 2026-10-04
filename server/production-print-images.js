import './production-print-readiness.js';
import { documentHash } from './production-corrections.js';
import { inspectRaster, MAX_BYTES, storage } from './production-correction-assets.js';

// Read the frozen Runtime objects, never the current template or an editing draft.
export function productionImagePlan(revision) {
  if (documentHash(revision.document) !== revision.document_hash) throw Error('저장된 교정 문서의 해시가 일치하지 않습니다.');
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
    if (!refs.size && (['image', 'image-frame'].includes(object.type) || object.type === 'semantic-object' && hasImageField)) refs.add(`unresolved-image://${object.id}`);
    for (const source of refs) {
      const payload = object.payload?.image && typeof object.payload.image === 'object' ? object.payload.image : object.payload || {};
      const fullFrame = ['image', 'image-frame'].includes(object.type) || object.type === 'semantic-object' && ['school-logo', 'school-building'].includes(object.role);
      const frame = object.frame;
      const scale = Number(payload.placement?.scale ?? payload.imageTransform?.scale ?? 1);
      const fit = payload.fit ?? (object.role === 'school-logo' ? 'contain' : 'cover');
      const measurable = fullFrame && !nested && refs.size === 1 && page.size?.unit !== 'px' && page.size?.unit !== 'pt' && [frame?.width, frame?.height, scale].every(v => Number.isFinite(v) && v > 0) && ['cover', 'contain'].includes(fit);
      uses.push({pageId: page.id, pageNumber, objectId: object.id, role: object.role || object.type, source, frameMm: structuredClone(frame), fit, scale, measurable, ...(!measurable ? {reason: '복합 개체 내부의 실제 이미지 배치 연결이 필요합니다.'} : {})});
    }
    (object.children || []).forEach(child => visit(child, page, pageNumber, true));
  }
  (revision.document.template?.pages || []).forEach((page, index) => (page.objects || []).forEach(object => visit(object, page, index + 1)));
  return {schemaVersion: 'production-image-plan.v1', revisionId: revision.id, revisionNumber: revision.revision_number, documentHash: revision.document_hash, minimumDpi: 300, sources: [...new Set(uses.map(use => use.source))], uses};
}

export function inspectProductionImageBytes(plan, source, asset, bytes) {
  if (!plan.sources.includes(source)) throw Error('이 교정 버전에 사용된 원본만 검사할 수 있습니다.');
  const expectedSize = Number(asset.byte_size ?? asset.byteSize);
  if (bytes.length > MAX_BYTES || bytes.length !== expectedSize) throw Error('보관 원본의 파일 크기가 일치하지 않습니다.');
  const info = inspectRaster(bytes);
  if (info.mimeType !== (asset.mime_type ?? asset.mimeType)) throw Error('보관 원본의 파일 형식이 일치하지 않습니다.');
  if (asset.content_hash && asset.content_hash !== info.contentHash) throw Error('보관 원본의 SHA-256이 일치하지 않습니다.');
  const placements = plan.uses.filter(use => use.source === source).map(use => {
    const dpi = use.measurable ? globalThis.ACDLNativePrintAuthoring.effectiveImageDpi({pixelWidth: info.width, pixelHeight: info.height, frameWidthMm: use.frameMm.width, frameHeightMm: use.frameMm.height, fit: use.fit, scale: use.scale}) : null;
    return {...use, effectiveDpi: dpi, status: dpi === null ? 'unresolved' : dpi >= plan.minimumDpi ? 'passed' : 'warning'};
  });
  return {revisionId: plan.revisionId, documentHash: plan.documentHash, source, sourceHash: info.contentHash, byteSize: bytes.length, pixelWidth: info.width, pixelHeight: info.height, mimeType: info.mimeType, inspectionBasis: 'file-size-header-sha256', placements, cmykDerived: false, finalApproved: false};
}

export async function readProductionImage(asset, bucket) {
  const response = await storage(`object/${bucket}/${asset.path.split('/').map(encodeURIComponent).join('/')}`);
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) throw Error('보관 원본은 최대 25MiB까지 검사할 수 있습니다.'); chunks.push(Buffer.from(value)); }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}
