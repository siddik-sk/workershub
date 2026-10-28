import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  MapPin,
  PlayCircle,
  ShieldAlert,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react';
import { workerApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle, StatCard } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import RatingStars from '../../components/workers/RatingStars';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency, formatDate, formatTime, friendlyDate, timeGreeting } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const approvalContent = {
  pending: {
    variant: 'warning',
    title: 'Your application is under review',
    body: 'An administrator is checking your profile. You can prepare your details now; your profile will become bookable once approved.',
  },
  rejected: {
    variant: 'error',
    title: 'Your application was not approved',
    body: 'Review the rejection reason below, update your details if needed, and contact support to request a re-review.',
  },
};

export default function WorkerDashboard() {
  const { user, workerProfile } = useAuth();
  const { unread } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Worker dashboard');

  useEffect(() => {
    let mounted = true;
    workerApi
      .dashboard()
      .then((response) => {
        if (mounted) setData(response.data);
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err, 'Could not load your dashboard'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Loading your workspace..." />;

  if (error) {
    return (
      <div>
        <PageHeader title="Professional dashboard" description="Manage requests, availability and your public profile." />
        <Alert variant="error" title="Dashboard unavailable">{error}</Alert>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const pendingRequests = (data?.recentBookings || []).filter((booking) => booking.status === 'pending');
  const upcoming = data?.upcoming || [];
  const approval = approvalContent[data?.approvalStatus];
  const completion = data?.profileCompletion || 0;

  return (
    <div>
      <PageHeader
        eyebrow={`${timeGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        title="Professional dashboard"
        description="Respond to booking requests, manage your availability and build a trusted local reputation."
        actions={
          <Button as={Link} to="/worker/bookings" icon={ClipboardList}>
            View requests
            {stats.pending > 0 && (
              <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">{stats.pending}</span>
            )}
          </Button>
        }
      />

      {approval && (
        <Alert
          variant={approval.variant}
          title={approval.title}
          className="mb-5"
        >
          <p>{approval.body}</p>
          {data?.rejectionReason && (
            <p className="mt-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs font-medium">
              Reason: {data.rejectionReason}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Link to="/worker/profile" className="text-xs font-bold underline underline-offset-2">Review profile</Link>
            <Link to="/worker/support" className="text-xs font-bold underline underline-offset-2">Contact support</Link>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="New requests"
          value={stats.pending}
          hint="Awaiting your response"
          tone="amber"
        />
        <StatCard
          icon={CalendarClock}
          label="Active jobs"
          value={(stats.accepted || 0) + (stats.inProgress || 0)}
          hint={`${stats.inProgress || 0} in progress`}
          tone="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed jobs"
          value={stats.completed}
          hint={`${stats.totalReviews || 0} customer reviews`}
          tone="emerald"
        />
        <StatCard
          icon={DollarSign}
          label="Estimated earnings"
          value={formatCurrency(stats.estimatedEarnings)}
          hint="Based on completed jobs × starting charge"
          tone="brand"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-8">
          <section>
            <SectionTitle
              title="New booking requests"
              description="Respond quickly to keep customers informed."
              action={
                <Link to="/worker/bookings" className="btn-ghost btn-sm">
                  All requests <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No new requests"
                description="New booking requests will appear here instantly, and you will receive a notification."
                action={<Button as={Link} to="/worker/profile" variant="outline" icon={UserRound}>Improve your profile</Button>}
              />
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/worker/bookings/${booking.id}`}
                    className="card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <CategoryIcon name={booking.category?.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{booking.category?.name}</p>
                      <p className="truncate text-xs text-navy-500">
                        {booking.customer?.name} · {formatDate(booking.appointmentDate)} at {formatTime(booking.appointmentTime)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-navy-400">
                        <MapPin className="h-3 w-3" /> {booking.locality}, {booking.city}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <StatusBadge status={booking.status} />
                      <span className="font-mono text-[10px] text-navy-300">{booking.bookingReference}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle
              title="Upcoming appointments"
              description="Accepted jobs from today onward."
              action={
                <Link to="/worker/bookings" className="btn-ghost btn-sm">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Nothing scheduled yet"
                description="Accepted appointments will show here with the customer's address and contact details."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
                {upcoming.map((booking, index) => (
                  <Link
                    key={booking.id}
                    to={`/worker/bookings/${booking.id}`}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-navy-50/50 ${index > 0 ? 'border-t border-navy-50' : ''}`}
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-900 text-white">
                      <span className="text-[8px] font-bold uppercase tracking-wide text-brand-300">{formatDate(booking.appointmentDate, 'MMM')}</span>
                      <span className="text-sm font-extrabold leading-none">{formatDate(booking.appointmentDate, 'dd')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-navy-900">{booking.customer?.name}</p>
                      <p className="truncate text-[11px] text-navy-400">
                        {friendlyDate(booking.appointmentDate)} at {formatTime(booking.appointmentTime)} · {booking.locality}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                {workerProfile?.profileImage ? (
                  <img src={workerProfile.profileImage} alt={user?.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Wrench className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{user?.name}</p>
                <p className="truncate text-xs text-navy-500">{data?.profile?.profession || 'Professional'}</p>
                <div className="mt-0.5">
                  <RatingStars rating={stats.averageRating} size="h-3 w-3" showValue={stats.totalReviews > 0} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-navy-500">
                <span>Profile completion</span>
                <span className={completion >= 80 ? 'text-emerald-700' : completion >= 50 ? 'text-amber-700' : 'text-rose-700'}>
                  {completion}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-100">
                <div
                  className={`h-full rounded-full transition-all ${completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.max(4, completion)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-navy-400">
                {completion >= 80
                  ? 'Your profile is in great shape. Keep availability and charges current.'
                  : 'Add a profile photo, service areas and a detailed description to attract more customers.'}
              </p>
              <Link to="/worker/profile" className="btn-outline btn-sm mt-3 w-full">Edit profile</Link>
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle title="At a glance" />
            <div className="space-y-2.5 text-xs">
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><CalendarCheck className="h-3.5 w-3.5" /> Accepted</span>
                <span className="font-bold text-navy-900">{stats.accepted || 0}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><PlayCircle className="h-3.5 w-3.5" /> In progress</span>
                <span className="font-bold text-navy-900">{stats.inProgress || 0}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                <span className="font-bold text-navy-900">{stats.completed || 0}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><Star className="h-3.5 w-3.5" /> Rating</span>
                <span className="font-bold text-navy-900">
                  {stats.totalReviews ? `${Number(stats.averageRating).toFixed(1)} / 5` : 'No reviews yet'}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><Bell className="h-3.5 w-3.5" /> Unread updates</span>
                <span className="font-bold text-navy-900">{unread}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-navy-400"><Clock3 className="h-3.5 w-3.5" /> Availability</span>
                <span className="flex items-center gap-1 font-bold text-navy-900">
                  {data?.profile?.availability?.isAvailable === false ? (
                    <><ShieldAlert className="h-3 w-3 text-rose-500" /> Paused</>
                  ) : (
                    <><BadgeCheck className="h-3 w-3 text-emerald-600" /> Open</>
                  )}
                </span>
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/worker/availability" className="btn-outline btn-sm">Availability</Link>
              <Link to="/worker/notifications" className="btn-outline btn-sm">Notifications</Link>
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Grow your business</p>
            <p className="mt-2 text-sm leading-relaxed text-navy-300">
              Fast responses and completed jobs improve your rating and visibility. Keep your starting charge and working
              days accurate so customers only request times you can work.
            </p>
            <Link to="/worker/availability" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Manage working hours <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
