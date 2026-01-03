import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import api, { openWhatsApp } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Appointment {
  _id: string;
  mode: 'IN_PERSON' | 'ONLINE';
  dateLocal: string;
  timeLocal: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  note?: string;
  surveyResponse?: {
    firstName: string;
    fatherName: string;
    lastName: string;
    phone: string;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function MyAppointments() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data.appointments);
    } catch {
      toast.error('فشل تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء الموعد؟')) return;

    try {
      await api.post(`/appointments/${id}/cancel`);
      toast.success('تم إلغاء الموعد');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إلغاء الموعد');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Panel className="min-h-screen flex items-center justify-center bg-white font-majalla">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">جاري تحميل المواعيد...</p>
          </div>
        </Panel>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla overflow-hidden">
        {/* خلفية ناعمة */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gray-300/20 rounded-full blur-[120px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10"
        >
          {/* العنوان */}
          <motion.div variants={item} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {t('appointments.myAppointments')}
            </h1>
            <p className="text-gray-500">
              جميع مواعيدك السابقة والقادمة في مكان واحد
            </p>
          </motion.div>

          {appointments.length === 0 ? (
            <motion.div variants={item}>
              <Card className="rounded-3xl p-8 text-center border border-gray-200">
                <p className="text-gray-500 text-lg">
                  لا يوجد لديك مواعيد حالياً
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={container} className="space-y-5">
              {appointments.map((apt) => (
                <motion.div key={apt._id} variants={item}>
                  <div className="relative group">
                    {/* Glow */}
                    <div
                      className="
                        pointer-events-none absolute inset-0
                        rounded-3xl
                        bg-orange-400/0
                        blur-2xl
                        transition-all duration-500
                        group-hover:bg-orange-400/20
                      "
                    />

                    <Card
                      className="
                        relative z-10
                        rounded-3xl
                        border border-gray-200
                        bg-white
                        p-6
                        transition-all duration-500
                        group-hover:-translate-y-1
                        group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                      "
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {apt.mode === 'IN_PERSON'
                              ? t('appointments.inPerson')
                              : t('appointments.online')}
                          </h3>

                          <p className="text-gray-500">
                            {apt.dateLocal} — {apt.timeLocal}
                          </p>

                          <p className="text-sm mt-2 text-gray-500">
                            الحالة:{' '}
                            <span className="font-semibold text-gray-700">
                              {t(`appointments.${apt.status.toLowerCase()}`)}
                            </span>
                          </p>

                          {apt.note && (
                            <p className="mt-3 text-gray-500 text-sm">
                              {apt.note}
                            </p>
                          )}

                          {apt.surveyResponse && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="secondary"
                                className="
                                  rounded-full
                                  px-4
                                  py-2
                                  border border-green-500
                                  text-green-500
                                  hover:bg-green-50
                                  transition
                                  flex items-center gap-2
                                "
                                onClick={() => {
                                  const fullName = `${apt.surveyResponse?.firstName} ${apt.surveyResponse?.fatherName} ${apt.surveyResponse?.lastName}`;
                                  const message = `الاسم الكامل: ${fullName}
رقم الهاتف: ${apt.surveyResponse?.phone}
اليوم/التاريخ: ${apt.dateLocal}
الساعة: ${apt.timeLocal}
نوع الموعد: ${apt.mode === 'IN_PERSON' ? 'حضوري' : 'أونلاين'}`;
                                  openWhatsApp('0791433341', message);
                                }}
                              >
                                <span>واتساب</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M17.125 15.194l-2.047-.995a3.667 3.667 0 0 0 1.211-2.179c0-2.079-1.692-3.771-3.771-3.771a3.665 3.665 0 0 0-2.179 1.211l-.995-2.047a5.896 5.896 0 0 1 3.17-1.022c3.278 0 5.941 2.663 5.941 5.941a5.896 5.896 0 0 1-1.022 3.17zM12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.627-3.529c-.128 0-.256-.015-.384-.046l-3.168-.78a.974.974 0 0 1-.614-.614l-.78-3.168a.96.96 0 0 1 .31-.994l6.088-6.088a.971.971 0 0 1 1.373 0l5.306 5.306a.971.971 0 0 1 0 1.373l-6.088 6.088a.96.96 0 0 1-.994.31zM8.118 13.627c-.128 0-.256-.015-.384-.046l-1.32-.325a.974.974 0 0 1-.614-.614l-.325-1.32a.96.96 0 0 1 .31-.994l6.088-6.088a.971.971 0 0 1 1.373 0l2.088 2.088a.971.971 0 0 1 0 1.373l-6.088 6.088a.96.96 0 0 1-.994.31z" />
                                </svg>
                              </Button>
                            </div>
                          )}
                        </div>

                        {apt.status === 'UPCOMING' && (
                          <Button
                            variant="secondary"
                            className="
                              rounded-full
                              px-6
                              border border-orange-500
                              text-orange-500
                              hover:bg-orange-50
                              transition
                            "
                            onClick={() => handleCancel(apt._id)}
                          >
                            {t('appointments.cancel')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}
