import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScreenContainer } from '../../components/ScreenContainer';
import api from '../../utils/api';

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
  createdAt: string;
  updatedAt: string;
}

const Targets: React.FC = () => {
  const [targets, setTargets] = useState<EmployeeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employee/targets/my-targets');
      setTargets(response.data.data);
    } catch (err) {
      setError('فشل في تحميل الأهداف');
      console.error('Error fetching targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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
            onClick={fetchTargets}
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
      <div className="max-w-4xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">الأهداف الشهرية</h1>
          <p className="text-gray-600">عرض تقدمك على الأهداف المحددة لك</p>
        </motion.div>

        {targets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد أهداف</h3>
            <p className="text-gray-500">لم يتم تعيين أي أهداف شهرية لك حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-6">
            {targets.map((target, index) => {
              const progress = calculateProgress(target.currentValue, target.targetValue);
              const daysLeft = Math.ceil(
                (new Date(target.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">{target.title}</h3>
                      <p className="text-gray-600 text-sm">{target.description}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(target.status)}`}>
                        {getStatusText(target.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {target.month}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>
                        التقدم: {target.currentValue} من {target.targetValue}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500">من:</span>
                      <span className="mr-2 text-gray-800">{new Date(target.startDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">إلى:</span>
                      <span className="mr-2 text-gray-800">{new Date(target.endDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">المتبقي:</span>
                      <span className={`mr-2 ${daysLeft < 0 ? 'text-red-600' : daysLeft < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysLeft < 0 ? 'انتهى' : `${daysLeft} يوم`}
                      </span>
                    </div>
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