import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, UserPlus } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import PasswordInput from '../../components/ui/PasswordInput';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors, isValidEmail, isValidPhone, passwordProblem } from '../../utils/validation';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  locality: '',
  terms: false,
};

export default function RegisterPage() {
  const { user, registerCustomer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Create your account');

  if (user && !submitting) {
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/app'} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  function validate() {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';
    const problem = passwordProblem(form.password);
    if (problem) next.password = problem;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.locality.trim()) next.locality = 'Locality or area is required';
    if (!form.terms) next.terms = 'Please accept the terms to continue';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      const response = await registerCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        city: form.city.trim(),
        locality: form.locality.trim(),
      });
      toast.success(response.message || 'Your account is ready.');
      navigate('/app', { replace: true });
    } catch (error) {
      setErrors((current) => ({ ...current, ...getFieldErrors(error) }));
      setServerError(getErrorMessage(error, 'Could not create your account'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Join WorkConnect"
      headline="Book local experts with confidence, from day one."
      description="Create a customer account to discover verified professionals, request bookings and follow every job from acceptance to completion."
      bullets={[
        { icon: ShieldCheck, title: 'Vetted local professionals', text: 'Only admin-approved workers appear in search.' },
        { icon: Check, title: 'Clear booking records', text: 'Every request gets a reference and status history.' },
        { icon: UserPlus, title: 'Free customer account', text: 'Search, book and review without any platform fee.' },
      ]}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Customer registration</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-navy-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-navy-500">It takes less than a minute to get started.</p>
      </div>

      {serverError && (
        <Alert variant="error" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="e.g. Ayesha Khan"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          autoComplete="name"
          required
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Phone number"
          type="tel"
          placeholder="e.g. 0300 1234567"
          value={form.phone}
          onChange={(event) => update('phone', event.target.value)}
          error={errors.phone}
          autoComplete="tel"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            placeholder="e.g. Lahore"
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
            error={errors.city}
            required
          />
          <Input
            label="Locality / area"
            placeholder="e.g. Gulberg"
            value={form.locality}
            onChange={(event) => update('locality', event.target.value)}
            error={errors.locality}
            required
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-600">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(event) => update('terms', event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-semibold text-brand-700 hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="font-semibold text-brand-700 hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        {errors.terms && <p className="field-error -mt-2">{errors.terms}</p>}

        <Button type="submit" className="w-full" loading={submitting} iconRight={ArrowRight}>
          Create customer account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-navy-500">
        Offer local services?{' '}
        <Link to="/worker/register" className="font-semibold text-brand-700 hover:text-brand-800">Apply as a worker</Link>
      </p>
    </AuthShell>
  );
}
