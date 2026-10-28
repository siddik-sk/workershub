import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import Button from './Button';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative z-10 w-full ${sizes[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-navy-100 bg-white shadow-lift animate-fade-up sm:rounded-2xl`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4 sm:px-6">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-bold text-navy-900">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
            </div>
            {onClose && (
              <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label="Close dialog">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This action will update the records immediately. Please review before continuing.</p>
      </div>
    </Modal>
  );
}

export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Submit',
  requireReason = false,
  label = 'Reason',
  placeholder = 'Add a clear explanation...',
  loading = false,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  async function submit() {
    if (requireReason && !reason.trim()) {
      setError('A reason is required');
      return;
    }
    setError('');
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err.message || 'Could not complete the action');
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <label className="label">
        {label} {requireReason && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        className="textarea"
        rows={4}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={placeholder}
        maxLength={500}
      />
      {error && <p className="field-error">{error}</p>}
    </Modal>
  );
}
