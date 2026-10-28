import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const sections = [
  {
    title: 'Information we collect',
    body: 'We collect the account details you provide (name, email address, phone number, city and locality), the professional details workers submit for review, booking information, and notification activity. Passwords are stored only as one-way bcrypt hashes.',
  },
  {
    title: 'How we use your information',
    body: 'Your information is used to operate your account, match customers with professionals, manage bookings, send booking and account notifications, prevent misuse, and provide support. We do not sell personal information.',
  },
  {
    title: 'Who can see your information',
    body: 'Booking records are limited to the customer, the assigned professional and authorised platform administrators. Public worker profiles show professional details and ratings. Private contact details are only revealed where needed to fulfil a booking.',
  },
  {
    title: 'Cookies and sessions',
    body: 'Authentication uses a secure, HTTP-only cookie that cannot be read by frontend JavaScript. The cookie is used to keep you signed in and to authenticate real-time notification connections. Logging out clears the cookie.',
  },
  {
    title: 'Data retention',
    body: 'Booking and audit records are retained to support service history, safety investigations and legal obligations. Password reset tokens expire automatically and used tokens cannot be reused.',
  },
  {
    title: 'Your choices',
    body: 'You can update your profile information, change your password, and manage notification reading state from your dashboard. To request account assistance, contact support.',
  },
  {
    title: 'Security',
    body: 'We apply role-based authorization on the server, validate inputs, rate limit authentication endpoints, secure cookies, and audit administrative actions. No system is completely risk-free; report suspected issues to support immediately.',
  },
];

export default function PrivacyPage() {
  useDocumentTitle('Privacy policy');
  return (
    <div className="page-container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Legal</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy-900">Privacy policy</h1>
        <p className="mt-3 text-sm text-navy-500">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-navy-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{section.body}</p>
            </section>
          ))}
          <section>
            <h2 className="text-lg font-bold text-navy-900">Contact</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Questions about this policy can be sent to{' '}
              <a href="mailto:support@workconnect.local" className="font-semibold text-brand-700 hover:underline">
                support@workconnect.local
              </a>. See also our <Link to="/terms" className="font-semibold text-brand-700 hover:underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
