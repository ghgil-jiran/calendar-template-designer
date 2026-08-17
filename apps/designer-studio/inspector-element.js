(function (root) {
  const finite = (value, fallback) => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function apply(item, action, values) {
    if (!item) return null;
    if (action === 'text-content') {
      item.content = values.content;
      item.binding = values.binding || null;
    }
    if (action === 'text-style') {
      item.style ||= {};
      item.style.fontSize = Number(values.fontSize);
      item.style.textAlign = values.textAlign;
      item.style.color = values.color;
      item.style.background = Boolean(values.background);
    }
    if (action === 'image-style') {
      item.fit = values.fit;
      item.alt = values.alt;
    }
    if (action === 'geometry') {
      item.x = finite(values.x, item.x);
      item.y = finite(values.y, item.y);
      item.width = clamp(finite(values.width, item.width), 3, 100);
      item.height = clamp(finite(values.height, item.height), 3, 100);
      item.x = clamp(item.x, 0, 100 - item.width);
      item.y = clamp(item.y, 0, 100 - item.height);
    }
    return item;
  }

  root.ACDLInspectorElement = Object.freeze({ apply });
})(typeof window !== 'undefined' ? window : globalThis);
