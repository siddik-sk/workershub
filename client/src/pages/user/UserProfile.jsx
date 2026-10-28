import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { authApi, userApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader, SectionTitle } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Fields';
import PasswordInput from '../../components/ui/PasswordInput';
import { formatDate } from '../../utils/format';
import { getErrorMessage, getFieldErrors, isValidPhone, passwordProblem } from '../../utils/validation';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    locality: user?.locality || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useDocumentTitle('My profile');

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  async function saveProfile(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.locality.trim()) next.locality = 'Locality or area is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError('');
    try {
      const response = await userApi.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        locality: form.locality.trim(),
      });
      updateUser(response.data.user);
      toast.success(response.message || 'Profile updated.');
    } catch (error) {
      setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setServerError(getErrorMessage(error, 'Could not update your profile'));
    } finally {
      setSaving(false);
    }
  }

  function updatePassword(field, value) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: '' }));
    setPasswordError('');
  }

  async function savePassword(event) {
    event.preventDefault();
    const next = {};
    if (!passwordForm.currentPassword) next.currentPassword = 'Enter your current password';
    const problem = passwordProblem(passwordForm.newPassword);
    if (problem) next.newPassword = problem;
    if (passwordForm.confirmPassword !== passwordForm.newPassword) next.confirmPassword = 'Passwords do not match';
    if (passwordForm.currentPassword && passwordForm.currentPassword === passwordForm.newPassword) {
      next.newPassword = 'Choose a password different from your current one';
    }
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setChangingPassword(true);
    setPasswordError('');
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(response.message || 'Password updated.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setPasswordError(getErrorMessage(error, 'Could not change your password'));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Account settings"
        title="My profile"
        description="Keep your contact details current so professionals can reach you about accepted bookings."
      />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-brand-600 to-navy-800" />
            <div className="-mt-8 px-5 pb-5">
              <Avatar name={user?.name} size="xl" ring />
              <h2 className="mt-3 truncate text-lg font-bold text-navy-900">{user?.name}</h2>
              <p className="truncate text-xs text-navy-500">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  <UserRound className="h-3 w-3" /> Customer
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <BadgeCheck className="h-3 w-3" /> Active
                </span>
              </div>
              <div className="mt-4 space-y-2 border-t border-navy-100 pt-3 text-xs text-navy-500">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-navy-400" /> {user?.email}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-navy-400" /> {user?.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-navy-400" /> {[user?.locality, user?.city].filter(Boolean).join(', ')}</p>
                <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-navy-400" /> Joined {formatDate(user?.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-navy-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Account security</p>
            <p className="mt-2 text-[11px] leading-relaxed text-navy-500">
              Your password is hashed with bcrypt and never stored in plain text. Sessions are protected by secure,
              HTTP-only cookies and are invalidated after a password change.
            </p>
            <Link to="/forgot-password" className="btn-ghost btn-sm mt-2 px-0">Forgot your password?</Link>
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <SectionTitle title="Contact details" description="Used for booking requests and service coordination." />
            {serverError && (
              <Alert variant="error" className="mb-4" onDismiss={() => setServerError('')}>
                {serverError}
              </Alert>
            )}
            <form onSubmit={saveProfile} className="space-y-4" noValidate>
              <Input
                label="Full name"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                error={errors.name}
                maxLength={80}
                required
                icon={UserRound}
              />
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <label className="label">Email address</label>
                  <div className="flex items-center gap-2 rounded-xl border border-navy-100 bg-navy-50 px-3.5 py-2.5 text-sm text-navy-400">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <p className="help-text">Email changes are not available in this local build.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex justify-end">
                <Button type="submit" loading={saving} icon={Save}>Save changes</Button>
              </div>
            </form>
          </section>

          <section className="card p-5 sm:p-6">
            <SectionTitle title="Change password" description="Use at least 8 characters with a letter and a number." />
            {passwordError && (
              <Alert variant="error" className="mb-4" onDismiss={() => setPasswordError('')}>
                {passwordError}
              </Alert>
            )}
            <form onSubmit={savePassword} className="space-y-4" noValidate>
              <PasswordInput
                label="Current password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePassword('currentPassword', event.target.value)}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordInput
                  label="New password"
                  value={passwordForm.newPassword}
                  onChange={(event) => updatePassword('newPassword', event.target.value)}
                  error={passwordErrors.newPassword}
                  autoComplete="new-password"
                  required
                />
                <PasswordInput
                  label="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => updatePassword('confirmPassword', event.target.value)}
                  error={passwordErrors.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] text-navy-400">
                  <KeyRound className="h-3.5 w-3.5" /> Other sessions stay signed in only if they were created after the change.
                </p>
                <Button type="submit" variant="outline" loading={changingPassword}>Update password</Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
