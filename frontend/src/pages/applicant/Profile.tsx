import { ScreenContainer, Panel } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function ApplicantProfile() {
  const { user } = useAuth();

  // ✅ صورة الإطار (اللي أرسلتها)
  // حطها في: public/images/profile-ring.png
  const ringImageSrc = '/images/profile-ring.png';

  // ✅ لو عندك صورة للمستخدم لاحقاً (avatarUrl) استخدمها
  // حالياً بنحط Placeholder بسيط
  const avatarSrc =
    (user as any)?.avatarUrl ||
    'https://ui-avatars.com/api/?background=F97316&color=fff&name=' +
      encodeURIComponent(user?.fullName || 'User');

  return (
    <ScreenContainer>
      <Panel className="relative min-h-screen overflow-hidden bg-white font-majalla">
        {/* خلفية ناعمة */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[450px] h-[450px] bg-orange-300/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-gray-300/20 rounded-full blur-[120px]" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10"
        >
          {/* العنوان */}
          <motion.div variants={item} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              الملف الشخصي
            </h1>
            <p className="text-gray-500">معلومات حسابك الأساسية</p>
          </motion.div>

          {/* ✅ الصورة فوق (Ring + Avatar) */}
          <motion.div variants={item} className="flex justify-center mb-6">
            <div className="relative w-56 h-56">
              {/* Glow خلف الإطار */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-orange-400/15 blur-2xl" />

              {/* Ring Image */}
              <img
                src={ringImageSrc}
                alt="Profile ring"
                className="absolute inset-0 w-full h-full object-cover rounded-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
              />

              {/* Avatar فوق الإطار من الداخل */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[54%] h-[54%] rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={avatarSrc}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* الكارد تحت الصورة */}
          <motion.div variants={item}>
            <div className="relative group">
              {/* Glow */}
              <div
                className="
                  pointer-events-none absolute inset-0
                  rounded-3xl
                  bg-orange-400/0
                  blur-2xl
                  transition-all duration-500
                  group-hover:bg-orange-400/20
                "
              />

              <Card
                className="
                  relative z-10
                  rounded-3xl
                  border border-gray-200
                  bg-white
                  p-6 sm:p-8
                  transition-all duration-500
                  group-hover:-translate-y-1
                  group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                "
              >
                <div className="space-y-6">
                  {/* الاسم */}
                  <div>
                    <label className="text-sm text-gray-500">الاسم الكامل</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.fullName || '—'}
                    </p>
                  </div>

                  {/* البريد */}
                  <div>
                    <label className="text-sm text-gray-500">البريد الإلكتروني</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.email || '—'}
                    </p>
                  </div>

                  {/* ✅ حالة التفعيل (برتقالي بدل الأخضر) */}
                  <div>
                    <label className="text-sm text-gray-500">حالة البريد الإلكتروني</label>
                    <p
                      className={`text-lg font-semibold ${
                        user?.isEmailVerified ? 'text-orange-600' : 'text-red-500'
                      }`}
                    >
                      {user?.isEmailVerified ? 'مفعل' : 'غير مفعل'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </Panel>
    </ScreenContainer>
  );
}
