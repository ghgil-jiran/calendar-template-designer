(function (root) {
  const finite = (value, fallback) => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const keepPartiallyVisible = item => {
    item.width = clamp(finite(item.width, 3), 3, 500);
    item.height = clamp(finite(item.height, 3), 3, 500);
    item.x = clamp(finite(item.x, 0), 1 - item.width, 99);
    item.y = clamp(finite(item.y, 0), 1 - item.height, 99);
  };

  function apply(item, action, values) {
    if (!item) return null;
    if (action === 'text-content') {
      item.content = values.content;
      item.binding = values.binding || null;
    }
    if (action === 'text-style') {
      item.style ||= {};
      item.style.fontFamily = values.fontFamily || '';
      item.style.fontSize = clamp(finite(values.fontSize, item.style.fontSize || 18), 1, 240);
      item.style.fontWeight = clamp(finite(values.fontWeight, item.style.fontWeight || 400), 100, 900);
      item.style.fontStyle = values.fontStyle === 'italic' ? 'italic' : 'normal';
      item.style.textDecoration = [values.underline ? 'underline' : '', values.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
      item.style.textAlign = ['left', 'center', 'right', 'justify'].includes(values.textAlign) ? values.textAlign : 'left';
      item.style.verticalAlign = ['top', 'middle', 'bottom'].includes(values.verticalAlign) ? values.verticalAlign : 'top';
      item.style.color = values.color || '#17202e';
      item.style.letterSpacing = clamp(finite(values.letterSpacing, item.style.letterSpacing || 0), -20, 100);
      item.style.lineHeight = clamp(finite(values.lineHeight, item.style.lineHeight || 1.2), .5, 4);
      item.style.opacity = clamp(finite(values.opacity, item.style.opacity ?? 1), 0, 1);
      item.style.background = Boolean(values.background);
      item.style.backgroundColor = values.backgroundColor || '#ffffff';
      item.style.strokeWidth = clamp(finite(values.strokeWidth, item.style.strokeWidth || 0), 0, 10);
      item.style.strokeColor = values.strokeColor || '#ffffff';
      item.style.shadow = Boolean(values.shadow);
      item.style.shadowX = clamp(finite(values.shadowX, item.style.shadowX || 0), -50, 50);
      item.style.shadowY = clamp(finite(values.shadowY, item.style.shadowY || 0), -50, 50);
      item.style.shadowBlur = clamp(finite(values.shadowBlur, item.style.shadowBlur || 0), 0, 50);
      item.style.shadowColor = values.shadowColor || '#000000';
    }
    if (action === 'image-style') {
      item.fit = values.fit;
      item.alt = values.alt;
      item.lockAspect = values.lockAspect !== false && values.lockAspect !== 'false';
      item.opacity = clamp(finite(values.opacity, item.opacity ?? 1), 0, 1);
      item.imageStyle = {
        ...(item.imageStyle || {}),
        brightness: clamp(finite(values.brightness, item.imageStyle?.brightness ?? 100), 0, 300),
        contrast: clamp(finite(values.contrast, item.imageStyle?.contrast ?? 100), 0, 300),
        saturation: clamp(finite(values.saturation, item.imageStyle?.saturation ?? 100), 0, 300),
        flipX: values.flipX === true || values.flipX === 'true',
        flipY: values.flipY === true || values.flipY === 'true'
      };
    }
    if (action === 'geometry') {
      item.x = finite(values.x, item.x);
      item.y = finite(values.y, item.y);
      item.width = finite(values.width, item.width);
      item.height = finite(values.height, item.height);
      keepPartiallyVisible(item);
    }
    return item;
  }

  root.ACDLInspectorElement = Object.freeze({ apply });
})(typeof window !== 'undefined' ? window : globalThis);
