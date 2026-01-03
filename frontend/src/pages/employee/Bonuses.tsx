import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';

interface BonusEntry {
  id: string;
  amount: number;
  note: string;
  createdAtUtc: string;
  createdByAdminId: { fullName: string };
  status: string;
}

interface BonusData {
  entries: BonusEntry[];
  balance: number;
  thisMonthTotal: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function EmployeeBonuses() {
  const { t } = useTranslation();
  const [bonusData, setBonusData] = useState<BonusData | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BonusEntry | null>(null);

  useEffect(() => {
    loadBonuses();
  }, []);

  const loadBonuses = async () => {
    try {
      const res = await api.get('/employee/bonuses/me');
      setBonusData(res.data);
    } catch (error) {
      console.error('Failed to load bonuses', error);
    }
  };

  const filteredEntries = bonusData?.entries.filter((entry) =>
    entry.note.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <ScreenContainer>
      <Panel className="h-full">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <h1 className="text-3xl font-bold mb-8">{t('employee.bonuses')}</h1>

          <div className="mb-6">
            <Input
              placeholder="Search by note"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <h3 className="text-lg font-bold mb-2">Total Balance</h3>
                <p className="text-2xl font-bold text-primary">
                  {bonusData?.balance?.toFixed(2) || '0.00'} JOD
                </p>
              </Card>
              <Card>
                <h3 className="text-lg font-bold mb-2">This Month</h3>
                <p className="text-2xl font-bold text-primary">
                  {bonusData?.thisMonthTotal?.toFixed(2) || '0.00'} JOD
                </p>
              </Card>
            </div>
            
            {filteredEntries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: entry.amount > 0 ? '#f97316' : '#ef4444' }}>
                      {entry.amount > 0 ? '+' : ''}
                      {entry.amount.toFixed(2)} JOD
                    </p>
                    <p className="text-gray-text mt-2">
                      {entry.note.length > 100 ? (
                        <>
                          {entry.note.substring(0, 100)}...
                          <button
                            onClick={() => setSelectedEntry(entry)}
                            className="text-primary ml-2"
                          >
                            {t('common.readMore')}
                          </button>
                        </>
                      ) : (
                        entry.note
                      )}
                    </p>
                    <p className="text-sm text-gray-text mt-2">
                      {new Date(entry.createdAtUtc).toLocaleString()} | By{' '}
                      {entry.createdByAdminId?.fullName}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-surface-light dark:bg-gray-surface-dark rounded-2xl p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Bonus Details</h2>
              <p className="text-gray-text whitespace-pre-line mb-4">{selectedEntry.note}</p>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-primary"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Panel>
    </ScreenContainer>
  );
}

