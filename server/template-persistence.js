import { createHash, timingSafeEqual } from 'node:crypto';

const STATES = new Set(['draft', 'ready', 'published', 'archived']);
const SAVE_KINDS = new Set(['manual', 'restore', 'publish']);

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw Object.assign(new Error(`Missing ${name}`), { statusCode: 503, code: 'SERVER_NOT_CONFIGURED' });
  return value;
}

export function assertInternalAccess(request) {
  const expected = env('TEMPLATE_EDITOR_ACCESS_TOKEN');
  const received = String(request.headers?.['x-template-editor-token'] || '').trim();
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  if (!received || expectedBytes.length !== receivedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes)) {
    throw Object.assign(new Error('Internal access token mismatch'), { statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

function supabaseConfig() {
  return { url: env('SUPABASE_URL').replace(/\/$/, ''), key: env('SUPABASE_SERVICE_ROLE_KEY') };
}

const ASSET_BUCKET='template-assets';
const ALLOWED_IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/svg+xml']);
const ASSET_MARKER=/^acdl-asset:\/\/([0-9a-f-]{36})$/i;

async function storageRequest(path,options={}){
  const {url,key}=supabaseConfig();
  const response=await fetch(`${url}/storage/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,...options.headers}});
  const text=await response.text(),body=text?JSON.parse(text):null;
  if(!response.ok){const error=new Error(body?.message||'Supabase storage request failed');error.statusCode=502;error.code='SUPABASE_STORAGE_FAILED';error.storageStatus=response.status;throw error}
  return body;
}

function decodeDataUrl(value){
  if(typeof value!=='string'||!value.startsWith('data:image/'))throw Object.assign(new Error('Invalid image data'),{statusCode:400,code:'INVALID_IMAGE'});
  const match=value.match(/^data:([^;,]+)(;base64)?,(.*)$/s);if(!match||!ALLOWED_IMAGE_TYPES.has(match[1]))throw Object.assign(new Error('Unsupported image type'),{statusCode:400,code:'INVALID_IMAGE'});
  const bytes=match[2]?Buffer.from(match[3],'base64'):Buffer.from(decodeURIComponent(match[3]));
  if(!bytes.length||bytes.length>20*1024*1024)throw Object.assign(new Error('Invalid image size'),{statusCode:413,code:'IMAGE_TOO_LARGE'});
  return {mimeType:match[1],bytes};
}

function extensionFor(mimeType){return {'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'}[mimeType]}

async function signedAsset(row){
  const signed=await storageRequest(`object/sign/${encodeURIComponent(row.storage_bucket)}/${row.storage_path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:86400})});
  const signedPath=signed?.signedURL||signed?.signedUrl;if(!signedPath)throw Object.assign(new Error('Signed URL missing'),{statusCode:502,code:'SIGNED_URL_FAILED'});
  const {url}=supabaseConfig();return {id:row.id,url:signedPath.startsWith('http')?signedPath:`${url}${signedPath}`,mimeType:row.mime_type,byteSize:Number(row.byte_size)};
}

export async function storeTemplateAsset(dataUrl){
  const {mimeType,bytes}=decodeDataUrl(dataUrl),contentHash=createHash('sha256').update(bytes).digest('hex');
  let rows=await supabaseRequest(`template_assets?select=*&content_hash=eq.${contentHash}&limit=1`);let row=rows[0];
  if(!row){
    const storagePath=`sha256/${contentHash}.${extensionFor(mimeType)}`;
    try{await storageRequest(`object/${ASSET_BUCKET}/${storagePath}`,{method:'POST',headers:{'Content-Type':mimeType,'x-upsert':'false'},body:bytes})}catch(error){if(error.storageStatus!==409)throw error}
    rows=await supabaseRequest('template_assets?on_conflict=content_hash',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({content_hash:contentHash,storage_bucket:ASSET_BUCKET,storage_path:storagePath,mime_type:mimeType,byte_size:bytes.length})});
    row=rows[0]||(await supabaseRequest(`template_assets?select=*&content_hash=eq.${contentHash}&limit=1`))[0];
  }
  return signedAsset(row);
}

