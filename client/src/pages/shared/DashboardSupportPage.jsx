import SupportContent from '../public/SupportContent';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';

export default function DashboardSupportPage() {
  useDocumentTitle('Help & support');
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Help centre"
        title="Help & support"
        description="Answers to common questions about bookings, verification and account security. Include your booking reference when contacting support."
      />
      <SupportContent compact />
    </div>
  );
}
