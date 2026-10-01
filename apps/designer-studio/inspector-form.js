(function (root) {
  function signature(container) {
    return [...container.querySelectorAll('input,select,textarea')]
      .filter(node => node.type !== 'file')
      .map(node => `${node.id}:${node.type === 'checkbox' ? node.checked : node.value}`)
      .join('|');
  }

  function validate(container) {
    const fields = [...container.querySelectorAll('input,select,textarea')];
    fields.forEach(node => node.classList.remove('inspector-field-error'));
    for (const node of container.querySelectorAll('input[type="number"]')) {
      if (node.value === "" && node.dataset?.optional === "true") continue;
      const value = Number(node.value);
      const min = node.min === '' ? null : Number(node.min);
      const max = node.max === '' ? null : Number(node.max);
      if (node.value === '' || !Number.isFinite(value) || (min !== null && value < min) || (max !== null && value > max)) {
        node.classList.add('inspector-field-error');
        const label = node.closest('label')?.childNodes[0]?.textContent?.trim() || '숫자 입력값';
        return { valid: false, message: `${label}을 허용 범위 안에서 입력하세요.` };
      }
    }
    for (const node of container.querySelectorAll('input[pattern]')) {
      if (node.pattern && node.value && !new RegExp(`^(?:${node.pattern})$`).test(node.value)) {
        node.classList.add('inspector-field-error');
        return {valid:false,message:'색상을 #RRGGBB 형식으로 입력하세요.'};
      }
    }
    return { valid: true, message: '' };
  }

  root.ACDLInspectorForm = Object.freeze({ signature, validate });
})(typeof window !== 'undefined' ? window : globalThis);
