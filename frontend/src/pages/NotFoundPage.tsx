import { Link } from 'react-router-dom';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';

export default function NotFoundPage() {
  return (
    <ScreenContainer>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-gray-text text-xl mb-8">Page not found</p>
          <Link to="/home">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    </ScreenContainer>
  );
}

