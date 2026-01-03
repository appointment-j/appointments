import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createSurvey } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

// Define Jordan governorates
const JORDAN_GOVERNORATES = [
  'عمان',
  'الزرقاء',
  'إربد',
  'البلقاء',
  'المفرق',
  'الكرك',
  'العقبة',
  'مادبا',
  'جرش',
  'عجلون',
  'الطفيلة'
];

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -20 },
};

// Step 1: Personal Information
const personalInfoSchema = z.object({
  firstName: z.string().min(1, { message: 'الاسم الأول مطلوب' }),
  fatherName: z.string().min(1, { message: 'اسم الأب مطلوب' }),
  lastName: z.string().min(1, { message: 'اسم العائلة مطلوب' }),
  age: z.number().min(18, { message: 'العمر يجب أن يكون 18 أو أكثر' }).max(100, { message: 'العمر يجب أن يكون أقل من 100' }),
  socialStatus: z.string().min(1, { message: 'الحالة الاجتماعية مطلوبة' }),
  phone: z.string().min(1, { message: 'رقم الهاتف مطلوب' }),
  nationality: z.string().min(1, { message: 'الجنسية مطلوبة' }),
  nationalId: z.string().optional(),
  passportId: z.string().optional(),
  region: z.string().optional(),
});

// Step 2: Academic Information
const academicInfoSchema = z.object({
  major: z.string().min(1, { message: 'التخصص الجامعي مطلوب' }),
  university: z.string().min(1, { message: 'الجامعة مطلوبة' }),
  heardFrom: z.string().min(1, { message: 'من أين سمعت عنا مطلوب' }),
});

