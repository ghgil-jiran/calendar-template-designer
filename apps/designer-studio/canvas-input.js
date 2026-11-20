(function (root) {
  function capturePointer(node, pointerId, handlers) {
    const move = handlers.move;
    const end = handlers.end;
    node.setPointerCapture(pointerId);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', end, { once: true });
    node.addEventListener('pointercancel', end, { once: true });

    return function releasePointer(releaseId = pointerId) {
      try { node.releasePointerCapture(releaseId); } catch {}
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', end);
      node.removeEventListener('pointercancel', end);
    };
  }

  function keyboardCommand(event, activeElement, hasSelection) {
    const tagName = typeof activeElement === 'string' ? activeElement : activeElement?.tagName;
    if (event.defaultPrevented || event.isComposing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(String(tagName || '').toUpperCase()) ||
        activeElement?.isContentEditable || activeElement?.closest?.('[data-wall-resize]')) return null;
    const key = String(event.key || '');
    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a') return Object.freeze({ type: 'select-all' });
    if (!hasSelection) return null;
    if (key === 'Delete' || key === 'Backspace') return Object.freeze({ type: 'delete' });
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!arrows[key]) return null;
    const scale = event.shiftKey ? 5 : 1;
    return Object.freeze({ type: 'nudge', deltaX: arrows[key][0] * scale * .05, deltaY: arrows[key][1] * scale * .05 });
  }

  root.ACDLCanvasInput = Object.freeze({ capturePointer, keyboardCommand });
})(typeof window !== 'undefined' ? window : globalThis);
