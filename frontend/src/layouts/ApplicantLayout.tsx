import { useMemo, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer, Panel } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U';
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

function Icon({ name }: { name: 'home' | 'book' | 'my' | 'faq' | 'profile' }) {
  // أيقونات بسيطة بدون مكتبات
  const common = 'w-5 h-5 opacity-90';
  switch (name) {
    case 'home':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'book':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M7 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H8a3 3 0 0 0-3 3V7a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 20a3 3 0 0 1 3-3h12" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'my':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8l-4 0V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'faq':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.9.45-1.1.8-1.1 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'profile':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
  }
}

export default function ApplicantLayout() {
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
        to="/app/dashboard"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="home" />
        <span className="font-semibold">{t('common.welcome')}</span>
      </NavLink>

      <NavLink
        to="/app/appointments/book"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="book" />
        <span className="font-semibold">{t('appointments.book')}</span>
      </NavLink>

      <NavLink
        to="/app/appointments/my"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="my" />
        <span className="font-semibold">{t('appointments.myAppointments')}</span>
      </NavLink>

      <NavLink
        to="/faq"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="faq" />
        <span className="font-semibold">الأسئلة الشائعة</span>
      </NavLink>

      <NavLink
        to="/app/profile"
        onClick={onNavigate}
        className={({ isActive }) => navItemClass(isActive)}
      >
        <span className={activeIndicatorClass(false)} />
        <span className={activeIndicatorClass(true)} />
        <Icon name="profile" />
        <span className="font-semibold">الملف الشخصي</span>
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

            <Link
              to="/home"
              className="text-xl sm:text-2xl font-extrabold text-primary hover:text-orange-500 transition"
            >
              BatTechno
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
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
              />

              {/* Sidebar */}
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="
                  fixed top-0 right-0 z-50
                  h-full w-[88%] max-w-sm
                  bg-white
                  shadow-2xl
                  px-6 py-6
                  md:hidden
                "
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900">القائمة</h2>
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
