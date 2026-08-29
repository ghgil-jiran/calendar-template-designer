import assert from 'node:assert/strict';

await import('../apps/designer-studio/inspector-form.js');

const classList = () => {
  const values = new Set();
  return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value) };
};
const field = ({ id, type = 'text', value = '', checked = false, min = '', max = '', label = id }) => ({
  id, type, value, checked, min, max, classList: classList(),
  closest: selector => selector === 'label' ? { childNodes: [{ textContent: label }] } : null
});
const name = field({ id: 'name', value: '학교' });
const enabled = field({ id: 'enabled', type: 'checkbox', checked: true });
const upload = field({ id: 'upload', type: 'file', value: 'ignored' });
const size = field({ id: 'size', type: 'number', value: '18', min: '10', max: '30', label: '글자 크기' });
const fields = [name, enabled, upload, size];
const container = {
  querySelectorAll: selector => selector === 'input[type="number"]' ? [size] : fields
};

assert.equal(globalThis.ACDLInspectorForm.signature(container), 'name:학교|enabled:true|size:18');
assert.deepEqual(globalThis.ACDLInspectorForm.validate(container), { valid: true, message: '' });
size.value = '31';
assert.deepEqual(globalThis.ACDLInspectorForm.validate(container), { valid: false, message: '글자 크기을 허용 범위 안에서 입력하세요.' });
assert.equal(size.classList.contains('inspector-field-error'), true);
size.value = '20';
assert.deepEqual(globalThis.ACDLInspectorForm.validate(container), { valid: true, message: '' });
assert.equal(size.classList.contains('inspector-field-error'), false);
