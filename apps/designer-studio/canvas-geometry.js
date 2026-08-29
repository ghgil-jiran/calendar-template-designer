(function (root) {
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, maximum));

  function moveFrame(frame, deltaX, deltaY) {
    return {
      x: clamp(frame.x + deltaX, 0, 100 - frame.width),
      y: clamp(frame.y + deltaY, 0, 100 - frame.height)
    };
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
    width = Math.max(3, width);
    height = Math.max(3, height);
    x = clamp(x, 0, 100 - width);
    y = clamp(y, 0, 100 - height);
    return {
      x,
      y,
      width: Math.min(100 - x, width),
      height: Math.min(100 - y, height)
    };
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

  root.ACDLCanvasGeometry = Object.freeze({ moveFrame, resizeFrame, rotateFrame, nudgeFrame });
})(typeof window !== 'undefined' ? window : globalThis);
