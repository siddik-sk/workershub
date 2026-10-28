import SupportContent from './SupportContent';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function SupportPage() {
  useDocumentTitle('Help & support');
  return <SupportContent />;
}
