import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';
import Alert from '../../components/ui/Alert';
import { authApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, passwordProblem } from '../../utils/validation';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Reset password');

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    const problem = passwordProblem(form.password);
    if (problem) next.password = problem;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      await authApi.resetPassword({ token, password: form.password });
      setSuccess(true);
    } catch (error) {
      setServerError(getErrorMessage(error, 'Could not reset your password'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Secure reset"
      headline="Choose a strong password and get back to work."
      description="Reset links expire after 30 minutes and can only be used once. Resetting your password signs out any previous sessions."
      bullets={[]}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Password reset</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-navy-900">
          {success ? 'Password updated' : 'Set a new password'}
        </h1>
        <p className="mt-1.5 text-sm text-navy-500">
          {success ? 'You can now sign in with your new password.' : 'Use at least 8 characters with a letter and a number.'}
        </p>
      </div>

      {!token ? (
        <div className="space-y-4">
          <Alert variant="error" title="Missing reset token">
            This page needs a valid reset link. Request a new link to continue.
          </Alert>
          <Link to="/forgot-password" className="btn-primary w-full">Request a new link</Link>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-emerald-900">Your password was reset successfully.</p>
            <p className="mt-1 text-xs text-emerald-700">All previous sessions have been signed out.</p>
          </div>
          <Link to="/login" className="btn-primary w-full">Continue to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && <Alert variant="error" onDismiss={() => setServerError('')}>{serverError}</Alert>}
          <PasswordInput
            label="New password"
            value={form.password}
            onChange={(event) => {
              setForm((current) => ({ ...current, password: event.target.value }));
              setErrors((current) => ({ ...current, password: '' }));
            }}
            error={errors.password}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <PasswordInput
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={(event) => {
              setForm((current) => ({ ...current, confirmPassword: event.target.value }));
              setErrors((current) => ({ ...current, confirmPassword: '' }));
            }}
            error={errors.confirmPassword}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            required
          />
          <Button type="submit" className="w-full" loading={submitting} icon={KeyRound}>
            Reset password
          </Button>
          <Link to="/login" className="btn-ghost w-full">Back to login</Link>
        </form>
      )}
    </AuthShell>
  );
}
