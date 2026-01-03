import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';
import ThemedPage from '../layouts/ThemedPage';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof loginSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('تم تسجيل الدخول بنجاح');

      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'EMPLOYEE') navigate('/employee/dashboard');
      else navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedPage>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full flex justify-center px-4"
      >
        <motion.div variants={item} className="w-full max-w-md">
          <div className="relative group">
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-orange-400/0 blur-2xl transition group-hover:bg-orange-400/20" />

            <Card className="relative z-10 w-full rounded-3xl bg-white px-6 py-8 shadow-soft">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8 text-center">
                تسجيل الدخول
              </h1>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />

                <Input
                  label="كلمة المرور"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                />

                <div className="flex justify-between items-center text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-orange-500 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full rounded-2xl py-4 bg-orange-500 text-white text-lg hover:bg-orange-600 transition"
                >
                  دخول
                </Button>

                {/* Register link (رجعناه) */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  ليس لديك حساب؟{' '}
                  <Link
                    to="/register"
                    className="text-orange-500 font-medium hover:underline"
                  >
                    إنشاء حساب
                  </Link>
                </div>
              </form>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </ThemedPage>
  );
}
