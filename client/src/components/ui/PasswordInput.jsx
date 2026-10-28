import { useId, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({ label, error, hint, id, required, value, onChange, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={`input pl-10 pr-11 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="help-text">{hint}</p> : null}
    </div>
  );
}
