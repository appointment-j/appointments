import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface EmployeeTarget {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  month: string; // YYYY-MM format
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  employee: Employee | null;
  createdAt: string;
  updatedAt: string;
}

const Targets: React.FC = () => {
  const [allTargets, setAllTargets] = useState<EmployeeTarget[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    month: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ الأساسي: endpoint واحد يرجّع targets + employees
      const targetsRes = await api.get('/admin/targets');

      const targetsData = targetsRes?.data?.data ?? targetsRes?.data ?? [];
      const employeesFromTargets = targetsRes?.data?.employees ?? [];

      setAllTargets(Array.isArray(targetsData) ? targetsData : []);
      setEmployees(Array.isArray(employeesFromTargets) ? employeesFromTargets : []);

      // ✅ Fallback: إذا الباك إند ما رجّع employees (قديماً)
      if (!Array.isArray(employeesFromTargets) || employeesFromTargets.length === 0) {
        try {
          const employeesRes = await api.get('/admin/employees');
          const employeesData = employeesRes?.data?.data ?? employeesRes?.data ?? [];
          setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } catch (e) {
          // مش ضروري نوقع الشاشة لو فشل الفول باك
          console.warn('Fallback /admin/employees failed:', e);
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const url = err?.config?.url;
      const data = err?.response?.data;

      console.error('Error fetching data:', {
        url,
        status,
        responseData: data,
        rawError: err,
      });

      setError(
        data?.message ||
          data?.error ||
          `فشل في تحميل البيانات (Status: ${status || 'Unknown'})`
      );

      setAllTargets([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTargets = useMemo(() => {
    let filtered = [...allTargets];

    if (filterEmployee) {
      filtered = filtered.filter((target) => target?.employee?.id === filterEmployee);
    }

    if (filterMonth) {
      filtered = filtered.filter((target) => target?.month === filterMonth);
    }

    return filtered;
  }, [allTargets, filterEmployee, filterMonth]);

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      const payload = {
        ...formData,
        targetValue: Number(formData.targetValue),
        employeeId: selectedEmployee,
      };

      const response = await api.post('/admin/targets', payload);
      const created = response?.data?.data ?? response?.data;

      if (created) {
        setAllTargets((prev) => [created, ...prev]);
      }

      setShowCreateForm(false);
      resetForm();
    } catch (err: any) {
      const status = err?.response?.status;
      const url = err?.config?.url;
      const data = err?.response?.data;

      console.error('Error creating target:', {
        url,
        status,
        responseData: data,
        rawError: err,
      });

      setError(
        data?.message ||
          data?.error ||
          `فشل في إنشاء الهدف (Status: ${status || 'Unknown'})`
      );
    }
  };

  const handleUpdateProgress = async (targetId: string, currentValue: number) => {
    try {
      setError(null);

      const response = await api.put(`/admin/targets/${targetId}/progress`, {
        currentValue,
      });

      const updated = response?.data?.data ?? response?.data;
      if (updated) {
        setAllTargets((prev) =>
          prev.map((target) => (target.id === targetId ? updated : target))
        );
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const url = err?.config?.url;
      const data = err?.response?.data;

      console.error('Error updating progress:', {
        url,
        status,
        responseData: data,
        rawError: err,
      });

      setError(
        data?.message ||
          data?.error ||
          `فشل في تحديث التقدم (Status: ${status || 'Unknown'})`
      );
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الهدف؟')) return;

    try {
      setError(null);
      await api.delete(`/admin/targets/${targetId}`);
      setAllTargets((prev) => prev.filter((target) => target.id !== targetId));
    } catch (err: any) {
      const status = err?.response?.status;
      const url = err?.config?.url;
      const data = err?.response?.data;

      console.error('Error deleting target:', {
        url,
        status,
        responseData: data,
        rawError: err,
      });

      setError(
        data?.message ||
          data?.error ||
          `فشل في حذف الهدف (Status: ${status || 'Unknown'})`
      );
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetValue: '',
      month: '',
      startDate: '',
      endDate: '',
    });
    setSelectedEmployee('');
  };

  const calculateProgress = (current: number, target: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(target) || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'EXPIRED':
        return 'منتهي';
      default:
        return 'نشط';
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
        </div>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="max-w-6xl mx-auto p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة الأهداف الشهرية</h1>
              <p className="text-gray-600">إدارة أهداف الموظفين وتحديث تقدمهم</p>
            </div>

            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              إضافة هدف جديد
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تصفية حسب الموظف</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">جميع الموظفين</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تصفية حسب الشهر</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <div
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">إضافة هدف جديد</h2>

              <form onSubmit={handleCreateTarget}>
                <div className="space-y-4">
                  <Input
                    label="العنوان"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />

                  <Input
                    label="الوصف"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />

                  <Input
                    label="قيمة الهدف"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الشهر</label>
                    <input
                      type="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    />
                  </div>

                  <Input
                    label="تاريخ البدء"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />

                  <Input
                    label="تاريخ الانتهاء"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الموظف</label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      required
                    >
                      <option value="">اختر موظفًا</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    إلغاء
                  </Button>

                  <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                    إنشاء
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Targets List */}
        {filteredTargets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد أهداف</h3>
            <p className="text-gray-500">لم يتم إنشاء أي أهداف شهرية بعد</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTargets.map((target, index) => {
              const progress = calculateProgress(target.currentValue, target.targetValue);

              const daysLeft = Math.ceil(
                (new Date(target.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              const employeeName = target.employee?.name || 'غير معروف';
              const employeeEmail = target.employee?.email || '—';

              return (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{target.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(target.status)}`}>
                          {getStatusText(target.status)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-2">{target.description}</p>

                      <div className="text-sm text-gray-500">
                        الموظف: {employeeName} ({employeeEmail})
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-sm text-gray-500">{target.month}</span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProgress(target.id, Number(target.currentValue) + 10)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          +10
                        </button>

                        <button
                          onClick={() => handleUpdateProgress(target.id, Number(target.currentValue) + 20)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          +20
                        </button>

                        <button
                          onClick={() => handleDeleteTarget(target.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>التقدم: {target.currentValue} من {target.targetValue}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500">من:</span>
                      <span className="mr-2 text-gray-800">
                        {new Date(target.startDate).toLocaleDateString('ar-JO')}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-gray-500">إلى:</span>
                      <span className="mr-2 text-gray-800">
                        {new Date(target.endDate).toLocaleDateString('ar-JO')}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-gray-500">المتبقي:</span>
                      <span
                        className={`mr-2 ${
                          daysLeft < 0 ? 'text-red-600' : daysLeft < 7 ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {daysLeft < 0 ? 'انتهى' : `${daysLeft} يوم`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm text-gray-600">تحديث التقدم:</label>
                    <input
                      type="number"
                      min="0"
                      max={target.targetValue}
                      value={target.currentValue}
                      onChange={(e) => handleUpdateProgress(target.id, Number(e.target.value))}
                      className="w-24 p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                    <span className="text-sm text-gray-500">من {target.targetValue}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ScreenContainer>
  );
};

export default Targets;
