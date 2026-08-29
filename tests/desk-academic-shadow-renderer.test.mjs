import assert from 'node:assert/strict';

await import('../apps/designer-studio/calendar-domain-bridge.js');
await import('../apps/designer-studio/desk-academic-shadow-renderer.js');

const renderer = globalThis.ACDLDeskAcademicShadowRenderer;

const calendarHtml = renderer.renderObject({
  type: 'calendar',
  payload: { year: 2027, month: 5, gridRows: 5 }
});
assert.match(calendarHtml, /data-calendar-rows="5"/);
assert.equal((calendarHtml.match(/shadow-calendar-cell/g) || []).length, 35);
assert.match(calendarHtml, /shadow-calendar-extra">30/);
assert.match(calendarHtml, /shadow-calendar-extra">31/);

const photoMemoHtml = renderer.renderObject({
  type: 'composite-master',
  contract: {
    children: [
      { id: 'monthly-photo', payload: 'asset:march' },
      { id: 'monthly-memo', lineCount: 7, drawnLineCount: 6, footer: { leftBinding: '정직', rightBinding: 'school.example' } }
    ]
  }
});
assert.match(photoMemoHtml, /data-layout="photo-1\.7-memo-1"/);
assert.equal((photoMemoHtml.match(/<div class="shadow-memo-line(?: has-rule)?"><\/div>/g) || []).length, 7);
assert.equal((photoMemoHtml.match(/has-rule/g) || []).length, 6);
assert.match(photoMemoHtml, /asset:march/);
assert.match(photoMemoHtml, /school\.example/);

const contactHtml = renderer.renderObject({
  type: 'contact-card',
  payload: { address: '서울', academicPhone: '02-1', adminPhone: '', fax: '', site: 'school.example' },
  metadata: { hideWhenAllEmpty: true }
});
assert.match(contactHtml, /CONTACT INFORMATION/);
assert.match(contactHtml, /교무실/);
assert.doesNotMatch(contactHtml, /행정실/);
assert.equal(renderer.renderObject({ type: 'contact-card', payload: {}, metadata: { hideWhenAllEmpty: true } }), '');

const document = renderer.renderDocument({
  template: {
    pages: [
      { id: 'p1', role: 'monthly-calendar', size: { width: 266, height: 186 }, objects: [{ id: 'calendar', type: 'calendar', frame: { x: 13, y: 18, width: 240, height: 150 }, payload: { year: 2027, month: 3, gridRows: 5 }, visible: true, zIndex: 1 }] },
      { id: 'p2', role: 'back-contact', objects: [], metadata: {} }
    ]
  }
});
assert.equal(document.pageCount, 2);
assert.equal(document.pages[0].role, 'monthly-calendar');
assert.match(document.pages[0].html, /data-page-id="p1"/);
assert.match(document.pages[0].html, /shadow-positioned-object/);
assert.match(document.pages[0].html, /left:/);
