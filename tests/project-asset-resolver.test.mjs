import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/project-asset-resolver.js');
const resolver=globalThis.ACDLProjectAssetResolver;

function project(){return {template:{resources:{aiDesignAssets:[{id:'ai-cover',kind:'image',src:'acdl-asset://11111111-1111-4111-8111-111111111111',source:{type:'live-ai-generation'}}]}},book:{elementsByPage:{cover:[{id:'cover-bg',type:'image',role:'ai-design-background',assetId:'ai-cover'}]}}}}

test('AI generated images keep one payload and receive a shared AssetRef',()=>{
 const value=project();resolver.normalize(value);const background=value.book.elementsByPage.cover[0];
 assert.equal(value.template.resources.assets.length,0);
 assert.equal(value.template.resources.aiDesignAssets[0].origin,'ai-generated');
 assert.deepEqual(background.assetRef,{ref:'template',id:'ai-cover'});
 assert.equal(resolver.elementSource(value,background),'acdl-asset://11111111-1111-4111-8111-111111111111');
});

test('normalization removes an older duplicate AI payload from ordinary assets',()=>{
 const value=project(),source=value.template.resources.aiDesignAssets[0].src;
 value.template.resources.assets=[{id:'ai-cover',src:source,origin:'ai-generated'},{id:'user-photo',src:'photo'}];
 resolver.normalize(value);
 assert.deepEqual(value.template.resources.assets.map(item=>item.id),['user-photo']);
 assert.equal(resolver.asset(value,'ai-cover'),value.template.resources.aiDesignAssets[0]);
});

test('runtime assets keep the generated image identity and source',()=>{
 const assets=resolver.runtimeAssets(project());
 assert.equal(assets.length,1);assert.equal(assets[0].id,'ai-cover');assert.match(assets[0].src,/^acdl-asset:\/\//);
});
