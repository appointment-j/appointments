import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface DashboardSummary {
  balance: number;
  thisMonthTotal: number;
  lastBonus: {
    amount: number;
    createdAtUtc: string;
    note: string;
  } | null;
  unreadNotificationsCount: number;
}

interface BonusEntry {
  _id: string;
  amount: number;
  note: string;
  createdAtUtc: string;
  status: string;
}

type TargetStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

interface MonthlyTarget {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  month: string;
  startDate: string;
  endDate: string;
  status: TargetStatus;
  progress?: number; // من endpoint statistics غالبًا
}

interface DailyWorkLog {
  id: string;
  date: string;
  title?: string;
  description: string;

  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDashboard() {
  const { t, i18n } = useTranslation();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bonuses, setBonuses] = useState<BonusEntry[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [dailyWorkLogs, setDailyWorkLogs] = useState<DailyWorkLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedBonus, setSelectedBonus] = useState<BonusEntry | null>(null);
  
  // Daily Work State
  const [dailyWorkDescription, setDailyWorkDescription] = useState('');
  const [dailyWorkTitle, setDailyWorkTitle] = useState('');

  const [dailyWorkDate, setDailyWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyWorkLoading, setDailyWorkLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadDashboardData = async () => {
    try {
      const [summaryRes, bonusesRes, targetsRes, dailyWorkRes] = await Promise.all([
        api.get('/employee/dashboard/summary'),
        api.get('/employee/bonuses/me'),
        api.get('/employee/targets/statistics'),
        api.get('/employee/daily-work/dashboard?limit=5'),
      ]);

      setSummary(summaryRes.data);
      setBonuses(bonusesRes.data.entries || []);

      const targetsData = targetsRes?.data?.data ?? targetsRes?.data ?? [];
      setTargets(Array.isArray(targetsData) ? targetsData : []);
      
      const dailyWorkData = dailyWorkRes?.data?.data ?? dailyWorkRes?.data ?? [];
      setDailyWorkLogs(Array.isArray(dailyWorkData) ? dailyWorkData : []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return i18n.language === 'ar'
      ? format(date, 'dd/MM/yyyy HH:mm', { locale: ar })
      : format(date, 'MM/dd/yyyy HH:mm');
  };

  const getStatusText = (status: string) => {
    return i18n.language === 'ar'
      ? status === 'APPROVED'
        ? 'معتمد'
        : 'قيد المراجعة'
      : status === 'APPROVED'
      ? 'Approved'
      : 'Pending';
  };

  const getTargetStatusText = (status: TargetStatus) => {
    if (i18n.language === 'ar') {
      if (status === 'COMPLETED') return 'مكتمل';
      if (status === 'EXPIRED') return 'منتهي';
      return 'نشط';
    }
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'EXPIRED') return 'Expired';
    return 'Active';
  };

  const getTargetStatusBadge = (status: TargetStatus) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800';
    if (status === 'EXPIRED') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const calcProgress = (current: number, target: number) => {
    const tVal = Number(target);
    const cVal = Number(current);
    if (!Number.isFinite(tVal) || !Number.isFinite(cVal) || tVal <= 0) return 0;
    return Math.min((cVal / tVal) * 100, 100);
  };

  const targetsSummary = useMemo(() => {
    const totalTarget = targets.reduce((acc, x) => acc + (Number(x.targetValue) || 0), 0);
    const totalCurrent = targets.reduce((acc, x) => acc + (Number(x.currentValue) || 0), 0);
    const percent = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
    return { totalTarget, totalCurrent, percent };
  }, [targets]);
  
  const handleDailyWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dailyWorkDescription.trim()) {
      toast.error('Work description is required');
      return;
    }
    
    try {
      setDailyWorkLoading(true);
      
      const payload = {
        date: dailyWorkDate,
        title: dailyWorkTitle.trim() || null,
        description: dailyWorkDescription.trim(),
      };
      
      await api.post('/employee/daily-work', payload);
      toast.success('Daily work log submitted successfully');
      
      // Reset form
      setDailyWorkDescription('');
      setDailyWorkTitle('');
      
      // Refresh logs
      const res = await api.get('/employee/daily-work/dashboard?limit=5');
      const dailyWorkData = res?.data?.data ?? res?.data ?? [];
      setDailyWorkLogs(Array.isArray(dailyWorkData) ? dailyWorkData : []);
    } catch (error: any) {
      console.error('Failed to submit daily work log', error);
      toast.error(error.response?.data?.message || 'Failed to submit daily work log');
    } finally {
      setDailyWorkLoading(false);
    }
  };
  
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return i18n.language === 'ar'
      ? format(date, 'dd/MM/yyyy', { locale: ar })
      : format(date, 'MM/dd/yyyy');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-text">{t('common.loading')}...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-text text-sm font-medium">
                  {i18n.language === 'ar' ? 'رصيدك الحالي' : 'Current Balance'}
                </h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {summary?.balance?.toFixed(2) || '0.00'} JOD
                </p>
                <p className="text-xs text-gray-text mt-1">
                  {i18n.language === 'ar' ? 'مجموع كل البونصات المعتمدة' : 'Total of all approved bonuses'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* This Month */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-text text-sm font-medium">
                  {i18n.language === 'ar' ? 'بونص هذا الشهر' : 'This Month Bonuses'}
                </h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  +{summary?.thisMonthTotal?.toFixed(2) || '0.00'} JOD
                </p>
                <p className="text-xs text-gray-text mt-1 flex items-center">
                  {i18n.language === 'ar' ? 'مقارنة بالشهر السابق' : 'Compared to last month'}
                  <span className="ml-1 text-green-500">↑</span>
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Last Bonus */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-text text-sm font-medium">
                  {i18n.language === 'ar' ? 'آخر بونص' : 'Last Bonus'}
                </h3>
                {summary?.lastBonus ? (
                  <>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {summary.lastBonus.amount > 0 ? '+' : ''}
                      {summary.lastBonus.amount.toFixed(2)} JOD
                    </p>
                    <p className="text-xs text-gray-text mt-1">{formatDate(summary.lastBonus.createdAtUtc)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-400 mt-2">-</p>
                    <p className="text-xs text-gray-text mt-1">
                      {i18n.language === 'ar' ? 'لا يوجد بونصات' : 'No bonuses yet'}
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-text text-sm font-medium">
                  {i18n.language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {summary?.unreadNotificationsCount || 0}
                </p>
                <p className="text-xs text-gray-text mt-1">
                  {i18n.language === 'ar' ? 'إشعارات غير مقروءة' : 'Unread notifications'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ✅ Monthly Targets Section */}
      <div className="mb-8">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {i18n.language === 'ar' ? 'الأهداف الشهرية' : 'Monthly Targets'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Targets Summary Card */}
          <Card className="h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-gray-text text-sm font-medium">
                  {i18n.language === 'ar' ? 'ملخص أهداف الشهر' : 'Monthly Targets Summary'}
                </h3>
                <p className="text-2xl font-bold text-primary mt-2">
                  {targetsSummary.percent.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-text mt-1">
                  {i18n.language === 'ar'
                    ? `المنجز ${targetsSummary.totalCurrent.toFixed(2)} من ${targetsSummary.totalTarget.toFixed(2)}`
                    : `Achieved ${targetsSummary.totalCurrent.toFixed(2)} of ${targetsSummary.totalTarget.toFixed(2)}`}
                </p>
              </div>

              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 1.79-7 4s3.134 4 7 4 7-1.79 7-4-3.134-4-7-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12v4c0 2.21 3.134 4 7 4s7-1.79 7-4v-4" />
                </svg>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${targetsSummary.percent}%` }}
              />
            </div>

            <div className="mt-4 text-sm text-gray-text">
              <div className="flex justify-between">
                <span>{i18n.language === 'ar' ? 'إجمالي الهدف' : 'Total Target'}</span>
                <span className="font-semibold">{targetsSummary.totalTarget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>{i18n.language === 'ar' ? 'إجمالي المنجز' : 'Total Achieved'}</span>
                <span className="font-semibold">{targetsSummary.totalCurrent.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Targets List */}
          <Card className="lg:col-span-2 h-full">
            <div className="overflow-auto max-h-96">
              {targets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                  <div className="p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 4h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {i18n.language === 'ar' ? 'لا يوجد أهداف لهذا الشهر' : 'No targets for this month'}
                  </h3>
                  <p className="text-gray-500">
                    {i18n.language === 'ar'
                      ? 'سيظهر سجل الأهداف الشهرية هنا عند إضافتها من الإدارة'
                      : 'Your monthly targets will appear here once added by admin'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {targets.map((target, idx) => {
                    const p = target.progress ?? calcProgress(target.currentValue, target.targetValue);
                    return (
                      <motion.div
                        key={target.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                        className="border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{target.title}</h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTargetStatusBadge(target.status)}`}>
                                {getTargetStatusText(target.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-text">{target.description}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              {i18n.language === 'ar' ? 'الشهر:' : 'Month:'} {target.month}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-text">
                              {i18n.language === 'ar' ? 'المنجز' : 'Achieved'}
                            </div>
                            <div className="font-bold">
                              {Number(target.currentValue).toFixed(2)} / {Number(target.targetValue).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{i18n.language === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</span>
                            <span>{Math.round(p)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
                            <span>
                              {i18n.language === 'ar' ? 'من:' : 'From:'} {formatDate(target.startDate).split(' ')[0]}
                            </span>
                            <span>
                              {i18n.language === 'ar' ? 'إلى:' : 'To:'} {formatDate(target.endDate).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Daily Work Section */}
      <div className="mb-8">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{i18n.language === 'ar' ? 'العمل اليومي' : 'Daily Work'}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Work Form Card */}
          <Card className="lg:col-span-2 h-full">
            <form onSubmit={handleDailyWorkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {i18n.language === 'ar' ? 'التاريخ' : 'Date'}
                </label>
                <Input
                  type="date"
                  value={dailyWorkDate}
                  onChange={(e) => setDailyWorkDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {i18n.language === 'ar' ? 'العنوان' : 'Title'}
                </label>
                <Input
                  placeholder={i18n.language === 'ar' ? 'اختياري' : 'Optional'}
                  value={dailyWorkTitle}
                  onChange={(e) => setDailyWorkTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {i18n.language === 'ar' ? 'الوصف' : 'Description'}
                  <span className="text-red-500"> *</span>
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                  placeholder={i18n.language === 'ar' ? 'اكتب ما قمت به اليوم...' : 'Write what you worked on today...'}
                  value={dailyWorkDescription}
                  onChange={(e) => setDailyWorkDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  isLoading={dailyWorkLoading}
                  disabled={dailyWorkLoading}
                >
                  {i18n.language === 'ar' ? 'إرسال' : 'Submit'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Recent Daily Work Logs */}
          <Card className="h-full">
            <h3 className="text-lg font-semibold mb-4">{i18n.language === 'ar' ? 'السجلات الحديثة' : 'Recent Logs'}</h3>
            
            <div className="space-y-3 max-h-96 overflow-auto">
              {dailyWorkLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {i18n.language === 'ar' ? 'لا توجد سجلات بعد' : 'No logs yet'}
                </p>
              ) : (
                dailyWorkLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {log.title || formatDateOnly(log.date)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateOnly(log.date)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {log.description.length > 60 
                            ? `${log.description.substring(0, 60)}...`
                            : log.description}
                        </p>
                      </div>
                      {log.isReviewed && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ml-2">
                          {i18n.language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Bonus Activity Section */}
      <div className="flex-1">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{i18n.language === 'ar' ? 'سجل البونصات' : 'Bonus Activity'}</h2>
        </div>

        <Card className="h-full">
          <div className="overflow-auto max-h-96">
            {bonuses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <div className="p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {i18n.language === 'ar' ? 'لا يوجد حركات بونص بعد' : 'No bonus activity yet'}
                </h3>
                <p className="text-gray-500">
                  {i18n.language === 'ar'
                    ? 'سيظهر سجل البونصات هنا بمجرد تلقيك لبونص'
                    : 'Your bonus activity will appear here once you receive bonuses'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-border-light dark:divide-gray-border-dark">
                <thead className="bg-gray-surface-light dark:bg-gray-surface-dark sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                      {i18n.language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                      {i18n.language === 'ar' ? 'الوقت' : 'Time'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                      {i18n.language === 'ar' ? 'القيمة' : 'Amount'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                      {i18n.language === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-text uppercase tracking-wider">
                      {i18n.language === 'ar' ? 'ملاحظة' : 'Note'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-border-light dark:divide-gray-border-dark">
                  {bonuses.map((bonus) => (
                    <motion.tr
                      key={bonus._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-surface-light dark:hover:bg-gray-surface-dark"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-text">
                        {formatDate(bonus.createdAtUtc).split(' ')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-text">
                        {formatDate(bonus.createdAtUtc).split(' ')[1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${bonus.amount > 0 ? 'text-orange-500' : 'text-red-400'}`}
                        >
                          {bonus.amount > 0 ? '+' : ''}
                          {bonus.amount.toFixed(2)} JOD
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bonus.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusText(bonus.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-text max-w-xs">
                        {bonus.note.length > 50 ? (
                          <>
                            {bonus.note.substring(0, 50)}...
                            <button onClick={() => setSelectedBonus(bonus)} className="text-primary ml-2 text-xs">
                              {i18n.language === 'ar' ? 'قراءة المزيد' : 'Read more'}
                            </button>
                          </>
                        ) : (
                          bonus.note
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Bonus Details Modal */}
      {selectedBonus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-surface-light dark:bg-gray-surface-dark rounded-2xl p-6 max-w-2xl w-full"
          >
            <h2 className="text-2xl font-bold mb-4">
              {i18n.language === 'ar' ? 'تفاصيل البونص' : 'Bonus Details'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-text">{i18n.language === 'ar' ? 'القيمة' : 'Amount'}</label>
                <p className={`text-lg font-bold ${selectedBonus.amount > 0 ? 'text-orange-500' : 'text-red-400'}`}>
                  {selectedBonus.amount > 0 ? '+' : ''}
                  {selectedBonus.amount.toFixed(2)} JOD
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-text">{i18n.language === 'ar' ? 'الحالة' : 'Status'}</label>
                <p className="text-lg font-medium">{getStatusText(selectedBonus.status)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-text">
                  {i18n.language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                </label>
                <p className="text-lg font-medium">{formatDate(selectedBonus.createdAtUtc)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-text">{i18n.language === 'ar' ? 'الملاحظة' : 'Note'}</label>
                <p className="text-lg whitespace-pre-line">{selectedBonus.note}</p>
              </div>
            </div>
            <button onClick={() => setSelectedBonus(null)} className="mt-6 text-primary">
              {t('common.close')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
