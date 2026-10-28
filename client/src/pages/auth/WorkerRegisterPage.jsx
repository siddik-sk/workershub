import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import Logo from '../../components/layout/Logo';
import Button from '../../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Fields';
import PasswordInput from '../../components/ui/PasswordInput';
import Alert from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { WEEK_DAYS } from '../../utils/constants';
import { formatCurrency, initials } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { categoryApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors, isValidEmail, isValidPhone, passwordProblem } from '../../utils/validation';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  profession: '',
  additionalServices: [],
  experienceYears: '',
  city: '',
  locality: '',
  serviceAreas: '',
  description: '',
  serviceCharge: '',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  startTime: '09:00',
  endTime: '18:00',
  terms: false,
};

export default function WorkerRegisterPage() {
  const { user, registerWorker } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useDocumentTitle('Become a professional');

  useEffect(() => {
    categoryApi
      .list()
      .then((response) => setCategories(response.data.categories))
      .catch(() => setServerError('Could not load service categories. Please refresh the page.'))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  if (user && !submitting) {
    return <Navigate to={user.role === 'worker' ? '/worker' : user.role === 'admin' ? '/admin' : '/app'} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  function toggleAdditional(id) {
    setForm((current) => ({
      ...current,
      additionalServices: current.additionalServices.includes(id)
        ? current.additionalServices.filter((item) => item !== id)
        : [...current.additionalServices, id],
    }));
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
    setErrors((current) => ({ ...current, days: '' }));
  }

  function choosePhoto(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, photo: 'Use a JPG, PNG or WebP image' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({ ...current, photo: 'Photo must be smaller than 2 MB' }));
      return;
    }
    setErrors((current) => ({ ...current, photo: '' }));
    setPhoto(file);
  }

  function validate() {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';
    const problem = passwordProblem(form.password);
    if (problem) next.password = problem;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    if (!form.profession) next.profession = 'Choose your primary profession';
    if (form.experienceYears === '' || Number(form.experienceYears) < 0) next.experienceYears = 'Enter your years of experience';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.locality.trim()) next.locality = 'Locality or service area is required';
    if (form.description.trim().length < 20) next.description = 'Write at least 20 characters about your services';
    if (form.serviceCharge === '' || Number(form.serviceCharge) < 0) next.serviceCharge = 'Enter a valid starting charge';
    if (!form.days.length) next.days = 'Select at least one working day';
    if (form.startTime >= form.endTime) next.endTime = 'End time must be after start time';
    if (!form.terms) next.terms = 'Please confirm your details and accept the terms';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loadingCategories) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      const firstField = Object.keys(next)[0];
      const element = document.getElementById(`worker-${firstField}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('email', form.email.trim());
      data.append('phone', form.phone.trim());
      data.append('password', form.password);
      data.append('confirmPassword', form.confirmPassword);
      data.append('profession', form.profession);
      data.append('additionalServices', JSON.stringify(form.additionalServices));
      data.append('experienceYears', String(Number(form.experienceYears)));
      data.append('city', form.city.trim());
      data.append('locality', form.locality.trim());
      data.append(
        'serviceAreas',
        JSON.stringify(form.serviceAreas.split(',').map((area) => area.trim()).filter(Boolean))
      );
      data.append('description', form.description.trim());
      data.append('serviceCharge', String(Number(form.serviceCharge)));
      data.append('workingHoursStart', form.startTime);
      data.append('workingHoursEnd', form.endTime);
      data.append('availabilityDays', JSON.stringify(form.days));
      if (photo) data.append('profilePhoto', photo);

      const response = await registerWorker(data);
      toast.success(response.message || 'Application submitted.', { title: 'Application received', duration: 7000 });
      navigate('/worker', { replace: true });
    } catch (error) {
      setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setServerError(getErrorMessage(error, 'Could not submit your application'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  const primaryCategory = categories.find((category) => category.id === form.profession);

  return (
    <div className="min-h-screen bg-navy-50/40">
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur-xl">
        <div className="page-container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-sm font-medium text-navy-500 hover:text-navy-800 sm:inline">
              Back to home
            </Link>
            <Link to="/worker/login" className="btn-outline btn-sm">
              Worker login
            </Link>
          </div>
        </div>
      </header>

      <div className="page-container py-8 sm:py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
          <ArrowLeft className="h-4 w-4" /> Back to WorkConnect
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Join as a professional</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-navy-900 text-balance">
              Turn your trade into a trusted local business.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-navy-500">
              Join a marketplace built around verified professionals and genuine customer reviews. Set your own
              availability, receive real booking requests and manage every job from one dashboard.
            </p>

            <div className="mt-7 space-y-3">
              {[
                { icon: BadgeCheck, title: 'Admin-reviewed profile', text: 'Your application is checked before going live — trust matters.' },
                { icon: CalendarClock, title: 'Your availability, your terms', text: 'Control working days, hours and the services you offer.' },
                { icon: MapPin, title: 'Local customers', text: 'Appear in searches for your profession, city and service areas.' },
                { icon: ShieldCheck, title: 'Protected booking records', text: 'Only you and the customer can access your booking details.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-navy-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-navy-900 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">What happens next</p>
              <ol className="mt-3 space-y-2 text-xs text-navy-300">
                <li className="flex gap-2"><span className="font-bold text-white">1.</span> Submit your professional details.</li>
                <li className="flex gap-2"><span className="font-bold text-white">2.</span> An administrator reviews your application.</li>
                <li className="flex gap-2"><span className="font-bold text-white">3.</span> Once approved, your profile goes live in search.</li>
              </ol>
            </div>
          </aside>

          <div className="card overflow-hidden">
            <div className="border-b border-navy-100 bg-white px-5 py-5 sm:px-7">
              <h2 className="text-xl font-bold text-navy-900">Professional application</h2>
              <p className="mt-1 text-sm text-navy-500">
                Fields marked <span className="text-rose-500">*</span> are required. Your account stays pending until an
                administrator approves it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 p-5 sm:p-7" noValidate>
              {serverError && (
                <Alert variant="error" onDismiss={() => setServerError('')}>{serverError}</Alert>
              )}

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">Account details</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} placeholder="e.g. Imran Ali" autoComplete="name" required />
                  <Input label="Email address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} placeholder="you@example.com" autoComplete="email" required />
                  <Input label="Phone number" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} placeholder="e.g. 0300 1234567" autoComplete="tel" required />
                  <div className="hidden sm:block" />
                  <PasswordInput label="Password" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" required />
                  <PasswordInput label="Confirm password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} error={errors.confirmPassword} placeholder="Repeat your password" autoComplete="new-password" required />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">Professional details</h3>
                </div>

                <label className="label">Primary profession <span className="text-rose-500">*</span></label>
                {loadingCategories ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-navy-400"><Spinner /> Loading categories...</div>
                ) : categories.length === 0 ? (
                  <Alert variant="warning">No active service categories are configured yet. Please contact the platform administrator.</Alert>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          update('profession', category.id);
                          setForm((current) => ({
                            ...current,
                            profession: category.id,
                            additionalServices: current.additionalServices.filter((id) => id !== category.id),
                          }));
                        }}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${
                          form.profession === category.id
                            ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/15'
                            : 'border-navy-200 bg-white text-navy-600 hover:border-brand-200 hover:bg-navy-50'
                        }`}
                      >
                        <CategoryIcon name={category.icon} className="h-4 w-4 shrink-0" />
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {errors.profession && <p className="field-error">{errors.profession}</p>}

                {categories.length > 0 && (
                  <div className="mt-5">
                    <label className="label">Additional services offered <span className="font-normal text-navy-400">(optional)</span></label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categories
                        .filter((category) => category.id !== form.profession)
                        .map((category) => (
                          <Checkbox
                            key={category.id}
                            label={category.name}
                            checked={form.additionalServices.includes(category.id)}
                            onChange={() => toggleAdditional(category.id)}
                          />
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Years of experience"
                    type="number"
                    min="0"
                    max="60"
                    value={form.experienceYears}
                    onChange={(e) => update('experienceYears', e.target.value)}
                    error={errors.experienceYears}
                    placeholder="e.g. 5"
                    required
                  />
                  <Input
                    label="Starting service charge"
                    type="number"
                    min="0"
                    step="1"
                    value={form.serviceCharge}
                    onChange={(e) => update('serviceCharge', e.target.value)}
                    error={errors.serviceCharge}
                    hint={form.serviceCharge ? `Customers will see ${formatCurrency(form.serviceCharge)} as your starting charge.` : 'A clearly stated starting price helps customers choose.'}
                    placeholder="e.g. 2500"
                    required
                  />
                </div>

                <Textarea
                  className="mt-4"
                  label="Professional description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  error={errors.description}
                  placeholder="Describe your skills, the work you do and what customers can expect..."
                  maxLength={1200}
                  hint={`${form.description.trim().length}/1200 characters (minimum 20)`}
                  required
                />
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">Service area & availability</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} error={errors.city} placeholder="e.g. Lahore" required />
                  <Input label="Locality / base area" value={form.locality} onChange={(e) => update('locality', e.target.value)} error={errors.locality} placeholder="e.g. Gulberg" required />
                </div>
                <Input
                  className="mt-4"
                  label="Additional service areas"
                  value={form.serviceAreas}
                  onChange={(e) => update('serviceAreas', e.target.value)}
                  placeholder="Comma separated, e.g. Model Town, DHA, Johar Town"
                  hint="Up to 12 areas. Your base locality is always included."
                />

                <div className="mt-5">
                  <label className="label">Working days <span className="text-rose-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`inline-flex h-9 w-12 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                          form.days.includes(day.value)
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-navy-200 bg-white text-navy-500 hover:bg-navy-50'
                        }`}
                        aria-pressed={form.days.includes(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {errors.days && <p className="field-error">{errors.days}</p>}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="Working hours start" type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} required />
                  <Input label="Working hours end" type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} error={errors.endTime} required />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">Profile photo</h3>
                </div>
                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-navy-100">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-brand-700">{initials(form.name) || <ImagePlus className="h-6 w-6" />}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                        <ImagePlus className="h-3.5 w-3.5" /> Choose photo
                      </button>
                      {photo && (
                        <button type="button" className="btn-ghost btn-sm text-rose-600" onClick={() => setPhoto(null)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-navy-400">JPG, PNG or WebP, up to 2 MB. A clear professional photo builds customer trust.</p>
                    {errors.photo && <p className="field-error">{errors.photo}</p>}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => choosePhoto(e.target.files?.[0])}
                    />
                  </div>
                </div>
              </section>

              <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-4">
                <Checkbox
                  label="I confirm these details are accurate and accept the professional terms."
                  description="Pending applications are not shown in public search results and cannot receive bookings."
                  checked={form.terms}
                  onChange={(e) => update('terms', e.target.checked)}
                  error={errors.terms}
                />
              </div>

              {primaryCategory && (
                <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100">
                  You are applying as a <strong>{primaryCategory.name}</strong> in <strong>{form.city || 'your city'}</strong>.
                  Your starting charge will be <strong>{form.serviceCharge ? formatCurrency(form.serviceCharge) : 'not set'}</strong>.
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-navy-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/worker/login" className="text-sm text-navy-500 hover:text-navy-800">
                  Already registered? <span className="font-semibold text-brand-700">Worker login</span>
                </Link>
                <Button type="submit" loading={submitting} iconRight={ArrowRight} disabled={loadingCategories || !categories.length}>
                  Submit application
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
