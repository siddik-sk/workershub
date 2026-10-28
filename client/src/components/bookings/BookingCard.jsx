import { Link } from 'react-router-dom';
import { CalendarDays, Clock3, Eye, MapPin, UserRound } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatDate, formatTime, timeAgo } from '../../utils/format';

export default function BookingCard({ booking, viewer = 'customer', actions, showDescription = true }) {
  const counterpart = viewer === 'worker' ? booking.customer : booking.worker;
  const profileId = booking.workerProfileId || booking.worker?.profileId;

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <CategoryIcon name={booking.category?.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy-900">{booking.category?.name || 'Local service'}</p>
            <p className="mt-0.5 font-mono text-[11px] font-medium text-navy-400">{booking.bookingReference}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
          <div>
            <p className="text-navy-400">Appointment</p>
            <p className="mt-0.5 font-semibold text-navy-800">{formatDate(booking.appointmentDate)}</p>
            <p className="text-navy-500">{formatTime(booking.appointmentTime)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
          <div>
            <p className="text-navy-400">{viewer === 'worker' ? 'Customer' : 'Professional'}</p>
            <p className="mt-0.5 font-semibold text-navy-800">{counterpart?.name || '—'}</p>
            {counterpart?.phone && <p className="text-navy-500">{counterpart.phone}</p>}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
          <div>
            <p className="text-navy-400">Location</p>
            <p className="mt-0.5 font-semibold text-navy-800">{booking.locality}</p>
            <p className="text-navy-500">{booking.city}</p>
          </div>
        </div>
      </div>

      {showDescription && booking.serviceDescription && (
        <p className="mt-3 line-clamp-2 rounded-lg bg-navy-50/60 px-3 py-2 text-xs leading-relaxed text-navy-500">
          {booking.serviceDescription}
        </p>
      )}

      {booking.status === 'rejected' && booking.rejectionReason && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Rejected: {booking.rejectionReason}
        </p>
      )}
      {booking.status === 'cancelled' && booking.cancellationReason && (
        <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600">
          Cancelled: {booking.cancellationReason}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 pt-3">
        <span className="inline-flex items-center gap-1 text-[11px] text-navy-400">
          <Clock3 className="h-3 w-3" /> Requested {timeAgo(booking.createdAt)}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Link to={viewer === 'worker' ? `/worker/bookings/${booking.id}` : viewer === 'admin' ? `/admin/bookings/${booking.id}` : `/app/bookings/${booking.id}`} className="btn-outline btn-sm">
            <Eye className="h-3.5 w-3.5" /> View details
          </Link>
          {viewer === 'customer' && profileId && (
            <Link to={`/workers/${profileId}`} className="btn-ghost btn-sm">Profile</Link>
          )}
        </div>
      </div>
    </article>
  );
}
