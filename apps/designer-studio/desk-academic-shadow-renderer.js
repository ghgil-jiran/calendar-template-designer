(function (root) {
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function imageSource(payload) {
    if (typeof payload === 'string') return payload;
    return payload?.image || payload?.src || '';
  }

  function renderImage(object, className = '') {
    const source = imageSource(object.payload);
    if (!source) return `<div class="shadow-empty-image ${className}" data-empty-image="true"></div>`;
    return `<img class="shadow-image ${className}" src="${escapeHtml(source)}" alt="" />`;
  }

  function renderCalendar(object) {
    const { year, month, gridRows = 5 } = object.payload || {};
    const cells = root.ACDLCalendarDomain.buildCalendarGrid(year, month, 'sunday', gridRows);
    const heads = WEEKDAYS.map((name, index) => `<div class="shadow-calendar-head day-${index}">${name}</div>`).join('');
    const body = cells.map(cell => {
      const extra = cell.extra ? `<span class="shadow-calendar-extra">${cell.extra.day}</span>` : '';
      const adjacent = cell.month === Number(month) ? '' : ' is-adjacent';
      return `<div class="shadow-calendar-cell day-${cell.dow}${adjacent}" data-date="${cell.date}"><span>${cell.day}</span>${extra}</div>`;
    }).join('');
    return `<section class="shadow-monthly-calendar" data-calendar-rows="${gridRows}"><h2>${year}년 ${month}월</h2><div class="shadow-calendar-grid">${heads}${body}</div></section>`;
  }

  function renderPhotoMemo(object) {
    const photo = object.contract?.children?.find(child => child.id === 'monthly-photo') || {};
    const memo = object.contract?.children?.find(child => child.id === 'monthly-memo') || {};
    const source = imageSource(photo.payload);
    const photoHtml = source
      ? `<img class="shadow-photo-memo-image" src="${escapeHtml(source)}" alt="" />`
      : '<div class="shadow-photo-memo-empty" data-screen-only="true"></div>';
    const lines = Array.from({ length: Number(memo.lineCount || 7) }, (_, index) => (
      `<div class="shadow-memo-line${index < Number(memo.drawnLineCount || 6) ? ' has-rule' : ''}"></div>`
    )).join('');
    const motto = memo.footer?.leftBinding || '';
    const site = memo.footer?.rightBinding || '';
    return `<section class="shadow-photo-memo" data-layout="photo-1.7-memo-1"><div class="shadow-photo-area">${photoHtml}</div><div class="shadow-memo-area"><header><strong>MEMO</strong><span>자유 기록 · Free Notes</span></header><div class="shadow-memo-lines">${lines}</div><footer><em>${escapeHtml(motto)}</em><span>${escapeHtml(site)}</span></footer></div></section>`;
  }

  function renderContactCard(object) {
    const values = object.payload || {};
    const fields = [
      ['교무실', values.academicPhone],
      ['행정실', values.adminPhone],
      ['FAX', values.fax],
      ['홈페이지', values.site]
    ].filter(([, value]) => value);
    if (!values.address && fields.length === 0 && object.metadata?.hideWhenAllEmpty) return '';
    const address = values.address ? `<p class="shadow-contact-address">${escapeHtml(values.address)}</p>` : '';
    const cells = fields.map(([label, value]) => `<div><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`).join('');
    return `<section class="shadow-contact-card"><h3>CONTACT INFORMATION</h3>${address}<div class="shadow-contact-fields" style="--contact-columns:${fields.length || 1}">${cells}</div></section>`;
  }

  function renderObject(object) {
    if (object.type === 'calendar') return renderCalendar(object);
    if (object.type === 'composite-master') return renderPhotoMemo(object);
    if (object.type === 'contact-card') return renderContactCard(object);
    if (object.type === 'image' || object.type === 'image-frame') return renderImage(object, object.role || '');
    const value = typeof object.payload === 'object'
      ? object.payload?.name || object.payload?.description || ''
      : object.payload || '';
    return `<div class="shadow-object shadow-${escapeHtml(object.type)}" data-role="${escapeHtml(object.role)}">${escapeHtml(value)}</div>`;
  }

  function frameStyle(object) {
    const frame = object.frame || {};
    const values = [frame.x, frame.y, frame.width, frame.height];
    if (!values.every(Number.isFinite)) return '';
    return `left:${frame.x}mm;top:${frame.y}mm;width:${frame.width}mm;height:${frame.height}mm;z-index:${Number(object.zIndex || 0)}`;
  }

  function renderPage(page) {
    const objects = (page.objects || []).filter(object => object.visible !== false).sort((a, b) => a.zIndex - b.zIndex);
    const size = page.size || { width: 260, height: 180, unit: 'mm' };
    const body = objects.map(object => `<div class="shadow-positioned-object" data-object-id="${escapeHtml(object.id)}" style="${frameStyle(object)}">${renderObject(object)}</div>`).join('');
    return `<article class="shadow-package-page role-${escapeHtml(page.role)}" data-page-id="${escapeHtml(page.id)}" data-page-role="${escapeHtml(page.role)}" style="--page-width:${Number(size.width)};--page-height:${Number(size.height)}">${body}</article>`;
  }

  function renderDocument(document) {
    const pages = document?.template?.pages || [];
    return { pageCount: pages.length, pages: pages.map(page => ({ id: page.id, role: page.role, html: renderPage(page) })) };
  }

  root.ACDLDeskAcademicShadowRenderer = Object.freeze({ renderObject, renderPage, renderDocument });
})(typeof window !== 'undefined' ? window : globalThis);
