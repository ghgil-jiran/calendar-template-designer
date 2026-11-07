(function (root) {
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, maximum));
  const MIN_SIZE = 3;
  const MIN_VISIBLE = 1;
  const MAX_SIZE = 500;

  function keepPartiallyVisible(frame) {
    const width = clamp(Number(frame.width) || MIN_SIZE, MIN_SIZE, MAX_SIZE);
    const height = clamp(Number(frame.height) || MIN_SIZE, MIN_SIZE, MAX_SIZE);
    return {
      ...frame,
      width,
      height,
      x: clamp(Number(frame.x) || 0, MIN_VISIBLE - width, 100 - MIN_VISIBLE),
      y: clamp(Number(frame.y) || 0, MIN_VISIBLE - height, 100 - MIN_VISIBLE)
    };
  }

  function moveFrame(frame, deltaX, deltaY) {
    const next = keepPartiallyVisible({ ...frame, x: frame.x + deltaX, y: frame.y + deltaY });
    return { x: next.x, y: next.y };
  }

  function resizeFrame(frame, handle, deltaX, deltaY) {
    let x = frame.x;
    let y = frame.y;
    let width = frame.width;
    let height = frame.height;
    if (handle.includes('e')) width = frame.width + deltaX;
    if (handle.includes('s')) height = frame.height + deltaY;
    if (handle.includes('w')) {
      x = frame.x + deltaX;
      width = frame.width - deltaX;
    }
    if (handle.includes('n')) {
      y = frame.y + deltaY;
      height = frame.height - deltaY;
    }
    return keepPartiallyVisible({ x, y, width, height });
  }

  function rotateFrame(rotation, pointerX, pointerY, center, startAngle, keepExactAngle) {
    const currentAngle = Math.atan2(pointerY - center.y, pointerX - center.x);
    let degrees = Number(rotation || 0) + (currentAngle - startAngle) * 180 / Math.PI;
    if (!keepExactAngle) degrees = Math.round(degrees / 5) * 5;
    return ((degrees % 360) + 360) % 360;
  }

  function nudgeFrame(frame, deltaX, deltaY) {
    return moveFrame(frame, deltaX, deltaY);
  }

  root.ACDLCanvasGeometry = Object.freeze({ moveFrame, resizeFrame, rotateFrame, nudgeFrame, keepPartiallyVisible });
})(typeof window !== 'undefined' ? window : globalThis);
