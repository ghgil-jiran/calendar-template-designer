import assert from 'node:assert/strict';
import test from 'node:test';

await import('../apps/designer-studio/user-service-asset-resolver.js');
const factory = globalThis.ACDLUserServiceAssetResolver;

test('resolves url assets without storage access', async () => {
  let reads = 0;
  const resolver = factory.create({ getAsset: async () => { reads++; return null; } });
  assert.equal(await resolver.resolve({ ref: 'url', src: '/sample.jpg' }), '/sample.jpg');
  assert.equal(reads, 0);
});

test('prefers calendar-uploads dataUrl and caches the resolved id', async () => {
  let reads = 0;
  const resolver = factory.create({ getAsset: async id => { reads++; return { id, dataUrl: 'data:image/png;base64,local' }; } });
  const ref = { ref: 'idb', id: 'photo-1' };
  assert.equal(await resolver.resolve(ref), 'data:image/png;base64,local');
  assert.equal(await resolver.resolve(ref), 'data:image/png;base64,local');
  assert.equal(reads, 1);
});

test('falls back to the confirmed print-assets public url only after an existence check', async () => {
  const calls = [];
  const resolver = factory.create({
    getAsset: async () => null,
    cloudAssetUrl: id => `https://storage.example/print-assets/user/${id}`,
    cloudAssetExists: async id => { calls.push(id); return true; }
  });
  assert.equal(await resolver.resolve({ ref: 'idb', id: 'photo-2' }), 'https://storage.example/print-assets/user/photo-2');
  assert.deepEqual(calls, ['photo-2']);
});

test('creates a render-only Dataset without changing AssetRef source data', async () => {
  const resolver = factory.create({ getAsset: async id => id === 'logo' ? { dataUrl: 'data:logo' } : null });
  const source = {
    school: { name: '학교', profile: { logo: { ref: 'idb', id: 'logo' } } },
    monthlyImages: {
      '2027-03': { assetRef: { ref: 'url', src: '/march.jpg' }, sourcePageN: 3 },
      '2027-04': { assetRef: { ref: 'idb', id: 'missing' }, sourcePageN: 5 }
    }
  };
  const result = await resolver.resolveDataset(source);
  assert.notEqual(result.dataset, source);
  assert.deepEqual(source.school.profile.logo, { ref: 'idb', id: 'logo' });
  assert.deepEqual(result.dataset.school.profile.logo, { assetRef: { ref: 'idb', id: 'logo' }, src: 'data:logo' });
  assert.equal(result.dataset.monthlyImages['2027-03'].src, '/march.jpg');
  assert.deepEqual(result.dataset.monthlyImages['2027-04'], { assetRef: { ref: 'idb', id: 'missing' }, sourcePageN: 5 });
  assert.deepEqual(result.diagnostics.map(item => item.code), ['ASSET_NOT_FOUND']);
});
