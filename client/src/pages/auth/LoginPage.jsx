import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import PasswordInput from '../../components/ui/PasswordInput';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/validation';

const configs = {
  customer: {
    title: 'Welcome back',
    subtitle: 'Sign in to manage bookings and find trusted local professionals.',
    badge: 'Customer portal',
    endpoint: '/login',
    home: '/app',
    registerText: 'New to WorkConnect?',
    registerLink: '/register',
    registerLabel: 'Create a customer account',
    titleText: 'Customer login',
    headline: 'Your trusted local professionals, all in one place.',
    description: 'Sign in to search verified workers, track bookings and receive live status updates from your dashboard.',
    bullets: [
      { icon: ShieldCheck, title: 'Verified professionals only', text: 'Every worker is reviewed by our platform team.' },
    ],
  },
  worker: {
    title: 'Professional sign in',
    subtitle: 'Access booking requests, manage availability and grow your local business.',
    badge: 'Worker portal',
    endpoint: '/worker/login',
    home: '/worker',
    registerText: 'Want to join WorkConnect?',
    registerLink: '/worker/register',
    registerLabel: 'Apply as a professional',
    titleText: 'Worker login',
    headline: 'Run your local service business from one dashboard.',
    description: 'Receive booking requests, manage appointments and build a trusted reputation with real customer reviews.',
    bullets: [
      { icon: ShieldCheck, title: 'Admin-reviewed applications', text: 'Approved profiles appear in local search results.' },
    ],
  },
};

export default function LoginPage({ role = 'customer' }) {
  const config = configs[role] || configs.customer;
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle(config.titleText);

  useEffect(() => {
    if (user) {
      const target = user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/app';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  if (user && !submitting) {
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/app'} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email';
    if (!form.password) nextErrors.password = 'Password is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const data = await login(role, form);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      const from = location.state?.from;
      const defaultHome = data.user.role === 'admin' ? '/admin' : data.user.role === 'worker' ? '/worker' : '/app';
      const safeFrom =
        typeof from === 'string' &&
        from.startsWith(`${defaultHome}/`) &&
        !from.startsWith('//')
          ? from
          : null;
      navigate(safeFrom || defaultHome, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Unable to sign in'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="Welcome back" headline={config.headline} description={config.description} bullets={config.bullets}>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-navy-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy-600">
          {config.badge}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900">{config.title}</h1>
        <p className="mt-1.5 text-sm text-navy-500">{config.subtitle}</p>
      </div>

      {serverError && (
        <Alert variant="error" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          error={errors.password}
          required
        />
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={submitting} iconRight={ArrowRight}>
          Sign in
        </Button>
      </form>

      {role !== 'admin' && config.registerLink && (
        <p className="mt-6 text-center text-sm text-navy-500">
          {config.registerText}{' '}
          <Link to={config.registerLink} className="font-semibold text-brand-700 hover:text-brand-800">
            {config.registerLabel}
          </Link>
        </p>
      )}

      {role === 'worker' && (
        <p className="mt-2 text-center text-sm text-navy-500">
          Looking for a service?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Customer login</Link>
        </p>
      )}
      {role === 'customer' && (
        <p className="mt-2 text-center text-sm text-navy-500">
          Are you a professional?{' '}
          <Link to="/worker/login" className="font-semibold text-brand-700 hover:text-brand-800">Worker login</Link>
        </p>
      )}
    </AuthShell>
  );
}
