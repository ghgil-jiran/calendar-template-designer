(function (root) {
  function createHistoryCodec() {
    const binaryPool = new Map();
    const binaryRefs = new Map();
    let binarySequence = 0;

    function compact(value) {
      const seen = new WeakSet();
      function walk(current) {
        if (typeof current === 'string' && current.startsWith('data:') && current.length > 2048) {
          let key = binaryRefs.get(current);
          if (!key) {
            key = `bin-${++binarySequence}`;
            binaryPool.set(key, current);
            binaryRefs.set(current, key);
          }
          return { __acdlBinaryRef: key };
        }
        if (!current || typeof current !== 'object') return current;
        if (seen.has(current)) return null;
        seen.add(current);
        if (Array.isArray(current)) return current.map(walk);
        const output = {};
        for (const [key, entry] of Object.entries(current)) output[key] = walk(entry);
        return output;
      }
      return walk(value);
    }

    function restore(value) {
      function walk(current) {
        if (!current || typeof current !== 'object') return current;
        if (current.__acdlBinaryRef) return binaryPool.get(current.__acdlBinaryRef) || '';
        if (Array.isArray(current)) return current.map(walk);
        for (const key of Object.keys(current)) current[key] = walk(current[key]);
        return current;
      }
      return walk(value);
    }

    const stringify = value => JSON.stringify(compact(value));
    const parse = text => restore(JSON.parse(text));
    return Object.freeze({ binaryPool, compact, restore, stringify, parse });
  }

  root.ACDLPersistenceHistory = Object.freeze({ createHistoryCodec });
})(typeof window !== 'undefined' ? window : globalThis);
