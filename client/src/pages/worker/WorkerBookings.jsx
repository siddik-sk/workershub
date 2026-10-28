import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarX2,
  Check,
  CheckCircle2,
  ClipboardList,
  Play,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import { workerApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Pagination from '../../components/ui/Pagination';
import BookingCard from '../../components/bookings/BookingCard';
import { ConfirmDialog, ReasonDialog } from '../../components/ui/Modal';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { BOOKING_STATUSES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/validation';

const filters = [{ value: '', label: 'All' }, ...BOOKING_STATUSES];

const confirmCopy = {
  accept: {
    title: 'Accept this booking?',
    description: 'The customer will be notified immediately and the appointment will move to your upcoming schedule.',
    confirmLabel: 'Accept booking',
    variant: 'primary',
    success: 'Booking accepted.',
  },
  start: {
    title: 'Start this job?',
    description: 'Mark the job as in progress once you are on site and beginning work. The customer will be notified.',
    confirmLabel: 'Start job',
    variant: 'primary',
    success: 'Job marked as in progress.',
  },
  complete: {
    title: 'Mark this job as completed?',
    description: 'This confirms the work is finished, updates your completed jobs count and lets the customer leave a review.',
    confirmLabel: 'Complete job',
    variant: 'primary',
    success: 'Job marked as completed.',
  },
};

export default function WorkerBookings() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [running, setRunning] = useState(false);

  useDocumentTitle('Booking requests');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workerApi.bookings({
        page,
        limit: 8,
        status: status || undefined,
        search: debouncedSearch.trim() || undefined,
      });
      setBookings(response.data.bookings);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load booking requests'));
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

  async function runConfirm() {
    if (!confirmAction) return;
    const { booking, kind } = confirmAction;
    setRunning(true);
    try {
      if (kind === 'accept') await workerApi.acceptBooking(booking.id);
      if (kind === 'start') await workerApi.startBooking(booking.id);
      if (kind === 'complete') await workerApi.completeBooking(booking.id);
      toast.success(confirmCopy[kind].success);
      setConfirmAction(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the booking'));
    } finally {
      setRunning(false);
    }
  }

  async function confirmReject(reason) {
    if (!rejectTarget) return;
    setRunning(true);
    try {
      await workerApi.rejectBooking(rejectTarget.id, reason);
      toast.success('Booking declined.');
      setRejectTarget(null);
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function confirmCancel(reason) {
    if (!cancelTarget) return;
    setRunning(true);
    try {
      await workerApi.cancelBooking(cancelTarget.id, reason);
      toast.success('Booking cancelled.');
      setCancelTarget(null);
      await load();
    } finally {
      setRunning(false);
    }
  }

  function actionsFor(booking) {
    if (booking.status === 'pending') {
      return (
        <>
          <Button size="sm" icon={Check} onClick={() => setConfirmAction({ booking, kind: 'accept' })}>
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={XCircle}
            className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setRejectTarget(booking)}
          >
            Decline
          </Button>
        </>
      );
    }
    if (booking.status === 'accepted') {
      return (
        <>
          <Button size="sm" icon={Play} onClick={() => setConfirmAction({ booking, kind: 'start' })}>
            Start job
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={CalendarX2}
            className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => setCancelTarget(booking)}
          >
            Cancel
          </Button>
        </>
      );
    }
    if (booking.status === 'in_progress') {
      return (
        <Button size="sm" icon={CheckCircle2} onClick={() => setConfirmAction({ booking, kind: 'complete' })}>
          Complete job
        </Button>
      );
    }
    return null;
  }

  const activeStatusLabel = filters.find((item) => item.value === status)?.label;

  return (
    <div>
      <PageHeader
        eyebrow="Your work queue"
        title="Booking requests"
        description="Accept, decline and progress jobs through the lifecycle. Customers are notified at every step."
        actions={
          <Button as={Link} to="/worker/availability" variant="outline" icon={SlidersHorizontal}>
            Manage availability
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
          {pagination.total} {activeStatusLabel === 'All' ? 'booking' : activeStatusLabel.toLowerCase() + ' booking'}
          {pagination.total === 1 ? '' : 's'}
          {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
        </p>
      )}

      {loading ? (
        <SkeletonList rows={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={status === 'pending' ? ClipboardList : status || debouncedSearch ? SlidersHorizontal : CalendarCheckIcon}
          title={
            status === 'pending'
              ? 'No pending requests'
              : status || debouncedSearch
                ? 'No bookings match these filters'
                : 'No bookings yet'
          }
          description={
            status === 'pending'
              ? 'New customer requests will appear here instantly and you will receive a notification.'
              : status || debouncedSearch
                ? 'Try another status, clear the reference search, or view all bookings.'
                : 'Once your profile is approved and customers book your services, their requests will appear here.'
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
              <Button as={Link} to="/worker/profile" variant="outline" icon={Plus}>Improve your profile</Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} viewer="worker" actions={actionsFor(booking)} />
          ))}
        </div>
      )}

      <Pagination
        className="mt-6"
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onChange={setPage}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirm}
        title={confirmCopy[confirmAction?.kind]?.title}
        description={
          confirmAction
            ? `${confirmCopy[confirmAction.kind]?.description} Reference ${confirmAction.booking.bookingReference}.`
            : ''
        }
        confirmLabel={confirmCopy[confirmAction?.kind]?.confirmLabel}
        variant={confirmCopy[confirmAction?.kind]?.variant || 'primary'}
        loading={running}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={confirmReject}
        loading={running}
        title="Decline this booking request"
        description={
          rejectTarget
            ? `Booking ${rejectTarget.bookingReference} from ${rejectTarget.customer?.name}. The customer will be notified with your reason.`
            : ''
        }
        confirmLabel="Decline booking"
        label="Reason for declining"
        placeholder="Let the customer know why you cannot take this job..."
      />

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        loading={running}
        title="Cancel accepted booking"
        description={
          cancelTarget
            ? `Booking ${cancelTarget.bookingReference}. Accepted jobs can only be cancelled at least 2 hours before the appointment.`
            : ''
        }
        confirmLabel="Cancel booking"
        label="Reason for cancellation"
        placeholder="Explain why you need to cancel so the customer can plan..."
      />
    </div>
  );
}

function CalendarCheckIcon(props) {
  return <ClipboardList {...props} />;
}
