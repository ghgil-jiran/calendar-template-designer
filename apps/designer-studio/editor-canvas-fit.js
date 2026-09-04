(function (root) {
  function fixedCanvasViewport({ pageWidth, pageHeight, availableWidth, availableHeight, minimumScale = .55 }) {
    const width = Number(pageWidth);
    const height = Number(pageHeight);
    if (!(width > 0 && height > 0)) throw new TypeError('A positive print page size is required.');
    const landscape = width >= height;
    const designWidth = landscape ? 850 : 720;
    const designHeight = designWidth / (width / height);
    const widthScale = Number(availableWidth) * .94 / designWidth;
    const heightScale = Number(availableHeight) * .94 / designHeight;
    const fitScale = landscape ? widthScale : Math.min(widthScale, heightScale);
    const scale = Math.min(1, Math.max(minimumScale, fitScale));
    return Object.freeze({
      designWidth,
      designHeight,
      scale,
      displayWidth: designWidth * scale,
      displayHeight: designHeight * scale,
      fitAxis: landscape ? 'width' : 'height'
    });
  }

  root.ACDLEditorCanvasFit = Object.freeze({ fixedCanvasViewport });
})(typeof window !== 'undefined' ? window : globalThis);
