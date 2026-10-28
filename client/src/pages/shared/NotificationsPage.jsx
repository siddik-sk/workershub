import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  BellOff,
  CalendarCheck,
  CalendarX2,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { notificationApi } from '../../services';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import Alert from '../../components/ui/Alert';
import { timeAgo } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

const typeIcons = {
  booking_new: ClipboardList,
  booking_accepted: CalendarCheck,
  booking_rejected: CalendarX2,
  booking_cancelled: CalendarX2,
  booking_in_progress: PlayCircle,
  booking_completed: CheckCircle2,
  booking_review: MessageSquare,
  account_approved: BadgeCheck,
  account_rejected: ShieldAlert,
  account_suspended: ShieldAlert,
  system: Sparkles,
};

const typeTones = {
  booking_new: 'bg-sky-50 text-sky-700',
  booking_accepted: 'bg-emerald-50 text-emerald-700',
  booking_rejected: 'bg-rose-50 text-rose-700',
  booking_cancelled: 'bg-rose-50 text-rose-700',
  booking_in_progress: 'bg-indigo-50 text-indigo-700',
  booking_completed: 'bg-emerald-50 text-emerald-700',
  booking_review: 'bg-amber-50 text-amber-700',
  account_approved: 'bg-emerald-50 text-emerald-700',
  account_rejected: 'bg-rose-50 text-rose-700',
  account_suspended: 'bg-rose-50 text-rose-700',
  system: 'bg-brand-50 text-brand-700',
};

const tabs = [
  { value: 'all', label: 'All notifications' },
  { value: 'unread', label: 'Unread' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { unread, refreshUnread } = useNotifications();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);

  useDocumentTitle('Notifications');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationApi.list({
        page,
        limit: 10,
        unread: tab === 'unread' ? 'true' : undefined,
      });
      setItems(response.data.notifications);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load notifications'));
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    load();
  }, [load]);

  function changeTab(value) {
    setTab(value);
    setPage(1);
  }

  async function openNotification(notification) {
    if (!notification.isRead) {
      try {
        await notificationApi.markRead(notification.id);
        setItems((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        refreshUnread();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not mark the notification as read'));
        return;
      }
    }
    if (notification.actionUrl && notification.actionUrl.startsWith('/') && !notification.actionUrl.startsWith('//')) {
      navigate(notification.actionUrl);
    }
  }

  async function handleMarkAll() {
    setMarking(true);
    try {
      await notificationApi.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      refreshUnread();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not mark notifications as read'));
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Booking activity, approvals and account updates are stored here. Push updates arrive in real time while you are online."
        actions={
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAll}
            loading={marking}
            disabled={unread === 0}
          >
            Mark all as read
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-navy-200 bg-white p-1">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => changeTab(item.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === item.value ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-900'
              }`}
            >
              {item.label}
              {item.value === 'unread' && unread > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    tab === item.value ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>
        {!loading && (
          <p className="text-xs text-navy-400">
            {pagination.total} notification{pagination.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'unread' ? BellOff : Bell}
          title={tab === 'unread' ? 'You are all caught up' : 'No notifications yet'}
          description={
            tab === 'unread'
              ? 'Unread booking updates and account messages will appear here.'
              : 'When bookings, approvals or account changes happen, you will see them here — even if you were offline.'
          }
          action={
            tab === 'unread' ? (
              <Button variant="outline" onClick={() => changeTab('all')}>
                View all notifications
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const tone = typeTones[notification.type] || 'bg-navy-50 text-navy-600';
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition ${
                  notification.isRead
                    ? 'border-navy-100 bg-white hover:border-navy-200'
                    : 'border-brand-200 bg-brand-50/40 hover:border-brand-300 hover:bg-brand-50/70'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${notification.isRead ? 'font-semibold text-navy-800' : 'font-bold text-navy-900'}`}>
                      {notification.title}
                    </span>
                    {!notification.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-navy-500">{notification.message}</span>
                  <span className="mt-1.5 block text-[11px] text-navy-400">{timeAgo(notification.createdAt)}</span>
                </span>
              </button>
            );
          })}
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
