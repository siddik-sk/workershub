import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Fields';
import Alert from '../../components/ui/Alert';
import { authApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, isValidEmail } from '../../utils/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Forgot password');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setServerError('');
    setSubmitting(true);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setResult(response);
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not process your request'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      headline="Get back to your bookings without the hassle."
      description="We use time-limited reset links. For your security, we never reveal whether an email address is registered."
      bullets={[]}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Password recovery</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-navy-900">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-navy-500">
          Enter the email linked to your account and we will create a secure reset link.
        </p>
      </div>

      {result ? (
        <div className="space-y-5">
          <Alert variant="success" title="Request received">
            {result.message}
          </Alert>
          {result.data?.devResetUrl && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Development mode</p>
              <p className="mt-1 text-xs leading-relaxed">
                Email delivery is not configured in this local environment. Use the generated link below to complete the
                reset. In production, this link would be sent by email and never returned to the browser.
              </p>
              <a href={result.data.devResetUrl} className="btn-outline btn-sm mt-3 bg-white">
                Open reset link
              </a>
            </div>
          )}
          <div className="rounded-xl border border-navy-100 p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 text-brand-600" />
              <p className="text-sm text-navy-600">
                If your account exists, the reset link is valid for 30 minutes and can only be used once.
              </p>
            </div>
          </div>
          <Link to="/login" className="btn-outline w-full">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && <Alert variant="error" onDismiss={() => setServerError('')}>{serverError}</Alert>}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            error={error}
            required
          />
          <Button type="submit" className="w-full" loading={submitting} icon={Send}>
            Send reset link
          </Button>
          <Link to="/login" className="btn-ghost w-full">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
