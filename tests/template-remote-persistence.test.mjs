import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../apps/designer-studio/template-remote-persistence.js', import.meta.url), 'utf8');

function runtime({ hostname = 'templates.example.com', fetch, accessToken = 'admin-jwt', localApiProxy = false } = {}) {
  const values = new Map();
  let blobSequence=0;class BrowserURL extends URL{}BrowserURL.createObjectURL=()=>`blob:template-asset-${++blobSequence}`;
  const browserFetch=async(path,options)=>String(path).startsWith('/api/template-assets?content=')?{ok:true,status:200,blob:async()=>new Blob(['image'])}:fetch(path,options);
  const window = { location: { hostname }, ACDL_LOCAL_API_PROXY:localApiProxy, URL:BrowserURL, sessionStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, ACDLAdminAuth: { accessToken: () => accessToken, signOut() {} }, fetch:browserFetch };
  vm.runInNewContext(source, { window, URL, console, structuredClone });
  return window.ACDLTemplateRemotePersistence;
}

test('remote persistence stays disabled on the local editor', () => {
  assert.equal(runtime({ hostname: 'localhost' }).isRemote(), false);
});

test('remote persistence is enabled when the local server provides its Production API proxy', () => {
  assert.equal(runtime({ hostname: 'localhost', localApiProxy:true }).isRemote(), true);
});

test('remote library uses one latest record per template', async () => {
  const calls = [];
  const api = runtime({ fetch: async (path, options) => {
    calls.push({ path, options });
    return { ok: true, status: 200, json: async () => ({ templates: [{ id: 't1', stableKey: 'wall-01', name: '벽걸이형 표준 01', description: '', edition: 2028, state: 'ready', productType: 'wall', templateKey: 'wall-standard', latestVersionNumber: 7, updatedAt: '2026-08-24T00:00:00Z' }] }) };
  }});
  const records = await api.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].id, 't1');
  assert.equal(records[0].version, 7);
  assert.equal(records[0].storage, 'supabase');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer admin-jwt');
});

test('remote library exposes deleted built-in catalog keys',async()=>{
  const api=runtime({fetch:async()=>({ok:true,status:200,json:async()=>({templates:[],deletedCatalogKeys:['built-in-01']})})});
  await api.list();assert.deepEqual([...api.deletedCatalogKeys()],['built-in-01']);
});

test('remote permanent deletion uses the authenticated templates endpoint',async()=>{
  let request;
  const api=runtime({fetch:async(path,options)=>{request={path,options};return {ok:true,status:200,json:async()=>({deleted:true})}}});
  await api.remove({templateId:'template-1',stableKey:'desk-01',hideCatalog:true});
  assert.equal(request.path,'/api/templates');assert.equal(request.options.method,'DELETE');assert.deepEqual(JSON.parse(request.options.body),{templateId:'template-1',stableKey:'desk-01',hideCatalog:true});
});

test('remote library keeps standard separate from publishing state', async () => {
  const api = runtime({ fetch: async () => ({ ok: true, status: 200, json: async () => ({ templates: [{ id: 't1', stableKey: 'desk-01', name: '기준 템플릿', description: '', edition: 2028, state: 'ready', isStandard: true, productType: 'desk', templateKey: 'desk-standard', latestVersionNumber: 3, updatedAt: '2026-09-04T00:00:00Z' }] }) }) });
  const [record] = await api.list();
  assert.equal(record.state, 'ready');
  assert.equal(record.isStandard, true);
});

test('remote load returns a hydrated editor copy and keeps canonical asset markers for local recovery',async()=>{
 const marker='acdl-asset://11111111-1111-4111-8111-111111111111',api=runtime({fetch:async path=>path.startsWith('/api/template-assets?')?{ok:true,status:200,json:async()=>({assets:[{id:marker.slice('acdl-asset://'.length),url:'https://signed.example/current.webp'}]})}:{ok:true,status:200,json:async()=>({version:{projectData:{template:{resources:{aiDesignAssets:[{id:'bg',src:marker}]}},book:{elementsByPage:{page:[{id:'background',role:'ai-design-background',assetId:'bg'}]}}}}})}}),result=await api.load('template-1');
 assert.match(result.version.projectData.template.resources.aiDesignAssets[0].src,/^blob:template-asset-/);
 assert.equal(result.version.storedProjectData.template.resources.aiDesignAssets[0].src,marker);
});

test('deferred remote load returns canonical pages without making asset resolution block the editor',async()=>{
 let assetRequests=0;
 const marker='acdl-asset://11111111-1111-4111-8111-111111111111';
 const api=runtime({fetch:async path=>{if(path.startsWith('/api/template-assets'))assetRequests+=1;return {ok:true,status:200,json:async()=>({version:{projectData:{template:{resources:{aiDesignAssets:[{id:'bg',src:marker}]}},book:{pageInstances:[{id:'page'}],elementsByPage:{page:[{role:'ai-design-background',assetId:'bg'}]}}}}})}}});
 const result=await api.load('template-1',{deferAssets:true});
 assert.equal(result.version.projectData.template.resources.aiDesignAssets[0].src,marker);
 assert.equal(result.version.storedProjectData.template.resources.aiDesignAssets[0].src,marker);
 assert.equal(assetRequests,0);
});

