import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react';
import { bookingApi } from '../../services';
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

export default function UserBookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useDocumentTitle(booking ? `Booking ${booking.bookingReference}` : 'Booking details');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingApi.get(id);
      setBooking(response.data.booking);
      if (response.data.booking.review) {
        setRating(response.data.booking.review.rating);
        setComment(response.data.booking.review.comment || '');
      }
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
        action={<Link to="/app/bookings" className="btn-primary">Back to my bookings</Link>}
      />
    );
  }

  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.review;
  const workerPhone = booking.worker?.phone;

  async function confirmCancel(reason) {
    setCancelling(true);
    try {
      await bookingApi.cancel(booking.id, reason);
      toast.success('Booking cancelled.');
      setCancelOpen(false);
      await load();
    } finally {
      setCancelling(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!rating) {
      setReviewError('Choose a rating from 1 to 5 stars');
      return;
    }
    setReviewing(true);
    setReviewError('');
    try {
      await bookingApi.review(booking.id, { rating, comment: comment.trim() });
      toast.success('Thank you for your review.');
      await load();
    } catch (err) {
      setReviewError(getErrorMessage(err, 'Could not submit your review'));
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/app/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" /> Back to my bookings
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              icon={CalendarX2}
              className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setCancelOpen(true)}
            >
              Cancel booking
            </Button>
          )}
          {booking.workerProfileId && (
            <Button as={Link} to={`/workers/${booking.workerProfileId}`} variant="outline" size="sm">
              View professional
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
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
            <p className="mt-1 text-xs text-navy-400">Every status change is recorded with the time it happened.</p>
            <div className="mt-4">
              <BookingTimeline history={booking.statusHistory} />
            </div>
            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <p className="font-semibold">Declined by the professional</p>
                <p className="mt-1">{booking.rejectionReason}</p>
              </div>
            )}
            {booking.status === 'cancelled' && booking.cancellationReason && (
              <div className="mt-4 rounded-xl bg-navy-50 p-3 text-xs text-navy-600">
                <p className="font-semibold">Cancelled by {booking.cancelledBy || 'a party'}</p>
                <p className="mt-1">{booking.cancellationReason}</p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy-900">Review</h2>
            {booking.review ? (
              <div className="mt-3 rounded-xl border border-navy-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={booking.review.rating} showValue />
                  <span className="text-[11px] text-navy-400">{formatDate(booking.review.createdAt)}</span>
                </div>
                {booking.review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{booking.review.comment}</p>
                )}
              </div>
            ) : canReview ? (
              <form onSubmit={submitReview} className="mt-3">
                <p className="text-xs text-navy-500">
                  How was the service from {booking.worker?.name}? Your rating helps other customers choose with confidence.
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setRating(value);
                        setReviewError('');
                      }}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="rounded p-0.5"
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    >
                      <Star
                        className={`h-7 w-7 transition ${
                          value <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-navy-100 text-navy-200'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-2 text-xs font-semibold text-navy-600">{rating}/5</span>}
                </div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share details about punctuality, quality and communication (optional)"
                  className="textarea mt-3"
                  maxLength={800}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-navy-400">{comment.length}/800</span>
                  <Button type="submit" size="sm" loading={reviewing} icon={MessageSquare}>
                    Submit review
                  </Button>
                </div>
                {reviewError && <p className="field-error">{reviewError}</p>}
              </form>
            ) : (
              <p className="mt-2 text-xs text-navy-400">
                {booking.status === 'completed'
                  ? 'A review has already been submitted for this booking.'
                  : 'Reviews can be submitted after the professional marks the job as completed.'}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Your professional</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={booking.worker?.name} src={booking.worker?.profileImage} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{booking.worker?.name || 'Professional'}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-brand-700">
                  <Wrench className="h-3.5 w-3.5" /> {booking.category?.name}
                </p>
                <div className="mt-1">
                  <RatingStars rating={booking.worker?.averageRating} size="h-3 w-3" showValue={booking.worker?.totalReviews > 0} />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-navy-100 pt-3 text-xs">
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Experience</span>
                <span className="font-semibold text-navy-800">{booking.worker?.experienceYears || 0} years</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Completed jobs</span>
                <span className="font-semibold text-navy-800">{booking.worker?.completedJobs || 0}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Starting charge</span>
                <span className="font-semibold text-navy-800">{formatCurrency(booking.worker?.serviceCharge)}</span>
              </p>
              <div className="rounded-lg bg-navy-50/70 px-3 py-2">
                {workerPhone ? (
                  <a href={`tel:${workerPhone}`} className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-800">
                    <Phone className="h-3.5 w-3.5" /> {workerPhone}
                  </a>
                ) : (
                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-navy-500">
                    <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Phone number is shared once the booking is accepted.
                  </p>
                )}
              </div>
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
                <span className="text-navy-400">Contact name</span>
                <span className="text-right font-semibold text-navy-800">{booking.customerName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Contact phone</span>
                <span className="text-right font-semibold text-navy-800">{booking.customerPhone}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Status</span>
                <StatusBadge status={booking.status} />
              </div>
              {booking.completedAt && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-navy-400">Completed</span>
                  <span className="text-right font-semibold text-navy-800">{formatDateTime(booking.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-brand-300" /> Booking protection</p>
            <p className="mt-2 text-[11px] leading-relaxed text-navy-300">
              This record is visible only to you, {booking.worker?.name?.split(' ')[0] || 'your professional'} and platform
              administrators. Contact support with reference {booking.bookingReference} if anything goes wrong.
            </p>
            <Link to="/app/support" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Get help <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>

          <div className="card p-4 text-[11px] text-navy-400">
            <p className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment is arranged directly with the professional.</p>
            <p className="mt-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> No online payment is collected by WorkConnect.</p>
            <p className="mt-2 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Only you, the worker and admins can see this booking.</p>
          </div>
        </aside>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel this booking?"
        description={`Booking ${booking.bookingReference}. Pending requests can be cancelled at any time; accepted bookings need at least 12 hours before the appointment.`}
        confirmLabel="Cancel booking"
        label="Reason for cancellation"
        placeholder="Let the professional know why you need to cancel..."
      />
    </div>
  );
}
