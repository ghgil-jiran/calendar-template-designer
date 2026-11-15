(function (root) {
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, maximum));
  const MIN_MM = .2;
  function minimumSize(pageSize={width:260,height:180}) {return {width:MIN_MM/(Number(pageSize?.width)||260)*100,height:MIN_MM/(Number(pageSize?.height)||180)*100};}
  const MIN_VISIBLE = 1;
  const MAX_SIZE = 500;

  function keepPartiallyVisible(frame, pageSize) {
    const minimum=minimumSize(pageSize);
    const width = clamp(Number(frame.width) || minimum.width, minimum.width, MAX_SIZE);
    const height = clamp(Number(frame.height) || minimum.height, minimum.height, MAX_SIZE);
    return {
      ...frame,
      width,
      height,
      x: clamp(Number(frame.x) || 0, MIN_VISIBLE - width, 100 - MIN_VISIBLE),
      y: clamp(Number(frame.y) || 0, MIN_VISIBLE - height, 100 - MIN_VISIBLE)
    };
  }

  function moveFrame(frame, deltaX, deltaY) {
    return {x:clamp(Number(frame.x)+deltaX,MIN_VISIBLE-Number(frame.width),100-MIN_VISIBLE),y:clamp(Number(frame.y)+deltaY,MIN_VISIBLE-Number(frame.height),100-MIN_VISIBLE)};
  }

  function resizeFrame(frame, handle, deltaX, deltaY, pageSize) {
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
    const minimum=minimumSize(pageSize);
    if(/[ew]/.test(handle))width=clamp(width,minimum.width,MAX_SIZE);
    if(/[ns]/.test(handle))height=clamp(height,minimum.height,MAX_SIZE);
    return {...moveFrame({x,y,width,height},0,0),width,height};
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

  root.ACDLCanvasGeometry = Object.freeze({ moveFrame, resizeFrame, rotateFrame, nudgeFrame, keepPartiallyVisible, minimumSize });
})(typeof window !== 'undefined' ? window : globalThis);
