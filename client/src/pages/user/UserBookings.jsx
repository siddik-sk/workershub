import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX2, Plus, Search, SlidersHorizontal, Ticket, X } from 'lucide-react';
import { bookingApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Pagination from '../../components/ui/Pagination';
import BookingCard from '../../components/bookings/BookingCard';
import { ReasonDialog } from '../../components/ui/Modal';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { BOOKING_STATUSES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/validation';

const filters = [{ value: '', label: 'All' }, ...BOOKING_STATUSES];

export default function UserBookings() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useDocumentTitle('My bookings');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingApi.my({
        page,
        limit: 8,
        status: status || undefined,
        search: debouncedSearch.trim() || undefined,
      });
      setBookings(response.data.bookings);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your bookings'));
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  async function confirmCancel(reason) {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(cancelTarget.id, reason);
      toast.success('Booking cancelled.');
      setCancelTarget(null);
      await load();
    } finally {
      setCancelling(false);
    }
  }

  const canCancel = (booking) => ['pending', 'accepted'].includes(booking.status);

  return (
    <div>
      <PageHeader
        eyebrow="Service history"
        title="My bookings"
        description="Every request, appointment and completed job with its live status and reference number."
        actions={
          <Button as={Link} to="/services" icon={Plus}>
            New booking
          </Button>
        }
      />

      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
            {filters.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                onClick={() => changeStatus(filter.value)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  status === filter.value
                    ? 'bg-navy-900 text-white'
                    : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search reference (WC-...)"
              className="input py-2 pl-8 pr-8 text-xs"
              aria-label="Search bookings by reference"
            />
            {search && (
              <button
                type="button"
                onClick={() => changeSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && (
        <p className="mb-3 text-xs text-navy-400">
          {pagination.total} booking{pagination.total === 1 ? '' : 's'}
          {status ? ` with status “${filters.find((item) => item.value === status)?.label}”` : ''}
          {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
        </p>
      )}

      {loading ? (
        <SkeletonList rows={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={status || debouncedSearch ? SlidersHorizontal : Ticket}
          title={status || debouncedSearch ? 'No bookings match these filters' : 'No bookings yet'}
          description={
            status || debouncedSearch
              ? 'Try another status, clear the reference search, or view all of your bookings.'
              : 'Send your first booking request to a verified local professional. You will be able to track every status change here.'
          }
          action={
            status || debouncedSearch ? (
              <Button
                variant="outline"
                onClick={() => {
                  changeStatus('');
                  changeSearch('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button as={Link} to="/services" icon={Plus}>
                Find a professional
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              viewer="customer"
              actions={
                canCancel(booking) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={CalendarX2}
                    className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setCancelTarget(booking)}
                  >
                    Cancel
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <Pagination
        className="mt-6"
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onChange={setPage}
      />

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title="Cancel booking request"
        description={
          cancelTarget
            ? `Booking ${cancelTarget.bookingReference} with ${cancelTarget.worker?.name}. Accepted bookings can only be cancelled at least 12 hours before the appointment.`
            : ''
        }
        confirmLabel="Cancel booking"
        label="Reason for cancellation"
        placeholder="Let the professional know why you need to cancel..."
      />
    </div>
  );
}
