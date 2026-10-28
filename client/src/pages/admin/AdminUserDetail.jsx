import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
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
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

export default function AdminUserDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [running, setRunning] = useState(false);

  useDocumentTitle(data?.user?.name ? `${data.user.name} · User` : 'User details');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.user(id);
      setData(response.data);
    } catch (err) {
      setError(
        err.status === 404 ? 'This user account no longer exists.' : getErrorMessage(err, 'Could not load the user')
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading account details..." />;

  if (error || !data?.user) {
    return (
      <EmptyState
        icon={UserRound}
        title="Account unavailable"
        description={error || 'This account could not be loaded.'}
        action={<Link to="/admin/users" className="btn-primary">Back to users</Link>}
      />
    );
  }

  const { user, workerProfile, bookings, reviews } = data;
  const suspended = user.accountStatus === 'suspended';

  async function suspendAccount(reason) {
    setRunning(true);
    try {
      await adminApi.setUserStatus(user.id, { accountStatus: 'suspended', reason });
      toast.success('Account suspended.');
      setSuspendOpen(false);
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function reactivateAccount() {
    setRunning(true);
    try {
      await adminApi.setUserStatus(user.id, { accountStatus: 'active' });
      toast.success('Account reactivated.');
      setReactivateOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reactivate the account'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow={`${user.role} account`}
          title={user.name}
          description={`Account created ${formatDate(user.createdAt)} · Last login ${user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'never'}`}
          actions={
            suspended ? (
              <Button variant="primary" icon={ShieldCheck} onClick={() => setReactivateOpen(true)}>
                Reactivate account
              </Button>
            ) : (
              <Button variant="danger" icon={ShieldAlert} onClick={() => setSuspendOpen(true)}>
                Suspend account
              </Button>
            )
          }
        />
      </div>

      {suspended && (
        <Alert variant="error" title="Account suspended" className="mb-5">
          This user cannot sign in, make bookings or receive new work. {user.suspensionReason ? `Reason: ${user.suspensionReason}` : 'No reason recorded.'}
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr] xl:items-start">
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{user.name}</p>
                <p className="text-xs capitalize text-navy-400">{user.role}</p>
                <div className="mt-1"><StatusBadge status={user.accountStatus} /></div>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-navy-100 pt-4 text-xs">
              <p className="flex items-center gap-2 text-navy-600"><Mail className="h-3.5 w-3.5 text-navy-400" /> {user.email}</p>
              <p className="flex items-center gap-2 text-navy-600"><Phone className="h-3.5 w-3.5 text-navy-400" /> {user.phone}</p>
              <p className="flex items-center gap-2 text-navy-600"><MapPin className="h-3.5 w-3.5 text-navy-400" /> {[user.locality, user.city].filter(Boolean).join(', ') || 'No location'}</p>
              <p className="flex items-center gap-2 text-navy-600"><CalendarDays className="h-3.5 w-3.5 text-navy-400" /> Joined {formatDate(user.createdAt, 'dd MMM yyyy')}</p>
            </div>
          </div>

          {workerProfile && (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-navy-900">Worker profile</p>
                <StatusBadge status={workerProfile.approvalStatus} />
              </div>
              <div className="mt-3 flex items-start gap-3">
                <Avatar name={user.name} src={workerProfile.profileImage} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-navy-900">{workerProfile.profession}</p>
                  <p className="mt-0.5 text-[11px] text-navy-400">{workerProfile.experienceYears} years experience</p>
                  <div className="mt-1"><RatingStars rating={workerProfile.averageRating} size="h-3 w-3" showValue={workerProfile.totalReviews > 0} /></div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-navy-50/70 p-3 text-[11px]">
                <div>
                  <p className="text-navy-400">Starting charge</p>
                  <p className="font-semibold text-navy-800">{formatCurrency(workerProfile.serviceCharge)}</p>
                </div>
                <div>
                  <p className="text-navy-400">Completed</p>
                  <p className="font-semibold text-navy-800">{workerProfile.completedJobs} jobs</p>
                </div>
              </div>
              {workerProfile.rejectionReason && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  Rejection reason: {workerProfile.rejectionReason}
                </p>
              )}
              <Link to={`/admin/workers/${workerProfile.id}`} className="btn-outline btn-sm mt-3 w-full">
                Manage worker profile
              </Link>
            </div>
          )}

          <div className="card p-5">
            <p className="text-xs font-bold text-navy-900">Account controls</p>
            <p className="mt-1 text-[11px] leading-relaxed text-navy-400">
              Suspension invalidates the user&apos;s session immediately, blocks sign-in, hides worker profiles from search
              and prevents new bookings. The action is written to the audit log.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {suspended ? (
                <Button variant="outline" icon={ShieldCheck} onClick={() => setReactivateOpen(true)}>
                  Reactivate account
                </Button>
              ) : (
                <Button variant="danger" icon={ShieldAlert} onClick={() => setSuspendOpen(true)}>
                  Suspend account
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <SectionTitle
              title="Bookings as a customer"
              description={`${bookings.length} booking${bookings.length === 1 ? '' : 's'} in the account's service history.`}
            />
            {bookings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No bookings" description="This account has not created any bookings." />
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 8).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} viewer="admin" showDescription={false} />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Reviews written" description="Customer reviews submitted from this account." />
            {reviews.length === 0 ? (
              <div className="empty-state py-8">
                <Star className="h-6 w-6 text-navy-300" />
                <p className="mt-2 text-sm font-medium text-navy-700">No reviews written</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((review) => (
                  <article key={review.id} className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
                        <Wrench className="h-3.5 w-3.5 text-brand-600" /> {review.workerName}
                      </p>
                      <RatingStars rating={review.rating} size="h-3 w-3" showValue />
                    </div>
                    {review.comment && <p className="mt-2 text-xs leading-relaxed text-navy-500">{review.comment}</p>}
                    <p className="mt-1.5 text-[10px] text-navy-300">{formatDateTime(review.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ReasonDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={suspendAccount}
        loading={running}
        title="Suspend this account?"
        description={`${user.name} will be signed out and blocked from using WorkConnect until reactivated.`}
        confirmLabel="Suspend account"
        label="Reason for suspension"
        placeholder="Explain the policy breach or risk..."
        requireReason
      />

      <ConfirmDialog
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={reactivateAccount}
        loading={running}
        title="Reactivate this account?"
        description={`${user.name} will be able to sign in and use WorkConnect again. Worker approval status is unchanged.`}
        confirmLabel="Reactivate"
        variant="primary"
      />
    </div>
  );
}
