import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Ban,
  Bell,
  CalendarPlus,
  CheckCheck,
  CircleCheck,
  CircleX,
  Hammer,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/format';
import Button from '../ui/Button';

const typeIcons = {
  booking_new: CalendarPlus,
  booking_accepted: CircleCheck,
  booking_rejected: CircleX,
  booking_cancelled: Ban,
  booking_in_progress: Hammer,
  booking_completed: BadgeCheck,
  booking_review: Star,
  account_approved: ShieldCheck,
  account_rejected: CircleX,
  account_suspended: Ban,
  system: Bell,
};

export default function NotificationBell({ viewAllPath = '/notifications' }) {
  const { unread, notifications, fetchNotifications, markRead, markAllRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    fetchNotifications({ limit: 8 }).catch(() => {});
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, fetchNotifications]);

  async function openNotification(notification) {
    try {
      if (!notification.isRead) await markRead(notification.id);
    } catch {
      // navigation still proceeds; unread state remains persisted on the server
    }
    setOpen(false);
    if (notification.actionUrl) navigate(notification.actionUrl);
    else if (notification.relatedBookingId) navigate(viewAllPath);
  }

  async function handleMarkAll() {
    setMarking(true);
    try {
      await markAllRead();
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="icon-btn relative"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift animate-fade-up">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-navy-900">Notifications</p>
              <p className="text-xs text-navy-400">{unread ? `${unread} unread` : 'You are all caught up'}</p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={marking}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && !notifications.length ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="skeleton h-16 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-navy-200" />
                <p className="mt-3 text-sm font-medium text-navy-700">No notifications yet</p>
                <p className="mt-1 text-xs text-navy-400">Booking and account updates will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className={`flex w-full items-start gap-3 border-b border-navy-50 px-4 py-3 text-left transition hover:bg-navy-50/60 ${
                      notification.isRead ? '' : 'bg-brand-50/40'
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${notification.isRead ? 'font-medium' : 'font-semibold'} text-navy-900`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-navy-500">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-navy-400">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-navy-100 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                navigate(viewAllPath);
              }}
            >
              View notification centre
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
