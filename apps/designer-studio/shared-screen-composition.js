/* Versioned page-space contract shared by authoring and Runtime adapters. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const legacyContentFrame = Object.freeze({ x: 5, y: 7, width: 90, height: 88 });
  const finite = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;

  function contentFrame(project, page) {
    const screen = project?.template?.screenComposition;
    if (screen && screen.schemaVersion !== "screen-composition.v1") {
      throw new Error("Unsupported screen composition contract");
    }
    if (page?.screenComposition && page.screenComposition.schemaVersion !== "screen-composition.v1") {
      throw new Error("Unsupported page screen composition contract");
    }
    const saved = page?.screenComposition?.contentFramePct
      || screen?.surfaces?.[page?.role]?.contentFramePct
      || legacyContentFrame;
    const frame = {
      x: finite(saved.x, legacyContentFrame.x),
      y: finite(saved.y, legacyContentFrame.y),
      width: finite(saved.width, legacyContentFrame.width),
      height: finite(saved.height, legacyContentFrame.height),
    };
    if (frame.width <= 0 || frame.height <= 0 || frame.x < 0 || frame.y < 0
      || frame.x + frame.width > 100 || frame.y + frame.height > 100) {
      throw new Error("Invalid screen composition content frame");
    }
    return frame;
  }

  function pageFrame(frame, content) {
    return {
      x: content.x + finite(frame.x, 0) * content.width / 100,
      y: content.y + finite(frame.y, 0) * content.height / 100,
      width: finite(frame.width, 100) * content.width / 100,
      height: finite(frame.height, 100) * content.height / 100,
    };
  }

  const api = Object.freeze({ version, contentFrame, pageFrame });
  root.ACDLSharedScreenComposition = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
