(function (root) {
  const key = (id, scope) => `${scope}:${id}`;
  const parseKey = value => {
    const [scope, ...parts] = String(value).split(':');
    return { id: parts.join(':'), scope };
  };

  function createSelectionStore(resolveItem) {
    const selected = new Set();
    const views = () => [...selected].map(value => {
      const { id, scope } = parseKey(value);
      const item = resolveItem(id, scope);
      return item ? { item, id, scope } : null;
    }).filter(Boolean);

    function clear() {
      selected.clear();
    }

    function selectOnly(id, scope) {
      selected.clear();
      selected.add(key(id, scope));
      return { id, scope };
    }

    function toggle(id, scope, primary) {
      const value = key(id, scope);
      if (!selected.has(value)) {
        selected.add(value);
        return { id, scope };
      }
      selected.delete(value);
      if (primary?.id !== id || primary?.scope !== scope) return primary;
      const next = selected.values().next().value;
      return next ? parseKey(next) : null;
    }

    function sync(primary) {
      if (!primary?.id || !primary?.scope) {
        selected.clear();
        return null;
      }
      for (const value of selected) {
        const { id, scope } = parseKey(value);
        if (!resolveItem(id, scope)) selected.delete(value);
      }
      const primaryKey = key(primary.id, primary.scope);
      if (!selected.has(primaryKey)) {
        selected.clear();
        selected.add(primaryKey);
      }
      return primary;
    }

    function replace(entries) {
      selected.clear();
      entries.forEach(entry => selected.add(typeof entry === 'string' ? entry : key(entry.id, entry.scope)));
      const last = [...selected].at(-1);
      return last ? parseKey(last) : null;
    }

    return Object.freeze({ key, has: value => selected.has(value), views, clear, selectOnly, toggle, sync, replace });
  }

  root.ACDLCanvasSelection = Object.freeze({ createSelectionStore, key, parseKey });
})(typeof window !== 'undefined' ? window : globalThis);
