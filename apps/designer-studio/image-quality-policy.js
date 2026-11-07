/* Shared image-quality contract. Keep this file byte-identical in both repositories. */
(function (root) {
  "use strict";
  const DEFAULT_POLICY = Object.freeze({schemaVersion:"image-quality-policy.v1",recommendedDpi:300,orderMinimumDpi:200,upscaleTargetDpi:300});
  function normalizePolicy(value) {
    if (value == null) return {...DEFAULT_POLICY};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("이미지 DPI 기준을 확인해 주세요.");
    const p = {...DEFAULT_POLICY, ...value};
    if (p.schemaVersion !== DEFAULT_POLICY.schemaVersion || !["recommendedDpi","orderMinimumDpi","upscaleTargetDpi"].every(k => Number.isInteger(p[k]) && p[k] >= 72 && p[k] <= 1200) || p.orderMinimumDpi > p.recommendedDpi || p.upscaleTargetDpi < p.orderMinimumDpi) throw Error("DPI 기준은 72~1200의 정수이며 주문 최소는 권장과 보정 목표 이하이어야 합니다. 보정 목표는 권장보다 낮게 설정할 수 있습니다.");
    return {schemaVersion:p.schemaVersion,recommendedDpi:p.recommendedDpi,orderMinimumDpi:p.orderMinimumDpi,upscaleTargetDpi:p.upscaleTargetDpi};
  }
  function classifyDpi(dpi, policy) {
    const p = normalizePolicy(policy);
    if (!Number.isFinite(dpi) || dpi <= 0) return "unresolved";
    return dpi < p.orderMinimumDpi ? "blocked" : dpi < p.recommendedDpi ? "upscale-candidate" : "passed";
  }
  function placementDpi(size, widthMm, heightMm, fit, zoom) {
    if (![size.width,size.height,widthMm,heightMm,zoom].every(n=>Number.isFinite(n)&&n>0) || !["contain","cover"].includes(fit)) return 0;
    const scales=[widthMm/size.width,heightMm/size.height];
    return Math.floor(25.4 / ((fit === "contain" ? Math.min(...scales) : Math.max(...scales)) * zoom) + 1e-9);
  }
  const api=Object.freeze({DEFAULT_POLICY,normalizePolicy,classifyDpi,placementDpi});
  root.ACDLImageQualityPolicy=api;
  if(typeof module==="object"&&module.exports) module.exports=api;
})(globalThis);
