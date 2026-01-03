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
import { motion, AnimatePresence } from 'framer-motion';

const faqSchema = z.object({
  question_ar: z.string().min(1, 'مطلوب'),
  answer_ar: z.string().min(1, 'مطلوب'),
  question_en: z.string().min(1, 'Required'),
  answer_en: z.string().min(1, 'Required'),
  isActive: z.boolean(),
});

type FaqForm = z.infer<typeof faqSchema>;

interface Faq extends FaqForm {
  id: string;
  order: number;
}

export default function AdminFaqs() {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: { isActive: true },
  });

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    if (selectedFaq) {
      reset(selectedFaq);
    } else {
      reset({
        question_ar: '',
        answer_ar: '',
        question_en: '',
        answer_en: '',
        isActive: true,
      });
    }
  }, [selectedFaq, reset]);

  const loadFaqs = async () => {
    try {
      const res = await api.get('/faqs/admin');
      setFaqs(res.data.faqs);
    } catch {
      toast.error('فشل تحميل الأسئلة');
    }
  };

  const onSubmit = async (data: FaqForm) => {
    try {
      if (selectedFaq) {
        await api.patch(`/faqs/${selectedFaq.id}`, data);
        toast.success('تم التحديث');
      } else {
        await api.post('/faqs', data);
        toast.success('تمت الإضافة');
      }
      setSelectedFaq(null);
      loadFaqs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await api.delete(`/faqs/${id}`);
      toast.success('تم الحذف');
      loadFaqs();
      if (selectedFaq?.id === id) setSelectedFaq(null);
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const toggleActive = async (faq: Faq) => {
    try {
      await api.patch(`/faqs/${faq.id}`, { isActive: !faq.isActive });
      loadFaqs();
    } catch {
      toast.error('فشل التحديث');
    }
  };

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          {/* العنوان */}
          <h1 className="text-3xl font-extrabold mb-8">
            {t('admin.faqs')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* قائمة الأسئلة */}
            <Card className="rounded-3xl">
              <h2 className="text-xl font-bold mb-4">قائمة الأسئلة</h2>

              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                <AnimatePresence>
                  {faqs.map((faq) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedFaq(faq)}
                      className={`cursor-pointer p-4 rounded-2xl border transition ${
                        selectedFaq?.id === faq.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">
                            {i18n.language === 'ar'
                              ? faq.question_ar
                              : faq.question_en}
                          </p>
                          <p className="text-xs text-gray-500">
                            الترتيب: {faq.order} •{' '}
                            {faq.isActive ? 'مفعل' : 'غير مفعل'}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1 text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(faq);
                            }}
                            className="text-orange-500 hover:underline"
                          >
                            {faq.isActive ? 'إيقاف' : 'تفعيل'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(faq.id);
                            }}
                            className="text-red-500 hover:underline"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                className="w-full mt-5"
                onClick={() => setSelectedFaq(null)}
              >
                إضافة سؤال جديد
              </Button>
            </Card>

            {/* الفورم */}
            <Card className="rounded-3xl">
              <h2 className="text-xl font-bold mb-4">
                {selectedFaq ? 'تعديل السؤال' : 'إضافة سؤال'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="السؤال (عربي)"
                  {...register('question_ar')}
                  error={errors.question_ar?.message}
                />

                <Input
                  label="الجواب (عربي)"
                  type="textarea"
                  {...register('answer_ar')}
                  error={errors.answer_ar?.message}
                />

                <Input
                  label="Question (English)"
                  {...register('question_en')}
                  error={errors.question_en?.message}
                />

                <Input
                  label="Answer (English)"
                  type="textarea"
                  {...register('answer_en')}
                  error={errors.answer_en?.message}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label className="text-sm">مفعل</label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">
                    {selectedFaq ? 'تحديث' : 'حفظ'}
                  </Button>
                  {selectedFaq && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedFaq(null)}
                    >
                      إلغاء
                    </Button>
                  )}
                </div>
              </form>
            </Card>

          </div>
        </div>
      </Panel>
    </ScreenContainer>
  );
}
