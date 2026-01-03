import { useState, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer, Panel } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const Icon = {
  Dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M4 4h7v9H4V4Zm9 0h7v5h-7V4ZM4 15h7v5H4v-5Zm9-4h7v9h-7v-9Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M7 3v3M17 3v3M4 9h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Entries: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M7 7h10M7 12h10M7 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  FAQ: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M9.6 9.2A2.6 2.6 0 1 1 13 12c-.9.5-1 .9-1 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Money: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M3 7h18v10H3V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 7c0 2-2 2-2 2v6s2 0 2 2M17 7c0 2 2 2 2 2v6s-2 0-2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Target: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  ),
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems: NavItem[] = useMemo(
    () => [
      { to: '/admin/dashboard', label: t('admin.dashboard'), icon: Icon.Dashboard },
      { to: '/admin/appointment', label: t('admin.appointments'), icon: Icon.Calendar },
      { to: '/admin/entries', label: t('admin.entries'), icon: Icon.Entries },
      { to: '/admin/faqs', label: t('admin.faqs'), icon: Icon.FAQ },
      { to: '/admin/employees', label: t('admin.employees'), icon: Icon.Users },
      { to: '/admin/users', label: t('admin.users', 'Users'), icon: Icon.Users },
      { to: '/admin/bonuses', label: t('admin.bonuses'), icon: Icon.Money },
      { to: '/admin/targets', label: 'الأهداف الشهرية', icon: Icon.Target },
      { to: '/admin/daily-work', label: 'الشغل اليومي للموظفين', icon: Icon.Calendar },
    ],
    [t]
  );

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const NavLinks = () => (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-3">عام</div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  'group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition',
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex items-center justify-center',
                    active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700',
                  ].join(' ')}
                >
                  {item.icon}
                </span>

                <span className="font-semibold">{item.label}</span>

                {/* مؤشر صغير يمين */}
                <span
                  className={[
                    'mr-auto h-2 w-2 rounded-full transition',
                    active ? 'bg-white' : 'bg-transparent group-hover:bg-gray-300',
                  ].join(' ')}
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-200" />

      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm text-gray-600 mb-2">مرحباً 👋</div>
        <div className="font-extrabold text-gray-800 leading-tight">
          {user?.fullName || 'Admin'}
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-4 w-full bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl"
        >
          {t('common.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <ScreenContainer className="bg-background-light font-majalla">
      <div className="min-h-screen flex flex-col">
        {/* ===== Header ===== */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-border-light px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              aria-label="Open menu"
            >
              ☰
            </button>

            <Link
              to="/home"
              className="text-xl sm:text-2xl font-extrabold text-primary hover:text-orange-500 cursor-pointer"
            >
              BatTechno Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-gray-text text-sm">{user?.fullName}</span>
            <Button variant="ghost" onClick={handleLogout}>
              {t('common.logout')}
            </Button>
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="flex flex-1 overflow-hidden">
          {/* ===== Sidebar Desktop ===== */}
          <aside className="hidden md:flex w-72 flex-col border-r border-gray-border-light bg-white">
            <div className="p-5">
              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500">لوحة التحكم</div>
                    <div className="text-lg font-extrabold text-gray-800">Admin Panel</div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                    BT
                  </div>
                </div>

                <NavLinks />
              </div>
            </div>
          </aside>

          {/* ===== Main ===== */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <Panel className="px-4 sm:px-6 py-6">
              <Outlet />
            </Panel>
          </main>
        </div>

        {/* ===== Mobile Sidebar ===== */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
              />

              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed top-0 right-0 z-50 h-full w-[88%] max-w-sm bg-white shadow-2xl px-5 py-5 md:hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-gray-500">لوحة التحكم</div>
                    <div className="text-lg font-extrabold text-gray-800">Admin Panel</div>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-10 w-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center text-2xl"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-4">
                  <NavLinks />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenContainer>
  );
}
