import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface DailyWorkLog {
  id: string;
  date: string;
  title?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDailyWork() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<DailyWorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DailyWorkLog | null>(null);
  
  // Form state
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');


  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/daily-work');
      const data = res.data.data ?? res.data;
      setLogs(data);
    } catch (error) {
      console.error('Failed to load daily work logs', error);
      toast.error('Failed to load daily work logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      setFormLoading(true);
      
      const payload = {
        date,
        title: title.trim() || null,
        description: description.trim()
      };

      await api.post('/employee/daily-work', payload);
      toast.success('Daily work log submitted successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      
      // Reload logs
      loadLogs();
    } catch (error: any) {
      console.error('Failed to submit daily work log', error);
      toast.error(error.response?.data?.message || 'Failed to submit daily work log');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ScreenContainer>
      <Panel className="h-full">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <h1 className="text-3xl font-bold mb-8">{t('employee.dailyWork')}</h1>

          {/* Daily Work Form */}
          <Card className="mb-8">
            <h2 className="text-xl font-bold mb-4">{t('employee.submitDailyWork')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('common.date')}
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('common.title')}
                </label>
                <Input
                  placeholder={t('common.optional')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('common.description')}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                  placeholder={t('employee.workDescriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  isLoading={formLoading}
                  disabled={formLoading}
                >
                  {t('common.submit')}
                </Button>
              </div>
            </form>
          </Card>

          {/* Previous Logs */}
          <div>
            <h2 className="text-xl font-bold mb-4">{t('employee.myDailyWorkLogs')}</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p>{t('common.loading')}...</p>
              </div>
            ) : logs.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500">{t('employee.noDailyWorkLogs')}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card key={log.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <div 
                      className="flex justify-between items-start"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">
                            {log.title || formatDate(log.date)}
                          </h3>

                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                          {log.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{formatDate(log.date)}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Log Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-surface-light dark:bg-gray-surface-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedLog.title || formatDate(selectedLog.date)}
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('common.date')}
                  </h3>
                  <p>{formatDate(selectedLog.date)}</p>
                </div>
                

                
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('common.description')}
                  </h3>
                  <p className="whitespace-pre-wrap">{selectedLog.description}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('common.createdAt')}
                  </h3>
                  <p>{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </ScreenContainer>
  );
}