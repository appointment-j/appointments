import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Entry {
  dateLocal: string;
  hourLocal: string;
  ip: string;
  language: string;
  isAuthenticated: boolean;
}

export default function AdminEntries() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily' | 'details'>(
    'details'
  );

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const res = await api.get(`/entries?${params.toString()}`);
      setStats(res.data.stats);
      setEntries(res.data.entries);
    } catch (err) {
      console.error('Failed to load entries', err);
    }
  };

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

          {/* العنوان */}
          <h1 className="text-3xl font-extrabold mb-8">
            {t('admin.entries')}
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <StatCard title="Total" value={stats?.total || 0} />
            <StatCard title="Authenticated" value={stats?.authenticated || 0} />
            <StatCard title="Today" value={stats?.today || 0} />
            <StatCard title="This Week" value={stats?.week || 0} />
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b mb-8 text-gray-500">
            {['details', 'hourly', 'daily'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 transition ${
                  activeTab === tab
                    ? 'border-b-2 border-orange-500 text-orange-500 font-bold'
                    : ''
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* التفاصيل */}
          {activeTab === 'details' && (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Input
                  label="من تاريخ"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
                <Input
                  label="إلى تاريخ"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
                <div className="flex items-end">
                  <Button className="w-full" onClick={loadData}>
                    تطبيق الفلترة
                  </Button>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-right">التاريخ</th>
                      <th className="p-3 text-right">الساعة</th>
                      <th className="p-3 text-right">IP</th>
                      <th className="p-3 text-right">اللغة</th>
                      <th className="p-3 text-right">مسجل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{e.dateLocal}</td>
                        <td className="p-3">{e.hourLocal}</td>
                        <td className="p-3">{e.ip}</td>
                        <td className="p-3">{e.language}</td>
                        <td className="p-3">
                          {e.isAuthenticated ? 'نعم' : 'لا'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                <AnimatePresence>
                  {entries.map((e, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="rounded-3xl">
                        <p><b>📅</b> {e.dateLocal}</p>
                        <p><b>⏰</b> {e.hourLocal}</p>
                        <p><b>🌍</b> {e.language}</p>
                        <p><b>IP:</b> {e.ip}</p>
                        <p className="mt-2 text-sm text-gray-500">
                          {e.isAuthenticated ? 'مسجل' : 'غير مسجل'}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </Panel>
    </ScreenContainer>
  );
}

/* ===== Component ===== */

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="rounded-3xl text-center">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-extrabold text-orange-500">{value}</p>
    </Card>
  );
}
