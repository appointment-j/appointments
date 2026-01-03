import { useState, useEffect } from 'react';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'APPLICANT' | 'EMPLOYEE';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data?.users || res.data.users || []);
      if (res.data.data?.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, userFullName: string) => {
    if (!newRole) {
      toast.error('Please select a role');
      return;
    }

    const confirmChange = window.confirm(
      `Are you sure you want to change ${userFullName}'s role to ${newRole}?`
    );
    
    if (!confirmChange) return;

    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(res.data.message || 'Role updated successfully');
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: res.data.data.role } 
            : user
        )
      );
      
      setEditingUserId(null);
      setNewRole('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };



  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              {t('admin.users', 'Users')}
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all users in the system
            </p>
          </div>

          {/* Filters */}
          <Card className="rounded-3xl mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('common.search', 'Search')}
                placeholder={t('common.searchPlaceholder', 'Search by name or email')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.role', 'Role')}
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="APPLICANT">APPLICANT</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.status', 'Status')}
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
                  }}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="rounded-3xl overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.name', 'Name')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.email', 'Email')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.role', 'Role')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.status', 'Status')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <AnimatePresence>
                        {users.map((user) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'}`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {editingUserId === user.id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    className="rounded-xl border border-gray-300 px-2 py-1 text-sm"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                  >
                                    <option value="">Select Role</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="APPLICANT">APPLICANT</option>
                                    <option value="EMPLOYEE">EMPLOYEE</option>
                                  </select>
                                  <Button
                                    className="px-3 py-1.5 text-sm"
                                    onClick={() => handleRoleChange(user.id, user.fullName)}
                                  >
                                    {t('common.save', 'Save')}
                                  </Button>
                                  <Button
                                    className="px-3 py-1.5 text-sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingUserId(null);
                                      setNewRole('');
                                    }}
                                  >
                                    {t('common.cancel', 'Cancel')}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  className="px-3 py-1.5 text-sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setNewRole(user.role);
                                  }}
                                >
                                  {t('common.editRole', 'Edit Role')}
                                </Button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && !loading && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">{t('common.noData', 'No users found')}</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        variant="secondary"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        {t('common.previous', 'Previous')}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        {t('common.next', 'Next')}
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          {t('common.showing', 'Showing')}{' '}
                          <span className="font-medium">
                            {(pagination.page - 1) * pagination.limit + 1}
                          </span>{' '}
                          {t('common.to', 'to')}{' '}
                          <span className="font-medium">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                          </span>{' '}
                          {t('common.of', 'of')}{' '}
                          <span className="font-medium">{pagination.total}</span>{' '}
                          {t('common.results', 'results')}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <Button
                            variant="secondary"
                            className="rounded-r-none"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            {t('common.previous', 'Previous')}
                          </Button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                              // Show all pages if total pages <= 5
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              // Show first 5 pages if current page is in first 3
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                              // Show last 5 pages if current page is in last 3
                              pageNum = pagination.pages - 4 + i;
                            } else {
                              // Show current page in the middle
                              pageNum = pagination.page - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? 'primary' : 'secondary'}
                                className={`
                                  ${pagination.page === pageNum 
                                    ? 'bg-orange-500 border-orange-500 text-white' 
                                    : ''
                                } rounded-none ${
                                  i === 0 ? 'rounded-l-md' : ''
                                } ${
                                  i === 4 || pageNum === pagination.pages ? 'rounded-r-md' : ''
                                }`}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                                                    
                          <Button
                            variant="secondary"
                            className="rounded-l-none"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                          >
                            {t('common.next', 'Next')}
                          </Button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </Panel>
    </ScreenContainer>
  );
};

export default AdminUsers;