test('remote save sends project data through the protected Vercel API', async () => {
  let request;
  const api = runtime({ fetch: async (path, options) => {
    request = { path, options };
    return { ok: true, status: 201, json: async () => ({ template: { id: 't1' }, version: { versionNumber: 2 } }) };
  }});
  const result = await api.save({ stableKey: 'wall-01', projectData: { id: 'project' } });
  assert.equal(request.path, '/api/templates');
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).projectData.id, 'project');
  assert.equal(result.version.versionNumber, 2);
});

test('package preflight checks the latest saved remote version',async()=>{
  let requestPath;
  const api=runtime({fetch:async path=>{requestPath=path;return {ok:true,status:200,json:async()=>({ok:true,version:{versionNumber:4}})}}});
  const result=await api.packagePreflight('template id');
  assert.equal(requestPath,'/api/template-package-preflight?templateId=template%20id');
  assert.equal(result.version.versionNumber,4);
});

test('autosave requires an authenticated Master Admin session', async () => {
  const api = runtime({ accessToken: '', fetch: async () => { throw new Error('must not fetch'); } });
  await assert.rejects(() => api.saveDraft({ templateId: 't1', projectData: {} }), error => error.code === 'AUTH_REQUIRED');
});

test('project images become stable asset references and hydrate with signed URLs', async () => {
  const api = runtime({ fetch: async (path) => {
    if (path === '/api/template-assets') return { ok: true, status: 201, json: async () => ({ asset: { id: '11111111-1111-4111-8111-111111111111' } }) };
    if (path.startsWith('/api/template-assets?ids=')) return { ok: true, status: 200, json: async () => ({ assets: [{ id: '11111111-1111-4111-8111-111111111111', url: 'https://signed.example/image.png' }] }) };
    throw new Error(`unexpected ${path}`);
  }});
  const prepared = await api.prepareProjectData({ cover: { image: 'data:image/png;base64,YWJj' } });
  assert.equal(prepared.cover.image, 'acdl-asset://11111111-1111-4111-8111-111111111111');
  const hydrated = await api.hydrateProjectData(prepared);
  assert.match(hydrated.cover.image, /^blob:template-asset-/);
  const resaved = await api.prepareProjectData(hydrated);
  assert.equal(resaved.cover.image, 'acdl-asset://11111111-1111-4111-8111-111111111111');
});

