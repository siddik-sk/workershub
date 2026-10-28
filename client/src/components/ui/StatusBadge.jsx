import { statusLabel } from '../../utils/format';

const known = {
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  in_progress: 'badge-in_progress',
  completed: 'badge-completed',
  rejected: 'badge-rejected',
  cancelled: 'badge-cancelled',
  active: 'badge-active',
  suspended: 'badge-suspended',
  approved: 'badge-approved',
};

export default function StatusBadge({ status, className = '', dot = true }) {
  const badgeClass = known[status] || 'badge bg-navy-100 text-navy-600';
  return (
    <span className={`${badgeClass} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {statusLabel(status)}
    </span>
  );
}
