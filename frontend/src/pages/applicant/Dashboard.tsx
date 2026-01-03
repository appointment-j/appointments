import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function ApplicantDashboard() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen overflow-hidden bg-white font-majalla">
        {/* خلفية ناعمة */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-300/25 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gray-300/25 rounded-full blur-[120px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10"
        >
          {/* العنوان */}
          <motion.div variants={item} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {t('common.welcome')}
            </h1>
            <p className="text-gray-500 text-base sm:text-lg">
              اختر الإجراء الذي ترغب بتنفيذه
            </p>
          </motion.div>

          {/* الكروت */}
          <motion.div
            variants={container}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* حجز موعد */}
            <motion.div variants={item}>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-orange-400/0 blur-2xl transition-all duration-500 group-hover:bg-orange-400/25" />

                <Card className="relative z-10 h-full rounded-3xl bg-white border border-gray-200 p-6 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                    {t('appointments.book')}
                  </h2>

                  <p className="text-gray-500 mb-8">
                    احجز موعدك بسهولة خلال خطوات بسيطة
                  </p>

                  <Link to="/app/appointments/book">
                    <Button
                      className="
                        w-full
                        rounded-2xl
                        py-3.5
                        bg-orange-500
                        text-white
                        text-lg
                        transition-all duration-300
                        hover:bg-orange-600
                        hover:scale-[1.04]
                        hover:shadow-[0_0_35px_rgba(245,124,0,0.45)]
                      "
                    >
                      {t('appointments.book')}
                    </Button>
                  </Link>
                </Card>
              </div>
            </motion.div>

            {/* مواعيدي */}
            <motion.div variants={item}>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-orange-400/0 blur-2xl transition-all duration-500 group-hover:bg-orange-400/25" />

                <Card className="relative z-10 h-full rounded-3xl bg-white border border-gray-200 p-6 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                    {t('appointments.myAppointments')}
                  </h2>

                  <p className="text-gray-500 mb-8">
                    استعرض جميع مواعيدك وتحكم بها
                  </p>

                  <Link to="/app/appointments/my">
                    <Button
                      className="
                        w-full
                        rounded-2xl
                        py-3.5
                        bg-orange-500
                        text-white
                        text-lg
                        transition-all duration-300
                        hover:bg-orange-600
                        hover:scale-[1.04]
                        hover:shadow-[0_0_35px_rgba(245,124,0,0.45)]
                      "
                    >
                      {t('appointments.myAppointments')}
                    </Button>
                  </Link>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}