test('AI design draft, quality report and regenerated backgrounds survive remote save and reopen', async () => {
  let sequence = 0;
  const api = runtime({ fetch: async path => {
    if (path === '/api/template-assets') return { ok: true, status: 201, json: async () => ({ asset: { id: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}` } }) };
    if (path.startsWith('/api/template-assets?ids=')) {
      const ids = decodeURIComponent(path.split('ids=')[1]).split(',');
      return { ok: true, status: 200, json: async () => ({ assets: ids.map(id => ({ id, url: `https://signed.example/${id}.webp` })) }) };
    }
    throw new Error(`unexpected ${path}`);
  }});
  const project = { template: { aiDesignDraft: { status: 'sample-applied', quality: { schemaVersion: 'ai-design-quality.v1@0.1.0', pageCount: 28, regeneration: { completed: 1 } }, selectedVariant: { assetsByRole: { cover: 'data:image/webp;base64,Y292ZXI=' } } }, resources: { aiDesignAssets: [{ id: 'cover', src: 'data:image/webp;base64,Y292ZXI=' }] } }, book: { pageInstances: Array.from({ length: 28 }, (_, index) => ({ id: `page-${index + 1}` })), elementsByPage: { 'page-1': [{ role: 'ai-design-background', src: 'data:image/webp;base64,Y292ZXI=' }] } } };
  const prepared = await api.prepareProjectData(project);
  assert.match(prepared.book.elementsByPage['page-1'][0].src, /^acdl-asset:\/\//);
  assert.equal(prepared.template.aiDesignDraft.quality.pageCount, 28);
  const reopened = await api.hydrateProjectData(prepared);
  assert.match(reopened.book.elementsByPage['page-1'][0].src, /^blob:template-asset-/);
  assert.equal(reopened.template.aiDesignDraft.status, 'sample-applied');
  assert.equal(reopened.template.aiDesignDraft.quality.regeneration.completed, 1);
});

test('resource-only AI backgrounds are materialized before remote save and reopen',async()=>{
 const api=runtime({fetch:async path=>path==='/api/template-assets'?{ok:true,status:201,json:async()=>({asset:{id:'11111111-1111-4111-8111-111111111111'}})}:{ok:true,status:200,json:async()=>({assets:[{id:'11111111-1111-4111-8111-111111111111',url:'https://signed.example/background.webp'}]})}}),project={template:{resources:{aiDesignAssets:[{id:'ai-cover',src:'data:image/webp;base64,Y292ZXI='}]}},book:{elementsByPage:{cover:[{role:'ai-design-background',assetId:'ai-cover'}]}}},prepared=await api.prepareProjectData(project);assert.match(prepared.book.elementsByPage.cover[0].src,/^acdl-asset:\/\//);const reopened=await api.hydrateProjectData(prepared);assert.match(reopened.book.elementsByPage.cover[0].src,/^blob:template-asset-/)
});

test('an already-saved resource-only AI background is repaired while reopening',async()=>{const api=runtime({fetch:async()=>({ok:true,status:200,json:async()=>({assets:[{id:'11111111-1111-4111-8111-111111111111',url:'https://signed.example/existing.webp'}]})})}),stored={template:{resources:{aiDesignAssets:[{id:'ai-cover',src:'acdl-asset://11111111-1111-4111-8111-111111111111'}]}},book:{elementsByPage:{cover:[{role:'ai-design-background',assetId:'ai-cover'}]}}},reopened=await api.hydrateProjectData(stored);assert.match(reopened.book.elementsByPage.cover[0].src,/^blob:template-asset-/)});

test('an applied AI draft cannot silently reopen without its background resources',async()=>{const api=runtime({fetch:async()=>{throw new Error('must not fetch')}}),stored={template:{aiDesignDraft:{status:'sample-applied'},resources:{}},book:{elementsByPage:{cover:[]}}};await assert.rejects(()=>api.hydrateProjectData(stored),error=>error.code==='AI_DESIGN_INCOMPLETE')});

test('missing private assets fail instead of rendering a partially blank template',async()=>{const api=runtime({fetch:async()=>({ok:true,status:200,json:async()=>({assets:[]})})}),stored={template:{resources:{aiDesignAssets:[{id:'ai-cover',src:'acdl-asset://11111111-1111-4111-8111-111111111111'}]}},book:{elementsByPage:{cover:[{id:'background',role:'ai-design-background',assetId:'ai-cover'}]}}};await assert.rejects(()=>api.hydrateProjectData(stored),error=>error.code==='TEMPLATE_ASSETS_MISSING')});

test('image uploads use bounded concurrency and report save progress',async()=>{let active=0,maxActive=0,sequence=0;const progress=[],api=runtime({fetch:async path=>{if(path==='/api/template-assets'){active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return {ok:true,status:201,json:async()=>({asset:{id:`11111111-1111-4111-8111-${String(++sequence).padStart(12,'0')}`}})}}return {ok:true,status:201,json:async()=>({template:{id:'t1'},version:{versionNumber:1}})}}}),images=Array.from({length:8},(_,index)=>`data:image/png;base64,${Buffer.from(String(index)).toString('base64')}`);await api.save({projectData:{images}},{concurrency:4,onProgress:value=>progress.push(value)});assert.equal(maxActive,4);assert.equal(progress.findLast(item=>item.phase==='assets').completed,8);assert.equal(progress.at(-1).phase,'complete')});

test('a historical version hydrates private asset references for preview', async () => {
  const api = runtime({ fetch: async path => {
    assert.match(path, /^\/api\/template-assets\?ids=/);
    return { ok: true, status: 200, json: async () => ({ assets: [{ id: '11111111-1111-4111-8111-111111111111', url: 'https://signed.example/history.png' }] }) };
  }});
  const version = await api.hydrateVersion({ id: 'v1', projectData: { image: 'acdl-asset://11111111-1111-4111-8111-111111111111' } });
  assert.match(version.projectData.image, /^blob:template-asset-/);
});

test('legacy Supabase signed URLs are migrated back through the private asset boundary',async()=>{
 const old='https://project.supabase.co/storage/v1/object/sign/template-assets/sha256/legacy.webp?token=expired';
 const api=runtime({fetch:async path=>{
  if(path.startsWith('/api/template-assets?paths='))return {ok:true,status:200,json:async()=>({assets:[{id:'11111111-1111-4111-8111-111111111111',storagePath:'sha256/legacy.webp'}]})};
  throw new Error(`unexpected ${path}`)
 }}),reopened=await api.hydrateProjectData({template:{resources:{aiDesignAssets:[{id:'legacy',src:old}]}},book:{elementsByPage:{page:[{role:'ai-design-background',assetId:'legacy',src:old}]}}});
 assert.match(reopened.template.resources.aiDesignAssets[0].src,/^blob:template-asset-/);assert.match(reopened.book.elementsByPage.page[0].src,/^blob:template-asset-/);assert.equal(api.legacyStoragePath(old),'sha256/legacy.webp')
});


test('the Supabase access token reaches the Authorization header unchanged', async () => {
  const accessToken = 'signed.supabase.jwt';
  let received;
  const api = runtime({
    accessToken,
    fetch: async (path, options) => {
      received = options.headers.Authorization;
      return { ok: true, status: 200, json: async () => ({ templates: [] }) };
    }
  });
  await api.list();
  assert.equal(received, `Bearer ${accessToken}`);
  assert.equal(api.hasSession(), true);
});
