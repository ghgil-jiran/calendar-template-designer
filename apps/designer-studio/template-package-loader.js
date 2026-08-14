(function (root) {
  const DEFAULT_BASE = '/templates/desk-academic-standard/1.0.0/';

  async function load(fetcher = root.fetch?.bind(root), base = DEFAULT_BASE) {
    if (typeof fetcher !== 'function') throw new TypeError('fetcher must be a function');
    const read = async path => {
      const response = await fetcher(`${base}${path}`);
      if (!response?.ok) throw new Error(`Template Package load failed: ${path}`);
      return response.json();
    };
    const manifest = await read('manifest.json');
    const [template, bindings, print] = await Promise.all([
      read(manifest.files.template),
      read(manifest.files.bindings),
      read(manifest.files.print)
    ]);
    if (manifest.templateId !== template.templateId) throw new Error('Template Package id mismatch');
    if (manifest.version !== template.version) throw new Error('Template Package version mismatch');
    return Object.freeze({ manifest, template, bindings, print });
  }

  root.ACDLTemplatePackageLoader = Object.freeze({ load, DEFAULT_BASE });
})(typeof window !== 'undefined' ? window : globalThis);
