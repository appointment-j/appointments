import { Outlet } from 'react-router-dom';
import { ScreenContainer } from '../components/ScreenContainer';

export default function AuthLayout() {
  return (
    <ScreenContainer>
      <div className="h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </ScreenContainer>
  );
}

