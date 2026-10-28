const ApiError = require('./ApiError');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseDateOnly(value, field = 'date') {
  if (!DATE_ONLY.test(String(value || ''))) {
    throw ApiError.badRequest(`${field} must be in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${field} is invalid`);
  }
  return date;
}

function utcStartOfDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatTime12h(time) {
  if (!TIME_ONLY.test(String(time || ''))) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDateLong(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function appointmentDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function weekdayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
}

module.exports = {
  parseDateOnly,
  utcStartOfDay,
  addDays,
  formatTime12h,
  formatDateLong,
  formatDateShort,
  appointmentDateKey,
  weekdayName,
  DATE_ONLY,
  TIME_ONLY,
};
