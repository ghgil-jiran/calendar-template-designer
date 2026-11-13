import {useId} from 'react';
export function TextField({label, value, required, hidden, allowHide, maxLength, hint, error, onChange, onHide}: {
  label: string; value: string; required: boolean; hidden: boolean; allowHide: boolean; maxLength: number;
  hint?: string; error?: string; onChange: (value: string) => void; onHide: (hidden: boolean) => void;
}) {
  const id = useId();
  return <div className="field">
    <div className="field-heading"><label htmlFor={id}>{label}</label>
    {allowHide && <label className="checkbox"><input type="checkbox" aria-label={`${label} 표시하지 않음`} checked={hidden} onChange={event => onHide(event.target.checked)} />표시하지 않음</label>}</div>
    <input id={id} value={value} required={required} disabled={hidden} maxLength={maxLength} onChange={event => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-hint` : undefined} />
    {(error || hint) && <p id={`${id}-hint`} className={error ? 'field-error' : 'field-hint'}>{error || hint}</p>}
  </div>;
}
