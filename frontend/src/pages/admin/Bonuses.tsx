import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const bonusSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  amount: z.number().min(0.01, 'Invalid amount'),
  note: z.string().min(1, 'Note is required'),
});

type BonusForm = z.infer<typeof bonusSchema>;

interface Employee {
  id: string;
  fullName: string;
  email: string;
}

interface BonusEntry {
  _id?: string; // mongo legacy
  id?: string;  // postgres new
  employeeId: { fullName: string; email: string };
  amount: number;
  note: string;
  createdAtUtc: string;
  createdByAdminId: { fullName: string };
  status: string;
}

const tabs = [
  { key: 'add', label: 'إضافة مكافأة' },
  { key: 'ledger', label: 'السجل' },
  { key: 'reports', label: 'التقارير' },
] as const;

export default function AdminBonuses() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<BonusEntry[]>([]);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['key']>('add');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BonusForm>({
    resolver: zodResolver(bonusSchema),
  });

  useEffect(() => {
    loadEmployees();
    loadLedger();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      const list = res?.data?.employees ?? res?.data?.data ?? res?.data ?? [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل تحميل الموظفين');
      setEmployees([]);
    }
  };

  const loadLedger = async () => {
    try {
      const res = await api.get('/admin/bonuses');
      const list = res?.data?.entries ?? res?.data?.data ?? res?.data ?? [];
      setEntries(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل تحميل السجل');
      setEntries([]);
    }
  };

  const onSubmit = async (data: BonusForm) => {
    try {
      await api.post('/admin/bonuses', data);
      toast.success('تمت إضافة المكافأة');
      reset();
      await loadLedger();
      setActiveTab('ledger');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إضافة المكافأة');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('هل أنت متأكد من حذف هذه المكافأة؟');
    if (!ok) return;

    try {
      setDeletingId(id);
      await api.delete(`/admin/bonuses/${id}`);
      toast.success('تم حذف المكافأة');
      await loadLedger();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف المكافأة');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const isApproved = status === 'APPROVED';
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla">
        <div className="pointer-events-none absolute -top-40 -right-40 w-[450px] h-[450px] bg-orange-300/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-gray-300/20 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-8">{t('admin.bonuses')}</h1>

          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2 rounded-full text-sm font-semibold transition
                  ${
                    activeTab === tab.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'add' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="rounded-3xl p-6 max-w-xl">
                <h2 className="text-xl font-bold mb-6">إضافة مكافأة جديدة</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">الموظف</label>
                    <select
                      {...register('employeeId')}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white"
                    >
                      <option value="">اختر موظف</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.email})
                        </option>
                      ))}
                    </select>
                    {errors.employeeId && (
                      <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>
                    )}
                  </div>

                  <Input
                    label="المبلغ"
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    error={errors.amount?.message}
                  />

                  <Input
                    label="الملاحظة"
                    type="textarea"
                    {...register('note')}
                    error={errors.note?.message}
                  />

                  <Button type="submit" className="w-full">
                    إضافة المكافأة
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-soft">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-right">الموظف</th>
                        <th className="p-4 text-right">المبلغ</th>
                        <th className="p-4 text-right">الملاحظة</th>
                        <th className="p-4 text-right">التاريخ</th>
                        <th className="p-4 text-right">بواسطة</th>
                        <th className="p-4 text-right">الحالة</th>
                        <th className="p-4 text-right">إجراء</th>
                      </tr>
                    </thead>

                    <tbody>
                      {entries.map((e, idx) => {
                        const entryId = (e as any)._id || (e as any).id || '';
                        const rowKey = entryId || `${e.createdAtUtc}-${idx}`;

                        return (
                          <tr key={rowKey} className="border-t hover:bg-gray-50">
                            <td className="p-4 font-semibold">{e.employeeId?.fullName}</td>
                            <td className="p-4">{e.amount} JOD</td>
                            <td className="p-4 text-gray-500">{e.note}</td>
                            <td className="p-4">{new Date(e.createdAtUtc).toLocaleDateString()}</td>
                            <td className="p-4">{e.createdByAdminId?.fullName}</td>
                            <td className="p-4">{statusBadge(e.status)}</td>
                            <td className="p-4">
                              <button
                                onClick={() => entryId && handleDelete(entryId)}
                                disabled={!entryId || deletingId === entryId}
                                className={`
                                  px-3 py-1 rounded-xl text-sm font-semibold transition
                                  ${
                                    deletingId === entryId
                                      ? 'bg-red-200 text-red-700 cursor-not-allowed'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }
                                `}
                              >
                                {deletingId === entryId ? '...جاري الحذف' : 'حذف'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-4">
                {entries.map((e, idx) => {
                  const entryId = (e as any)._id || (e as any).id || '';
                  const cardKey = entryId || `${e.createdAtUtc}-${idx}`;

                  return (
                    <Card key={cardKey} className="rounded-3xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{e.employeeId?.fullName}</h3>
                          <p className="text-gray-500 text-sm mb-2">{e.employeeId?.email}</p>
                        </div>
                        <div>{statusBadge(e.status)}</div>
                      </div>

                      <p className="mt-2">💰 {e.amount} JOD</p>
                      <p className="text-gray-500 text-sm mt-1">{e.note}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(e.createdAtUtc).toLocaleDateString()} — {e.createdByAdminId?.fullName}
                      </p>

                      <div className="mt-4">
                        <button
                          onClick={() => entryId && handleDelete(entryId)}
                          disabled={!entryId || deletingId === entryId}
                          className={`
                            w-full px-4 py-3 rounded-2xl font-semibold transition
                            ${
                              deletingId === entryId
                                ? 'bg-red-200 text-red-700 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }
                          `}
                        >
                          {deletingId === entryId ? '...جاري الحذف' : 'حذف المكافأة'}
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'reports' && (
            <Card className="rounded-3xl p-8 text-center">
              <h2 className="text-xl font-bold mb-3">التقارير</h2>
              <p className="text-gray-500">سيتم إضافة التقارير قريباً 📊</p>
            </Card>
          )}
        </div>
      </Panel>
    </ScreenContainer>
  );
}
