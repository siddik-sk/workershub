import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, Clock3, Info, Power, Save } from 'lucide-react';
import { workerApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Feedback';
import { WEEK_DAYS } from '../../utils/constants';
import { formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/validation';

export default function WorkerAvailabilityPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    days: [],
    startTime: '09:00',
    endTime: '18:00',
    isAvailable: true,
  });

  useDocumentTitle('Availability');

  useEffect(() => {
    let mounted = true;
    workerApi
      .profile()
      .then((response) => {
        if (!mounted) return;
        const availability = response.data.workerProfile?.availability || {};
        setForm({
          days: availability.days || [],
          startTime: availability.startTime || '09:00',
          endTime: availability.endTime || '18:00',
          isAvailable: availability.isAvailable !== false,
        });
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err, 'Could not load your availability'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.days.length) {
      setError('Select at least one working day.');
      return;
    }
    if (form.startTime >= form.endTime) {
      setError('End time must be after the start time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await workerApi.updateAvailability({
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
        isAvailable: form.isAvailable,
      });
      setForm((current) => ({ ...current, ...response.data.availability }));
      toast.success(response.message || 'Availability updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update your availability'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader label="Loading your availability..." />;

  const orderedDays = WEEK_DAYS.map((day) => day);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Working schedule"
        title="Availability"
        description="Customers can only request appointments on your working days and within your working hours."
        actions={
          <Button as={Link} to="/worker/bookings" variant="outline">
            Booking requests
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card p-5 sm:p-6">
          <SectionTitle
            title="Accepting new bookings"
            description="Pause requests temporarily without changing your schedule."
            action={
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, isAvailable: !current.isAvailable }))}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                  form.isAvailable ? 'bg-emerald-500' : 'bg-navy-300'
                }`}
                aria-pressed={form.isAvailable}
                aria-label={form.isAvailable ? 'Pause new bookings' : 'Start accepting bookings'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    form.isAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            }
          />
          <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-xs ${
            form.isAvailable ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
          }`}>
            <Power className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {form.isAvailable
                ? 'Your profile is open for new bookings on the selected days and hours.'
                : 'New booking requests are paused. Existing accepted jobs are not affected.'}
            </p>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <SectionTitle title="Working days" description="Choose every day you are available to work." />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {orderedDays.map((day) => {
              const active = form.days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                      : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                  }`}
                  aria-pressed={active}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      active ? 'bg-brand-600 text-white' : 'bg-navy-100 text-navy-400'
                    }`}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                  </span>
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-navy-400">
            {form.days.length
              ? `${form.days.length} working day${form.days.length === 1 ? '' : 's'} selected.`
              : 'Select at least one day to keep your profile bookable.'}
          </p>
        </section>

        <section className="card p-5 sm:p-6">
          <SectionTitle title="Working hours" description="Customers can only choose appointment times inside this window." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startTime" className="label">Start time</label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  id="startTime"
                  type="time"
                  className="input pl-10"
                  value={form.startTime}
                  onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                  required
                />
              </div>
              <p className="help-text">Displayed as {formatTime(form.startTime)}</p>
            </div>
            <div>
              <label htmlFor="endTime" className="label">End time</label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  id="endTime"
                  type="time"
                  className="input pl-10"
                  value={form.endTime}
                  onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                  required
                />
              </div>
              <p className="help-text">Displayed as {formatTime(form.endTime)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50/60 p-3 text-[11px] leading-relaxed text-navy-500">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              Booking requests are validated against these hours and days. Times outside this window are rejected before a
              request reaches you.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-navy-900 p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Schedule preview</p>
          <p className="mt-2 text-sm leading-relaxed text-navy-300">
            {form.isAvailable ? 'Customers see you as available' : 'Customers see that you are not accepting bookings'}
            {form.days.length
              ? ` on ${form.days
                  .slice()
                  .sort((a, b) => WEEK_DAYS.findIndex((day) => day.value === a) - WEEK_DAYS.findIndex((day) => day.value === b))
                  .map((day) => WEEK_DAYS.find((item) => item.value === day)?.label || day)
                  .join(', ')}`
              : ''}
            , between {formatTime(form.startTime)} and {formatTime(form.endTime)}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" loading={saving} icon={Save} className="bg-white text-navy-900 hover:bg-navy-100">
              Save availability
            </Button>
            <Button as={Link} to="/worker" variant="ghost" className="text-navy-200 hover:bg-white/10 hover:text-white">
              Back to dashboard
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
