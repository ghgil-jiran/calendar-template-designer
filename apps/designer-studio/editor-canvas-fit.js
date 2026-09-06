(function (root) {
  function clampCanvasScale(value, minimumScale = .5, maximumScale = 1.5) {
    const scale = Number(value);
    if (!Number.isFinite(scale)) throw new TypeError('A finite canvas scale is required.');
    return Math.min(maximumScale, Math.max(minimumScale, scale));
  }

  function fixedCanvasViewport({ pageWidth, pageHeight, availableWidth, availableHeight, minimumScale = .55, maximumScale = 1.5 }) {
    const width = Number(pageWidth);
    const height = Number(pageHeight);
    if (!(width > 0 && height > 0)) throw new TypeError('A positive print page size is required.');
    const landscape = width >= height;
    const designWidth = landscape ? 850 : 720;
    const designHeight = designWidth / (width / height);
    const widthScale = Number(availableWidth) * .94 / designWidth;
    const heightScale = Number(availableHeight) * .94 / designHeight;
    const fitScale = landscape ? widthScale : Math.min(widthScale, heightScale);
    const scale = clampCanvasScale(fitScale, minimumScale, maximumScale);
    return Object.freeze({
      designWidth,
      designHeight,
      scale,
      displayWidth: designWidth * scale,
      displayHeight: designHeight * scale,
      fitAxis: landscape ? 'width' : 'height'
    });
  }

  root.ACDLEditorCanvasFit = Object.freeze({ clampCanvasScale, fixedCanvasViewport });
})(typeof window !== 'undefined' ? window : globalThis);
