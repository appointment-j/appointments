import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import api, { openWhatsApp } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface AppointmentDetails {
  appointment: {
    id: string;
    mode: 'IN_PERSON' | 'ONLINE';
    dateLocal: string;
    timeLocal: string;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
    note?: string;
    handledByAdminName?: string;
    createdAt: string;
    updatedAt: string;
  };
  surveyResponse?: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    age?: number;
    socialStatus?: string;
    phone: string;
    nationality: string;
    nationalId?: string;
    passportId?: string;
    region?: string;
    major?: string;
    university?: string;
    heardFrom?: string;
    createdAt: string;
  };
  user?: {
    fullName: string;
    email: string;
    phone?: string;
  };
  slot?: {
    id: string;
    startAt: string;
    endAt: string;
    capacity: number;
    allowOnline: boolean;
    allowInPerson: boolean;
  };
  dayRule?: {
    id: string;
    dayDate: string;
    isBlocked: boolean;
    isOnlineOnly: boolean;
    defaultCapacity: number | null;
    createdAt: string;
  };
  slotRule?: {
    id: string;
    slotId: string;
    isBlocked: boolean;
    isOnlineOnly: boolean;
    capacity: number | null;
    allowOnline: boolean | null;
    allowInPerson: boolean | null;
    createdAt: string;
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

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadAppointmentDetails();
  }, [id]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/admin/appointments/${id}`);
      setDetails(res.data);
    } catch (error: any) {
      console.error('Failed to load appointment details', error);
      toast.error(error.response?.data?.message || 'فشل تحميل تفاصيل الموعد');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW') => {
    if (!window.confirm('هل أنت متأكد من تغيير حالة الموعد؟')) return;

    try {
      setStatusUpdating(true);
      await api.patch(`/appointments/admin/${id}`, { status: newStatus });
      toast.success('تم تحديث حالة الموعد بنجاح');
      loadAppointmentDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث حالة الموعد');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Panel className="min-h-screen flex items-center justify-center bg-white font-majalla">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">جاري تحميل تفاصيل الموعد...</p>
          </div>
        </Panel>
      </ScreenContainer>
    );
  }

  if (!details) {
    return (
      <ScreenContainer>
        <Panel className="min-h-screen flex items-center justify-center bg-white font-majalla">
          <div className="text-center">
            <p className="text-gray-500 mb-4">لم يتم العثور على تفاصيل الموعد</p>
            <Button onClick={() => navigate('/admin/appointments')}>العودة إلى قائمة المواعيد</Button>
          </div>
        </Panel>
      </ScreenContainer>
    );
  }

  const { appointment, surveyResponse, user } = details;

  // Status options for updating
  const statusOptions = [
    { value: 'UPCOMING', label: t('appointments.upcoming') },
    { value: 'COMPLETED', label: t('appointments.completed') },
    { value: 'CANCELED', label: t('appointments.canceled') },
    { value: 'NO_SHOW', label: t('appointments.no_show') },
  ];

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gray-300/20 rounded-full blur-[120px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10"
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              تفاصيل الموعد
            </h1>
            <Button variant="secondary" onClick={() => navigate('/admin/appointments')}>
              {t('common.back')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div variants={item}>
              <Card className="rounded-3xl p-6 h-full">
                <h2 className="text-xl font-bold mb-4">المعلومات الشخصية</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">الاسم الكامل</label>
                    <p className="font-medium">
                      {surveyResponse 
                        ? `${surveyResponse.firstName} ${surveyResponse.fatherName} ${surveyResponse.lastName}`
                        : user?.fullName || 'غير متوفر'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">الهاتف</label>
                    <p className="font-medium">{surveyResponse?.phone || user?.phone || 'غير متوفر'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">البريد الإلكتروني</label>
                    <p className="font-medium">{user?.email || 'غير متوفر'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">الجنسية</label>
                    <p className="font-medium">{surveyResponse?.nationality || 'غير متوفر'}</p>
                  </div>
                  
                  {surveyResponse?.nationalId && (
                    <div>
                      <label className="text-sm text-gray-500">الرقم الوطني</label>
                      <p className="font-medium">{surveyResponse?.nationalId}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.passportId && (
                    <div>
                      <label className="text-sm text-gray-500">رقم الجواز</label>
                      <p className="font-medium">{surveyResponse?.passportId}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.region && (
                    <div>
                      <label className="text-sm text-gray-500">المنطقة/المحافظة</label>
                      <p className="font-medium">{surveyResponse?.region}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.age && (
                    <div>
                      <label className="text-sm text-gray-500">العمر</label>
                      <p className="font-medium">{surveyResponse?.age}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.socialStatus && (
                    <div>
                      <label className="text-sm text-gray-500">الحالة الاجتماعية</label>
                      <p className="font-medium">{surveyResponse?.socialStatus}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="rounded-3xl p-6 h-full">
                <h2 className="text-xl font-bold mb-4">المعلومات الأكاديمية</h2>
                <div className="space-y-3">
                  {surveyResponse?.major && (
                    <div>
                      <label className="text-sm text-gray-500">التخصص الجامعي</label>
                      <p className="font-medium">{surveyResponse?.major}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.university && (
                    <div>
                      <label className="text-sm text-gray-500">الجامعة</label>
                      <p className="font-medium">{surveyResponse?.university}</p>
                    </div>
                  )}
                  
                  {surveyResponse?.heardFrom && (
                    <div>
                      <label className="text-sm text-gray-500">من أين سمعت عنا</label>
                      <p className="font-medium">{surveyResponse?.heardFrom}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="rounded-3xl p-6 h-full">
                <h2 className="text-xl font-bold mb-4">تفاصيل الموعد</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">النوع</label>
                    <p className="font-medium">
                      {appointment.mode === 'IN_PERSON' ? t('appointments.inPerson') : t('appointments.online')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">التاريخ</label>
                    <p className="font-medium">{appointment.dateLocal}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">الوقت</label>
                    <p className="font-medium">{appointment.timeLocal}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">الحالة</label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        appointment.status === 'UPCOMING' ? 'text-orange-500 bg-orange-50' :
                        appointment.status === 'COMPLETED' ? 'text-green-600 bg-green-50' :
                        appointment.status === 'CANCELED' ? 'text-red-500 bg-red-50' :
                        'text-gray-500 bg-gray-100'
                      }`}
                    >
                      {t(`appointments.${appointment.status.toLowerCase()}`)}
                    </span>
                  </div>
                  
                  {appointment.note && (
                    <div>
                      <label className="text-sm text-gray-500">ملاحظات</label>
                      <p className="font-medium">{appointment.note}</p>
                    </div>
                  )}
                  
                  {appointment.handledByAdminName && (
                    <div>
                      <label className="text-sm text-gray-500">تمت المعالجة من قبل</label>
                      <p className="font-medium">{appointment.handledByAdminName}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm text-gray-500">تاريخ الإنشاء</label>
                    <p className="font-medium">
                      {new Date(appointment.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-sm text-gray-500">تحديث الحالة</label>
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(e.target.value as any)}
                      disabled={statusUpdating}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button
                    className="w-full mt-4 flex items-center justify-center gap-2"
                    onClick={() => {
                      const fullName = surveyResponse 
                        ? `${surveyResponse.firstName} ${surveyResponse.fatherName} ${surveyResponse.lastName}`
                        : user?.fullName || 'غير محدد';
                      const message = `الاسم الكامل: ${fullName}
رقم الهاتف: ${surveyResponse?.phone || user?.phone || 'غير متوفر'}
اليوم/التاريخ: ${appointment.dateLocal}
الساعة: ${appointment.timeLocal}
نوع الموعد: ${appointment.mode === 'IN_PERSON' ? 'حضوري' : 'أونلاين'}`;
                      openWhatsApp('0791433341', message);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.125 15.194l-2.047-.995a3.667 3.667 0 0 0 1.211-2.179c0-2.079-1.692-3.771-3.771-3.771a3.665 3.665 0 0 0-2.179 1.211l-.995-2.047a5.896 5.896 0 0 1 3.17-1.022c3.278 0 5.941 2.663 5.941 5.941a5.896 5.896 0 0 1-1.022 3.17zM12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.627-3.529c-.128 0-.256-.015-.384-.046l-3.168-.78a.974.974 0 0 1-.614-.614l-.78-3.168a.96.96 0 0 1 .31-.994l6.088-6.088a.971.971 0 0 1 1.373 0l5.306 5.306a.971.971 0 0 1 0 1.373l-6.088 6.088a.96.96 0 0 1-.994.31zM8.118 13.627c-.128 0-.256-.015-.384-.046l-1.32-.325a.974.974 0 0 1-.614-.614l-.325-1.32a.96.96 0 0 1 .31-.994l6.088-6.088a.971.971 0 0 1 1.373 0l2.088 2.088a.971.971 0 0 1 0 1.373l-6.088 6.088a.96.96 0 0 1-.994.31z" />
                    </svg>
                    إرسال إلى واتساب
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}