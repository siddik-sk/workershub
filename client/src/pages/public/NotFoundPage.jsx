import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, LayoutDashboard, SearchX } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Page not found');
  const home = user?.role === 'admin' ? '/admin' : user?.role === 'worker' ? '/worker' : '/app';

  return (
    <div className="grid min-h-screen place-items-center bg-navy-50/40 px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-8 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <SearchX className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-brand-700">Error 404</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">This page has moved on</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
            The page you are looking for does not exist, or the link is no longer valid.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {user ? (
              <Button icon={LayoutDashboard} onClick={() => navigate(home)}>Go to dashboard</Button>
            ) : (
              <Button icon={Compass} onClick={() => navigate('/services')}>Browse professionals</Button>
            )}
            <Link to="/" className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
