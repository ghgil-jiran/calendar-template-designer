(function (root) {
  function maximumShapeRadius(item, pageSize) {
    return Math.min(item.width * pageSize.width, item.height * pageSize.height) / 200;
  }
  function shapeCornerPercent(item, pageSize) {
    const maximum = maximumShapeRadius(item, pageSize);
    return maximum > 0 ? Math.min(100, (item.style?.cornerRadiusMm ?? 3) / maximum * 100) : 100;
  }
  function apply(item, action, values) {
    if (!item) return null;
    if (action === 'shape-form' && item.type === 'shape') {
      item.shapeType = values.shapeType;
      if (item.shapeType === 'rounded') {
        const maximum = maximumShapeRadius(item, values.pageSize);
        const ratio = Number(values.cornerPercent);
        const radius = maximum > 0 && ratio > 0 ? maximum * Math.min(100, ratio) / 100 : 3;
        item.style = {...item.style, cornerRadiusMm: radius};
      }
    }
    if (action === 'style') {
      if (item.type === 'shape') {
        item.shapeType = values.shapeType || item.shapeType;
        const opacityPercent = values.shapeOpacityPercent;
        if (opacityPercent != null && String(opacityPercent).trim() && Number.isFinite(Number(opacityPercent))) {
          item.opacity = Math.max(0, Math.min(100, Number(opacityPercent))) / 100;
        }
        item.style = {
          ...(item.style || {}),
          ...(item.shapeType === 'rounded' && item.style?.cornerRadiusMm == null ? {cornerRadiusMm: 3} : {}),
          fill: values.fill || item.style?.fill,
          ...(values.fillSoftEdgePt !== undefined ? {fillSoftEdgePt: root.ACDLPhotoFrameModel.softEdgeSize(values.fillSoftEdgePt)} : {}),
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
      if (item.type === 'vector' && item.assetId === 'graphic-library-vector') {
        const object = root.ACDLGraphicVectorObject.normalize({...item.colors.graphicVectorObject, ...(values.vectorColors?.length ? {colors: values.vectorColors} : {})});
        item.colors = {...item.colors, graphicVectorObject: object};
        item.style = {...item.style, graphicVectorObject: JSON.parse(JSON.stringify(object))};
        item.value = {...item.value, graphicVectorObject: JSON.parse(JSON.stringify(object))};
        item.flipX = values.flipX === true || values.flipX === 'true';
        item.flipY = values.flipY === true || values.flipY === 'true';
      }
      if (item.type === 'vector' && item.assetId !== 'graphic-library-vector') {
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
          background: values.background ?? item.style?.background ?? '#eef2f7',
          ...(values.softEdgePt === undefined ? {} : {softEdgePt: root.ACDLPhotoFrameModel.softEdgeSize(values.softEdgePt)}),
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
      if (values.opacity != null) item.opacity = Number(values.opacity);
      Object.assign(item, root.ACDLCanvasGeometry?.keepPartiallyVisible(item, values.pageSize) || item);
    }
    if (action === 'frame') {
      root.ACDLPhotoFrameEditing.apply(item, values);
    }
    if (action === 'permission') {
      item.permissions ||= {};
      Object.entries(values.permissions || {}).forEach(([name, enabled]) => { item.permissions[name] = Boolean(enabled); });
    }
    return item;
  }

  root.ACDLInspectorGraphic = Object.freeze({ apply, shapeCornerPercent });
})(typeof window !== 'undefined' ? window : globalThis);

