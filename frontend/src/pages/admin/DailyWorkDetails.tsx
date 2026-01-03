import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';

import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface DailyWorkLog {
  id: string;
  employee: {
    id: string;
    fullName: string;
    email: string;
    employeeCode?: string;
    jobTitle?: string;
  };
  date: string;
  title?: string;
  description: string;

  adminNote?: string;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDailyWorkDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<DailyWorkLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [isReviewed, setIsReviewed] = useState(false);

  useEffect(() => {
    loadLog();
  }, [id]);

  const loadLog = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/daily-work/${id}`);
      const data = res.data.data ?? res.data;
      setLog(data);
      setAdminNote(data.adminNote || '');
      setIsReviewed(data.isReviewed);
    } catch (error) {
      console.error('Failed to load daily work log', error);
      toast.error('Failed to load daily work log');
      navigate('/admin/daily-work');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/daily-work/${id}`, {
        adminNote,
        isReviewed
      });
      
      toast.success('Daily work log updated successfully');
      loadLog(); // Refresh the data
    } catch (error) {
      console.error('Failed to update daily work log', error);
      toast.error('Failed to update daily work log');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Panel className="h-full flex items-center justify-center">
          <p>{t('common.loading')}...</p>
        </Panel>
      </ScreenContainer>
    );
  }

  if (!log) {
    return (
      <ScreenContainer>
        <Panel className="h-full flex items-center justify-center">
          <p>{t('common.notFound')}</p>
        </Panel>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Panel className="h-full">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              {log.title || formatDate(log.date)}
            </h1>
            <Button variant="secondary" onClick={() => navigate('/admin/daily-work')}>
              {t('common.back')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-xl font-bold mb-4">{t('common.details')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('common.description')}
                    </h3>
                    <p className="whitespace-pre-wrap">{log.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('common.date')}
                      </h3>
                      <p>{formatDate(log.date)}</p>
                    </div>
                    

                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('common.createdAt')}
                    </h3>
                    <p>{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold mb-4">{t('common.adminNote')}</h2>
                
                <div className="space-y-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                    placeholder={t('admin.addNotePlaceholder')}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isReviewed}
                        onChange={(e) => setIsReviewed(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{t('admin.markAsReviewed')}</span>
                    </label>
                    
                    <Button 
                      onClick={handleUpdate} 
                      isLoading={updating}
                      disabled={updating}
                    >
                      {t('common.update')}
                    </Button>
                  </div>
                  
                  {log.adminNote && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">{t('admin.adminNotes')}</h4>
                      <p className="whitespace-pre-wrap">{log.adminNote}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-xl font-bold mb-4">{t('common.employee')}</h2>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('common.name')}
                    </h3>
                    <p>{log.employee.fullName}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('common.email')}
                    </h3>
                    <p>{log.employee.email}</p>
                  </div>
                  
                  {log.employee.employeeCode && (
                    <div>
                      <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('common.employeeCode')}
                      </h3>
                      <p>{log.employee.employeeCode}</p>
                    </div>
                  )}
                  
                  {log.employee.jobTitle && (
                    <div>
                      <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('common.jobTitle')}
                      </h3>
                      <p>{log.employee.jobTitle}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold mb-4">{t('common.status')}</h2>
                
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      log.isReviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {log.isReviewed ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Panel>
    </ScreenContainer>
  );
}