import { useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function BookAppointment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Redirect to survey-based booking flow
  useEffect(() => {
    // Show a message to the user about the new survey requirement
    toast('لضمان جودة الخدمة، يرجى إكمال الاستبيان أولاً', { duration: 5000 });
    // Redirect to the survey appointment flow
    navigate('/app/appointments/survey');
  }, [navigate]);
  
  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">جاري التوجيه إلى استبيان الحجز...</p>
          <p className="text-sm text-gray-500">سيتم تحويلك تلقائياً إلى استبيان الحجز</p>
        </div>
      </Panel>
    </ScreenContainer>
  );
}
