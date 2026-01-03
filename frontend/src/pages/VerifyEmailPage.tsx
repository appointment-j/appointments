import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        toast.success('Email verified successfully');
      })
      .catch(() => {
        setStatus('error');
        toast.error('Invalid or expired token');
      });
  }, [searchParams]);

  return (
    <Card className="w-full">
      <div className="text-center">
        {status === 'loading' && <p>Verifying email...</p>}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Email Verified</h1>
            <p className="text-gray-text mb-6">Your email has been verified successfully.</p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
            <p className="text-gray-text mb-6">Invalid or expired verification token.</p>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

