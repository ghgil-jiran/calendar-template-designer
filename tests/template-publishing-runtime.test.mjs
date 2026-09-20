import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {forwardReviewPackage} from '../server/user-service-review-publisher.js';

const source=readFileSync(new URL('../apps/designer-studio/template-publishing-runtime.js',import.meta.url),'utf8');
const studioRuntimeSource=readFileSync(new URL('../apps/designer-studio/features/studio-runtime-core.js',import.meta.url),'utf8');
const proxySource=readFileSync(new URL('../api/templates.js',import.meta.url),'utf8');
const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
function runtime(){const window={crypto:globalThis.crypto,fetch:globalThis.fetch,TextEncoder,FileReader:class{}};vm.runInNewContext(source,{window,TextEncoder,FileReader:window.FileReader,structuredClone,btoa,atob,decodeURIComponent});return window.ACDLTemplatePublishing}

test('snapshot review bundle preserves the complete editor project and preview contract',()=>{const api=runtime(),project={productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{startMonth:3},template:{publishing:{dataRequirements:[{path:'school.name',stage:'project-create-required'},{path:'monthlyImages',stage:'optional',fallback:'sample'}]}},book:{pageInstances:[{id:'cover',role:'cover-front'},{id:'month',role:'monthly-front'}]}};const representativeAsset={id:'11111111-1111-4111-8111-111111111111',storagePath:'test-template/1.0.0/assets/preview',mimeType:'image/svg+xml',sha256:'a'.repeat(64)},bundle=api.buildBundle(project,{id:'test-template',version:'1.0.0',name:'테스트',productType:'desk',representativeAsset});assert.equal(bundle.template.kind,'designer-project-snapshot');assert.equal(bundle.template.projectData,project);assert.equal(bundle.bindings.bindings[0].required,true);assert.equal(bundle.bindings.bindings[1].missing,'sample');assert.equal(bundle.manifest.status,'review');assert.equal(bundle.manifest.publishable,false);assert.deepEqual(JSON.parse(JSON.stringify(bundle.manifest.representativePreview)),{mode:'cover-page',pageId:'cover',role:'cover-front',assetId:representativeAsset.id,storagePath:representativeAsset.storagePath,mimeType:representativeAsset.mimeType,sha256:representativeAsset.sha256});assert.deepEqual(JSON.parse(JSON.stringify(bundle.manifest.pagePreviews)),{schemaVersion:'template-page-previews.v1',mode:'runtime-derived',source:'immutable-package',pages:[{index:0,pageId:'cover',role:'cover-front',mode:'runtime-derived'},{index:1,pageId:'month',role:'monthly-front',mode:'runtime-derived'}]})});

test('package id normalization is stable and accepted by the user service contract',()=>{const api=runtime();assert.equal(api.packageId('TPL 2027 / Desk 01'),'tpl-2027-desk-01');assert.match(api.packageId('한글 이름'),/^template-\d+$/)});

test('new temporary templates receive a readable name and deterministic package identity',()=>{const api=runtime(),project={productType:{category:'desk',pageSize:{width:260,height:180}},settings:{frontInsertCount:0,rearInsertCount:0},template:{settings:{aiDesignSpec:{styleId:'editorial-graphic',styleSnapshots:[{id:'editorial-graphic',name:'에디토리얼 그래픽'}]}}}};const identity=api.publicationIdentity(project,'20260914_002',{id:'tpl-1789367395367',stableKey:'tpl-1789367395367'});assert.equal(identity.name,'탁상형 260×180 · 기본 구성 · 에디토리얼 그래픽 · 02');assert.equal(identity.id,'desk-260x180-basic-editorial-graphic-02')});