export async function resolveTemplateAssets(ids){
  const unique=[...new Set((Array.isArray(ids)?ids:[]).filter(id=>/^[0-9a-f-]{36}$/i.test(id)))];if(!unique.length)return [];
  const rows=await supabaseRequest(`template_assets?select=*&id=in.(${unique.map(encodeURIComponent).join(',')})`);
  return Promise.all(rows.map(signedAsset));
}

function collectAssetIds(value,result=new Set()){
  if(typeof value==='string'){const match=value.match(ASSET_MARKER);if(match)result.add(match[1]);return result}
  if(Array.isArray(value)){value.forEach(item=>collectAssetIds(item,result));return result}
  if(value&&typeof value==='object')Object.values(value).forEach(item=>collectAssetIds(item,result));return result;
}

export async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(body?.message || 'Supabase request failed');
    error.statusCode = 502;
    error.code = 'SUPABASE_REQUEST_FAILED';
    throw error;
  }
  return body;
}

function requiredText(value, field, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw Object.assign(new Error(`Invalid ${field}`), { statusCode: 400, code: 'INVALID_REQUEST' });
  }
  return value.trim();
}

function optionalText(value, field, max = 1000) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) {
    throw Object.assign(new Error(`Invalid ${field}`), { statusCode: 400, code: 'INVALID_REQUEST' });
  }
  return value.trim();
}

function projectData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('Invalid projectData'), { statusCode: 400, code: 'INVALID_REQUEST' });
  }
  return value;
}

export function validateVersionSave(value) {
  const body = value && typeof value === 'object' ? value : {};
  const edition = Number(body.edition);
  if (!Number.isInteger(edition) || edition < 2000 || edition > 2200 || !STATES.has(body.state) || !SAVE_KINDS.has(body.saveKind)) {
    throw Object.assign(new Error('Invalid template metadata'), { statusCode: 400, code: 'INVALID_REQUEST' });
  }
  return {
    templateId: body.templateId ? requiredText(body.templateId, 'templateId', 80) : null,
    stableKey: requiredText(body.stableKey, 'stableKey', 160),
    name: requiredText(body.name, 'name', 160),
    description: optionalText(body.description, 'description', 1000) || '',
    edition,
    state: body.state,
    productType: requiredText(body.productType, 'productType', 80),
    templateKey: requiredText(body.templateKey, 'templateKey', 160),
    saveKind: body.saveKind,
    saveNote: optionalText(body.saveNote, 'saveNote', 500),
    sourceVersionId: body.sourceVersionId ? requiredText(body.sourceVersionId, 'sourceVersionId', 80) : null,
    schemaVersion: requiredText(body.schemaVersion, 'schemaVersion', 40),
    projectData: projectData(body.projectData)
  };
}

export function validateDraftSave(value) {
  const body = value && typeof value === 'object' ? value : {};
  return {
    templateId: requiredText(body.templateId, 'templateId', 80),
    schemaVersion: requiredText(body.schemaVersion, 'schemaVersion', 40),
    projectData: projectData(body.projectData)
  };
}

export function rowToLibraryItem(row) {
  return {
    id: row.id,
    stableKey: row.stable_key,
    name: row.name,
    description: row.description,
    edition: row.edition,
    state: row.state,
    productType: row.product_type,
    templateKey: row.template_key,
    latestVersionId: row.latest_version_id,
    latestVersionNumber: row.latest_version_number,
    updatedAt: row.updated_at
  };
}

export function rowToVersion(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    versionNumber: row.version_number,
    saveKind: row.save_kind,
    state: row.state,
    saveNote: row.save_note || undefined,
    sourceVersionId: row.source_version_id || undefined,
    schemaVersion: row.schema_version,
    projectData: row.project_data,
    createdAt: row.created_at
  };
}

function firstRow(value) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listTemplates() {
  const rows = await supabaseRequest('template_projects?select=*&archived_at=is.null&order=updated_at.desc');
  return rows.map(rowToLibraryItem);
}

