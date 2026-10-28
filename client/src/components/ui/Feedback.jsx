import { Loader2, Inbox } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5', label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-navy-500" role="status">
      <Loader2 className={`${className} animate-spin text-brand-600`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading your workspace...' }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
      <p className="text-sm font-medium text-navy-500">{label}</p>
    </div>
  );
}

export function SkeletonList({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/5" />
              <div className="skeleton h-3 w-3/5" />
            </div>
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-navy-400 shadow-sm ring-1 ring-navy-100">
        <Icon className="h-6 w-6" />
      </div>
      {title && <h3 className="text-base font-semibold text-navy-900">{title}</h3>}
      {description && <p className="mt-1.5 max-w-md text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