test('image data URLs are deduplicated into independently uploaded package assets',async()=>{const api=runtime(),source='data:image/png;base64,aGVsbG8=',result=await api.externalizeAssets({cover:source,nested:[source]},{templateId:'desk-test',version:'1.0.0'});assert.equal(result.assets.length,1);assert.equal(result.assets[0].mimeType,'image/png');assert.equal(result.assets[0].byteLength,5);assert.match(result.assets[0].id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);assert.equal(result.project.cover,`package-asset://${result.assets[0].id}`);assert.equal(result.project.nested[0],result.project.cover);const bundle=api.buildBundle(result.project,{id:'desk-test',version:'1.0.0',name:'테스트',productType:'desk',assets:result.assets});assert.equal(bundle.assets.length,1);assert.equal('bytes' in bundle.assets[0],false)});

test('generated SVG cover preview is externalized as a UTF-8 package image asset',async()=>{const api=runtime(),svg='<svg xmlns="http://www.w3.org/2000/svg"><text>학교 표지</text></svg>',preview=`data:image/svg+xml,${encodeURIComponent(svg)}`,result=await api.externalizeAssets({project:{format:'acdl-project'},representativePreview:preview},{templateId:'desk-test',version:'1.0.1'});assert.equal(result.assets.length,1);assert.equal(result.assets[0].mimeType,'image/svg+xml');assert.equal(new TextDecoder().decode(result.assets[0].bytes),svg);assert.equal(result.project.representativePreview,`package-asset://${result.assets[0].id}`)});

test('library settings publishing captures the explicitly loaded project instead of editor global state',()=>{assert.match(source,/capture\?\.\(projectData\)/);assert.match(studioRuntimeSource,/representativeCoverSvg\(sourceProject=project\)/);assert.match(studioRuntimeSource,/project=sourceProject/);assert.match(studioRuntimeSource,/project=previous\.project/)});

test('cover representative preview is rasterized to PNG before publishing',()=>{assert.match(studioRuntimeSource,/return representativeSvgPng\(svg,width,height\)/);assert.match(studioRuntimeSource,/canvas\.toDataURL\('image\/png'\)/)});
test('generated representative cover is persisted and verified as the editor library thumbnail',()=>{assert.match(source,/projectData\.template\.thumbnail\.packagePreview=\{templateId:id,version,assetId:representativeAsset\.id,storagePath:representativeAsset\.storagePath,sha256:representativeAsset\.sha256\}/);assert.match(studioRuntimeSource,/const persistedThumbnail=result\.version\?\.projectData\?\.template\?\.thumbnail/);assert.match(studioRuntimeSource,/REPRESENTATIVE_PREVIEW_MISMATCH/)});

