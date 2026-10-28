import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const actions = [
  'user.suspend',
  'user.reactivate',
  'worker.approve',
  'worker.reject',
  'worker.suspend',
  'worker.reactivate',
  'category.create',
  'category.update',
  'booking.cancel',
];

const targetTypes = ['user', 'worker', 'category', 'booking'];

const actionTones = {
  'user.suspend': 'bg-rose-50 text-rose-700',
  'user.reactivate': 'bg-emerald-50 text-emerald-700',
  'worker.approve': 'bg-emerald-50 text-emerald-700',
  'worker.reject': 'bg-rose-50 text-rose-700',
  'worker.suspend': 'bg-rose-50 text-rose-700',
  'worker.reactivate': 'bg-emerald-50 text-emerald-700',
  'category.create': 'bg-sky-50 text-sky-700',
  'category.update': 'bg-indigo-50 text-indigo-700',
  'booking.cancel': 'bg-amber-50 text-amber-700',
};

function actionLabel(action) {
  return action
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ');
}

export default function AdminAuditLogs() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useDocumentTitle('Audit logs');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await adminApi.auditLogs({
        page,
        limit: 20,
        action: action || undefined,
        targetType: targetType || undefined,
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load audit logs'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, action, targetType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Accountability"
        title="Audit logs"
        description="Every sensitive administrative action is recorded with the administrator, target, timestamp and source IP."
        actions={<Button variant="outline" icon={RefreshCw} onClick={() => load(true)} loading={refreshing}>Refresh</Button>}
      />

      <div className="card mb-5 p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className="select py-2 text-xs"
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>{actionLabel(item)}</option>
            ))}
          </select>
          <select
            value={targetType}
            onChange={(event) => {
              setTargetType(event.target.value);
              setPage(1);
            }}
            className="select py-2 text-xs"
            aria-label="Filter by target type"
          >
            <option value="">All target types</option>
            {targetTypes.map((item) => (
              <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>
            ))}
          </select>
          <div className="text-[11px] text-navy-400 sm:col-span-2 xl:col-span-2 xl:self-center">
            {pagination.total} audit event{pagination.total === 1 ? '' : 's'} stored
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
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No audit events"
          description="Administrative actions such as approvals, suspensions, category changes and booking cancellations will appear here."
          action={action || targetType ? (
            <Button variant="outline" onClick={() => { setAction(''); setTargetType(''); setPage(1); }}>
              Clear filters
            </Button>
          ) : null}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target</th>
                <th>Description</th>
                <th>IP address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</td>
                  <td>
                    {log.admin ? (
                      <>
                        <p className="text-xs font-semibold text-navy-900">{log.admin.name}</p>
                        <p className="text-[10px] text-navy-400">{log.admin.email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-navy-400">System</span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${actionTones[log.action] || 'bg-navy-100 text-navy-600'}`}>
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td>
                    <p className="text-xs capitalize text-navy-700">{log.targetType}</p>
                    {log.targetId && <p className="max-w-[8rem] truncate font-mono text-[9px] text-navy-300">{log.targetId}</p>}
                  </td>
                  <td className="max-w-md whitespace-normal text-xs leading-relaxed text-navy-600">{log.description}</td>
                  <td className="font-mono text-[10px] text-navy-400">{log.ipAddress || '—'}</td>
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

      <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-navy-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Immutable operational trail</p>
        <p className="mt-1.5 text-xs leading-relaxed text-navy-500">
          Audit records are written by the backend service whenever an administrator approves or rejects a worker,
          suspends or reactivates an account, changes the service catalogue, or cancels a booking. They are read-only from
          the admin interface.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/admin/workers" className="btn-outline btn-sm">Worker approvals</Link>
          <Link to="/admin/bookings" className="btn-outline btn-sm">Booking management</Link>
        </div>
      </div>
    </div>
  );
}
