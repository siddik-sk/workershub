import { Check, X } from 'lucide-react';
import { formatDateTime, statusLabel } from '../../utils/format';

const dotColors = {
  pending: 'bg-amber-400',
  accepted: 'bg-sky-500',
  in_progress: 'bg-indigo-500',
  completed: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  cancelled: 'bg-navy-400',
};

export default function BookingTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-navy-400">No status history recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-5">
      <span className="absolute bottom-2 left-[7px] top-2 w-px bg-navy-100" aria-hidden="true" />
      {history.map((entry, index) => {
        const negative = entry.status === 'rejected' || entry.status === 'cancelled';
        return (
          <li key={`${entry.status}-${index}`} className="relative flex gap-3.5">
            <span className={`relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${dotColors[entry.status] || 'bg-navy-300'} ring-4 ring-white`}>
              {negative ? <X className="h-2.5 w-2.5 text-white" /> : <Check className="h-2.5 w-2.5 text-white" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">{statusLabel(entry.status)}</p>
              <p className="text-[11px] text-navy-400">{formatDateTime(entry.changedAt)}</p>
              {entry.note && <p className="mt-1 text-xs leading-relaxed text-navy-500">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
