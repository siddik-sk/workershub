import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Camera,
  Eye,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react';
import { categoryApi, workerApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { Input, Textarea } from '../../components/ui/Fields';
import { PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage, getFieldErrors, isValidPhone } from '../../utils/validation';

export default function WorkerProfilePage() {
  const { user, workerProfile, updateUser, setWorkerProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    locality: user?.locality || '',
    profession: '',
    additionalServices: [],
    experienceYears: 0,
    serviceCharge: 0,
    description: '',
    serviceAreas: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useDocumentTitle('My professional profile');

  useEffect(() => {
    let mounted = true;
    Promise.all([categoryApi.list(), workerApi.profile()])
      .then(([categoryResponse, profileResponse]) => {
        if (!mounted) return;
        const list = categoryResponse.data.categories;
        setCategories(list);
        const profile = profileResponse.data.workerProfile;
        const account = profileResponse.data.user;
        if (profile) {
          setForm({
            name: account.name || '',
            phone: account.phone || '',
            city: profile.city || account.city || '',
            locality: profile.locality || account.locality || '',
            profession: profile.serviceCategoryId || '',
            additionalServices: (profile.additionalServices || [])
              .map((service) => (typeof service === 'string' ? service : service.id))
              .filter(Boolean),
            experienceYears: profile.experienceYears || 0,
            serviceCharge: profile.serviceCharge || 0,
            description: profile.description || '',
            serviceAreas: (profile.serviceAreas || []).join(', '),
          });
          setPhotoPreview(profile.profileImage || '');
        }
      })
      .catch((err) => {
        if (mounted) setServerError(getErrorMessage(err, 'Could not load your profile'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const additionalOptions = useMemo(
    () => categories.filter((category) => category.id !== form.profession),
    [categories, form.profession]
  );

  const currentProfile = workerProfile;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
    if (field === 'profession') {
      setForm((current) => ({
        ...current,
        profession: value,
        additionalServices: current.additionalServices.filter((id) => id !== value),
      }));
    }
  }

  function toggleAdditional(id) {
    setForm((current) => ({
      ...current,
      additionalServices: current.additionalServices.includes(id)
        ? current.additionalServices.filter((item) => item !== id)
        : [...current.additionalServices, id],
    }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, photo: 'Choose a JPG, PNG or WebP image' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, photo: 'Image must be smaller than 5 MB' }));
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, photo: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.locality.trim()) next.locality = 'Locality is required';
    if (!form.profession) next.profession = 'Choose your primary profession';
    if (Number(form.experienceYears) < 0 || Number(form.experienceYears) > 60) {
      next.experienceYears = 'Experience must be between 0 and 60 years';
    }
    if (Number(form.serviceCharge) < 0) next.serviceCharge = 'Service charge cannot be negative';
    if (form.description.trim() && form.description.trim().length < 20) {
      next.description = 'Write at least 20 characters so customers can understand your work';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      setServerError('Please correct the highlighted fields.');
      return;
    }

    setSaving(true);
    setServerError('');
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('phone', form.phone.trim());
      data.append('city', form.city.trim());
      data.append('locality', form.locality.trim());
      data.append('profession', form.profession);
      data.append('additionalServices', JSON.stringify(form.additionalServices));
      data.append('experienceYears', String(Number(form.experienceYears)));
      data.append('serviceCharge', String(Number(form.serviceCharge)));
      data.append('description', form.description.trim());
      data.append(
        'serviceAreas',
        JSON.stringify(
          form.serviceAreas
            .split(',')
            .map((area) => area.trim())
            .filter(Boolean)
        )
      );
      if (photo) data.append('profilePhoto', photo);

      const response = await workerApi.updateProfile(data);
      updateUser(response.data.user);
      setWorkerProfile(response.data.workerProfile);
      setPhoto(null);
      toast.success(response.message || 'Profile updated.');
    } catch (error) {
      setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setServerError(getErrorMessage(error, 'Could not update your profile'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader label="Loading your professional profile..." />;

  const approvalStatus = currentProfile?.approvalStatus;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Public profile"
        title="My professional profile"
        description="This information appears on your public profile and helps customers decide whether to book you."
        actions={
          currentProfile?.id && approvalStatus === 'approved' ? (
            <Button as={Link} to={`/workers/${currentProfile.id}`} variant="outline" icon={Eye}>
              View public profile
            </Button>
          ) : null
        }
      />

      {approvalStatus === 'pending' && (
        <Alert variant="warning" title="Application under review" className="mb-5">
          Your profile is not visible to customers yet. You can still complete your details and availability while an
          administrator reviews your application.
        </Alert>
      )}
      {approvalStatus === 'rejected' && (
        <Alert variant="error" title="Application not approved" className="mb-5">
          <p>Your profile is not visible to customers. Update your details and contact support to request a re-review.</p>
          {currentProfile?.rejectionReason && (
            <p className="mt-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs font-medium">Reason: {currentProfile.rejectionReason}</p>
          )}
        </Alert>
      )}

      {serverError && (
        <Alert variant="error" className="mb-5" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-brand-600 to-navy-800" />
            <div className="-mt-9 px-5 pb-5 text-center">
              <div className="relative mx-auto w-fit">
                <Avatar name={form.name || user?.name} src={photoPreview} size="xl" ring />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-white shadow-md transition hover:bg-navy-800"
                  aria-label="Change profile photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={choosePhoto}
                  className="hidden"
                />
              </div>
              {errors.photo && <p className="mt-2 text-xs text-rose-600">{errors.photo}</p>}
              <h2 className="mt-3 text-lg font-bold text-navy-900">{form.name || 'Your name'}</h2>
              <p className="text-xs text-navy-500">{form.city ? `${form.locality}, ${form.city}` : 'Add your service area'}</p>
              <div className="mt-2 flex justify-center gap-1.5">
                <StatusBadge status={approvalStatus || 'pending'} />
                {currentProfile?.accountStatus === 'suspended' && <StatusBadge status="suspended" />}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 border-t border-navy-100 pt-3 text-xs text-navy-500">
                <span className="text-center">
                  <span className="block text-base font-extrabold text-navy-900">{currentProfile?.completedJobs || 0}</span>
                  Jobs done
                </span>
                <span className="h-8 w-px bg-navy-100" />
                <span className="text-center">
                  <span className="block flex items-center justify-center gap-0.5 text-base font-extrabold text-navy-900">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {currentProfile?.totalReviews ? Number(currentProfile.averageRating).toFixed(1) : '—'}
                  </span>
                  {currentProfile?.totalReviews || 0} reviews
                </span>
              </div>
              <p className="mt-3 text-[10px] text-navy-400">Member since {formatDate(currentProfile?.createdAt || user?.createdAt)}</p>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-xs font-bold text-navy-900">Account & verification</p>
            <div className="mt-3 space-y-2 text-xs">
              <p className="flex items-center gap-2 text-navy-500"><Mail className="h-3.5 w-3.5 text-navy-400" /> {user?.email}</p>
              <p className="flex items-center gap-2 text-navy-500"><Phone className="h-3.5 w-3.5 text-navy-400" /> {form.phone}</p>
              <p className="flex items-center gap-2 text-navy-500"><MapPin className="h-3.5 w-3.5 text-navy-400" /> {[form.locality, form.city].filter(Boolean).join(', ')}</p>
            </div>
            <div className="mt-4 rounded-xl bg-navy-50/70 p-3 text-[11px] leading-relaxed text-navy-500">
              {approvalStatus === 'approved' ? (
                <p className="flex gap-2 text-emerald-800">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Your profile is verified and visible in search results.
                </p>
              ) : (
                <p className="flex gap-2 text-amber-800">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Only admin-approved professionals appear in search results and can accept new bookings.
                </p>
              )}
            </div>
          </div>

          <div className="card p-5 text-[11px] leading-relaxed text-navy-500">
            <p className="flex items-center gap-1.5 font-bold text-navy-900"><Wrench className="h-4 w-4 text-brand-600" /> Profile tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Use a clear, friendly profile photo.</li>
              <li>Describe the jobs you handle and the areas you cover.</li>
              <li>Keep your starting charge and availability accurate.</li>
              <li>Respond to requests quickly to build trust.</li>
            </ul>
          </div>
        </aside>

        <section className="card p-5 sm:p-6">
          <SectionTitle title="Profile details" description="All fields below are visible to customers on your public profile." />
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-navy-400">Personal details</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  error={errors.name}
                  maxLength={80}
                  required
                  icon={UserRound}
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  error={errors.phone}
                  maxLength={25}
                  required
                  icon={Phone}
                />
                <Input
                  label="City"
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                  error={errors.city}
                  maxLength={80}
                  required
                />
                <Input
                  label="Locality / area"
                  value={form.locality}
                  onChange={(event) => update('locality', event.target.value)}
                  error={errors.locality}
                  maxLength={120}
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-navy-400">Professional details</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profession" className="label">Primary profession <span className="text-rose-500">*</span></label>
                  <select
                    id="profession"
                    className="select"
                    value={form.profession}
                    onChange={(event) => update('profession', event.target.value)}
                  >
                    <option value="">Choose a profession</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {errors.profession && <p className="field-error">{errors.profession}</p>}
                </div>
                <Input
                  label="Years of experience"
                  type="number"
                  min="0"
                  max="60"
                  value={form.experienceYears}
                  onChange={(event) => update('experienceYears', event.target.value)}
                  error={errors.experienceYears}
                  required
                />
                <Input
                  label={`Starting service charge (${import.meta.env.VITE_CURRENCY || '$'})`}
                  type="number"
                  min="0"
                  step="1"
                  value={form.serviceCharge}
                  onChange={(event) => update('serviceCharge', event.target.value)}
                  error={errors.serviceCharge}
                  hint="Customers see this as the starting price. Final cost is agreed directly."
                  required
                />
                <Input
                  label="Service areas"
                  value={form.serviceAreas}
                  onChange={(event) => update('serviceAreas', event.target.value)}
                  placeholder="e.g. Gulberg, Model Town, DHA"
                  hint="Separate areas with commas (up to 12)."
                />
              </div>

              <Textarea
                className="mt-4"
                label="Professional bio"
                rows={5}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                error={errors.description}
                maxLength={1200}
                placeholder="Describe your experience, specialties, tools, guarantees and how you work with customers."
                hint={`${form.description.length}/1200 characters`}
              />

              <div className="mt-4">
                <p className="label">Additional services</p>
                <p className="-mt-1 mb-2 text-xs text-navy-400">Select other services you can provide. Customers can choose these when booking.</p>
                <div className="flex flex-wrap gap-2">
                  {additionalOptions.map((category) => {
                    const selected = form.additionalServices.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleAdditional(category.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? 'border-brand-300 bg-brand-50 text-brand-800'
                            : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                        }`}
                      >
                        <CategoryIcon name={category.icon} className="h-3.5 w-3.5" />
                        {category.name}
                      </button>
                    );
                  })}
                  {additionalOptions.length === 0 && <p className="text-xs text-navy-400">No other categories available.</p>}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-navy-50/50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-navy-800">
                  <Camera className="h-4 w-4 text-brand-600" /> Profile photo
                </p>
                <p className="mt-1 text-[11px] text-navy-400">JPG, PNG or WebP, up to 5 MB. A clear photo builds customer trust.</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
                  Choose photo
                </Button>
                {photo && <span className="ml-2 text-[11px] text-emerald-700">Selected: {photo.name}</span>}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 pt-4">
              {currentProfile?.id && approvalStatus === 'approved' && (
                <Button as={Link} to={`/workers/${currentProfile.id}`} variant="ghost" icon={Eye}>
                  Preview
                </Button>
              )}
              <Button type="submit" loading={saving} icon={Save}>Save profile</Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
