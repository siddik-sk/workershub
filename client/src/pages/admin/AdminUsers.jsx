import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, X } from 'lucide-react';
import { adminApi } from '../../services';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { formatDate, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const roleTabs = [
  { value: 'customer', label: 'Customers' },
  { value: 'worker', label: 'Worker accounts' },
];

export default function AdminUsers() {
  const [role, setRole] = useState('customer');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('User management');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.users({
        role,
        page,
        limit: 12,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load users'));
    } finally {
      setLoading(false);
    }
  }, [role, page, debouncedSearch, status]);

  useEffect(() => {
    load();
  }, [load]);

  function changeRole(value) {
    setRole(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="User management"
        description="Search customer and worker accounts, review activity and enforce account status when needed."
      />

      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-navy-200 bg-white p-1">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeRole(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  role === tab.value ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
                className="input w-full py-2 pl-8 pr-8 text-xs sm:w-64"
                aria-label="Search users"
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
              className="select py-2 text-xs sm:w-40"
              aria-label="Filter by account status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
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
          {pagination.total} {role === 'worker' ? 'worker account' : 'customer'}{pagination.total === 1 ? '' : 's'} found
        </p>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts found"
          description="Try a different search term, account status or role tab."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatus('');
                setRole('customer');
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
                <th>Account</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
                <th>Bookings</th>
                <th>Joined</th>
                <th>Last login</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-800">
                        {user.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link to={`/admin/users/${user.id}`} className="block truncate text-xs font-semibold text-navy-900 hover:text-brand-700">
                          {user.name}
                        </Link>
                        <span className="text-[10px] capitalize text-navy-400">{user.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-navy-700">{user.email}</p>
                    <p className="text-[10px] text-navy-400">{user.phone}</p>
                  </td>
                  <td className="text-xs">{[user.locality, user.city].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <StatusBadge status={user.accountStatus} />
                    {user.suspensionReason && (
                      <p className="mt-1 max-w-[12rem] truncate text-[10px] text-rose-500" title={user.suspensionReason}>
                        {user.suspensionReason}
                      </p>
                    )}
                  </td>
                  <td className="text-xs font-semibold">{user.bookingCount}</td>
                  <td className="text-xs">{formatDate(user.createdAt)}</td>
                  <td className="text-xs">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</td>
                  <td className="text-right">
                    <Link to={`/admin/users/${user.id}`} className="btn-outline btn-sm">View</Link>
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
