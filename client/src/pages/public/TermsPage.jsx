import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const sections = [
  {
    title: 'Using WorkConnect',
    body: 'You must provide accurate account information and keep your login credentials private. You are responsible for activity performed through your account. Accounts may be suspended for misuse, fraudulent bookings, abusive behaviour or attempts to bypass platform controls.',
  },
  {
    title: 'Customer responsibilities',
    body: 'Provide a safe and accurate service location, describe the work clearly, and ensure someone aged 18 or over can provide access at the agreed appointment time. Do not ask professionals to perform work outside the scope or laws applicable in your area.',
  },
  {
    title: 'Professional responsibilities',
    body: 'Workers must hold the skills, qualifications and insurance required for the services they offer, keep availability accurate, communicate promptly, and treat customers and their property with respect. Worker profiles remain pending until reviewed and approved by an administrator.',
  },
  {
    title: 'Bookings and cancellations',
    body: 'Submitting a booking creates a request, not a guaranteed engagement until the professional accepts it. Pending bookings may be cancelled at any time. Accepted bookings may be cancelled at least 12 hours before the appointment. Cancellation of in-progress work must be handled through support.',
  },
  {
    title: 'Reviews',
    body: 'Only customers with a completed booking may submit a review. Reviews must reflect genuine experiences. WorkConnect may remove content that is abusive, misleading or unrelated to the service provided.',
  },
  {
    title: 'Platform role',
    body: 'WorkConnect provides a marketplace and booking management platform. The professional is responsible for the service delivered. WorkConnect verifies applications and maintains records but does not itself perform the services listed.',
  },
  {
    title: 'Prohibited conduct',
    body: 'Do not attempt to access another account, private booking or administrative area; submit false information; send spam; interfere with the platform; or use automated tools to bypass rate limits or security controls.',
  },
  {
    title: 'Changes and contact',
    body: 'We may update these terms as the platform evolves. Continued use after an update constitutes acceptance. Questions can be sent to support@workconnect.local.',
  },
];

export default function TermsPage() {
  useDocumentTitle('Terms of service');
  return (
    <div className="page-container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Legal</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy-900">Terms of service</h1>
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
              Read our <Link to="/privacy" className="font-semibold text-brand-700 hover:underline">Privacy Policy</Link> or
              email <a href="mailto:support@workconnect.local" className="font-semibold text-brand-700 hover:underline">support@workconnect.local</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
