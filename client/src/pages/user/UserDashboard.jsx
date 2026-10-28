import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPin,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { userApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle, StatCard } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatDate, formatTime, friendlyDate, timeGreeting } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const quickActions = [
  {
    label: 'Find a professional',
    description: 'Search verified local workers by trade, city and rating.',
    to: '/services',
    icon: Search,
    tone: 'bg-brand-50 text-brand-700',
  },
  {
    label: 'My bookings',
    description: 'Track requests, appointments and completed jobs.',
    to: '/app/bookings',
    icon: CalendarCheck,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Notifications',
    description: 'See booking updates and account messages.',
    to: '/app/notifications',
    icon: Bell,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'My profile',
    description: 'Keep your contact details and password up to date.',
    to: '/app/profile',
    icon: UserRound,
    tone: 'bg-emerald-50 text-emerald-700',
  },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Customer dashboard');

  useEffect(() => {
    let mounted = true;
    userApi
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

  if (loading) return <PageLoader label="Loading your dashboard..." />;

  if (error) {
    return (
      <div>
        <PageHeader title="Your dashboard" description="Manage bookings and discover local professionals." />
        <Alert variant="error" title="Dashboard unavailable">{error}</Alert>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const upcoming = data?.upcoming || [];
  const recent = data?.recentBookings || [];

  return (
    <div>
      <PageHeader
        eyebrow={`${timeGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        title="Your service dashboard"
        description="Book trusted professionals, follow every appointment and keep all your service records in one place."
        actions={
          <Button as={Link} to="/services" icon={Search}>
            Find a professional
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Active bookings"
          value={stats.active}
          hint={`${stats.pending || 0} awaiting a response`}
          tone="brand"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed jobs"
          value={stats.completed}
          hint="Leave a review to help others"
          tone="emerald"
        />
        <StatCard
          icon={ListChecks}
          label="Total requests"
          value={stats.totalBookings}
          hint={`${stats.cancelled || 0} cancelled`}
          tone="sky"
        />
        <StatCard
          icon={Bell}
          label="Unread updates"
          value={unread}
          hint={unread ? 'New activity waiting' : 'You are all caught up'}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section>
          <SectionTitle
            title="Upcoming appointments"
            description="Accepted jobs scheduled from today onward."
            action={
              <Link to="/app/bookings" className="btn-ghost btn-sm">
                All bookings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming appointments"
              description="Once a professional accepts your request, the appointment will appear here with the confirmed time."
              action={<Button as={Link} to="/services" variant="outline" icon={Search}>Find a professional</Button>}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/app/bookings/${booking.id}`}
                  className="card-hover flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-900 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-300">
                        {formatDate(booking.appointmentDate, 'MMM')}
                      </span>
                      <span className="text-lg font-extrabold leading-none">
                        {formatDate(booking.appointmentDate, 'dd')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-navy-900">{booking.category?.name || 'Local service'}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-500">
                        <Clock3 className="h-3.5 w-3.5" /> {friendlyDate(booking.appointmentDate)} at {formatTime(booking.appointmentTime)}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:border-l sm:border-navy-100 sm:pl-4">
                    <p className="truncate text-xs font-semibold text-navy-700">{booking.worker?.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-navy-400">
                      <MapPin className="h-3 w-3" /> {booking.locality}, {booking.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <StatusBadge status={booking.status} />
                    <span className="font-mono text-[10px] text-navy-300">{booking.bookingReference}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <SectionTitle
              title="Recent activity"
              description="Your latest booking requests and their current status."
              action={
                <Link to="/app/bookings" className="btn-ghost btn-sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {recent.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Your first booking starts here"
                description="Browse verified professionals, compare profiles and send a booking request in a few clicks."
                action={<Button as={Link} to="/services" icon={Search}>Browse professionals</Button>}
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
                {recent.map((booking, index) => (
                  <Link
                    key={booking.id}
                    to={`/app/bookings/${booking.id}`}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-navy-50/50 ${
                      index > 0 ? 'border-t border-navy-50' : ''
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <CategoryIcon name={booking.category?.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-navy-800">{booking.category?.name || 'Local service'}</p>
                      <p className="truncate text-[11px] text-navy-400">
                        {booking.worker?.name} · {formatDate(booking.appointmentDate)} at {formatTime(booking.appointmentTime)}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card p-5">
            <SectionTitle title="Quick actions" />
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-navy-100 hover:bg-navy-50/60"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.tone}`}>
                    <action.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-navy-900">{action.label}</span>
                      {action.to === '/app/notifications' && unread > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-navy-400">{action.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Booking protection</p>
            <p className="mt-2 text-sm leading-relaxed text-navy-300">
              Every request is recorded with a reference and a full status timeline. Contact details are shared only
              between you, your professional and platform administrators.
            </p>
            <Link to="/app/support" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Read the help centre <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Account</p>
            <p className="mt-2 truncate text-sm font-bold text-navy-900">{user?.name}</p>
            <p className="truncate text-xs text-navy-500">{user?.email}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-navy-400">
              <MapPin className="h-3 w-3" /> {[user?.locality, user?.city].filter(Boolean).join(', ') || 'Add your service location'}
            </p>
            <Link to="/app/profile" className="btn-outline btn-sm mt-4 w-full">Manage profile</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
