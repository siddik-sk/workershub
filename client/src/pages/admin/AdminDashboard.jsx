import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  Users,
  Wrench,
} from 'lucide-react';
import { adminApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle, StatCard } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatDate, formatDateTime, formatTime, statusLabel } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const ranges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const statusColors = {
  pending: '#f59e0b',
  accepted: '#0ea5e9',
  in_progress: '#6366f1',
  completed: '#10b981',
  rejected: '#f43f5e',
  cancelled: '#94a3b8',
};

const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e5ebf3',
    boxShadow: '0 12px 30px -16px rgba(11,31,58,0.25)',
    fontSize: 12,
  },
  labelStyle: { fontWeight: 600, color: '#0b1f3a' },
};

function shortDate(value) {
  return formatDate(value, 'dd MMM');
}

export default function AdminDashboard() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useDocumentTitle('Admin overview');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await adminApi.dashboard({ range });
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load platform analytics'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading platform analytics..." />;

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Platform overview" description="Real-time marketplace health and operational activity." />
        <Alert variant="error" title="Analytics unavailable">{error}</Alert>
        <Button className="mt-4" onClick={() => load()}>Try again</Button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recentBookings = data?.recentBookings || [];
  const pendingWorkers = data?.pendingWorkers || [];
  const statusData = (charts.statusDistribution || []).map((row) => ({
    name: statusLabel(row.status),
    value: row.count,
    status: row.status,
    color: statusColors[row.status] || '#94a3b8',
  }));
  const categoryData = (charts.bookingsByCategory || []).slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Platform overview"
        description="Every metric is calculated live from the database: registrations, worker approvals, booking flow and service demand."
        actions={
          <>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="select w-auto py-2 text-xs font-semibold"
              aria-label="Analytics date range"
            >
              {ranges.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <Button variant="outline" icon={RefreshCw} onClick={() => load(true)} loading={refreshing}>
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="error" className="mb-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Customers"
          value={Number(metrics.totalUsers || 0).toLocaleString()}
          hint={`${metrics.newUsersToday || 0} registered today`}
          tone="brand"
        />
        <StatCard
          icon={Wrench}
          label="Professionals"
          value={Number(metrics.totalWorkers || 0).toLocaleString()}
          hint={`${metrics.approvedWorkers || 0} approved and bookable`}
          tone="sky"
        />
        <StatCard
          icon={CalendarDays}
          label="Total bookings"
          value={Number(metrics.totalBookings || 0).toLocaleString()}
          hint={`${metrics.pendingBookings || 0} pending responses`}
          tone="indigo"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending approvals"
          value={metrics.pendingWorkerApprovals || 0}
          hint="Worker applications awaiting review"
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-navy-900">{Number(metrics.completedBookings || 0).toLocaleString()}</p>
            <p className="text-[11px] font-medium text-navy-400">Completed bookings</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-navy-900">{Number(metrics.inProgressBookings || 0).toLocaleString()}</p>
            <p className="text-[11px] font-medium text-navy-400">Jobs in progress</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <CalendarX2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-navy-900">
              {Number((metrics.cancelledBookings || 0) + (metrics.rejectedBookings || 0)).toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-navy-400">Cancelled or rejected</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-navy-900">{Number(metrics.newRegistrationsWeek || 0).toLocaleString()}</p>
            <p className="text-[11px] font-medium text-navy-400">New registrations this week</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <SectionTitle
            title="Registration growth"
            description={`New customer and worker accounts from ${formatDate(data?.range?.from)} to ${formatDate(data?.range?.to)}.`}
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.registrationGrowth || []} margin={{ top: 5, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="customerFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0b8a80" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0b8a80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="workerFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#6785ab' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6785ab' }} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} labelFormatter={(value) => formatDate(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="customer" name="Customers" stroke="#0b8a80" strokeWidth={2} fill="url(#customerFill)" />
                <Area type="monotone" dataKey="worker" name="Workers" stroke="#0ea5e9" strokeWidth={2} fill="url(#workerFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle
            title="Booking trends"
            description="Requests created per day across the selected period."
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bookingTrends || []} margin={{ top: 5, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#6785ab' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6785ab' }} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} labelFormatter={(value) => formatDate(value)} />
                <Bar dataKey="bookings" name="Bookings" fill="#0b8a80" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle
            title="Booking status distribution"
            description="All bookings by their current lifecycle status."
          />
          <div className="h-64 w-full">
            {statusData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-navy-400">No bookings recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle
            title="Demand by service"
            description="Top service categories by booking volume in this period."
          />
          <div className="h-64 w-full">
            {categoryData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-navy-400">No service demand recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 16, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ebf3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#6785ab' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#334e6d' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="count" name="Bookings" fill="#26c7b1" radius={[0, 5, 5, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy-900">Latest bookings</h2>
              <p className="mt-0.5 text-xs text-navy-400">The eight most recent requests on the platform.</p>
            </div>
            <Link to="/admin/bookings" className="btn-ghost btn-sm">
              All bookings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="No bookings yet" description="New booking requests will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Service</th>
                    <th>Customer</th>
                    <th>Professional</th>
                    <th>Appointment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <Link to={`/admin/bookings/${booking.id}`} className="font-mono text-[11px] font-semibold text-brand-700 hover:underline">
                          {booking.bookingReference}
                        </Link>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <CategoryIcon name={booking.category?.icon} className="h-3.5 w-3.5 text-brand-600" />
                          {booking.category?.name || '—'}
                        </span>
                      </td>
                      <td className="text-xs">{booking.customer?.name}</td>
                      <td className="text-xs">{booking.worker?.name}</td>
                      <td className="text-xs">
                        {formatDate(booking.appointmentDate, 'dd MMM')} · {formatTime(booking.appointmentTime)}
                      </td>
                      <td><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy-900">Pending worker approvals</h2>
              <p className="mt-0.5 text-xs text-navy-400">Applications waiting for review.</p>
            </div>
            <Link to="/admin/workers?approvalStatus=pending" className="btn-ghost btn-sm">
              Review all
            </Link>
          </div>
          {pendingWorkers.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={BadgeCheck} title="No pending applications" description="Every worker application has been reviewed." />
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {pendingWorkers.map((worker) => (
                <Link
                  key={worker.id}
                  to={`/admin/workers/${worker.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-navy-50/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                    {worker.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-navy-900">{worker.name}</p>
                    <p className="truncate text-[11px] text-navy-400">
                      {worker.profession} · {worker.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-navy-400">{formatDate(worker.createdAt)}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-amber-700">Review</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-navy-900">Operations snapshot</p>
            <p className="mt-0.5 text-xs text-navy-500">
              {metrics.newRegistrationsMonth || 0} new registrations this month · {metrics.rejectedOrSuspendedWorkers || 0} rejected or
              suspended worker accounts · Last refreshed {formatDateTime(new Date())}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/workers" className="btn-outline btn-sm">Worker management</Link>
            <Link to="/admin/audit-logs" className="btn-outline btn-sm">Audit logs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
