import { forwardRef, useId } from 'react';

const baseFieldClass = 'input';

export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon = null, className = '', id, required, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        )}
        <input
          ref={ref}
          id={fieldId}
          className={`${baseFieldClass} ${Icon ? 'pl-10' : ''} ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="help-text">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', id, required, rows = 4, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={`textarea ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="help-text">{hint}</p> : null}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className = '', id, required, options = [], placeholder, children, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        className={`select ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="help-text">{hint}</p> : null}
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox(
  { label, description, error, className = '', id, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-2.5">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-brand-500"
          {...props}
        />
        <span>
          <span className="block text-sm font-medium text-navy-800">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-navy-400">{description}</span>}
        </span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});
