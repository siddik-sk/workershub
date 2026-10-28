import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Search, X } from 'lucide-react';
import { adminApi } from '../../services';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { BOOKING_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Booking management');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.bookings({
        page,
        limit: 15,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        city: city.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setBookings(response.data.bookings);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load bookings'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, city, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminApi.bookingStats().then((response) => setStats(response.data)).catch(() => {});
  }, []);

  function resetFilters() {
    setSearch('');
    setStatus('');
    setCity('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  const hasFilters = Boolean(search || status || city || from || to);
  const totalStatus = stats?.byStatus || {};

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Booking management"
        description="Inspect every booking on the platform, filter by lifecycle status and intervene when support is required."
      />

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          <div className="card px-3 py-2.5">
            <p className="text-base font-extrabold text-navy-900">{stats.today}</p>
            <p className="text-[10px] text-navy-400">Created today</p>
          </div>
          <div className="card px-3 py-2.5">
            <p className="text-base font-extrabold text-navy-900">{stats.week}</p>
            <p className="text-[10px] text-navy-400">Last 7 days</p>
          </div>
          <div className="card px-3 py-2.5">
            <p className="text-base font-extrabold text-navy-900">{stats.month}</p>
            <p className="text-[10px] text-navy-400">This month</p>
          </div>
          {BOOKING_STATUSES.slice(0, 4).map((item) => (
            <div key={item.value} className="card px-3 py-2.5">
              <p className="text-base font-extrabold text-navy-900">{totalStatus[item.value] || 0}</p>
              <p className="text-[10px] text-navy-400">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-5 p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search booking reference"
              className="input py-2 pl-8 pr-8 text-xs"
              aria-label="Search bookings"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="select py-2 text-xs"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            placeholder="City"
            className="input py-2 text-xs"
            aria-label="Filter by city"
          />
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="input py-2 text-xs"
            aria-label="Created from date"
            title="Created from"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="input py-2 text-xs"
            aria-label="Created to date"
            title="Created to"
          />
        </div>
        {hasFilters && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-navy-400">Filters are applied to the database query.</p>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-500 hover:text-navy-800">
              <X className="h-3 w-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && (
        <p className="mb-3 text-xs text-navy-400">{pagination.total} booking{pagination.total === 1 ? '' : 's'} matching the current filters</p>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings found"
          description="Try a different status, city or date range, or clear the reference search."
          action={hasFilters ? <Button variant="outline" onClick={resetFilters}>Clear filters</Button> : null}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Service</th>
                <th>Customer</th>
                <th>Professional</th>
                <th>Appointment</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <Link to={`/admin/bookings/${booking.id}`} className="font-mono text-[11px] font-semibold text-brand-700 hover:underline">
                      {booking.bookingReference}
                    </Link>
                  </td>
                  <td className="text-xs">{booking.category?.name || '—'}</td>
                  <td className="text-xs">{booking.customer?.name}</td>
                  <td className="text-xs">{booking.worker?.name}</td>
                  <td className="text-xs">
                    {formatDate(booking.appointmentDate, 'dd MMM yyyy')}
                    <span className="ml-1 text-navy-400">{formatTime(booking.appointmentTime)}</span>
                  </td>
                  <td className="text-xs">{[booking.locality, booking.city].filter(Boolean).join(', ')}</td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td className="text-xs">{formatDateTime(booking.createdAt)}</td>
                  <td className="text-right">
                    <Link to={`/admin/bookings/${booking.id}`} className="btn-outline btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        className="mt-6"
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onChange={setPage}
      />
    </div>
  );
}
