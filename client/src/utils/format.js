import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export const CURRENCY = import.meta.env.VITE_CURRENCY || '$';

export function formatCurrency(value) {
  const number = Number(value || 0);
  return `${CURRENCY}${number.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseISO(`${value}T00:00:00`);
  }
  return new Date(value);
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return format(date, pattern);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy, h:mm a');
}

export function formatTime(value) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value || '—';
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function friendlyDate(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, dd MMM');
}

export function timeAgo(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function initials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function capitalize(value = '') {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function statusLabel(status = '') {
  const labels = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    suspended: 'Suspended',
    approved: 'Approved',
    customer: 'Customer',
    worker: 'Worker',
    admin: 'Admin',
  };
  return labels[status] || capitalize(String(status).replace(/_/g, ' '));
}

export function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const local = new Date(today.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export function maxDateInputValue(days = 90) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path;
}
