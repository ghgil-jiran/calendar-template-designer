/* Shared screen markup for the designer and user service checklist widget. */
(function (root) {
  "use strict";
  const version = "0.1.0-preview.1";
  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function renderChecklist(model) {
    const itemCount = Math.max(1, Math.min(20, Number.isFinite(Number(model?.itemCount)) ? Math.trunc(Number(model.itemCount)) : 6));
    const rows = Array.from({ length: itemCount }, () => '<div class="planner-check-row"><span></span><span></span><span></span></div>').join("");
    return '<div class="widget-memo shared-screen-memo" data-memo-layout="checklist"><strong class="planner-ribbon">' + escapeText(model?.title ?? "MEMO") + '</strong><div class="planner-check-list" style="grid-template-rows:auto repeat(' + itemCount + ',1fr)"><div class="planner-check-row header"><span>DATE</span><span>TO DO</span><span></span></div>' + rows + '</div></div>';
  }
  root.ACDLSharedMemo = Object.freeze({ version, renderChecklist });
})(globalThis);
