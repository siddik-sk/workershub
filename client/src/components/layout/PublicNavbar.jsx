import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from './Logo';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

const roleHome = { customer: '/app', worker: '/worker', admin: '/admin' };

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Become a Worker', to: '/worker/register' },
];

export default function PublicNavbar() {
  const { user, role, workerProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) =>
            link.to.startsWith('/#') ? (
              <a
                key={link.label}
                href={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition hover:bg-navy-50 hover:text-navy-900"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Button variant="outline" size="sm" icon={LayoutDashboard} onClick={() => navigate(roleHome[role] || '/')}>
                Dashboard
              </Button>
              <Link to={roleHome[role] || '/'} className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-navy-50">
                <Avatar
                  name={user.name}
                  src={role === 'worker' ? workerProfile?.profileImage : ''}
                  size="sm"
                />
                <span className="max-w-[9rem] truncate text-sm font-semibold text-navy-800">{user.name.split(' ')[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn-outline btn-sm">
                Register
              </Link>
              <Link to="/worker/register" className="btn-primary btn-sm">
                Join as a Worker
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="icon-btn lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) =>
              link.to.startsWith('/#') ? (
                <a
                  key={link.label}
                  href={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-navy-100 pt-4">
            {user ? (
              <Button
                icon={LayoutDashboard}
                onClick={() => {
                  setOpen(false);
                  navigate(roleHome[role] || '/');
                }}
              >
                Go to dashboard
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-outline">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-outline">
                    Register
                  </Link>
                </div>
                <Link to="/worker/register" onClick={() => setOpen(false)} className="btn-primary">
                  Join as a Worker
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
