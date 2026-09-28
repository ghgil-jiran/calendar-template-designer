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

  function isMonthBackCompositionElement(element) {
    const type = ({ frame: "image-frame", "monthly-calendar": "calendar", "school-object": "semantic-object" })[element?.type] || element?.type;
    return element?.role === "ai-month-back-component" || Boolean(element?.aiDesignComponent)
      || ["image-frame", "mini-calendar", "mini-calendar-prev", "mini-calendar-next", "month-date-strip", "memo"].includes(type)
      || ["monthly-goal", "monthly-todo", "weekly-planner"].includes(element?.role);
  }

  function visibleElements(page, masterElements = [], localElements = []) {
    const shadowed = new Set(localElements.map(element => element.shadowOfMasterElementId).filter(Boolean));
    return [
      ...masterElements.filter(element => !shadowed.has(element.id)
        && (page?.aiDesignBase?.mode !== "neutral" || !(
          element.role === "background-decoration" || element.role === "ai-design-background" || Boolean(element.backgroundPresetId)
        ))
        && (page?.aiMonthBackComposition?.mode !== "generated-layout" || !isMonthBackCompositionElement(element))
      ).map(element => ({ ...element, _scope: "master" })),
      ...localElements.map(element => ({ ...element, _scope: "page" })),
    ].sort((left, right) => (Number(left.zIndex) || 0) - (Number(right.zIndex) || 0));
  }

  function frameFromPercent(frame, size) {
    if (!(size?.width > 0 && size?.height > 0)) throw new Error("Invalid page size");
    return {
      x: finite(frame?.x, 0) / 100 * size.width,
      y: finite(frame?.y, 0) / 100 * size.height,
      width: finite(frame?.width, 100) / 100 * size.width,
      height: finite(frame?.height, 100) / 100 * size.height,
    };
  }

  function frameToPercent(frame, size) {
    if (!(size?.width > 0 && size?.height > 0)) throw new Error("Invalid page size");
    const round = value => Math.round(value * 1000000) / 1000000;
    return {
      x: round(finite(frame?.x, 0) / size.width * 100),
      y: round(finite(frame?.y, 0) / size.height * 100),
      width: round(finite(frame?.width, 0) / size.width * 100),
      height: round(finite(frame?.height, 0) / size.height * 100),
    };
  }

  const api = Object.freeze({ version, contentFrame, pageFrame, visibleElements, isMonthBackCompositionElement, frameFromPercent, frameToPercent });
  root.ACDLSharedScreenComposition = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
