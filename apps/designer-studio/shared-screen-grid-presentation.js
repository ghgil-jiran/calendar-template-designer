/* Shared calendar grid style contract for authoring and Runtime screens. */
(function (root) {
  "use strict";
  const version = "1.0.0-preview.1";
  const classes = Object.freeze({
    "open-rows": "grid-open-rows",
    minimal: "grid-minimal",
    "detached-cards": "grid-detached-cards",
    boxed: "grid-boxed",
  });
  function resolve(style) {
    if (style != null && style !== "" && !Object.hasOwn(classes, style)) {
      throw new Error(`Unsupported calendar grid style: ${String(style)}`);
    }
    const kind = style || "boxed";
    return Object.freeze({ kind, className: classes[kind] });
  }
  const api = Object.freeze({ version, resolve });
  root.ACDLSharedGridPresentation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
