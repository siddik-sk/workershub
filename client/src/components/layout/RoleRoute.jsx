import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Feedback';

const loginPaths = {
  customer: '/login',
  worker: '/worker/login',
  admin: '/admin/login',
};

export default function RoleRoute({ roles = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-navy-50/40">
        <PageLoader label="Checking your session..." />
      </div>
    );
  }

  if (!user) {
    const target = loginPaths[roles[0]] || '/login';
    return <Navigate to={target} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
