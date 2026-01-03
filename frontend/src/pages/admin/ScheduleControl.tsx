import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* =======================
   CountUp Component
======================= */
function CountUp({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(value)) return;

    let start: number | null = null;
    let raf = 0;

    const animate = (ts: number) => {
      if (start === null) start = ts;

      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const current = Math.round(eased * value);
      setDisplayValue(current);

      if (progress < 1) raf = requestAnimationFrame(animate);
      else setDisplayValue(value);
    };

    setDisplayValue(0);
    raf = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

/* =======================
   Animations
======================= */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

type Stats = {
  total: number;
  today: number;
  pending: number;
  employees?: number;
};

type TodayAppointment = {
  id?: string; // ✅ خليها optional عشان نعمل normalize
  _id?: string;
  appointmentId?: string;
  appointment?: { id?: string; _id?: string };

  mode?: 'IN_PERSON' | 'ONLINE';
  status?: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  timeLocal?: string;
  dateLocal?: string;

  surveyResponse?: {
    firstName: string;
    fatherName: string;
    lastName: string;
    phone?: string;
  } | null;

  userId?: { fullName?: string; phone?: string } | null;
};

function getAppointmentId(a: TodayAppointment): string | null {
  return (
    a?.id ??
    a?._id ??
    a?.appointmentId ??
    a?.appointment?.id ??
    a?.appointment?._id ??
    null
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [dayRuleLoading, setDayRuleLoading] = useState(false);
  const [dayRuleSaving, setDayRuleSaving] = useState(false);

  const safeStats = useMemo(() => {
    return {
      total: stats?.total ?? 0,
      today: stats?.today ?? 0,
      pending: stats?.pending ?? 0,
      employees: stats?.employees ?? 0,
    };
  }, [stats]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/dashboard/stats');

        const raw = res?.data;
        const payload = raw?.data ?? raw;

        const nextStats: Stats = {
          total: Number(payload?.total ?? 0),
          today: Number(payload?.today ?? 0),
          pending: Number(payload?.pending ?? 0),
          employees: Number(payload?.employees ?? 0),
        };

        setStats(nextStats);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'فشل تحميل الإحصائيات');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const normalizeTodayList = (list: any[]): TodayAppointment[] => {
      return (Array.isArray(list) ? list : []).map((x) => {
        const id = getAppointmentId(x);
        return { ...x, id: id ?? x?.id }; // ✅ الآن ضمان أن id موجود إذا كان بأي شكل
      });
    };

    const loadTodayAppointments = async () => {
      try {
        setAppointmentsLoading(true);

        let list: any[] = [];

        try {
          const res = await api.get('/appointments/admin/today');
          const payload = res.data?.data ?? res.data;
          list = payload?.appointments ?? payload ?? [];
        } catch {
          const res2 = await api.get('/appointments/admin/appointments/today');
          const payload2 = res2.data?.data ?? res2.data;
          list = payload2?.appointments ?? payload2 ?? [];
        }

        const normalized = normalizeTodayList(list);
        setTodayAppointments(normalized);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'فشل تحميل مواعيد اليوم');
        setTodayAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    loadTodayAppointments();
  }, []);

  useEffect(() => {
    const loadDayRule = async () => {
      if (!selectedDate) {
        setIsBlocked(false);
        setIsOnlineOnly(false);
        return;
      }

      setDayRuleLoading(true);
      try {
        try {
          const res = await api.get(`/appointments/admin/days/${selectedDate}`);
          const payload = res.data?.data ?? res.data;
          setIsBlocked(Boolean(payload?.isBlocked ?? false));
          setIsOnlineOnly(Boolean(payload?.isOnlineOnly ?? false));
        } catch {
          const res2 = await api.get(`/admin/days/${selectedDate}`);
          const payload2 = res2.data?.data ?? res2.data;
          setIsBlocked(Boolean(payload2?.isBlocked ?? false));
          setIsOnlineOnly(Boolean(payload2?.isOnlineOnly ?? false));
        }
      } catch {
        setIsBlocked(false);
        setIsOnlineOnly(false);
      } finally {
        setDayRuleLoading(false);
      }
    };

    loadDayRule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const handleDayRuleUpdate = async () => {
    if (!selectedDate) {
      toast.error('الرجاء اختيار تاريخ');
      return;
    }

    try {
      setDayRuleSaving(true);

      try {
        await api.patch(`/appointments/admin/days/${selectedDate}`, {
          isBlocked,
          isOnlineOnly,
        });
      } catch {
        await api.patch(`/admin/days/${selectedDate}`, {
          isBlocked,
          isOnlineOnly,
        });
      }

      toast.success('تم تحديث إعدادات اليوم بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث إعدادات اليوم');
    } finally {
      setDayRuleSaving(false);
    }
  };

  const getRowName = (appointment: TodayAppointment) => {
    if (appointment.surveyResponse) {
      const s = appointment.surveyResponse;
      return `${s.firstName} ${s.fatherName} ${s.lastName}`;
    }
    return appointment.userId?.fullName || 'غير معروف';
  };

  const getRowPhone = (appointment: TodayAppointment) => {
    return appointment.surveyResponse?.phone || appointment.userId?.phone || 'غير معروف';
  };

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] bg-orange-200/20 rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[520px] h-[520px] bg-orange-100/15 rounded-full blur-[150px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10"
        >
          <motion.div variants={item} className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {t('admin.dashboard')}
            </h1>
            <p className="text-gray-500">نظرة عامة على أداء النظام اليوم</p>
          </motion.div>

          {loading ? (
            <motion.div variants={item}>
              <Card className="rounded-3xl p-10 border border-gray-200 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500">جاري تحميل الإحصائيات...</p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div variants={item}>
                  <Card className="relative overflow-hidden rounded-3xl p-6 border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-orange-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 rounded-full blur-2xl" />
                    <p className="text-sm text-gray-500 mb-2">إجمالي المواعيد</p>
                    <p className="text-4xl font-extrabold text-gray-900">
                      <CountUp value={safeStats.total} />
                    </p>
                    <p className="mt-2 text-sm text-gray-500">جميع المواعيد المسجلة</p>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card className="relative overflow-hidden rounded-3xl p-6 border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-orange-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/25 rounded-full blur-2xl" />
                    <p className="text-sm text-gray-500 mb-2">مواعيد اليوم</p>
                    <p className="text-4xl font-extrabold text-gray-900">
                      <CountUp value={safeStats.today} />
                    </p>
                    <p className="mt-2 text-sm text-gray-500">عدد المواعيد لليوم</p>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card className="relative overflow-hidden rounded-3xl p-6 border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-orange-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl" />
                    <p className="text-sm text-gray-500 mb-2">قيد الانتظار</p>
                    <p className="text-4xl font-extrabold text-gray-900">
                      <CountUp value={safeStats.pending} />
                    </p>
                    <p className="mt-2 text-sm text-gray-500">بانتظار المعالجة</p>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div variants={item} className="mt-12">
                <Card className="rounded-3xl p-8 border border-gray-200 text-center bg-white">
                  <h2 className="text-xl font-bold mb-2">تقارير وتحليلات</h2>
                  <p className="text-gray-500">سيتم إضافة الإحصائيات المتقدمة قريباً 📊</p>
                </Card>
              </motion.div>

              <motion.div variants={item} className="mt-12">
                <Card className="rounded-3xl p-8 border border-gray-200 bg-white">
                  <h2 className="text-xl font-bold mb-6">المواعيد</h2>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">من قدم موعد اليوم</h3>

                    {appointmentsLoading ? (
                      <div className="text-center py-4">
                        <p>جاري تحميل المواعيد...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الاسم</th>
                              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">رقم الهاتف</th>
                              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الوقت</th>
                              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">النوع</th>
                              <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todayAppointments.length > 0 ? (
                              todayAppointments.map((appointment) => {
                                const apptId = getAppointmentId(appointment);

                                return (
                                  <tr
                                    key={apptId ?? `${getRowName(appointment)}-${appointment.timeLocal ?? ''}`}
                                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                                      apptId ? 'cursor-pointer' : ''
                                    }`}
                                    onClick={() => {
                                      if (!apptId) {
                                        toast.error('معرّف الموعد غير موجود من السيرفر');
                                        return;
                                      }
                                      navigate(`/admin/appointments/${encodeURIComponent(apptId)}`);
                                    }}
                                  >
                                    <td className="py-3 px-4 text-sm">{getRowName(appointment)}</td>
                                    <td className="py-3 px-4 text-sm">{getRowPhone(appointment)}</td>
                                    <td className="py-3 px-4 text-sm">{appointment.timeLocal ?? '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                      {appointment.mode === 'IN_PERSON' ? 'حضوري' : 'أونلاين'}
                                    </td>
                                    <td className="py-3 px-4 text-sm">{appointment.status ?? '-'}</td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-3 px-4 text-center text-sm text-gray-500">
                                  لا توجد مواعيد لليوم
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">تحكم كامل بالمواعيد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">اختر تاريخ</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        {dayRuleLoading && (
                          <p className="text-xs text-gray-500 mt-2">جاري تحميل إعدادات اليوم...</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="blockDay"
                            checked={isBlocked}
                            onChange={(e) => setIsBlocked(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <label htmlFor="blockDay" className="ml-2 text-sm">
                            ممنوع الحجز في هذا اليوم
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="onlineOnly"
                            checked={isOnlineOnly}
                            onChange={(e) => setIsOnlineOnly(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <label htmlFor="onlineOnly" className="ml-2 text-sm">
                            كل مواعيد هذا اليوم أونلاين فقط
                          </label>
                        </div>

                        <button
                          onClick={handleDayRuleUpdate}
                          disabled={dayRuleSaving || !selectedDate}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
                        >
                          {dayRuleSaving ? 'جاري التحديث...' : 'تحديث الإعدادات'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}
