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
          strokeWidth: Number(values.strokeWidth ?? item.style?.strokeWidth),
          dash: values.dash || 'solid',
          shadow: values.shadow === true || values.shadow === 'true',
          shadowColor: values.shadowColor || item.style?.shadowColor || '#000000',
          shadowBlur: Number(values.shadowBlur ?? item.style?.shadowBlur ?? 0),
          shadowX: Number(values.shadowX ?? item.style?.shadowX ?? 0),
          shadowY: Number(values.shadowY ?? item.style?.shadowY ?? 0)
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
        item.shadow = values.shadow === true || values.shadow === 'true';
        item.shadowColor = values.shadowColor || item.shadowColor || '#000000';
        item.shadowBlur = Number(values.shadowBlur ?? item.shadowBlur ?? 0);
      }
      if (item.type === 'image-frame') {
        item.frameType = values.frameType || item.frameType;
        item.style = {
          ...(item.style || {}),
          stroke: values.stroke || item.style?.stroke,
          strokeWidth: Number(values.strokeWidth ?? item.style?.strokeWidth),
          background: values.background || item.style?.background || '#eef2f7',
          shadow: values.shadow === true || values.shadow === 'true',
          shadowColor: values.shadowColor || item.style?.shadowColor || '#000000',
          shadowBlur: Number(values.shadowBlur ?? item.style?.shadowBlur ?? 0)
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
      Object.assign(item, root.ACDLCanvasGeometry?.keepPartiallyVisible(item) || item);
    }
    if (action === 'frame') {
      item.image ||= {};
      item.image.binding = values.binding;
      item.image.fit = values.fit;
      item.image.scale = Number(values.scale || 1);
      item.image.offsetX = Number(values.offsetX || 0);
      item.image.offsetY = Number(values.offsetY || 0);
      item.image.flipX = values.flipX === true || values.flipX === 'true';
      item.image.flipY = values.flipY === true || values.flipY === 'true';
      item.image.brightness = Number(values.brightness ?? 100);
      item.image.contrast = Number(values.contrast ?? 100);
      item.image.saturation = Number(values.saturation ?? 100);
    }
    if (action === 'permission') {
      item.permissions ||= {};
      Object.entries(values.permissions || {}).forEach(([name, enabled]) => { item.permissions[name] = Boolean(enabled); });
    }
    return item;
  }

  root.ACDLInspectorGraphic = Object.freeze({ apply });
})(typeof window !== 'undefined' ? window : globalThis);
