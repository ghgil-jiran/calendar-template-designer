(function (root) {
  function pages(project) {
    return Array.isArray(project?.book?.pageInstances) ? project.book.pageInstances : [];
  }

  function repairPageId(project, pageId) {
    const available = pages(project);
    if (!available.length) return null;
    return available.some(page => page.id === pageId) ? pageId : available[0].id;
  }

  function capture(state) {
    return Object.freeze({
      pageId: state.pageId || null,
      elementId: state.elementId || null,
      scope: state.scope || null,
      calendarEditing: Boolean(state.calendarEditing),
      preview: Boolean(state.preview),
      previewType: state.previewType || null
    });
  }

  function restore(project, state) {
    return Object.freeze({
      pageId: repairPageId(project, state?.pageId),
      elementId: state?.elementId || null,
      scope: state?.scope || null,
      calendarEditing: Boolean(state?.calendarEditing),
      preview: false,
      previewType: null
    });
  }

  function clonePage(live, pageInfo) {
    const source = live.cloneNode(true);
    source.removeAttribute('id');
    source.classList.add('preview-only-page');
    source.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    source.querySelectorAll('.editor-only,.non-output,.resize-handle,.elem-handle,.elem-label,.semantic-role-badge,.binding-status-badge,.workspace-binding-badge').forEach(node => node.remove());
    source.querySelectorAll('.selected,.element-selected,.workspace-locked,.binding-missing').forEach(node => node.classList.remove('selected', 'element-selected', 'workspace-locked', 'binding-missing'));
    const poster = pageInfo?.role === 'poster-annual';
    const width = poster ? 720 : (live.offsetWidth || 720);
    const height = poster ? 1018 : (live.offsetHeight || Math.round(width * 1.414));
    source.dataset.previewWidth = String(width);
    source.dataset.previewHeight = String(height);
    source.style.width = `${width}px`;
    source.style.height = `${height}px`;
    return source;
  }

  root.ACDLPreviewState = Object.freeze({ pages, repairPageId, capture, restore, clonePage });
})(typeof window !== 'undefined' ? window : globalThis);
