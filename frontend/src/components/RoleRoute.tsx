import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: ('ADMIN' | 'EMPLOYEE' | 'APPLICANT')[];
}

export const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, loading } = useAuth();

  /* شاشة تحميل فخمة */
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-orange-50 font-majalla overflow-hidden relative">
        {/* Glow خلفي */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[140px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Spinner */}
          <motion.div
            className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />

          <p className="text-gray-600 text-lg tracking-wide">
            جارٍ التحقق من الصلاحيات…
          </p>
        </motion.div>
      </div>
    );
  }

  /* غير مسجل دخول */
  if (!user) {
    const attemptedRoute = window.location.pathname;
    if (attemptedRoute !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', attemptedRoute);
    }
    return <Navigate to="/login" replace />;
  }

  /* الدور غير مسموح */
  if (!allowedRoles.includes(user.role)) {
    let redirectPath = '/not-found';

    switch (user.role) {
      case 'ADMIN':
        redirectPath = '/admin/dashboard';
        break;
      case 'EMPLOYEE':
        redirectPath = '/employee/dashboard';
        break;
      case 'APPLICANT':
        redirectPath = '/app/dashboard';
        break;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
