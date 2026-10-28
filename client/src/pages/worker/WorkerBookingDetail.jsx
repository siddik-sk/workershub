import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
  XCircle,
} from 'lucide-react';
import { bookingApi, workerApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { ConfirmDialog, ReasonDialog } from '../../components/ui/Modal';
import BookingTimeline from '../../components/bookings/BookingTimeline';
import RatingStars from '../../components/workers/RatingStars';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const confirmCopy = {
  accept: {
    title: 'Accept this booking?',
    description: 'The customer will be notified and the appointment will be added to your upcoming schedule.',
    confirmLabel: 'Accept booking',
    success: 'Booking accepted.',
  },
  start: {
    title: 'Start this job?',
    description: 'Mark the job as in progress when you begin work on site. The customer will be notified.',
    confirmLabel: 'Start job',
    success: 'Job marked as in progress.',
  },
  complete: {
    title: 'Complete this job?',
    description: 'Confirm the work is finished. Your completed jobs count updates and the customer can leave a review.',
    confirmLabel: 'Complete job',
    success: 'Job marked as completed.',
  },
};

export default function WorkerBookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [running, setRunning] = useState(false);

  useDocumentTitle(booking ? `Booking ${booking.bookingReference}` : 'Booking details');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingApi.get(id);
      setBooking(response.data.booking);
    } catch (err) {
      setError(
        err.status === 404
          ? 'Booking not found.'
          : err.status === 403
            ? 'You do not have access to this booking.'
            : getErrorMessage(err, 'Could not load this booking')
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading booking details..." />;

  if (error || !booking) {
    return (
      <EmptyState
        icon={FileText}
        title="Booking unavailable"
        description={error || 'This booking could not be loaded.'}
        action={<Link to="/worker/bookings" className="btn-primary">Back to bookings</Link>}
      />
    );
  }

  async function runConfirm() {
    if (!confirmAction) return;
    setRunning(true);
    try {
      if (confirmAction === 'accept') await workerApi.acceptBooking(booking.id);
      if (confirmAction === 'start') await workerApi.startBooking(booking.id);
      if (confirmAction === 'complete') await workerApi.completeBooking(booking.id);
      toast.success(confirmCopy[confirmAction].success);
      setConfirmAction(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the booking'));
    } finally {
      setRunning(false);
    }
  }

  async function confirmReject(reason) {
    setRunning(true);
    try {
      await workerApi.rejectBooking(booking.id, reason);
      toast.success('Booking declined.');
      setRejectOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function confirmCancel(reason) {
    setRunning(true);
    try {
      await workerApi.cancelBooking(booking.id, reason);
      toast.success('Booking cancelled.');
      setCancelOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  const actions = (
    <>
      {booking.status === 'pending' && (
        <>
          <Button size="sm" icon={Check} onClick={() => setConfirmAction('accept')}>Accept booking</Button>
          <Button
            size="sm"
            variant="outline"
            icon={XCircle}
            className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setRejectOpen(true)}
          >
            Decline
          </Button>
        </>
      )}
      {booking.status === 'accepted' && (
        <>
          <Button size="sm" icon={Play} onClick={() => setConfirmAction('start')}>Start job</Button>
          <Button
            size="sm"
            variant="outline"
            icon={CalendarX2}
            className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
        </>
      )}
      {booking.status === 'in_progress' && (
        <Button size="sm" icon={CheckCircle2} onClick={() => setConfirmAction('complete')}>Complete job</Button>
      )}
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/worker/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" /> Back to booking requests
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {booking.workerProfileId && (
            <Button as={Link} to={`/workers/${booking.workerProfileId}`} variant="outline" size="sm">
              Public profile
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <CategoryIcon name={booking.category?.icon} className="h-6 w-6" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
              {booking.category?.name || 'Local service'}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-navy-400">{booking.bookingReference}</p>
          <p className="mt-1 text-xs text-navy-400">Requested {formatDateTime(booking.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr] lg:items-start">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Appointment</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Date</p>
                  <p className="mt-0.5 text-sm font-bold text-navy-900">{formatDate(booking.appointmentDate, 'EEEE, dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Time</p>
                  <p className="mt-0.5 text-sm font-bold text-navy-900">{formatTime(booking.appointmentTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Service address</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy-900">{booking.serviceAddress}</p>
                  <p className="text-xs text-navy-500">{booking.locality}, {booking.city}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Job description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-600">{booking.serviceDescription}</p>
            {booking.additionalNotes && (
              <div className="mt-4 rounded-xl bg-navy-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Additional notes</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-navy-600">{booking.additionalNotes}</p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Progress timeline</h2>
            <p className="mt-1 text-xs text-navy-400">Status updates are recorded automatically and shown to the customer.</p>
            <div className="mt-4">
              <BookingTimeline history={booking.statusHistory} />
            </div>
            {booking.status === 'cancelled' && booking.cancellationReason && (
              <div className="mt-4 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
                <p className="font-semibold">Cancelled by {booking.cancelledBy || 'a party'}</p>
                <p className="mt-1">{booking.cancellationReason}</p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Customer review</h2>
            {booking.review ? (
              <div className="mt-3 rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={booking.review.rating} showValue />
                  <span className="text-[11px] text-navy-400">{formatDate(booking.review.createdAt)}</span>
                </div>
                {booking.review.comment && <p className="mt-2 text-sm leading-relaxed text-navy-600">{booking.review.comment}</p>}
              </div>
            ) : (
              <p className="mt-2 text-xs text-navy-400">
                {booking.status === 'completed'
                  ? 'The customer has not reviewed this booking yet.'
                  : 'A review becomes available after you mark the job as completed.'}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Customer</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                {(booking.customer?.name || 'C').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{booking.customer?.name || 'Customer'}</p>
                <p className="flex items-center gap-1 text-xs text-navy-500">
                  <MapPin className="h-3 w-3" /> {[booking.customer?.locality, booking.customer?.city].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-navy-100 pt-3 text-xs">
              <div className="rounded-lg bg-brand-50 px-3 py-2">
                {booking.customer?.phone ? (
                  <a href={`tel:${booking.customer.phone}`} className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-800">
                    <Phone className="h-3.5 w-3.5" /> {booking.customer.phone}
                  </a>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-navy-500">
                    <Phone className="h-3.5 w-3.5" /> Phone not available
                  </p>
                )}
              </div>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Contact name</span>
                <span className="text-right font-semibold text-navy-800">{booking.customerName}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Contact phone</span>
                <span className="text-right font-semibold text-navy-800">{booking.customerPhone}</span>
              </p>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Booking summary</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Reference</span>
                <span className="font-mono font-semibold text-navy-800">{booking.bookingReference}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Service</span>
                <span className="text-right font-semibold text-navy-800">{booking.category?.name}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Starting charge</span>
                <span className="font-semibold text-navy-800">{formatCurrency(booking.worker?.serviceCharge)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Status</span>
                <StatusBadge status={booking.status} />
              </div>
              {booking.acceptedAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-navy-400">Accepted</span>
                  <span className="text-right font-semibold text-navy-800">{formatDateTime(booking.acceptedAt)}</span>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-navy-400">Completed</span>
                  <span className="text-right font-semibold text-navy-800">{formatDateTime(booking.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-brand-300" /> Privacy reminder</p>
            <p className="mt-2 text-[11px] leading-relaxed text-navy-300">
              Customer contact information is provided only to fulfil this booking. Do not use it for marketing or share it
              with anyone else.
            </p>
            <Link to="/worker/support" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Help & policies <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>

          <div className="card p-4 text-[11px] text-navy-400">
            <p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Only you, the customer and admins can see this record.</p>
            <p className="mt-2 flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Payment is agreed directly with the customer.</p>
            <p className="mt-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Completed jobs build your public rating.</p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirm}
        title={confirmCopy[confirmAction]?.title}
        description={
          confirmAction
            ? `${confirmCopy[confirmAction].description} Reference ${booking.bookingReference}.`
            : ''
        }
        confirmLabel={confirmCopy[confirmAction]?.confirmLabel}
        variant="primary"
        loading={running}
      />

      <ReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={confirmReject}
        loading={running}
        title="Decline this booking request"
        description={`Booking ${booking.bookingReference} from ${booking.customer?.name}. The customer will be notified with your reason.`}
        confirmLabel="Decline booking"
        label="Reason for declining"
        placeholder="Let the customer know why you cannot take this job..."
      />

      <ReasonDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        loading={running}
        title="Cancel accepted booking"
        description={`Booking ${booking.bookingReference}. Accepted jobs can only be cancelled at least 2 hours before the appointment.`}
        confirmLabel="Cancel booking"
        label="Reason for cancellation"
        placeholder="Explain why you need to cancel so the customer can plan..."
      />
    </div>
  );
}
