import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  Wrench,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import RatingStars from '../../components/workers/RatingStars';
import BookingCard from '../../components/bookings/BookingCard';
import { ConfirmDialog, ReasonDialog } from '../../components/ui/Modal';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { WEEK_DAYS } from '../../utils/constants';
import { formatCurrency, formatDate, formatDateTime, formatTime, statusLabel } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const dayLabels = Object.fromEntries(WEEK_DAYS.map((day) => [day.value, day.label.replace('Mon', 'Monday').replace('Tue', 'Tuesday').replace('Wed', 'Wednesday').replace('Thu', 'Thursday').replace('Fri', 'Friday').replace('Sat', 'Saturday').replace('Sun', 'Sunday')]));

export default function AdminWorkerDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [running, setRunning] = useState(false);

  useDocumentTitle(data?.worker?.name ? `${data.worker.name} · Worker` : 'Worker details');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.worker(id);
      setData(response.data);
    } catch (err) {
      setError(
        err.status === 404 ? 'This worker profile no longer exists.' : getErrorMessage(err, 'Could not load the worker')
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading worker application..." />;

  if (error || !data?.worker) {
    return (
      <EmptyState
        icon={Wrench}
        title="Worker unavailable"
        description={error || 'This worker profile could not be loaded.'}
        action={<Link to="/admin/workers" className="btn-primary">Back to workers</Link>}
      />
    );
  }

  const { worker, bookings, reviews, bookingStats } = data;
  const suspended = worker.accountStatus === 'suspended';
  const availability = worker.availability || {};

  async function approve() {
    setRunning(true);
    try {
      await adminApi.setWorkerApproval(worker.id, { approvalStatus: 'approved' });
      toast.success('Worker approved and now bookable.');
      setApproveOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve this worker'));
    } finally {
      setRunning(false);
    }
  }

  async function reject(reason) {
    setRunning(true);
    try {
      await adminApi.setWorkerApproval(worker.id, { approvalStatus: 'rejected', reason });
      toast.success('Worker application rejected.');
      setRejectOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function suspend(reason) {
    setRunning(true);
    try {
      await adminApi.setWorkerStatus(worker.id, { accountStatus: 'suspended', reason });
      toast.success('Worker account suspended.');
      setSuspendOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function reactivate() {
    setRunning(true);
    try {
      await adminApi.setWorkerStatus(worker.id, { accountStatus: 'active' });
      toast.success('Worker account reactivated.');
      setReactivateOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reactivate this worker'));
    } finally {
      setRunning(false);
    }
  }

  const statusRows = ['pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];

  return (
    <div>
      <Link to="/admin/workers" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Back to worker management
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={worker.name} src={worker.profileImage} size="xl" ring />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{worker.name}</h1>
              <StatusBadge status={worker.approvalStatus} />
              <StatusBadge status={worker.accountStatus} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              <CategoryIcon name={worker.categoryIcon} className="h-4 w-4" /> {worker.profession}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-500">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {worker.email}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {worker.phone}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {[worker.locality, worker.city].filter(Boolean).join(', ')}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={worker.averageRating} showValue={worker.totalReviews > 0} />
              <span className="text-xs text-navy-400">
                {worker.totalReviews ? `${worker.totalReviews} reviews` : 'No reviews yet'} · Applied {formatDate(worker.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {worker.approvalStatus !== 'approved' && (
            <Button icon={BadgeCheck} onClick={() => setApproveOpen(true)}>Approve</Button>
          )}
          {worker.approvalStatus !== 'rejected' && (
            <Button variant="outline" icon={XCircle} className="text-rose-600 hover:border-rose-200 hover:bg-rose-50" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          )}
          {suspended ? (
            <Button variant="outline" icon={ShieldCheck} onClick={() => setReactivateOpen(true)}>Reactivate</Button>
          ) : (
            <Button variant="danger" icon={ShieldAlert} onClick={() => setSuspendOpen(true)}>Suspend account</Button>
          )}
        </div>
      </div>

      {worker.approvalStatus === 'pending' && (
        <Alert variant="warning" title="Application pending review" className="mt-5">
          This profile is hidden from customers and cannot accept bookings until approved.
        </Alert>
      )}
      {worker.approvalStatus === 'rejected' && (
        <Alert variant="error" title="Application rejected" className="mt-5">
          {worker.rejectionReason ? `Reason: ${worker.rejectionReason}` : 'No rejection reason was recorded.'}
        </Alert>
      )}
      {suspended && (
        <Alert variant="error" title="Worker account suspended" className="mt-3">
          This professional is removed from search and cannot accept bookings. {worker.suspensionReason ? `Reason: ${worker.suspensionReason}` : ''}
        </Alert>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.35fr] xl:items-start">
        <div className="space-y-4">
          <div className="card p-5">
            <SectionTitle title="Application details" />
            <div className="space-y-2.5 text-xs">
              <p className="flex items-center justify-between gap-3">
                <span className="text-navy-400">Primary profession</span>
                <span className="text-right font-semibold text-navy-800">{worker.profession}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-navy-400">Experience</span>
                <span className="font-semibold text-navy-800">{worker.experienceYears} years</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-navy-400">Starting charge</span>
                <span className="font-semibold text-navy-800">{formatCurrency(worker.serviceCharge)}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-navy-400">Completed jobs</span>
                <span className="font-semibold text-navy-800">{worker.completedJobs}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="text-navy-400">Approved</span>
                <span className="font-semibold text-navy-800">{worker.approvedAt ? formatDate(worker.approvedAt) : '—'}</span>
              </p>
            </div>
            {worker.description && (
              <div className="mt-4 border-t border-navy-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Bio</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-navy-600">{worker.description}</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <SectionTitle title="Services & coverage" />
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
                <CategoryIcon name={worker.categoryIcon} className="h-3 w-3" /> {worker.profession}
              </span>
              {(worker.additionalServices || []).map((service) => (
                <span key={service.id} className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600">
                  <Wrench className="h-3 w-3" /> {service.name}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Service areas</p>
              <p className="mt-1 text-xs text-navy-600">
                {[worker.locality, worker.city, ...(worker.serviceAreas || [])].filter((value, index, arr) => value && arr.indexOf(value) === index).join(' · ')}
              </p>
            </div>
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                <Clock3 className="h-3.5 w-3.5" /> Availability
              </p>
              <p className="mt-1 text-xs font-semibold text-navy-800">
                {availability.isAvailable === false ? 'Paused — not accepting bookings' : 'Open for new bookings'}
              </p>
              <p className="mt-0.5 text-xs text-navy-500">
                {(availability.days || []).map((day) => dayLabels[day] || day).join(', ') || 'No days configured'}
                {availability.startTime && availability.endTime
                  ? ` · ${formatTime(availability.startTime)}–${formatTime(availability.endTime)}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle title="Booking history" description="Current lifecycle distribution for this professional." />
            <div className="grid grid-cols-2 gap-2">
              {statusRows.map((status) => (
                <div key={status} className="rounded-xl bg-navy-50/70 px-3 py-2">
                  <p className="text-sm font-extrabold text-navy-900">{bookingStats?.[status] || 0}</p>
                  <p className="text-[10px] font-medium text-navy-400">{statusLabel(status)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <SectionTitle title="Worker bookings" description={`${bookings.length} most recent bookings assigned to this professional.`} />
            {bookings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No bookings yet" description="This professional has not received any bookings." />
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 8).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} viewer="admin" showDescription={false} />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Customer reviews" description="Reviews from completed bookings with this professional." />
            {reviews.length === 0 ? (
              <div className="empty-state py-8">
                <Star className="h-6 w-6 text-navy-300" />
                <p className="mt-2 text-sm font-medium text-navy-700">No reviews yet</p>
                <p className="mt-1 text-xs text-navy-400">Reviews appear after a customer rates a completed job.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((review) => (
                  <article key={review.id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-navy-800">{review.customerName}</p>
                      <RatingStars rating={review.rating} size="h-3 w-3" showValue />
                    </div>
                    {review.comment && <p className="mt-2 text-xs leading-relaxed text-navy-500">{review.comment}</p>}
                    <p className="mt-1.5 text-[10px] text-navy-300">{formatDateTime(review.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="card p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-navy-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Trust & safety</p>
            <p className="mt-2 text-[11px] leading-relaxed text-navy-500">
              Approving a worker publishes their profile in customer search and allows booking requests. Rejecting or
              suspending removes them from search immediately. Every action is recorded in the audit log with the
              administrator identity, timestamp and IP address.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/admin/audit-logs" className="btn-outline btn-sm">View audit logs</Link>
              <Link to="/admin/bookings" className="btn-outline btn-sm">All bookings</Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={approve}
        loading={running}
        title="Approve this professional?"
        description={`${worker.name} will become visible in search results and can accept bookings. The worker is notified immediately.`}
        confirmLabel="Approve worker"
        variant="primary"
      />

      <ReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={reject}
        loading={running}
        title="Reject this application"
        description={`${worker.name} will not appear in search results. The reason is stored and sent to the worker.`}
        confirmLabel="Reject application"
        label="Rejection reason"
        placeholder="Explain what needs to be corrected..."
        requireReason
      />

      <ReasonDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={suspend}
        loading={running}
        title="Suspend this worker account?"
        description={`${worker.name} will be signed out, hidden from search and blocked from receiving bookings until reactivated.`}
        confirmLabel="Suspend account"
        label="Reason for suspension"
        placeholder="Explain the policy breach or risk..."
        requireReason
      />

      <ConfirmDialog
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={reactivate}
        loading={running}
        title="Reactivate this worker account?"
        description="The worker can sign in and receive bookings again. Approval status is unchanged."
        confirmLabel="Reactivate"
        variant="primary"
      />
    </div>
  );
}
