(function (root) {
  function apply(item, action, values) {
    if (!item) return null;
    if (action === 'style') {
      if (item.type === 'shape') {
        item.shapeType = values.shapeType || item.shapeType;
        item.style = {
          ...(item.style || {}),
          fill: values.fill || item.style?.fill,
          stroke: values.stroke || item.style?.stroke,
          strokeWidth: Number(values.strokeWidth ?? item.style?.strokeWidth)
        };
      }
      if (item.type === 'vector') {
        item.assetId = values.assetId || item.assetId;
        item.colors = {
          primary: values.primary || item.colors?.primary,
          secondary: values.secondary || item.colors?.secondary
        };
        item.flipX = values.flipX === true || values.flipX === 'true';
        item.flipY = values.flipY === true || values.flipY === 'true';
      }
      if (item.type === 'image-frame') {
        item.frameType = values.frameType || item.frameType;
        item.style = {
          ...(item.style || {}),
          stroke: values.stroke || item.style?.stroke,
          strokeWidth: Number(values.strokeWidth ?? item.style?.strokeWidth)
        };
      }
    }
    if (action === 'layout') {
      item.x = Number(values.x);
      item.y = Number(values.y);
      item.width = Number(values.width);
      item.height = Number(values.height);
      item.rotation = Number(values.rotation || 0);
      item.opacity = Number(values.opacity ?? 1);
    }
    if (action === 'frame') {
      item.image ||= {};
      item.image.binding = values.binding;
      item.image.fit = values.fit;
      item.image.scale = Number(values.scale || 1);
      item.image.offsetX = Number(values.offsetX || 0);
      item.image.offsetY = Number(values.offsetY || 0);
    }
    if (action === 'permission') {
      item.permissions ||= {};
      Object.entries(values.permissions || {}).forEach(([name, enabled]) => { item.permissions[name] = Boolean(enabled); });
    }
    return item;
  }

  root.ACDLInspectorGraphic = Object.freeze({ apply });
})(typeof window !== 'undefined' ? window : globalThis);
