import { useEffect, useMemo, useState } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  jobTitle?: string;
}

interface DailyWorkLog {
  id: string;
  employee: Employee;
  date: string;
  title?: string;
  description: string;
  adminNote?: string;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 'ALL' | 'REVIEWED' | 'PENDING';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } },
};

function safeArray<T>(x: any): T[] {
  return Array.isArray(x) ? x : [];
}

function formatDateShort(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateLong(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function initials(name?: string) {
  const n = (name || '').trim();
  if (!n) return '—';
  return n.slice(0, 1);
}

function Badge({ reviewed }: { reviewed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${
        reviewed
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${reviewed ? 'bg-orange-500' : 'bg-gray-400'}`} />
      {reviewed ? 'تمت المراجعة' : 'قيد المراجعة'}
    </span>
  );
}

function SegmentedTabs({
  value,
  onChange,
  counts,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  counts: { all: number; reviewed: number; pending: number };
}) {
  const tabBase = 'flex-1 px-4 py-2 rounded-2xl text-sm font-extrabold transition border';
  const active =
    'bg-orange-500 text-white border-orange-500 shadow-[0_10px_30px_rgba(249,115,22,0.25)]';
  const inactive =
    'bg-white text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50/40';

  const pill = 'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-extrabold';

  return (
    <div className="w-full sm:w-[420px] bg-white/70 backdrop-blur border border-gray-200 rounded-3xl p-2 flex gap-2">
      <button
        type="button"
        onClick={() => onChange('ALL')}
        className={`${tabBase} ${value === 'ALL' ? active : inactive}`}
      >
        الكل{' '}
        <span className={`${pill} ${value === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
          {counts.all}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('REVIEWED')}
        className={`${tabBase} ${value === 'REVIEWED' ? active : inactive}`}
      >
        تمت{' '}
        <span
          className={`${pill} ${
            value === 'REVIEWED' ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-700'
          }`}
        >
          {counts.reviewed}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('PENDING')}
        className={`${tabBase} ${value === 'PENDING' ? active : inactive}`}
      >
        قيد{' '}
        <span className={`${pill} ${value === 'PENDING' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
          {counts.pending}
        </span>
      </button>
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border border-gray-200 bg-white">
      <span className="text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="w-6 h-6 rounded-full hover:bg-gray-100 transition flex items-center justify-center text-gray-500"
        aria-label="remove"
      >
        ×
      </button>
    </span>
  );
}

export default function AdminDailyWork() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<DailyWorkLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<TabKey>('ALL');

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedLog, setSelectedLog] = useState<DailyWorkLog | null>(null);
  const [updatingReview, setUpdatingReview] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const reviewed = logs.filter((l) => l.isReviewed).length;
    const pending = total - reviewed;
    return { total, reviewed, pending };
  }, [logs]);

  const displayLogs = useMemo(() => {
    if (tab === 'REVIEWED') return logs.filter((l) => l.isReviewed);
    if (tab === 'PENDING') return logs.filter((l) => !l.isReviewed);
    return logs;
  }, [logs, tab]);

  const selectedEmployeeLabel = useMemo(() => {
    if (!selectedEmployee) return '';
    const emp = employees.find((e) => e.id === selectedEmployee);
    return emp ? emp.fullName : selectedEmployee;
  }, [selectedEmployee, employees]);

  const hasFilters = Boolean(search || dateFrom || dateTo || selectedEmployee);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (selectedEmployee) params.append('employeeId', selectedEmployee);

      const queryString = params.toString();
      const res = await api.get(`/admin/daily-work${queryString ? `?${queryString}` : ''}`);

      const payload = res.data?.data ?? res.data;
      const list = payload?.logs ?? payload?.items ?? payload;

      setLogs(safeArray<DailyWorkLog>(list));
    } catch (error) {
      console.error('Failed to load daily work logs', error);
      toast.error('Failed to load daily work logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      const payload = res.data?.employees ?? res.data?.data ?? res.data;
      setEmployees(safeArray<Employee>(payload));
    } catch (error) {
      console.error('Failed to load employees', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSelectedEmployee('');
    setTimeout(() => loadLogs(), 0);
  };

  const toggleReviewStatus = async (logId: string, currentStatus: boolean) => {
    try {
      setUpdatingReview(logId);
      await api.patch(`/admin/daily-work/${logId}`, { isReviewed: !currentStatus });
      toast.success(!currentStatus ? 'تمت مراجعة السجل' : 'تم إلغاء المراجعة');
      await loadLogs();
    } catch (error) {
      console.error('Failed to update review status', error);
      toast.error('Failed to update review status');
    } finally {
      setUpdatingReview(null);
    }
  };

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla overflow-hidden">
        {/* خلفية ناعمة */}
        <div className="pointer-events-none absolute -top-52 -right-52 w-[650px] h-[650px] bg-orange-200/25 rounded-full blur-[160px]" />
        <div className="pointer-events-none absolute -bottom-52 -left-52 w-[650px] h-[650px] bg-gray-300/20 rounded-full blur-[160px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_45%)]" />

        <motion.div variants={container} initial="hidden" animate="show" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <motion.div variants={item} className="mb-8">
            <div className="relative rounded-[28px] border border-gray-200 bg-white/75 backdrop-blur p-6 sm:p-7 shadow-sm overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_55%)]" />
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    {t('admin.dailyWork')}
                  </h1>
                  <p className="text-gray-500 mt-1">عرض الشغل اليومي مع مراجعة سهلة وسريعة</p>
                </div>

                <SegmentedTabs
                  value={tab}
                  onChange={setTab}
                  counts={{ all: stats.total, reviewed: stats.reviewed, pending: stats.pending }}
                />
              </div>

              <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-gray-500">الإجمالي</p>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                  <p className="text-xs text-orange-700">تمت المراجعة</p>
                  <p className="text-2xl font-extrabold text-orange-700">{stats.reviewed}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-600">قيد المراجعة</p>
                  <p className="text-2xl font-extrabold text-gray-800">{stats.pending}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div variants={item} className="mb-8">
            <Card className="rounded-[28px] p-6 border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold">{t('common.searchAndFilter')}</h2>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="px-3 py-1.5 rounded-2xl text-xs font-extrabold border border-gray-200 hover:bg-gray-50 transition"
                  >
                    {filtersOpen ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    {t('common.clearFilters')}
                  </Button>
                  <Button type="button" onClick={loadLogs} className="bg-orange-500 hover:bg-orange-600">
                    تحديث
                  </Button>
                </div>
              </div>

              {/* Active filter chips */}
              {hasFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {search && (
                    <FilterChip
                      label={`بحث: ${search}`}
                      onRemove={() => {
                        setSearch('');
                        setTimeout(() => loadLogs(), 0);
                      }}
                    />
                  )}
                  {dateFrom && (
                    <FilterChip
                      label={`من: ${dateFrom}`}
                      onRemove={() => {
                        setDateFrom('');
                        setTimeout(() => loadLogs(), 0);
                      }}
                    />
                  )}
                  {dateTo && (
                    <FilterChip
                      label={`إلى: ${dateTo}`}
                      onRemove={() => {
                        setDateTo('');
                        setTimeout(() => loadLogs(), 0);
                      }}
                    />
                  )}
                  {selectedEmployee && (
                    <FilterChip
                      label={`موظف: ${selectedEmployeeLabel}`}
                      onRemove={() => {
                        setSelectedEmployee('');
                        setTimeout(() => loadLogs(), 0);
                      }}
                    />
                  )}
                </div>
              )}

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSearch} className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm mb-2 text-gray-700">{t('common.search')}</label>
                        <div className="relative">
                          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</div>
                          <Input
                            placeholder={t('common.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-gray-700">{t('common.dateFrom')}</label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-gray-700">{t('common.dateTo')}</label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-gray-700">{t('common.employee')}</label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">{t('common.all')}</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                        <Button type="submit" className="bg-gray-900 hover:bg-black">
                          {t('common.search')}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Content */}
          <motion.div variants={item}>
            {loading ? (
              <Card className="rounded-[28px] p-10 border border-gray-200 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500">{t('common.loading')}...</p>
                </div>
              </Card>
            ) : displayLogs.length === 0 ? (
              <Card className="rounded-[28px] p-12 border border-gray-200 bg-white text-center">
                <p className="text-gray-500">{t('admin.noDailyWorkLogs')}</p>
              </Card>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.employee')}</th>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.date')}</th>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.title')}</th>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.description')}</th>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.status')}</th>
                            <th className="p-4 text-right text-gray-700 font-extrabold">{t('common.actions')}</th>
                          </tr>
                        </thead>

                        <tbody>
                          {displayLogs.map((log) => (
                            <tr
                              key={log.id}
                              className={`border-t transition cursor-pointer group ${
                                log.isReviewed ? 'hover:bg-orange-50/15' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedLog(log)}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-white flex items-center justify-center font-extrabold shadow-sm">
                                    {initials(log.employee?.fullName)}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-gray-900">{log.employee.fullName}</div>
                                    <div className="text-xs text-gray-500">{log.employee.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-4 text-gray-800 font-semibold">{formatDateShort(log.date)}</td>

                              <td className="p-4">
                                {log.title ? (
                                  <span className="font-extrabold text-gray-900">{log.title}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>

                              <td className="p-4 text-gray-600 max-w-[420px]">
                                <div className="truncate" title={log.description}>
                                  {log.description}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1">
                                  أُنشئ: {new Date(log.createdAt).toLocaleDateString('ar-EG')}
                                </div>
                              </td>

                              <td className="p-4">
                                <Badge reviewed={log.isReviewed} />
                              </td>

                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => setSelectedLog(log)}
                                    className="px-4 py-2 rounded-2xl text-sm font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                                  >
                                    👁️ {t('common.view')}
                                  </button>

                                  <button
                                    onClick={() => toggleReviewStatus(log.id, log.isReviewed)}
                                    disabled={updatingReview === log.id}
                                    className={`px-4 py-2 rounded-2xl text-sm font-extrabold transition disabled:opacity-50 ${
                                      log.isReviewed
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                    }`}
                                  >
                                    {updatingReview === log.id ? '...' : log.isReviewed ? 'إلغاء' : '✅ مراجعة'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-5 py-4 bg-gray-50 border-t text-xs text-gray-500">
                      إجمالي النتائج المعروضة: <span className="font-extrabold text-gray-800">{displayLogs.length}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                  {displayLogs.map((log) => (
                    <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card
                        className="rounded-[28px] p-5 border border-gray-200 bg-white shadow-sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-200 mb-4" />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-white flex items-center justify-center font-extrabold shadow-sm">
                              {initials(log.employee?.fullName)}
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900">{log.employee.fullName}</p>
                              <p className="text-xs text-gray-500">{log.employee.email}</p>
                            </div>
                          </div>

                          <Badge reviewed={log.isReviewed} />
                        </div>

                        <div className="mt-4">
                          <p className="font-extrabold text-gray-900">{log.title || formatDateLong(log.date)}</p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gray-100 text-gray-700">
                              {formatDateShort(log.date)}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700">
                              {new Date(log.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>

                          <p className="text-gray-700 text-sm mt-3 line-clamp-4 whitespace-pre-wrap">
                            {log.description}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="flex-1 px-4 py-3 rounded-2xl font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            👁️ {t('common.view')}
                          </button>

                          <button
                            onClick={() => toggleReviewStatus(log.id, log.isReviewed)}
                            disabled={updatingReview === log.id}
                            className={`flex-1 px-4 py-3 rounded-2xl font-extrabold transition disabled:opacity-50 ${
                              log.isReviewed
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            {updatingReview === log.id ? '...' : log.isReviewed ? 'إلغاء' : '✅ مراجعة'}
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Modal */}
          <AnimatePresence>
            {selectedLog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50"
                onClick={() => setSelectedLog(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-gray-200 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 sm:p-7 border-b border-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_55%)]" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-white flex items-center justify-center font-extrabold shadow-sm">
                          {initials(selectedLog.employee?.fullName)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-gray-900">
                            {selectedLog.title || formatDateLong(selectedLog.date)}
                          </h2>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {selectedLog.employee.fullName} • {selectedLog.employee.email}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedLog(null)}
                        className="w-10 h-10 rounded-2xl hover:bg-gray-100 transition flex items-center justify-center text-xl"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="relative mt-4 flex items-center justify-between flex-wrap gap-3">
                      <Badge reviewed={selectedLog.isReviewed} />

                      <button
                        onClick={() => toggleReviewStatus(selectedLog.id, selectedLog.isReviewed)}
                        disabled={updatingReview === selectedLog.id}
                        className={`px-4 py-2 rounded-2xl font-extrabold transition disabled:opacity-50 ${
                          selectedLog.isReviewed
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        {updatingReview === selectedLog.id
                          ? '...'
                          : selectedLog.isReviewed
                          ? 'إلغاء المراجعة'
                          : '✅ تأكيد المراجعة'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">{t('common.date')}</p>
                        <p className="font-extrabold text-gray-900">{formatDateLong(selectedLog.date)}</p>
                      </div>

                      <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">{t('common.createdAt')}</p>
                        <p className="font-extrabold text-gray-900">
                          {new Date(selectedLog.createdAt).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-[24px] border border-gray-200 bg-white">
                      <p className="text-xs text-gray-500 mb-2">{t('common.description')}</p>
                      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {selectedLog.description}
                      </p>
                    </div>

                    <div className="p-5 rounded-[24px] border border-gray-200 bg-white">
                      <p className="text-xs text-gray-500 mb-2">{t('common.adminNote')}</p>
                      {selectedLog.adminNote ? (
                        <p className="whitespace-pre-wrap text-gray-800">{selectedLog.adminNote}</p>
                      ) : (
                        <p className="text-gray-400">—</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" variant="secondary" onClick={() => setSelectedLog(null)}>
                        إغلاق
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}
