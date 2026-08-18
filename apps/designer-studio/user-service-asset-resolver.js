(function (root) {
  function isAssetRef(value) {
    return Boolean(value && typeof value === 'object' && (
      (value.ref === 'idb' && typeof value.id === 'string' && value.id.length > 0) ||
      (value.ref === 'url' && typeof value.src === 'string' && value.src.length > 0)
    ));
  }

  function create(options = {}) {
    const getAsset = options.getAsset;
    const cloudAssetUrl = options.cloudAssetUrl;
    const cloudAssetExists = options.cloudAssetExists;
    const cache = new Map();

    async function resolve(ref) {
      if (!isAssetRef(ref)) return null;
      if (ref.ref === 'url') return ref.src;
      if (cache.has(ref.id)) return cache.get(ref.id);
      const pending = (async () => {
        if (typeof getAsset === 'function') {
          const local = await getAsset(ref.id);
          const source = typeof local === 'string' ? local : local?.dataUrl;
          if (typeof source === 'string' && source.length > 0) return source;
        }
        if (typeof cloudAssetUrl === 'function' && typeof cloudAssetExists === 'function') {
          const url = cloudAssetUrl(ref.id);
          if (url && await cloudAssetExists(ref.id)) return url;
        }
        return null;
      })().catch(() => null);
      cache.set(ref.id, pending);
      const source = await pending;
      if (source) cache.set(ref.id, source);
      else cache.delete(ref.id);
      return source;
    }

    async function resolveValue(value, path, diagnostics) {
      const ref = isAssetRef(value) ? value : value?.assetRef;
      if (!isAssetRef(ref)) return value;
      const src = await resolve(ref);
      if (!src) {
        diagnostics.push({ severity: 'warning', code: 'ASSET_NOT_FOUND', message: `이미지 자산을 찾지 못했습니다: ${ref.ref === 'idb' ? ref.id : ref.src}`, path });
        return isAssetRef(value) ? { assetRef: value } : { ...value };
      }
      return isAssetRef(value) ? { assetRef: value, src } : { ...value, src };
    }

    async function resolveDataset(dataset) {
      if (!dataset || typeof dataset !== 'object') throw new TypeError('dataset must be an object');
      const diagnostics = [];
      const profile = dataset.school?.profile || {};
      const resolvedProfile = { ...profile };
      if (profile.logo) resolvedProfile.logo = await resolveValue(profile.logo, 'school.profile.logo', diagnostics);
      const monthlyImages = {};
      for (const [key, value] of Object.entries(dataset.monthlyImages || {})) {
        monthlyImages[key] = await resolveValue(value, `monthlyImages.${key}`, diagnostics);
      }
      return {
        dataset: {
          ...dataset,
          school: { ...(dataset.school || {}), profile: resolvedProfile },
          monthlyImages
        },
        diagnostics,
        hasErrors: false
      };
    }

    return Object.freeze({ resolve, resolveDataset, clearCache: () => cache.clear() });
  }

  root.ACDLUserServiceAssetResolver = Object.freeze({ isAssetRef, create });
})(typeof window !== 'undefined' ? window : globalThis);
