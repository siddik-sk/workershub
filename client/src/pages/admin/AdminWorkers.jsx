import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Search, SlidersHorizontal, UserRound, X, XCircle } from 'lucide-react';
import { adminApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { ConfirmDialog, ReasonDialog } from '../../components/ui/Modal';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import RatingStars from '../../components/workers/RatingStars';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const approvalTabs = [
  { value: '', label: 'All applications' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminWorkers() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [approvalStatus, setApprovalStatus] = useState(searchParams.get('approvalStatus') || '');
  const [accountStatus, setAccountStatus] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [running, setRunning] = useState(false);

  useDocumentTitle('Worker management');

  useEffect(() => {
    const fromQuery = searchParams.get('approvalStatus') || '';
    setApprovalStatus(fromQuery);
    setPage(1);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.workers({
        page,
        limit: 12,
        approvalStatus: approvalStatus || undefined,
        accountStatus: accountStatus || undefined,
        search: debouncedSearch.trim() || undefined,
        city: city.trim() || undefined,
      });
      setWorkers(response.data.workers);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load worker applications'));
    } finally {
      setLoading(false);
    }
  }, [page, approvalStatus, accountStatus, debouncedSearch, city]);

  useEffect(() => {
    load();
  }, [load]);

  async function approveWorker() {
    if (!approveTarget) return;
    setRunning(true);
    try {
      await adminApi.setWorkerApproval(approveTarget.id, { approvalStatus: 'approved' });
      toast.success(`${approveTarget.name} is now approved and bookable.`);
      setApproveTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve this application'));
    } finally {
      setRunning(false);
    }
  }

  async function rejectWorker(reason) {
    if (!rejectTarget) return;
    setRunning(true);
    try {
      await adminApi.setWorkerApproval(rejectTarget.id, { approvalStatus: 'rejected', reason });
      toast.success('Worker application rejected.');
      setRejectTarget(null);
      await load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Verification queue"
        title="Worker management"
        description="Review professional applications, approve bookable profiles and manage worker account access."
      />

      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
            {approvalTabs.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => {
                  setApprovalStatus(tab.value);
                  setPage(1);
                }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  approvalStatus === tab.value ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email or phone"
                className="input py-2 pl-8 pr-8 text-xs"
                aria-label="Search workers"
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
            <input
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setPage(1);
              }}
              placeholder="Filter by city"
              className="input py-2 text-xs"
              aria-label="Filter by city"
            />
            <select
              value={accountStatus}
              onChange={(event) => {
                setAccountStatus(event.target.value);
                setPage(1);
              }}
              className="select py-2 text-xs"
              aria-label="Filter by account status"
            >
              <option value="">All account statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="flex items-center text-[11px] text-navy-400">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {pagination.total} application{pagination.total === 1 ? '' : 's'} matching
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : workers.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No worker applications found"
          description="Try a different approval tab, account status, city or search term."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setApprovalStatus('');
                setAccountStatus('');
                setSearch('');
                setCity('');
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Professional</th>
                <th>Profession</th>
                <th>Location</th>
                <th>Approval</th>
                <th>Account</th>
                <th>Performance</th>
                <th>Charge</th>
                <th>Applied</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-800">
                        {worker.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link to={`/admin/workers/${worker.id}`} className="block truncate text-xs font-semibold text-navy-900 hover:text-brand-700">
                          {worker.name}
                        </Link>
                        <span className="text-[10px] text-navy-400">{worker.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs">{worker.profession}</td>
                  <td className="text-xs">{[worker.locality, worker.city].filter(Boolean).join(', ')}</td>
                  <td>
                    <StatusBadge status={worker.approvalStatus} />
                    {worker.rejectionReason && (
                      <p className="mt-1 max-w-[12rem] truncate text-[10px] text-rose-500" title={worker.rejectionReason}>
                        {worker.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td><StatusBadge status={worker.accountStatus} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={worker.averageRating} size="h-3 w-3" />
                      <span className="text-[10px] text-navy-400">
                        {worker.totalReviews ? Number(worker.averageRating).toFixed(1) : 'New'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-navy-400">
                      {worker.completedJobs} done · {worker.totalBookings} requests
                    </p>
                  </td>
                  <td className="text-xs font-semibold">{formatCurrency(worker.serviceCharge)}</td>
                  <td className="text-xs">{formatDate(worker.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      {worker.approvalStatus !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                          onClick={() => setApproveTarget(worker)}
                        >
                          Approve
                        </Button>
                      )}
                      {worker.approvalStatus !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                          onClick={() => setRejectTarget(worker)}
                        >
                          Reject
                        </Button>
                      )}
                      <Link to={`/admin/workers/${worker.id}`} className="btn-outline btn-sm">View</Link>
                    </div>
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

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={approveWorker}
        loading={running}
        title="Approve this worker?"
        description={
          approveTarget
            ? `${approveTarget.name} (${approveTarget.profession}) will become visible in search results and can accept bookings. The worker is notified immediately.`
            : ''
        }
        confirmLabel="Approve worker"
        variant="primary"
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={rejectWorker}
        loading={running}
        title="Reject this worker application"
        description={
          rejectTarget
            ? `${rejectTarget.name} will not appear in search results. The reason is stored and sent to the worker.`
            : ''
        }
        confirmLabel="Reject application"
        label="Rejection reason"
        placeholder="Explain what needs to be corrected before reapplying..."
        requireReason
      />
    </div>
  );
}
