import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../utils/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ThemedPage from '../layouts/ThemedPage';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

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

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إرسال الرابط');
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
              {!sent ? (
                <>
                  {/* العنوان */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 text-center">
                    {t('auth.forgotPassword')}
                  </h1>

                  <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
                  </p>

                  {/* الفورم */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                      label={t('auth.email')}
                      type="email"
                      {...register('email')}
                      error={errors.email?.message}
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
                      إرسال رابط إعادة التعيين
                    </Button>
                  </form>
                </>
              ) : (
                /* رسالة النجاح */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold mb-4">
                    تم الإرسال بنجاح
                  </h2>

                  <p className="text-gray-600 leading-relaxed">
                    إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني،
                    فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.
                  </p>
                </motion.div>
              )}
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </ThemedPage>
  );
}
