import type {SchoolField, SchoolInput} from './contracts';

export function emptySchoolInput(fields: SchoolField[]): SchoolInput {
  return {values: Object.fromEntries(fields.map(field => [field.key, ''])), hidden: [], omitEmptyContacts: true};
}

export function validateSchoolInput(fields: SchoolField[], input: SchoolInput): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (input.hidden.includes(field.key)) {
      if (!field.allowHide) errors[field.key] = `${field.label}은 표시해야 해요.`;
      continue;
    }
    const value = (input.values[field.key] || '').trim();
    if (field.required && !value) errors[field.key] = `${field.label}을 입력해 주세요.`;
    else if (value.length > field.maxLength) errors[field.key] = `${field.maxLength}자 이내로 입력해 주세요.`;
  }
  return errors;
}

export function visibleSchoolValues(fields: SchoolField[], input: SchoolInput): Record<string, string> {
  const errors = validateSchoolInput(fields, input);
  if (Object.keys(errors).length) throw new Error('Invalid school input');
  return Object.fromEntries(fields.filter(field => !input.hidden.includes(field.key)).map(field => [field.key, (input.values[field.key] || '').trim()]));
}
