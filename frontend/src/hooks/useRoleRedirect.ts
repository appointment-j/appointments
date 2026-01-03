import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useRoleRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const currentPath = window.location.pathname;

      // Determine the correct dashboard based on user role
      let correctDashboard = '';
      switch (user.role) {
        case 'ADMIN':
          correctDashboard = '/admin/dashboard';
          break;
        case 'EMPLOYEE':
          correctDashboard = '/employee/dashboard';
          break;
        case 'APPLICANT':
          correctDashboard = '/app/dashboard';
          break;
      }

      // Check if the user is trying to access an unauthorized route
      const isUnauthorized = 
        (user.role === 'EMPLOYEE' && (currentPath.startsWith('/app/') || currentPath.startsWith('/admin/'))) ||
        (user.role === 'APPLICANT' && (currentPath.startsWith('/employee/') || currentPath.startsWith('/admin/'))) ||
        (user.role === 'ADMIN' && (currentPath.startsWith('/app/') || currentPath.startsWith('/employee/')));

      if (isUnauthorized) {
        navigate(correctDashboard, { replace: true });
      }
    }
  }, [user, navigate]);
};