import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, LogIn, ShieldAlert } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Access denied');

  const home = user?.role === 'admin' ? '/admin' : user?.role === 'worker' ? '/worker' : '/app';
  const loginPath = user?.role === 'worker' ? '/worker/login' : '/login';

  return (
    <div className="grid min-h-screen place-items-center bg-navy-50/40 px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-8 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-navy-900">Access denied</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy-500">
            {user
              ? `Your ${user.role} account does not have permission to view this area. Access is enforced by the server, not just the interface.`
              : 'You need to sign in with the correct account type to view this area.'}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {user ? (
              <Button icon={LayoutDashboard} onClick={() => navigate(home)}>Go to my dashboard</Button>
            ) : (
              <Button icon={LogIn} onClick={() => navigate(loginPath)}>Sign in</Button>
            )}
            <Link to="/" className="btn-outline"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
          </div>
        </div>
        <p className="mt-5 text-xs text-navy-400">
          If you believe this is a mistake, contact platform support.
        </p>
      </div>
    </div>
  );
}
