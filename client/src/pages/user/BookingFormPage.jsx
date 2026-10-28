import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react';
import { workerApi, bookingApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import { Input, Textarea } from '../../components/ui/Fields';
import Modal from '../../components/ui/Modal';
import RatingStars from '../../components/workers/RatingStars';
import { CategoryIcon } from '../../utils/categoryIcons';
import { WEEK_DAYS } from '../../utils/constants';
import {
  formatCurrency,
  formatDate,
  formatTime,
  maxDateInputValue,
  todayInputValue,
} from '../../utils/format';
import { getErrorMessage, getFieldErrors, validateRequired } from '../../utils/validation';

const dayLabels = Object.fromEntries(WEEK_DAYS.map((day) => [day.value, day.label]));

function weekdayKey(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return WEEK_DAYS[date.getDay()]?.value || '';
}

export default function BookingFormPage() {
  const { workerId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    serviceCategoryId: '',
    appointmentDate: '',
    appointmentTime: '',
    serviceDescription: '',
    serviceAddress: '',
    city: user?.city || '',
    locality: user?.locality || '',
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useDocumentTitle(worker ? `Book ${worker.name}` : 'Book a professional');

  useEffect(() => {
    let mounted = true;
    workerApi
      .get(workerId)
      .then((response) => {
        if (!mounted) return;
        const profile = response.data.worker;
        setWorker(profile);
        setForm((current) => ({
          ...current,
          serviceCategoryId: current.serviceCategoryId || profile.categoryId,
          city: current.city || profile.city,
          locality: current.locality || profile.locality,
          appointmentTime: '',
        }));
      })
      .catch((err) => {
        if (mounted) setLoadError(err.status === 404 ? 'This professional is no longer available.' : getErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [workerId]);

  const services = useMemo(() => {
    if (!worker) return [];
    return [
      { id: worker.categoryId, name: worker.profession, icon: worker.categoryIcon, primary: true },
      ...(worker.additionalServices || []).map((service) => ({ ...service, icon: worker.categoryIcon, primary: false })),
    ];
  }, [worker]);

  const availability = worker?.availability || {};
  const availableDays = availability.days || [];
  const selectedDay = weekdayKey(form.appointmentDate);
  const dayBlocked = Boolean(form.appointmentDate && availableDays.length && !availableDays.includes(selectedDay));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  function validate() {
    const next = validateRequired({
      serviceCategoryId: form.serviceCategoryId,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      serviceDescription: form.serviceDescription,
      serviceAddress: form.serviceAddress,
      city: form.city,
      locality: form.locality,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
    });
    if (form.serviceDescription.trim() && form.serviceDescription.trim().length < 10) {
      next.serviceDescription = 'Describe the work in at least 10 characters';
    }
    if (form.serviceAddress.trim() && form.serviceAddress.trim().length < 5) {
      next.serviceAddress = 'Enter the full service address';
    }
    if (form.customerPhone && !/^[+0-9()\-\s]{7,25}$/.test(form.customerPhone.trim())) {
      next.customerPhone = 'Enter a valid contact phone number';
    }
    if (form.appointmentTime && availability.startTime && form.appointmentTime < availability.startTime) {
      next.appointmentTime = `Choose a time after ${formatTime(availability.startTime)}`;
    }
    if (form.appointmentTime && availability.endTime && form.appointmentTime >= availability.endTime) {
      next.appointmentTime = `Choose a time before ${formatTime(availability.endTime)}`;
    }
    if (dayBlocked) {
      next.appointmentDate = `This professional does not work on ${dayLabels[selectedDay] || selectedDay}`;
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      setServerError('Please correct the highlighted fields before sending your request.');
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const response = await bookingApi.create({
        workerId: worker.userId,
        serviceCategoryId: form.serviceCategoryId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        serviceDescription: form.serviceDescription.trim(),
        serviceAddress: form.serviceAddress.trim(),
        city: form.city.trim(),
        locality: form.locality.trim(),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        additionalNotes: form.additionalNotes.trim(),
      });
      setSuccess(response.data.booking);
      toast.success(response.message || 'Booking request sent.');
    } catch (error) {
      setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setServerError(getErrorMessage(error, 'Could not send your booking request'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader label="Preparing your booking request..." />;

  if (loadError || !worker) {
    return (
      <EmptyState
        icon={Wrench}
        title="Professional unavailable"
        description={loadError || 'This professional cannot be booked right now.'}
        action={<Link to="/services" className="btn-primary">Browse professionals</Link>}
      />
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-white px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-navy-900">Booking request sent</h1>
            <p className="mt-1.5 text-sm text-navy-500">
              {worker.name} will receive your request instantly and can accept or decline it.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-mono text-xs font-semibold text-navy-700 ring-1 ring-navy-200">
              <TicketIcon /> {success.bookingReference}
            </p>
          </div>
          <div className="space-y-3 px-6 py-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-navy-500">Service</span>
              <span className="font-semibold text-navy-900">{success.category?.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-navy-500">Appointment</span>
              <span className="font-semibold text-navy-900">
                {formatDate(success.appointmentDate)} at {formatTime(success.appointmentTime)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-navy-500">Status</span>
              <span className="badge-pending">Awaiting response</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-navy-100 px-6 py-4 sm:flex-row">
            <Button as={Link} to={`/app/bookings/${success.id}`} className="flex-1">
              View booking
            </Button>
            <Button as={Link} to="/app/bookings" variant="outline" className="flex-1">
              All bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/workers/${worker.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_0.7fr] lg:items-start">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">Request a booking</h1>
          <p className="mt-1 text-sm text-navy-500">
            Share the job details and choose a time that fits {worker.name}&apos;s availability. Nothing is charged online.
          </p>

          {availability.isAvailable === false && (
            <Alert variant="warning" className="mt-4" title="Not accepting new bookings">
              This professional has paused new requests. You can still browse other verified professionals.
            </Alert>
          )}

          {serverError && (
            <Alert variant="error" className="mt-4" onDismiss={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6" noValidate>
            <section className="card p-5">
              <h2 className="text-sm font-bold text-navy-900">1. Choose the service</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      form.serviceCategoryId === service.id
                        ? 'border-brand-400 bg-brand-50/60 ring-1 ring-brand-300'
                        : 'border-navy-100 hover:border-navy-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceCategoryId"
                      value={service.id}
                      checked={form.serviceCategoryId === service.id}
                      onChange={(event) => update('serviceCategoryId', event.target.value)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-navy-100">
                      <CategoryIcon name={service.icon || 'Wrench'} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-navy-900">{service.name}</span>
                      <span className="block text-[10px] text-navy-400">{service.primary ? 'Primary service' : 'Additional service'}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.serviceCategoryId && <p className="field-error">{errors.serviceCategoryId}</p>}

              <Textarea
                className="mt-4"
                label="Describe the work"
                required
                rows={4}
                value={form.serviceDescription}
                onChange={(event) => update('serviceDescription', event.target.value)}
                error={errors.serviceDescription}
                placeholder="What needs to be fixed, installed or cleaned? Include sizes, access details or anything the professional should know before arriving."
                hint={`${form.serviceDescription.length}/2000 characters`}
                maxLength={2000}
              />
            </section>

            <section className="card p-5">
              <h2 className="text-sm font-bold text-navy-900">2. Pick a date and time</h2>
              <p className="mt-1 text-xs text-navy-400">
                Working days: {availableDays.length ? availableDays.map((day) => dayLabels[day] || day).join(', ') : 'Contact the professional'}
                {availability.startTime && availability.endTime
                  ? ` · ${formatTime(availability.startTime)}–${formatTime(availability.endTime)}`
                  : ''}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Appointment date"
                  type="date"
                  required
                  min={todayInputValue()}
                  max={maxDateInputValue(90)}
                  value={form.appointmentDate}
                  onChange={(event) => update('appointmentDate', event.target.value)}
                  error={errors.appointmentDate}
                />
                <Input
                  label="Appointment time"
                  type="time"
                  required
                  min={availability.startTime || undefined}
                  max={availability.endTime || undefined}
                  value={form.appointmentTime}
                  onChange={(event) => update('appointmentTime', event.target.value)}
                  error={errors.appointmentTime}
                  hint={availability.startTime ? `Between ${formatTime(availability.startTime)} and ${formatTime(availability.endTime)}` : undefined}
                />
              </div>
              {dayBlocked && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {worker.name} does not work on {dayLabels[selectedDay] || selectedDay}. Choose another date or check the profile for working days.
                </p>
              )}
            </section>

            <section className="card p-5">
              <h2 className="text-sm font-bold text-navy-900">3. Service location & contact</h2>
              <div className="mt-3 space-y-4">
                <Input
                  label="Full service address"
                  required
                  value={form.serviceAddress}
                  onChange={(event) => update('serviceAddress', event.target.value)}
                  error={errors.serviceAddress}
                  placeholder="House / building, street, landmark"
                  maxLength={300}
                  icon={MapPin}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="City"
                    required
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                    error={errors.city}
                    maxLength={80}
                  />
                  <Input
                    label="Locality / area"
                    required
                    value={form.locality}
                    onChange={(event) => update('locality', event.target.value)}
                    error={errors.locality}
                    maxLength={120}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Contact name"
                    required
                    value={form.customerName}
                    onChange={(event) => update('customerName', event.target.value)}
                    error={errors.customerName}
                    maxLength={80}
                    icon={UserRound}
                  />
                  <Input
                    label="Contact phone"
                    type="tel"
                    required
                    value={form.customerPhone}
                    onChange={(event) => update('customerPhone', event.target.value)}
                    error={errors.customerPhone}
                    maxLength={25}
                    icon={Phone}
                  />
                </div>
                <Textarea
                  label="Additional notes (optional)"
                  rows={3}
                  value={form.additionalNotes}
                  onChange={(event) => update('additionalNotes', event.target.value)}
                  placeholder="Parking instructions, preferred arrival window, pets at home..."
                  maxLength={1000}
                  hint={`${form.additionalNotes.length}/1000 characters`}
                />
              </div>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button as={Link} to={`/workers/${worker.id}`} variant="outline">
                Cancel
              </Button>
              <Button type="submit" loading={submitting} disabled={availability.isAvailable === false} icon={MessageSquare}>
                Send booking request
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={worker.name} src={worker.profileImage} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{worker.name}</p>
                <p className="flex items-center gap-1 text-xs font-semibold text-brand-700">
                  <CategoryIcon name={worker.categoryIcon} className="h-3.5 w-3.5" /> {worker.profession}
                </p>
                <div className="mt-1">
                  <RatingStars rating={worker.averageRating} size="h-3 w-3" showValue={worker.totalReviews > 0} />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-navy-100 pt-3 text-xs">
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Starting charge</span>
                <span className="flex items-center gap-1 font-bold text-navy-900">
                  <CreditCard className="h-3.5 w-3.5 text-brand-600" /> {formatCurrency(worker.serviceCharge)}
                </span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Experience</span>
                <span className="font-semibold text-navy-800">{worker.experienceYears} years</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-navy-400">Completed jobs</span>
                <span className="font-semibold text-navy-800">{worker.completedJobs}</span>
              </p>
              <p className="flex items-start justify-between gap-2">
                <span className="text-navy-400">Location</span>
                <span className="text-right font-semibold text-navy-800">{worker.locality}, {worker.city}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-navy-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> What happens next?
            </p>
            <ol className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-navy-500">
              <li className="flex gap-2"><span className="font-bold text-brand-700">1.</span> Your request is sent instantly and stored with a unique reference.</li>
              <li className="flex gap-2"><span className="font-bold text-brand-700">2.</span> The professional accepts or declines. You receive a notification either way.</li>
              <li className="flex gap-2"><span className="font-bold text-brand-700">3.</span> Contact details are shared after acceptance so you can coordinate the visit.</li>
              <li className="flex gap-2"><span className="font-bold text-brand-700">4.</span> After completion, leave a review to help other customers.</li>
            </ol>
          </div>

          {(availability.startTime || availability.days?.length) && (
            <div className="card p-5 text-xs">
              <p className="flex items-center gap-2 font-bold text-navy-900"><Clock3 className="h-4 w-4 text-brand-600" /> Availability</p>
              <p className="mt-2 text-navy-500">{availableDays.map((day) => dayLabels[day] || day).join(', ') || 'On request'}</p>
              {availability.startTime && availability.endTime && (
                <p className="mt-1 font-semibold text-navy-800">{formatTime(availability.startTime)} – {formatTime(availability.endTime)}</p>
              )}
              <p className="mt-2 flex items-center gap-1 text-[10px] text-navy-400">
                <CalendarDays className="h-3 w-3" /> Requests can be made up to 90 days ahead.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function TicketIcon() {
  return <Star className="h-3.5 w-3.5" />;
}
