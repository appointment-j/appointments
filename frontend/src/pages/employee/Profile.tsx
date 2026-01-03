import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

interface EmployeeProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  jobTitle?: string;
  language: 'ar' | 'en';
  isActive: boolean;
}

export default function EmployeeProfile() {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    language: 'ar' as 'ar' | 'en',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (user) {
        setProfile({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          employeeCode: user.employeeCode,
          jobTitle: user.jobTitle,
          language: user.language || 'ar',
          isActive: user.isActive,
        });
        setFormData({ language: user.language || 'ar' });
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async () => {
    if (!profile) return;
    
    try {
      await api.patch('/auth/profile', { language: formData.language });
      await updateProfile({ language: formData.language });
      i18n.changeLanguage(formData.language);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update language', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-text">{t('common.loading')}...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-text">{t('common.error')}</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="max-w-2xl mx-auto py-8 px-6">
        <h1 className="text-3xl font-bold mb-8">{t('common.profile')}</h1>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {i18n.language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-1">
                    {t('auth.fullName')}
                  </label>
                  <p className="text-lg">{profile.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-1">
                    {t('auth.email')}
                  </label>
                  <p className="text-lg">{profile.email}</p>
                </div>
                {profile.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-1">
                      {t('auth.phone')}
                    </label>
                    <p className="text-lg">{profile.phone}</p>
                  </div>
                )}
                {profile.employeeCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-1">
                      {i18n.language === 'ar' ? 'رمز الموظف' : 'Employee Code'}
                    </label>
                    <p className="text-lg">{profile.employeeCode}</p>
                  </div>
                )}
                {profile.jobTitle && (
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-1">
                      {i18n.language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
                    </label>
                    <p className="text-lg">{profile.jobTitle}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {i18n.language === 'ar' ? 'الحالة' : 'Status'}
              </h2>
              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                  profile.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.isActive 
                    ? (i18n.language === 'ar' ? 'نشط' : 'Active')
                    : (i18n.language === 'ar' ? 'غير نشط' : 'Inactive')
                  }
                </span>
              </div>
            </div>

            {/* Language Preference */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {i18n.language === 'ar' ? 'تفضيل اللغة' : 'Language Preference'}
              </h2>
              <div className="flex items-center gap-4">
                {editing ? (
                  <>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as 'ar' | 'en' })}
                      className="px-4 py-2 rounded-2xl border border-gray-border-light bg-white"
                    >
                      <option value="ar">{i18n.language === 'ar' ? 'العربية' : 'Arabic'}</option>
                      <option value="en">{i18n.language === 'ar' ? 'الإنجليزية' : 'English'}</option>
                    </select>
                    <button
                      onClick={handleLanguageChange}
                      className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({ language: profile.language });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-2xl hover:bg-gray-300"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg">
                      {profile.language === 'ar' 
                        ? (i18n.language === 'ar' ? 'العربية' : 'Arabic')
                        : (i18n.language === 'ar' ? 'الإنجليزية' : 'English')
                      }
                    </p>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-primary text-white rounded-2xl hover:bg-primary/90"
                    >
                      {t('common.edit')}
                    </button>
                  </>
                )}
              </div>
            </div>


          </div>
        </Card>
      </div>
    </div>
  );
}