// Step 3: Appointment Booking
const appointmentSchema = z.object({
  slotId: z.string().min(1, { message: 'الموعد مطلوب' }),
  mode: z.enum(['IN_PERSON', 'ONLINE'], { message: 'نوع الموعد مطلوب' }),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type AcademicInfoForm = z.infer<typeof academicInfoSchema>;
type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function SurveyAppointment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'IN_PERSON' | 'ONLINE' | ''>('');

  const [surveyResponseId, setSurveyResponseId] = useState<string | null>(null);
  
  // Check if user tries to access step 3 directly
  useEffect(() => {
    if (step === 3 && !surveyResponseId) {
      toast.error('يجب إكمال الاستبيان أولاً');
      setStep(1);
    }
  }, [step, surveyResponseId]);

  // Personal Info Form
  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      age: 18,
    },
  });

  // Academic Info Form
  const academicForm = useForm<AcademicInfoForm>({
    resolver: zodResolver(academicInfoSchema),
  });

  // Appointment Form
  const appointmentForm = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  const { watch: watchPersonal } = personalForm;
  const watchedNationality = watchPersonal('nationality');

  // Handle next step
  const handleNextStep = async () => {
    if (step === 1) {
      // Validate personal info
      const isValid = await personalForm.trigger();
      if (!isValid) return;
      
      setStep(2);
    } else if (step === 2) {
      // Validate academic info
      const isValid = await academicForm.trigger();
      if (!isValid) return;
      
      // Save survey first
      try {
        const personalData = personalForm.getValues();
        const academicData = academicForm.getValues();
        
        const surveyData = {
          ...personalData,
          ...academicData,
        };
        
        const response = await createSurvey(surveyData);
        
        if (response.data.success && response.data.data.id) {
          setSurveyResponseId(response.data.data.id);
          setStep(3);
          
          // Load available slots
          loadAvailableSlots();
        } else {
          toast.error('فشل حفظ الاستبيان');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'فشل حفظ الاستبيان');
      }
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Load available slots
  const loadAvailableSlots = async () => {
    if (!surveyResponseId) {
      toast.error('يجب إكمال الاستبيان أولاً');
      setStep(1);
      return;
    }
    
    setLoading(true);
    try {
      // Get slots for next 30 days
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const toDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];
      
      const response = await api.get(`/appointments/slots-with-rules?from=${fromDate}&to=${toDate}`);
      setAvailableSlots(response.data.slots);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في تحميل المواعيد المتاحة');
    } finally {
      setLoading(false);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    appointmentForm.setValue('slotId', slot.id);
    
    // Automatically set mode based on slot rules
    if (slot.effectiveIsOnlineOnly) {
      setSelectedMode('ONLINE');
      appointmentForm.setValue('mode', 'ONLINE');
    } else {
      setSelectedMode('');
      appointmentForm.setValue('mode', 'IN_PERSON' as any);
    }
  };

  // Handle mode selection
  const handleModeSelect = (mode: 'IN_PERSON' | 'ONLINE') => {
    if (selectedSlot?.effectiveIsOnlineOnly && mode === 'IN_PERSON') {
      toast.error('هذا الموعد متاح فقط أونلاين');
      return;
    }
    setSelectedMode(mode);
    appointmentForm.setValue('mode', mode);
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate appointment form
    const isValid = await appointmentForm.trigger();
    if (!isValid) return;
    
    try {
      // Book appointment with surveyResponseId
      const data = {
        surveyResponseId,
        slotId: appointmentForm.getValues('slotId'),
        mode: appointmentForm.getValues('mode'),
      };
      
      await api.post('/appointments/survey-book', data);
      toast.success('تم حجز الموعد بنجاح');
      navigate('/app/appointments/my');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حجز الموعد');
    }
  };

  return (
    <ScreenContainer>
      <Panel className="min-h-screen bg-white font-majalla">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-extrabold text-center mb-8">
            حجز موعد بالاستبيان
          </h1>

          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === s
                        ? 'bg-orange-500 text-white'
                        : s < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 ${
                        s < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <Card className="p-6 rounded-3xl">
                    <h2 className="text-xl font-bold mb-6 text-center">
                      المعلومات الشخصية
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          الاسم الأول *
                        </label>
                        <Input
                          {...personalForm.register('firstName')}
                          placeholder="الاسم الأول"
                          className="w-full"
                        />
                        {personalForm.formState.errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          اسم الأب *
                        </label>
                        <Input
                          {...personalForm.register('fatherName')}
                          placeholder="اسم الأب"
                          className="w-full"
                        />
                        {personalForm.formState.errors.fatherName && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.fatherName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          اسم العائلة *
                        </label>
                        <Input
                          {...personalForm.register('lastName')}
                          placeholder="اسم العائلة"
                          className="w-full"
                        />
                        {personalForm.formState.errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          العمر *
                        </label>
                        <Input
                          type="number"
                          {...personalForm.register('age', { valueAsNumber: true })}
                          placeholder="العمر"
                          className="w-full"
                        />
                        {personalForm.formState.errors.age && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.age.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          الحالة الاجتماعية *
                        </label>
                        <select
                          {...personalForm.register('socialStatus')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">اختر الحالة الاجتماعية</option>
                          <option value="أعزب">أعزب</option>
                          <option value="متزوج">متزوج</option>
                          <option value="مطلق">مطلق</option>
                          <option value="أرمل">أرمل</option>
                        </select>
                        {personalForm.formState.errors.socialStatus && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.socialStatus.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          رقم الهاتف *
                        </label>
                        <Input
                          {...personalForm.register('phone')}
                          placeholder="رقم الهاتف"
                          className="w-full"
                        />
                        {personalForm.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        الجنسية *
                      </label>
                      <Input
                        {...personalForm.register('nationality')}
                        placeholder="الجنسية (مثل: الأردن)"
                        className="w-full"
                      />
                      {personalForm.formState.errors.nationality && (
                        <p className="text-red-500 text-sm mt-1">
                          {personalForm.formState.errors.nationality.message}
                        </p>
                      )}
                    </div>

                    {watchedNationality === 'الأردن' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          الرقم الوطني *
                        </label>
                        <Input
                          {...personalForm.register('nationalId')}
                          placeholder="الرقم الوطني"
                          className="w-full"
                        />
                        {personalForm.formState.errors.nationalId && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.nationalId.message}
                          </p>
                        )}
                      </div>
                    )}

                    {watchedNationality !== 'الأردن' && watchedNationality && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          رقم الجواز *
                        </label>
                        <Input
                          {...personalForm.register('passportId')}
                          placeholder="رقم الجواز"
                          className="w-full"
                        />
                        {personalForm.formState.errors.passportId && (
                          <p className="text-red-500 text-sm mt-1">
                            {personalForm.formState.errors.passportId.message}
                          </p>
                        )}
                      </div>
                    )}

                    {watchedNationality === 'الأردن' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          المنطقة/المحافظة
                        </label>
                        <select
                          {...personalForm.register('region')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">اختر المحافظة</option>
                          {JORDAN_GOVERNORATES.map((gov) => (
                            <option key={gov} value={gov}>
                              {gov}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {watchedNationality && watchedNationality !== 'الأردن' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          المدينة/المنطقة
                        </label>
                        <Input
                          {...personalForm.register('region')}
                          placeholder="المدينة أو المنطقة"
                          className="w-full"
                        />
                      </div>
                    )}

                    <div className="mt-6 text-right">
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        التالي
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <Card className="p-6 rounded-3xl">
                    <h2 className="text-xl font-bold mb-6 text-center">
                      المعلومات الأكاديمية
                    </h2>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        التخصص الجامعي *
                      </label>
                      <Input
                        {...academicForm.register('major')}
                        placeholder="التخصص الجامعي"
                        className="w-full"
                      />
                      {academicForm.formState.errors.major && (
                        <p className="text-red-500 text-sm mt-1">
                          {academicForm.formState.errors.major.message}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        الجامعة *
                      </label>
                      <Input
                        {...academicForm.register('university')}
                        placeholder="الجامعة"
                        className="w-full"
                      />
                      {academicForm.formState.errors.university && (
                        <p className="text-red-500 text-sm mt-1">
                          {academicForm.formState.errors.university.message}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        من أين سمعت عنا *
                      </label>
                      <select
                        {...academicForm.register('heardFrom')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">اختر</option>
                        <option value="صديق">صديق</option>
                        <option value="إنترنت">إنترنت</option>
                        <option value="إعلان">إعلان</option>
                        <option value="زيارة سابقة">زيارة سابقة</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                      {academicForm.formState.errors.heardFrom && (
                        <p className="text-red-500 text-sm mt-1">
                          {academicForm.formState.errors.heardFrom.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        onClick={handlePrevStep}
                        variant="secondary"
                      >
                        رجوع
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        التالي
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <Card className="p-6 rounded-3xl">
                    <h2 className="text-xl font-bold mb-6 text-center">
                      حجز الموعد
                    </h2>

                    {!surveyResponseId ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 mb-4">يجب إكمال الاستبيان أولاً</p>
                        <Button
                          onClick={() => setStep(1)}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          العودة إلى الاستبيان
                        </Button>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-8">
                        <p>جاري تحميل المواعيد المتاحة...</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">
                            اختر الموعد:
                          </h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {availableSlots.map((slot) => (
                              <div
                                key={slot.id}
                                onClick={() => handleSlotSelect(slot)}
                                className={`p-4 border rounded-lg cursor-pointer transition ${
                                  selectedSlot?.id === slot.id
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-orange-300'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">
                                      {new Date(slot.startAt).toLocaleString('ar-EG', {
                                        dateStyle: 'full',
                                        timeStyle: 'short',
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      ({slot.bookedCount}/{slot.effectiveCapacity} محجوز)
                                    </p>
                                  </div>
                                  {slot.effectiveIsOnlineOnly && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      أونلاين فقط
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                            {availableSlots.length === 0 && (
                              <p className="text-center text-gray-500 py-4">
                                لا توجد مواعيد متاحة في الوقت الحالي
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedSlot && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">
                              نوع الموعد:
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => handleModeSelect('IN_PERSON')}
                                disabled={selectedSlot.effectiveIsOnlineOnly}
                                className={`
                                  p-4 rounded-2xl border transition
                                  ${
                                    selectedMode === 'IN_PERSON'
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200'
                                  }
                                  ${
                                    selectedSlot.effectiveIsOnlineOnly
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:border-orange-300'
                                  }
                                `}
                              >
                                {t('appointments.inPerson')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModeSelect('ONLINE')}
                                className={`
                                  p-4 rounded-2xl border transition
                                  ${
                                    selectedMode === 'ONLINE'
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200'
                                  }
                                  hover:border-orange-300
                                `}
                              >
                                {t('appointments.online')}
                              </button>
                            </div>
                            {selectedSlot.effectiveIsOnlineOnly && (
                              <p className="text-sm text-blue-600 mt-2">
                                هذا الموعد متاح فقط أونلاين
                              </p>
                            )}
                            {appointmentForm.formState.errors.mode && (
                              <p className="text-red-500 text-sm mt-1">
                                {appointmentForm.formState.errors.mode.message}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between mt-6">
                          <Button
                            type="button"
                            onClick={handlePrevStep}
                            variant="secondary"
                          >
                            رجوع
                          </Button>
                          <Button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600"
                            disabled={!selectedSlot || !selectedMode}
                          >
                            إنهاء الحجز
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </Panel>
    </ScreenContainer>
  );
}