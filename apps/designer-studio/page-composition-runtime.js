(function (root) {
  "use strict";
  const alias = type => ({ frame: "image-frame", "monthly-calendar": "calendar", "school-object": "semantic-object" })[type] || type;
  function isMonthBackCompositionElement(element) {
    return element?.role === "ai-month-back-component"
      || Boolean(element?.aiDesignComponent)
      || ["image-frame", "mini-calendar", "mini-calendar-prev", "mini-calendar-next", "month-date-strip", "memo"].includes(alias(element?.type))
      || ["monthly-goal", "monthly-todo", "weekly-planner"].includes(element?.role);
  }
  function isInheritedDesignDecoration(element) {
    return element?.role === "background-decoration"
      || element?.role === "ai-design-background"
      || Boolean(element?.backgroundPresetId);
  }
  function visibleElements(page, masterElements = [], localElements = []) {
    const shadowed = new Set(localElements.map(element => element.shadowOfMasterElementId).filter(Boolean));
    return [
      ...masterElements.filter(element =>
        !shadowed.has(element.id)
        && (page.aiDesignBase?.mode !== "neutral" || !isInheritedDesignDecoration(element))
        && (page.aiMonthBackComposition?.mode !== "generated-layout" || !isMonthBackCompositionElement(element))
      ).map(element => ({ ...element, _scope: "master" })),
      ...localElements.map(element => ({ ...element, _scope: "page" }))
    ].sort((left, right) => (Number(left.zIndex) || 0) - (Number(right.zIndex) || 0));
  }
  root.ACDLPageCompositionRuntime = Object.freeze({ visibleElements, isMonthBackCompositionElement });
})(typeof window !== "undefined" ? window : globalThis);
