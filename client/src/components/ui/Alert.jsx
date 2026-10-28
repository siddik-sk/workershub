import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

const variants = {
  success: {
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  error: {
    wrap: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: AlertCircle,
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: TriangleAlert,
  },
  info: {
    wrap: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: Info,
  },
};

export default function Alert({ variant = 'info', title, children, onDismiss, className = '' }) {
  const config = variants[variant] || variants.info;
  const Icon = config.icon;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${config.wrap} ${className}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="opacity-60 transition hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