export async function getTemplate(templateId) {
  const id = encodeURIComponent(requiredText(templateId, 'templateId', 80));
  const rows = await supabaseRequest(`template_projects?select=*&id=eq.${id}&limit=1`);
  if (!rows.length) throw Object.assign(new Error('Template not found'), { statusCode: 404, code: 'NOT_FOUND' });
  const template = rowToLibraryItem(rows[0]);
  const versions = await supabaseRequest(`template_versions?select=*&id=eq.${encodeURIComponent(template.latestVersionId)}&limit=1`);
  if (!versions.length) throw Object.assign(new Error('Latest version not found'), { statusCode: 409, code: 'VERSION_MISSING' });
  return { template, version: rowToVersion(versions[0]) };
}

export async function saveVersion(input) {
  const data = validateVersionSave(input);
  const versionRow = firstRow(await supabaseRequest('rpc/save_template_version', {
    method: 'POST',
    body: JSON.stringify({
      p_template_id: data.templateId,
      p_stable_key: data.stableKey,
      p_name: data.name,
      p_description: data.description,
      p_edition: data.edition,
      p_state: data.state,
      p_product_type: data.productType,
      p_template_key: data.templateKey,
      p_save_kind: data.saveKind,
      p_save_note: data.saveNote,
      p_source_version_id: data.sourceVersionId,
      p_schema_version: data.schemaVersion,
      p_project_data: data.projectData
    })
  }));
  const assetIds=[...collectAssetIds(data.projectData)];
  if(assetIds.length)await supabaseRequest('template_version_assets?on_conflict=version_id,asset_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(assetIds.map(assetId=>({version_id:versionRow.id,asset_id:assetId})))});
  const projectRow = firstRow(await supabaseRequest(`template_projects?select=*&id=eq.${encodeURIComponent(versionRow.template_id)}&limit=1`));
  return { template: rowToLibraryItem(projectRow), version: rowToVersion(versionRow) };
}

export async function saveDraft(input) {
  const data = validateDraftSave(input);
  const rows = await supabaseRequest('template_drafts?on_conflict=template_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      template_id: data.templateId,
      schema_version: data.schemaVersion,
      project_data: data.projectData,
      updated_at: new Date().toISOString()
    })
  });
  return rows[0];
}

export async function listVersions(templateId) {
  const id = encodeURIComponent(requiredText(templateId, 'templateId', 80));
  const rows = await supabaseRequest(`template_versions?select=*&template_id=eq.${id}&order=version_number.desc`);
  return rows.map(rowToVersion);
}

export async function restoreVersion(input) {
  const templateId = requiredText(input?.templateId, 'templateId', 80);
  const versionId = requiredText(input?.versionId, 'versionId', 80);
  const source = firstRow(await supabaseRequest(`template_versions?select=*&id=eq.${encodeURIComponent(versionId)}&template_id=eq.${encodeURIComponent(templateId)}&limit=1`));
  if (!source) throw Object.assign(new Error('Version not found'), { statusCode: 404, code: 'NOT_FOUND' });
  const current = await getTemplate(templateId);
  return saveVersion({
    templateId,
    stableKey: current.template.stableKey,
    name: current.template.name,
    description: current.template.description,
    edition: current.template.edition,
    state: source.state,
    productType: current.template.productType,
    templateKey: current.template.templateKey,
    saveKind: 'restore',
    saveNote: optionalText(input?.saveNote, 'saveNote', 500) || `v${source.version_number} 복원`,
    sourceVersionId: source.id,
    schemaVersion: source.schema_version,
    projectData: source.project_data
  });
}

export function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export function sendError(response, error) {
  const status = Number(error?.statusCode) || 500;
  sendJson(response, status, { error: error?.code || 'INTERNAL_ERROR' });
}

export async function readJson(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  let raw = '';
  for await (const chunk of request) raw += chunk;
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON'), { statusCode: 400, code: 'INVALID_JSON' }); }
}