test('a hydrated blob thumbnail is converted before it becomes a required package representative asset',()=>{assert.match(source,/normalizedUploaded=uploaded\?await run\('기존 대표 이미지 준비',\(\)=>inlineBlobUrls\(uploaded\)\):null/);assert.match(source,/if\(!representativeAsset\)throw Object\.assign\(new Error\('대표 이미지를 게시 자산으로 준비하지 못했습니다.'/);assert.match(source,/code:'REPRESENTATIVE_ASSET_MISSING'/)});

test('an automatic cover thumbnail is regenerated while only an explicit custom upload is preserved',()=>{assert.match(source,/thumbnail\.source==='custom-upload'\|\|legacyCustom/);assert.match(source,/source:customThumbnail\?'custom-upload':'cover-page'/);assert.match(source,/representativeDataUrl=normalizedUploaded\|\|await run\('대표 이미지 생성'/);assert.match(studioRuntimeSource,/source:'custom-upload'/)});

test('cover capture waits for page images and the library shows the full representative surface',()=>{assert.match(studioRuntimeSource,/source\.querySelectorAll\('img'\)/);assert.match(studioRuntimeSource,/image\.decode/);const css=readFileSync(new URL('../apps/designer-studio/designer-studio-overrides.css',import.meta.url),'utf8');assert.match(css,/\.calendar-product-page \.library-uploaded-thumbnail\{object-fit:contain/)});

test('review proxy forwards only authenticated supported operations to the user service preview branch',async()=>{await assert.rejects(()=>forwardReviewPackage({authorization:'',body:{mode:'chunk'},fetcher:async()=>{}}),/AUTH_REQUIRED/);let received;const result=await forwardReviewPackage({authorization:'Bearer token',body:{mode:'next-version',packageId:'a',baseVersion:'1.0.0'},fetcher:async(url,options)=>{received={url,options};return {ok:true,status:200,json:async()=>({version:'1.0.1'})}}});assert.equal(result.version,'1.0.1');assert.match(received.url,/school-calendar-editor-servic-git-1a2acc/);assert.match(received.url,/template-packages\/review$/);assert.equal(received.options.headers.Authorization,'Bearer token')});

test('review proxy permits asset upload, activation, withdrawal, and catalog synchronization modes',async()=>{for(const mode of ['asset-chunk','activate-review','withdraw','retire-packages','inspect-review-catalog','sync-review-catalog']){let forwarded=false;await forwardReviewPackage({authorization:'Bearer token',body:{mode},fetcher:async()=>{forwarded=true;return {ok:true,status:200,json:async()=>({ok:true})}}});assert.equal(forwarded,true)}});

test('review proxy permits completed print artifact download and history modes',async()=>{for(const mode of ['print-preflight-download','print-preflight-history']){let forwarded=false;await forwardReviewPackage({authorization:'Bearer token',body:{mode,id:'job-id'},fetcher:async()=>{forwarded=true;return {ok:true,status:200,json:async()=>({ok:true})}}});assert.equal(forwarded,true)}});

test('print artifact download and history use the dedicated print preflight endpoint',async()=>{for(const mode of ['print-preflight-download','print-preflight-history']){let endpoint='';await forwardReviewPackage({authorization:'Bearer token',body:{mode,id:'job-id'},fetcher:async url=>{endpoint=url;return {ok:true,status:200,json:async()=>({ok:true})}}});assert.match(endpoint,/\/api\/template-print-preflight$/)}});

test('publishing runtime exposes print artifact download and history requests',()=>{const api=runtime();assert.equal(typeof api.printPreflightDownload,'function');assert.equal(typeof api.printPreflightHistory,'function');assert.match(source,/mode:'print-preflight-download'/);assert.match(source,/mode:'print-preflight-history'/)});
test('print preflight request carries the canonical editor renderer origin and id',()=>{assert.match(source,/editorPrintOrigin:location\.origin/);assert.match(source,/rendererId:'template-editor-review-dom\.v1'/)});
test('completed CMYK PDF uses the Korean template display name instead of the internal package id',()=>{const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');assert.match(library,/identity\?\.name\|\|identity\?\.displayName/);assert.match(library,/replace\(\/\\s\+\/g,'-'\)/);assert.match(library,/`\$\{safe\}-CMYK-draft\.pdf`/);assert.match(library,/name:preflightRecord\.name\|\|preflightProject\?\.template\?\.metadata\?\.name/)});
test('the actual CMYK download reuses the opened library record name',()=>{const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');assert.match(library,/identity=\{\.\.\.\(preflightReport\?\.identity\|\|\{\}\),name:preflightRecord\?\.name\|\|preflightReport\?\.identity\?\.name\}/);assert.match(library,/link\.download=artifactFilename\(identity,artifact\)/)});
test('a completed artifact remains downloadable even when quality verification fails',()=>{const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8'),start=library.indexOf('async function downloadPrintPdf()'),end=library.indexOf('async function captureRenderParity',start),download=library.slice(start,end);assert.match(download,/artifact\.status!==['"]done['"]/);assert.doesNotMatch(download,/artifact\.verified/)});
test('the artifact summary distinguishes failed, unfinished, and fully passed checks',()=>{const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');assert.match(library,/failed=results\.filter/);assert.match(library,/품질검사 실패/);assert.match(library,/미완료 검사 항목 있음/);assert.match(library,/필수 자동검사 통과/)});

test('catalog comparison distinguishes matching, missing, stale, and mismatched packages',()=>{const rows=runtime().compareCatalogs([{name:'일치',editorRevision:10,templateId:'same',version:'1.0.7'},{name:'신규',editorRevision:3,templateId:'new',version:'1.0.0'},{name:'변경',editorRevision:5,templateId:'changed',version:'1.0.2'}],[{name:'일치',templateId:'same',version:'1.0.7'},{name:'이전',templateId:'old',version:'1.0.4'},{name:'변경',templateId:'changed',version:'1.0.1'}]);const states=Object.fromEntries(rows.map(row=>[row.templateId,row.state]));assert.equal(states.same,'matched');assert.equal(states.new,'editor-only');assert.equal(states.old,'service-only');assert.equal(states.changed,'version-mismatch')});

test('browser reuses the existing templates endpoint with bounded two-megabyte review chunks',()=>{assert.match(source,/fetch\('\/api\/templates'/);assert.match(source,/operation:'publish-review'/);assert.match(source,/CHUNK_BYTES=1800\*1024/)});

test('missing review chunks trigger bounded re-upload and finalization recovery',()=>{assert.match(source,/for\(let attempt=0;attempt<3;attempt\+\+\)/);assert.match(source,/Review \(\?:asset \|package \)\?chunk missing/);assert.match(source,/await uploadAssets\(true\);await uploadPackage\(true\)/)});

test('an interrupted publish keeps its version and completed checkpoints for stage retry',()=>{assert.match(source,/let pendingPublish=null/);assert.match(source,/pendingPublish\?\.key===key\?pendingPublish:null/);assert.match(source,/if\(!context\.assetsUploaded\)await uploadAssets\(\)/);assert.match(source,/if\(!context\.packageUploaded\)await uploadPackage\(\)/);assert.match(source,/if\(!context\.validated\)for/);assert.match(source,/if\(activate&&!context\.activated\)/);assert.match(source,/function completePublication\(templateId,version\)/)});

test('draft print inspection prepares an inactive package without publishing it',async()=>{
 const modes=[];
 const window={
  crypto:globalThis.crypto,TextEncoder,FileReader:class{},
  ACDLTemplateRemotePersistence:{accessToken:()=>"token"},
  ACDLRepresentativePreview:{capture:async()=>"data:image/png;base64,aGVsbG8="},
  ACDLNativePrintPackageCompiler:{compileProject:()=>({status:'ready',counts:{blocked:0}})},
  fetch:async(_url,options)=>{const body=JSON.parse(options.body).reviewBody;modes.push(body.mode);return {ok:true,json:async()=>body.mode==='next-version'?{version:'1.0.0'}:{ok:true}}}
 };
 vm.runInNewContext(source,{window,TextEncoder,FileReader:window.FileReader,structuredClone,btoa,atob,decodeURIComponent});
 const projectData={productType:{category:'desk',pageSize:{width:260,height:180,unit:'mm'}},settings:{startMonth:3},template:{metadata:{name:'초안',state:'draft'},remoteVersionNumber:3,publishing:{},thumbnail:{}},book:{pageInstances:[{id:'cover',role:'cover-front'}],elementsByPage:{cover:[]}}};
 const result=await window.ACDLTemplatePublishing.preparePrintInspection({record:{id:'draft-template',stableKey:'draft-template',version:3,type:'desk'},projectData,name:'초안',productType:'desk'});
 assert.equal(result.version,'1.0.0');
 assert.ok(projectData.template.publishing.lastPrintInspectionPackage?.sha256);
 assert.equal(projectData.template.publishing.lastPrintInspectionPackage.status,'print-inspection');
 assert.equal(projectData.template.publishing.lastReviewPackage,undefined);
 assert.equal(modes.includes('activate-review'),false);
 assert.deepEqual(modes.filter(mode=>mode==='next-version'||mode==='finalize'),['next-version','finalize']);
});

test('template preflight creates and persists a package for a draft before requesting the worker job',()=>{
 const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
 assert.match(library,/lastPrintInspectionPackage\|\|publishing\.lastReviewPackage/);
 assert.match(library,/preparePrintInspection/);
 assert.match(library,/saveNote:`\$\{record\.name\} 인쇄검사용 Package 저장`/);
 assert.match(library,/state,isStandard:record\.isStandard===true/);
 assert.match(library,/ensurePrintPreflight\(preflightIdentity/);
});

test('every draft final preflight refreshes the immutable package from the current saved snapshot',()=>{
 const library=readFileSync(new URL('../apps/designer-studio/template-library-runtime.js',import.meta.url),'utf8');
 const start=library.indexOf('async function runFinalPreflight');
 const end=library.indexOf('async function refreshPreflightResult',start);
 const finalPreflight=library.slice(start,end);
 assert.match(finalPreflight,/const status=el\('templatePreflightStatus'\),draft=/);
 assert.match(finalPreflight,/if\(draft\|\|!preflightIdentity\?\.templateId/);
 assert.match(finalPreflight,/await prepareDraftPrintInspectionPackage\(\)/);
 assert.match(finalPreflight,/preflightRenderParity=await captureRenderParity\(preflightProject\)/);
});

test('review proxy delegates authorization once to the receiving user service',()=>{const review=proxySource.indexOf("body?.operation==='publish-review'"),localAuth=proxySource.indexOf('await assertInternalAccess(request)');assert.ok(review>0);assert.ok(localAuth>review);assert.match(proxySource,/forwardReviewPackage\(\{authorization,body:body\.reviewBody\}\)/)});

test('image-heavy package finalization has an explicit long-running function budget',()=>{assert.equal(vercel.functions['api/templates.js'].maxDuration,300);assert.match(readFileSync(new URL('../server/user-service-review-publisher.js',import.meta.url),'utf8'),/body\.mode==='finalize'\?240000:60000/)});

test('published identities can be withdrawn and the review catalog follows the current system base exactly',async()=>{const calls=[],projects={one:{template:{publishing:{lastReviewPackage:{templateId:'desk-one',version:'1.0.2'}}}},two:{template:{publishing:{lastReviewPackage:{templateId:'desk-two',version:'1.0.1'}}}}},window={crypto:globalThis.crypto,fetch:async(_url,options)=>{const body=JSON.parse(options.body);calls.push(body.reviewBody);return {ok:true,json:async()=>({archived:[]})}},TextEncoder,FileReader:class{},ACDLTemplateRemotePersistence:{accessToken:()=>"token",isRemote:()=>true,list:async()=>[{id:'one',state:'published'},{id:'two',state:'published'},{id:'draft',state:'draft'}],load:async id=>({version:{projectData:projects[id]}})}};vm.runInNewContext(source,{window,TextEncoder,FileReader:window.FileReader,structuredClone,btoa});const project={template:{publishing:{lastReviewPackage:{templateId:'desk-new',version:'1.0.0'}}}};assert.equal(JSON.stringify(window.ACDLTemplatePublishing.publishedIdentity(project)),JSON.stringify({templateId:'desk-new',version:'1.0.0'}));await window.ACDLTemplatePublishing.withdraw(project);await window.ACDLTemplatePublishing.synchronizeCatalog();assert.equal(calls[0].mode,'withdraw');assert.equal(calls[1].mode,'sync-review-catalog');assert.deepEqual(calls[1].activePackages.map(item=>`${item.templateId}@${item.version}`),['desk-one@1.0.2','desk-two@1.0.1']);assert.deepEqual(calls[1].activePackages.map(item=>item.sourceEditorRevision),[null,null])});
