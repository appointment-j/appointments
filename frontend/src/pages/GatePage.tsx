import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function GatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleEnter = async () => {
    // Check if already passed
    if (sessionStorage.getItem('bt_gate_passed') === '1') {
      navigate('/home');
      return;
    }

    // Track entry
    try {
      await api.post('/entries');
      sessionStorage.setItem('bt_gate_passed', '1');
    } catch (error) {
      toast.error('Entry tracking failed');
    }

    navigate('/home');
  };

  return (
    <ScreenContainer>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background-dark to-gray-surface-dark">
        <div className="text-center space-y-8 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4">{t('gate.title')}</h1>
            <p className="text-xl text-gray-text mb-8">{t('gate.subtitle')}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              variant="primary"
              onClick={handleEnter}
              className="text-lg px-12 py-4 shadow-lg"
            >
              {t('gate.enter')}
            </Button>
          </motion.div>
        </div>
      </div>
    </ScreenContainer>
  );
}

