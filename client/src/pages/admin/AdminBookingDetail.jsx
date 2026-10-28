import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react';
import { adminApi, bookingApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { ReasonDialog } from '../../components/ui/Modal';
import BookingTimeline from '../../components/bookings/BookingTimeline';
import RatingStars from '../../components/workers/RatingStars';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

export default function AdminBookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [running, setRunning] = useState(false);

  useDocumentTitle(booking ? `Booking ${booking.bookingReference}` : 'Booking details');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.booking(id);
      setBooking(response.data.booking);
    } catch (err) {
      setError(err.status === 404 ? 'This booking no longer exists.' : getErrorMessage(err, 'Could not load the booking'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading booking record..." />;

  if (error || !booking) {
    return (
      <EmptyState
        icon={FileText}
        title="Booking unavailable"
        description={error || 'This booking could not be loaded.'}
        action={<Link to="/admin/bookings" className="btn-primary">Back to bookings</Link>}
      />
    );
  }

  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const cancellable = canCancel;

  async function cancelBooking(reason) {
    setRunning(true);
    try {
      await adminApi.cancelBooking(booking.id, reason);
      toast.success('Booking cancelled and both parties notified.');
      setCancelOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <Link to="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Back to booking management
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <CategoryIcon name={booking.category?.icon} className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{booking.bookingReference}</h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-navy-600">{booking.category?.name || 'Local service'}</p>
            <p className="mt-0.5 text-xs text-navy-400">Created {formatDateTime(booking.createdAt)}</p>
          </div>
        </div>
        {cancellable && (
          <Button variant="danger" icon={CalendarX2} onClick={() => setCancelOpen(true)}>
            Cancel booking
          </Button>
        )}
      </div>

      {cancellable && (
        <Alert variant="info" className="mt-5" title="Administrative intervention available">
          Pending and accepted bookings can be cancelled by an administrator. Both the customer and professional receive a
          notification, and the action is written to the audit log.
        </Alert>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Appointment & service</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><CalendarDays className="h-4 w-4" /></span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Date</p>
                  <p className="mt-0.5 text-sm font-bold text-navy-900">{formatDate(booking.appointmentDate, 'EEEE, dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Clock3 className="h-4 w-4" /></span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Time</p>
                  <p className="mt-0.5 text-sm font-bold text-navy-900">{formatTime(booking.appointmentTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><MapPin className="h-4 w-4" /></span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Service address</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy-900">{booking.serviceAddress}</p>
                  <p className="text-xs text-navy-500">{booking.locality}, {booking.city}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-navy-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Description</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy-600">{booking.serviceDescription}</p>
              {booking.additionalNotes && (
                <>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-navy-400">Additional notes</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-navy-600">{booking.additionalNotes}</p>
                </>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Status history</h2>
            <p className="mt-1 text-xs text-navy-400">Complete audit trail of the booking lifecycle.</p>
            <div className="mt-4"><BookingTimeline history={booking.statusHistory} /></div>
            {booking.cancelledBy && (
              <div className="mt-4 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
                <p className="font-semibold">Cancelled by {booking.cancelledBy}</p>
                <p className="mt-1">{booking.cancellationReason}</p>
                {booking.cancelledAt && <p className="mt-1 text-[10px] text-navy-400">{formatDateTime(booking.cancelledAt)}</p>}
              </div>
            )}
            {booking.rejectionReason && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <p className="font-semibold">Rejected by professional</p>
                <p className="mt-1">{booking.rejectionReason}</p>
              </div>
            )}
          </section>

          {booking.review && (
            <section className="card p-5">
              <h2 className="text-sm font-bold text-navy-900">Customer review</h2>
              <div className="mt-3 rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={booking.review.rating} showValue />
                  <span className="text-[11px] text-navy-400">{formatDate(booking.review.createdAt)}</span>
                </div>
                {booking.review.comment && <p className="mt-2 text-sm leading-relaxed text-navy-600">{booking.review.comment}</p>}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Customer</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={booking.customer?.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{booking.customer?.name}</p>
                <p className="truncate text-[11px] text-navy-400">{booking.customer?.email || 'Email hidden'}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-navy-500">
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {booking.customer?.phone || 'Not provided'}</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {[booking.customer?.locality, booking.customer?.city].filter(Boolean).join(', ')}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/admin/users/${booking.customer?.id}`} className="btn-outline btn-sm flex-1">View account</Link>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Professional</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={booking.worker?.name} src={booking.worker?.profileImage} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{booking.worker?.name}</p>
                <p className="truncate text-[11px] text-navy-400">{booking.worker?.email}</p>
                <div className="mt-0.5"><RatingStars rating={booking.worker?.averageRating} size="h-3 w-3" showValue={booking.worker?.totalReviews > 0} /></div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-navy-500">
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {booking.worker?.phone || 'Not provided'}</p>
              <p className="flex items-center gap-1.5"><Wrench className="h-3 w-3" /> {booking.worker?.experienceYears || 0} years · {formatCurrency(booking.worker?.serviceCharge)} starting</p>
            </div>
            <div className="mt-3 flex gap-2">
              {booking.workerProfileId && (
                <Link to={`/admin/workers/${booking.workerProfileId}`} className="btn-outline btn-sm flex-1">Worker profile</Link>
              )}
              <Link to={`/admin/users/${booking.worker?.id}`} className="btn-outline btn-sm flex-1">Account</Link>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Record metadata</p>
            <div className="mt-3 space-y-2 text-[11px]">
              <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Reference</span><span className="font-mono font-semibold text-navy-800">{booking.bookingReference}</span></p>
              <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Booking ID</span><span className="font-mono text-[10px] text-navy-600">{booking.id}</span></p>
              <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Created</span><span className="text-right font-semibold text-navy-800">{formatDateTime(booking.createdAt)}</span></p>
              {booking.acceptedAt && <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Accepted</span><span className="text-right font-semibold text-navy-800">{formatDateTime(booking.acceptedAt)}</span></p>}
              {booking.startedAt && <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Started</span><span className="text-right font-semibold text-navy-800">{formatDateTime(booking.startedAt)}</span></p>}
              {booking.completedAt && <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Completed</span><span className="text-right font-semibold text-navy-800">{formatDateTime(booking.completedAt)}</span></p>}
              <p className="flex items-center justify-between gap-2"><span className="text-navy-400">Status</span><StatusBadge status={booking.status} /></p>
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-brand-300" /> Administrative access</p>
            <p className="mt-2 text-[11px] leading-relaxed text-navy-300">
              This view exposes contact details for support purposes only. Do not disclose booking information outside the
              platform. Every cancellation is attributed to your admin account in the audit log.
            </p>
            <Link to="/admin/audit-logs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Review audit trail <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>

          <div className="card p-4 text-[11px] text-navy-400">
            <p className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> In-progress jobs cannot be cancelled by an administrator.</p>
            <p className="mt-2 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Contact both parties before intervening where possible.</p>
            <p className="mt-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Reviews are immutable once submitted.</p>
          </div>
        </aside>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelBooking}
        loading={running}
        title="Cancel this booking as an administrator?"
        description={`Booking ${booking.bookingReference}. Both the customer and professional will be notified with your reason. This action is recorded in the audit log.`}
        confirmLabel="Cancel booking"
        label="Reason for cancellation"
        placeholder="Explain the support decision..."
        requireReason
      />
    </div>
  );
}
