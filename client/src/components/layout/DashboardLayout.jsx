import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Shield,
  Star,
  Tags,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import Logo from './Logo';
import Avatar from '../ui/Avatar';
import NotificationBell from './NotificationBell';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';

const navigation = {
  customer: [
    { label: 'Dashboard', to: '/app', icon: LayoutDashboard, end: true },
    { label: 'Find professionals', to: '/services', icon: Search },
    { label: 'My bookings', to: '/app/bookings', icon: CalendarCheck },
    { label: 'Notifications', to: '/app/notifications', icon: Bell },
    { label: 'My profile', to: '/app/profile', icon: UserRound },
    { label: 'Help & support', to: '/app/support', icon: LifeBuoy },
  ],
  worker: [
    { label: 'Dashboard', to: '/worker', icon: LayoutDashboard, end: true },
    { label: 'Booking requests', to: '/worker/bookings', icon: ClipboardList },
    { label: 'My profile', to: '/worker/profile', icon: UserRound },
    { label: 'Availability', to: '/worker/availability', icon: Clock },
    { label: 'Notifications', to: '/worker/notifications', icon: Bell },
    { label: 'Help & support', to: '/worker/support', icon: LifeBuoy },
  ],
  admin: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Workers', to: '/admin/workers', icon: BadgeCheck },
    { label: 'Service categories', to: '/admin/categories', icon: Tags },
    { label: 'Bookings', to: '/admin/bookings', icon: CalendarDays },
    { label: 'Audit logs', to: '/admin/audit-logs', icon: ListChecks },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  ],
};

const roleLabel = { customer: 'Customer workspace', worker: 'Professional workspace', admin: 'Administration' };

const notificationPaths = {
  customer: '/app/notifications',
  worker: '/worker/notifications',
  admin: '/admin/notifications',
};

const profilePaths = {
  customer: '/app/profile',
  worker: '/worker/profile',
  admin: '/admin',
};

export default function DashboardLayout() {
  const { user, role, workerProfile, logout } = useAuth();
  const { unread } = useNotifications();
  const { connected } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const links = navigation[role] || [];

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    navigate(role === 'admin' ? '/admin/login' : role === 'worker' ? '/worker/login' : '/login');
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button type="button" className="icon-btn lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3">
        <div className="rounded-xl border border-navy-100 bg-navy-50/60 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400">{roleLabel[role]}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy-800">{user?.name}</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <link.icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{link.label}</span>
            {link.label === 'Notifications' && unread > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-100 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-navy-400">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-navy-300'}`} />
          {connected ? 'Real-time updates on' : 'Notifications stored securely'}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-50/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-navy-100 bg-white lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[17rem] max-w-[85vw] border-r border-navy-100 bg-white shadow-lift animate-fade-in">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-navy-400">WorkConnect</p>
              <p className="text-sm font-semibold text-navy-800">{roleLabel[role]}</p>
            </div>
            <div className="sm:hidden">
              <Logo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell viewAllPath={notificationPaths[role]} />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-navy-50"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
              >
                <Avatar name={user?.name} src={role === 'worker' ? workerProfile?.profileImage : ''} size="sm" />
                <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-navy-800 md:block">
                  {user?.name}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-navy-400 md:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white py-1.5 shadow-lift animate-fade-up">
                  <div className="border-b border-navy-50 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-navy-900">{user?.name}</p>
                    <p className="truncate text-xs text-navy-400">{user?.email}</p>
                  </div>
                  <Link
                    to={profilePaths[role]}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50"
                  >
                    <UserRound className="h-4 w-4" /> {role === 'admin' ? 'Admin overview' : 'My profile'}
                  </Link>
                  {role === 'customer' && (
                    <Link to="/app/bookings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50">
                      <CalendarCheck className="h-4 w-4" /> My bookings
                    </Link>
                  )}
                  {role === 'worker' && (
                    <Link to="/worker/bookings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50">
                      <ClipboardList className="h-4 w-4" /> Booking requests
                    </Link>
                  )}
                  {role === 'admin' && (
                    <Link to="/admin/audit-logs" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-navy-50">
                      <ListChecks className="h-4 w-4" /> Audit logs
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-navy-50 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
