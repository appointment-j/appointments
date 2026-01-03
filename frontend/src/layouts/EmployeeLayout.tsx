import { useMemo, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer, Panel } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { NotificationBell } from '../components/NotificationBell';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

function getInitials(name?: string) {
  if (!name) return 'E';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'E';
}

function navItemClass(isActive: boolean) {
  return `
    group relative flex items-center gap-3
    px-4 py-3 rounded-2xl
    transition-all duration-200
    ${isActive
      ? 'bg-orange-50 text-orange-600 shadow-sm'
      : 'text-gray-700 hover:bg-gray-100'}
  `;
}

function activeIndicatorClass(isActive: boolean) {
  return `
    absolute right-2 top-1/2 -translate-y-1/2
    w-1.5 h-7 rounded-full
    transition-all duration-200
    ${isActive ? 'bg-orange-500' : 'bg-transparent group-hover:bg-gray-300'}
  `;
}

function Icon({ name }: { name: 'dashboard' | 'bonuses' | 'targets' }) {
  const common = 'w-5 h-5 opacity-90';
  switch (name) {
    case 'dashboard':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 13h8V4H4v9Zm0 7h8v-5H4v5Zm10 0h6V11h-6v9Zm0-18v6h6V2h-6Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'bonuses':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.8 6.4 19.5 8.5 12.8 3 8.8h6.8L12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case 'targets':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M12 21a9 9 0 1 1 9-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 17a5 5 0 1 1 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 13a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z" fill="currentColor" />
          <path d="M21 3l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = useMemo(() => getInitials(user?.fullName), [user?.fullName]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="space-y-2 text-sm">
      <NavLink
        to="/employee/dashboard"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="dashboard" />
        <span className="font-semibold">{t('employee.dashboard')}</span>
      </NavLink>

      <NavLink
        to="/employee/bonuses"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="bonuses" />
        <span className="font-semibold">{t('employee.bonuses')}</span>
      </NavLink>

      <NavLink
        to="/employee/targets"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="targets" />
        <span className="font-semibold">أهدافي الشهرية</span>
      </NavLink>

      <NavLink
        to="/employee/daily-work"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="dashboard" />
        <span className="font-semibold">الشغل اليومي</span>
      </NavLink>
    </nav>
  );

  return (
    <ScreenContainer className="bg-background-light font-majalla">
      <div className="min-h-screen flex flex-col">
        {/* ===== Header ===== */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-border-light px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition"
              aria-label="Open menu"
            >
              ☰
            </button>

            <Link to="/home" className="text-xl sm:text-2xl font-extrabold text-primary hover:text-orange-500 transition">
              BatTechno Employee
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden sm:block text-gray-text text-sm">{user?.fullName}</span>
            <Button variant="ghost" onClick={handleLogout}>
              {t('common.logout')}
            </Button>
          </div>
        </header>

        {/* ===== Body ===== */}
        <div className="flex flex-1 overflow-hidden">
          {/* ===== Sidebar Desktop ===== */}
          <aside className="hidden md:flex w-72 flex-col border-r border-gray-border-light bg-white px-4 py-6">
            {/* User Card */}
            <div className="mb-6 p-4 rounded-3xl border border-gray-200 bg-gradient-to-b from-orange-50/70 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-gray-900 truncate">{user?.fullName || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            <NavLinks />

            <div className="mt-auto pt-6">
              <Button variant="secondary" className="w-full" onClick={handleLogout}>
                {t('common.logout')}
              </Button>
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
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="fixed top-0 right-0 z-50 h-full w-[88%] max-w-sm bg-white shadow-2xl px-6 py-6 md:hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900">لوحة الموظف</h2>
                      <p className="text-xs text-gray-500 truncate max-w-[220px]">{user?.fullName}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl w-10 h-10 rounded-xl hover:bg-gray-100 transition flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>

                <NavLinks onNavigate={() => setMobileMenuOpen(false)} />

                <div className="mt-8">
                  <Button variant="secondary" className="w-full" onClick={handleLogout}>
                    {t('common.logout')}
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </ScreenContainer>
  );
}
