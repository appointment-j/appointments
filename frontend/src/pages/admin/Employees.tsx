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

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  employeeCode: z.string().optional(),
  jobTitle: z.string().optional(),
  isActive: z.boolean(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Employee extends EmployeeForm {
  _id: string;
}

export default function AdminEmployees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) reset(selectedEmployee);
    else reset({ fullName: '', email: '', isActive: true });
  }, [selectedEmployee, reset]);

  const loadEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data.employees);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  const onSubmit = async (data: EmployeeForm) => {
    try {
      if (selectedEmployee) {
        await api.patch(`/admin/employees/${selectedEmployee._id}`, data);
        toast.success('Employee updated');
      } else {
        await api.post('/admin/employees', data);
        toast.success('Employee created');
      }
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleInvite = async (id: string) => {
    try {
      await api.post(`/admin/employees/${id}/invite`);
      toast.success('Invite sent');
    } catch {
      toast.error('Failed to send invite');
    }
  };

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen bg-white font-majalla">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

          {/* العنوان */}
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-8">
            {t('admin.employees')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* قائمة الموظفين */}
            <Card className="lg:col-span-1 rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Employees</h2>
                <Button
  onClick={() => setSelectedEmployee(null)}
  className="px-4 py-2 text-sm rounded-xl"
>
  + New
</Button>
    
              </div>

              <div className="space-y-2 max-h-[420px] overflow-auto">
                {employees.map((emp) => (
                  <button
                    key={emp._id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      selectedEmployee?._id === emp._id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold">{emp.fullName}</p>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                    <p className="text-xs mt-1 text-gray-400">
                      {emp.employeeCode || '—'} · {emp.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* الفورم */}
            <motion.div
              key={selectedEmployee?._id || 'new'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card className="rounded-3xl">
                <h2 className="text-xl font-bold mb-6">
                  {selectedEmployee ? 'Edit Employee' : 'Create Employee'}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
                  <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
                  <Input label="Phone" {...register('phone')} />
                  <Input label="Employee Code" {...register('employeeCode')} />
                  <Input label="Job Title" {...register('jobTitle')} />

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" {...register('isActive')} />
                    <span className="text-sm">Active</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:col-span-2 mt-4">
                    <Button type="submit" className="flex-1">
                      {selectedEmployee ? 'Update' : 'Create'}
                    </Button>

                    {selectedEmployee && (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleInvite(selectedEmployee._id)}
                        >
                          Invite
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Card>
            </motion.div>

          </div>
        </div>
      </Panel>
    </ScreenContainer>
  );
}
