(function (root) {
  const clone = value => typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

  function begin({ pointerId, startX, startY, handle, rect, views, primary, node, pageSize }) {
    const center = {
      x: rect.left + (primary.item.x + primary.item.width / 2) / 100 * rect.width,
      y: rect.top + (primary.item.y + primary.item.height / 2) / 100 * rect.height
    };
    return {
      pageSize,
      pointerId,
      startX,
      startY,
      handle,
      rect,
      originals: views.filter(view => !view.item.locked).map(view => ({ ...view, original: clone(view.item) })),
      primary: { ...primary, original: clone(primary.item) },
      startAngle: Math.atan2(startY - center.y, startX - center.x),
      center,
      changed: false,
      node
    };
  }

  function update(gesture, pointer) {
    const deltaX = (pointer.clientX - gesture.startX) / gesture.rect.width * 100;
    const deltaY = (pointer.clientY - gesture.startY) / gesture.rect.height * 100;
    if (Math.abs(deltaX) > .05 || Math.abs(deltaY) > .05) gesture.changed = true;
    if (gesture.handle === 'move') {
      gesture.originals.forEach(view => Object.assign(view.item, root.ACDLCanvasGeometry.moveFrame(view.original, deltaX, deltaY)));
    } else if (gesture.handle === 'rotate') {
      gesture.primary.item.rotation = root.ACDLCanvasGeometry.rotateFrame(
        gesture.primary.original.rotation,
        pointer.clientX,
        pointer.clientY,
        gesture.center,
        gesture.startAngle,
        pointer.shiftKey
      );
    } else {
      const original = gesture.primary.original;
      const resized = root.ACDLCanvasGeometry.resizeFrame(original, gesture.handle, deltaX, deltaY, gesture.pageSize);
      if (original.type === 'image' && original.lockAspect !== false) {
        const ratio = original.width / original.height;
        if (gesture.handle.includes('e') || gesture.handle.includes('w')) resized.height = resized.width / ratio;
        else resized.width = resized.height * ratio;
        Object.assign(resized, root.ACDLCanvasGeometry.keepPartiallyVisible(resized,gesture.pageSize));
      }
      Object.assign(gesture.primary.item, resized);
    }
    return gesture.primary.item;
  }

  function cancel(gesture) {
    for (const view of gesture.originals) Object.assign(view.item, view.original);
    gesture.changed = false;
  }

  function finish(gesture) {
    const changed = Boolean(gesture?.changed);
    return Object.freeze({
      changed,
      discardSnapshot: !changed,
      message: changed ? 'Canvas에서 개체 편집 결과를 반영했습니다.' : '개체를 선택했습니다.'
    });
  }

  root.ACDLCanvasGesture = Object.freeze({ begin, update, finish, cancel });
})(typeof window !== 'undefined' ? window : globalThis);
