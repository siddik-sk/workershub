import { Link } from 'react-router-dom';
import { CalendarDays, Mail, MessageCircle, ShieldCheck, Wrench } from 'lucide-react';

const faqs = [
  {
    question: 'How do I know a worker is verified?',
    answer:
      'Worker applications are reviewed by a platform administrator before the profile can appear in search results. Pending, rejected and suspended workers cannot receive new bookings. You can see ratings and reviews from completed jobs on worker profiles.',
  },
  {
    question: 'How does booking work?',
    answer:
      'Choose a professional, select the service and appointment time, and submit your request. The worker receives a real-time notification and can accept or reject it. You will see every status change in My Bookings, including your unique booking reference.',
  },
  {
    question: 'Can I cancel a booking?',
    answer:
      'Pending requests can be cancelled at any time. Accepted bookings can be cancelled at least 12 hours before the appointment. Once a job is in progress, contact support so we can help resolve the situation.',
  },
  {
    question: 'What should I do if a worker does not arrive?',
    answer:
      'Contact the worker using the phone number shown on the accepted booking. If you still need help, email support with your booking reference and we will review the record.',
  },
  {
    question: 'How do I become a worker?',
    answer:
      'Apply through the worker registration page, choose your profession and service area, and submit your professional details. An administrator reviews the application and you receive a notification when a decision is made.',
  },
  {
    question: 'Is my personal information private?',
    answer:
      'Booking records are only available to the customer, the assigned worker and authorised administrators. We never expose passwords, session tokens or another customer’s bookings. Notifications are delivered only to the authenticated recipient.',
  },
];

export default function SupportContent({ compact = false }) {
  return (
    <div className={compact ? '' : 'page-container py-14 sm:py-20'}>
      {!compact && (
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow"><MessageCircle className="h-3.5 w-3.5" /> Help & support</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-navy-900 text-balance">How can we help?</h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-500">
            Find answers about bookings, worker verification and account security. If you need a person, our support
            team is one email away.
          </p>
        </div>
      )}

      <div className={`grid gap-6 ${compact ? '' : 'mt-12 lg:grid-cols-[1.2fr_0.8fr]'}`}>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="card group p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-navy-900">
                {faq.question}
                <span className="text-lg font-normal text-navy-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-navy-100 px-5 py-4 text-sm leading-relaxed text-navy-500">{faq.answer}</div>
            </details>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold text-navy-900">Email support</h2>
            <p className="mt-1 text-sm text-navy-500">
              Include your booking reference so we can locate the record quickly.
            </p>
            <a href="mailto:support@workconnect.local" className="btn-outline btn-sm mt-4">
              support@workconnect.local
            </a>
          </div>
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold text-navy-900">Booking issues</h2>
            <p className="mt-1 text-sm text-navy-500">
              View the booking timeline first — it shows who changed the status and when.
            </p>
            <Link to="/services" className="btn-ghost btn-sm mt-3 px-0">Browse professionals</Link>
          </div>
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold text-navy-900">Account safety</h2>
            <p className="mt-1 text-sm text-navy-500">
              We will never ask for your password or session token by email. Change your password from your profile settings.
            </p>
          </div>
          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <Wrench className="h-5 w-5 text-brand-300" />
            <h2 className="mt-3 text-base font-bold">Worker applications</h2>
            <p className="mt-1 text-xs leading-relaxed text-navy-300">
              Applications are usually reviewed within two business days. You can track your approval status from your
              worker dashboard.
            </p>
            <Link to="/worker/register" className="btn-primary btn-sm mt-4">Apply now</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
