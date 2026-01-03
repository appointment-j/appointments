import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  userId: {
    fullName: string;
    email: string;
    phone: string;
  } | null;
  mode: 'IN_PERSON' | 'ONLINE';
  dateLocal: string;
  timeLocal: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  note?: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELED';
  handledByAdminName?: string;
  surveyResponse: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    age: number;
    socialStatus: string;
    phone: string;
    nationality: string;
    nationalId?: string;
    passportId?: string;
    region?: string;
    major: string;
    university: string;
    heardFrom: string;
  } | null;
}

export default function AdminAppointments() {
  useTranslation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFullName = (a: Appointment) => {
    if (a.surveyResponse) {
      return `${a.surveyResponse.firstName} ${a.surveyResponse.fatherName} ${a.surveyResponse.lastName}`;
    }
    return a.userId?.fullName || 'غير متوفر';
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await api.get(`/appointments/admin?${params.toString()}`);

      // يدعم حالتين: {success:true,data:{appointments:[]}} أو {appointments:[]}
      const payload = response.data?.data ?? response.data;
      const list = payload?.appointments ?? payload ?? [];

      setAppointments(Array.isArray(list) ? list : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // جرّب مسار الأدمن أولاً (المتوقع مع باقي صفحات الأدمن)
      try {
        await api.patch(`/appointments/admin/appointments/${id}`, {
          status: newStatus,
          handledByAdminName: 'Admin',
        });
      } catch {
        // fallback لمسار قديم إن كان موجود بمشروعك
        await api.patch(`/appointments/${id}/status`, {
          status: newStatus,
          handledByAdminName: 'Admin',
        });
      }

      toast.success('تم تحديث الحالة بنجاح');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-extrabold text-center mb-8">إدارة المواعيد</h1>

          {/* Filters */}
          <Card className="p-6 rounded-3xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">حالة الموعد</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">جميع الحالات</option>
                  <option value="UPCOMING">المواعيد القادمة</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="CANCELED">ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">من تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 text-left">
              <Button onClick={loadAppointments} className="bg-orange-500 hover:bg-orange-600">
                تطبيق الفلاتر
              </Button>
            </div>
          </Card>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-10">
              <p>جاري تحميل المواعيد...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {appointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="p-6 rounded-3xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Appointment Details */}
                        <div>
                          <h3 className="text-lg font-bold mb-4">تفاصيل الموعد</h3>

                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>الاسم:</strong>{' '}
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/appointments/${appointment.id}`)}
                                className="text-orange-600 hover:text-orange-700 underline"
                              >
                                {getFullName(appointment)}
                              </button>
                            </p>

                            <p>
                              <strong>الحالة:</strong> {appointment.status}
                            </p>
                            <p>
                              <strong>النوع:</strong>{' '}
                              {appointment.mode === 'IN_PERSON' ? 'حجز مباشر' : 'أونلاين'}
                            </p>
                            <p>
                              <strong>التاريخ:</strong> {formatDate(appointment.startDateTimeUtc)}
                            </p>
                            <p>
                              <strong>الوقت:</strong> {appointment.timeLocal}
                            </p>

                            {appointment.note && (
                              <p>
                                <strong>ملاحظات:</strong> {appointment.note}
                              </p>
                            )}

                            {appointment.handledByAdminName && (
                              <p>
                                <strong>تمت معالجته من قبل:</strong> {appointment.handledByAdminName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Survey Response Details */}
                        {appointment.surveyResponse && (
                          <div>
                            <h3 className="text-lg font-bold mb-4">تفاصيل الاستبيان</h3>

                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>الاسم:</strong> {appointment.surveyResponse.firstName}{' '}
                                {appointment.surveyResponse.fatherName}{' '}
                                {appointment.surveyResponse.lastName}
                              </p>
                              <p>
                                <strong>العمر:</strong> {appointment.surveyResponse.age}
                              </p>
                              <p>
                                <strong>الحالة الاجتماعية:</strong> {appointment.surveyResponse.socialStatus}
                              </p>
                              <p>
                                <strong>الهاتف:</strong> {appointment.surveyResponse.phone}
                              </p>
                              <p>
                                <strong>الجنسية:</strong> {appointment.surveyResponse.nationality}
                              </p>

                              {appointment.surveyResponse.nationalId && (
                                <p>
                                  <strong>الرقم الوطني:</strong> {appointment.surveyResponse.nationalId}
                                </p>
                              )}

                              {appointment.surveyResponse.passportId && (
                                <p>
                                  <strong>رقم الجواز:</strong> {appointment.surveyResponse.passportId}
                                </p>
                              )}

                              {appointment.surveyResponse.region && (
                                <p>
                                  <strong>المنطقة:</strong> {appointment.surveyResponse.region}
                                </p>
                              )}

                              <p>
                                <strong>التخصص:</strong> {appointment.surveyResponse.major}
                              </p>
                              <p>
                                <strong>الجامعة:</strong> {appointment.surveyResponse.university}
                              </p>
                              <p>
                                <strong>من أين سمعت عنا:</strong> {appointment.surveyResponse.heardFrom}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* User Details (fallback if no survey) */}
                        {!appointment.surveyResponse && appointment.userId && (
                          <div>
                            <h3 className="text-lg font-bold mb-4">تفاصيل المستخدم</h3>

                            <div className="space-y-2 text-sm">
                              <p>
                                <strong>الاسم:</strong> {appointment.userId.fullName}
                              </p>
                              <p>
                                <strong>البريد:</strong> {appointment.userId.email}
                              </p>
                              <p>
                                <strong>الهاتف:</strong> {appointment.userId.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Update */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={appointment.status === 'UPCOMING' ? 'primary' : 'secondary'}
                            onClick={() => handleStatusChange(appointment.id, 'UPCOMING')}
                            disabled={appointment.status === 'UPCOMING'}
                          >
                            قادم
                          </Button>

                          <Button
                            variant={appointment.status === 'COMPLETED' ? 'primary' : 'secondary'}
                            onClick={() => handleStatusChange(appointment.id, 'COMPLETED')}
                            disabled={appointment.status === 'COMPLETED'}
                          >
                            مكتمل
                          </Button>

                          <Button
                            variant={appointment.status === 'CANCELED' ? 'primary' : 'secondary'}
                            onClick={() => handleStatusChange(appointment.id, 'CANCELED')}
                            disabled={appointment.status === 'CANCELED'}
                          >
                            ملغى
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {appointments.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">لا توجد مواعيد</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Panel>
    </ScreenContainer>
  );
}
