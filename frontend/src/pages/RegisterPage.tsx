import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';
import ThemedPage from '../layouts/ThemedPage';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إنشاء الحساب');
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
              {/* العنوان */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8 text-center">
                إنشاء حساب جديد
              </h1>

              {/* الفورم */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="الاسم الكامل"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />

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

                <Input
                  label="رقم الهاتف (اختياري)"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                />

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="
                    w-full
                    rounded-2xl
                    py-4
                    bg-orange-500
                    text-white
                    text-lg
                    transition-all
                    hover:bg-orange-600
                    hover:scale-[1.03]
                    hover:shadow-[0_0_35px_rgba(245,124,0,0.4)]
                  "
                >
                  إنشاء حساب
                </Button>

                {/* رابط تسجيل الدخول */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  لديك حساب بالفعل؟{' '}
                  <Link
                    to="/login"
                    className="text-orange-500 font-medium hover:underline"
                  >
                    تسجيل الدخول
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
