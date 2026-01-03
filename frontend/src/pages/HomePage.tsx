import { Link } from 'react-router-dom';
import { ScreenContainer, Panel } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function HomePage() {
  return (
    <ScreenContainer>
      <Panel
        className="
          relative
          min-h-screen
          w-full
          overflow-hidden
          font-[Majalla]
          bg-white
        "
      >
        {/* ===== خلفية فخمة ناعمة للموقع كامل ===== */}
        <div className="absolute inset-0 -z-10">
          {/* طبقة برتقالية ناعمة جدًا */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 via-orange-200/10 to-transparent animate-bgMove" />
          {/* طبقة سكني للتوازن */}
          <div className="absolute inset-0 bg-gradient-to-tl from-gray-300/25 via-transparent to-transparent animate-bgMoveSlow" />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="
            relative
            min-h-screen
            w-full
            max-w-6xl
            mx-auto
            px-4 sm:px-6
            flex flex-col
            justify-center
          "
        >
          {/* ===== العنوان الرئيسي ===== */}
          <motion.div variants={item} className="text-center mb-12 sm:mb-20">
            <h1 className="
              text-3xl sm:text-4xl md:text-5xl lg:text-6xl
              font-extrabold
              tracking-wide
              text-gray-900
              mb-4 sm:mb-6
            ">
              منصة مواعيد <span className="text-orange-500">BatTechno</span>
            </h1>

            <p className="
              text-gray-600
              text-base sm:text-lg md:text-xl
              max-w-2xl
              mx-auto
              leading-relaxed
            ">
              تجربة راقية وبسيطة لحجز المواعيد  
              بسهولة، وضوح، واحترافية
            </p>
          </motion.div>

          {/* ===== الكروت ===== */}
          <motion.div
            variants={container}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-12 sm:mb-20"
          >
            {/* ===== حجز موعد ===== */}
            <motion.div variants={item}>
              <div className="relative group">
                {/* Glow فاخر */}
                <div className="
                  pointer-events-none absolute inset-0
                  rounded-3xl
                  bg-orange-400/0
                  blur-2xl
                  transition-all duration-500
                  group-hover:bg-orange-400/20
                " />

                <Card
                  className="
                    relative z-10
                    h-full
                    rounded-3xl
                    border border-gray-200
                    bg-white
                    px-2
                    transition-all duration-500
                    group-hover:-translate-y-2
                    group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                  "
                >
                  <div className="flex flex-col h-full p-6 sm:p-8">
                    <h2 className="
                      text-2xl sm:text-3xl
                      font-bold
                      text-gray-900
                      mb-4
                      transition-colors
                      group-hover:text-orange-500
                    ">
                      حجز موعد
                    </h2>

                    <p className="
                      text-gray-600
                      mb-10
                      leading-relaxed
                      text-sm sm:text-base
                    ">
                      احجز موعدك خلال ثوانٍ  
                      بتجربة سلسة ومريحة تناسب الجميع
                    </p>

                    <Link to="/app/appointments/book">
                      <Button
                        className="
                          w-full
                          rounded-2xl
                          py-4
                          bg-orange-500
                          text-white
                          text-lg
                          transition-all duration-300
                          hover:bg-orange-600
                          hover:scale-[1.04]
                          hover:shadow-[0_0_35px_rgba(245,124,0,0.4)]
                        "
                      >
                        احجز الآن
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* ===== الأسئلة الشائعة ===== */}
            <motion.div variants={item}>
              <div className="relative group">
                {/* Glow فاخر */}
                <div className="
                  pointer-events-none absolute inset-0
                  rounded-3xl
                  bg-orange-400/0
                  blur-2xl
                  transition-all duration-500
                  group-hover:bg-orange-400/20
                " />

                <Card
                  className="
                    relative z-10
                    h-full
                    rounded-3xl
                    border border-gray-200
                    bg-white
                    px-2
                    transition-all duration-500
                    group-hover:-translate-y-2
                    group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                  "
                >
                  <div className="flex flex-col h-full p-6 sm:p-8">
                    <h2 className="
                      text-2xl sm:text-3xl
                      font-bold
                      text-gray-900
                      mb-4
                      transition-colors
                      group-hover:text-orange-500
                    ">
                      الأسئلة الشائعة
                    </h2>

                    <p className="
                      text-gray-600
                      mb-10
                      leading-relaxed
                      text-sm sm:text-base
                    ">
                      إجابات واضحة ومباشرة  
                      لأكثر الأسئلة التي تهمك
                    </p>

                    <Link to="/faq">
                      <Button
                        className="
                          w-full
                          rounded-2xl
                          py-4
                          bg-orange-500
                          text-white
                          text-lg
                          transition-all duration-300
                          hover:bg-orange-600
                          hover:scale-[1.04]
                          hover:shadow-[0_0_35px_rgba(245,124,0,0.4)]
                        "
                      >
                        عرض الأسئلة
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </motion.div>
          </motion.div>

          {/* ===== تسجيل الدخول ===== */}
          <motion.div variants={item} className="flex justify-center">
            <Link to="/login">
              <Button
                className="
                  px-20
                  py-4
                  rounded-full
                  bg-orange-500
                  text-white
                  text-lg sm:text-xl
                  transition-all duration-300
                  hover:bg-orange-600
                  hover:scale-[1.08]
                  hover:shadow-[0_0_45px_rgba(245,124,0,0.45)]
                "
              >
                تسجيل الدخول
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ===== Animations ===== */}
        <style>
          {`
            @keyframes bgMove {
              0% { transform: translate(0, 0); }
              50% { transform: translate(-20px, -20px); }
              100% { transform: translate(0, 0); }
            }

            @keyframes bgMoveSlow {
              0% { transform: translate(0, 0); }
              50% { transform: translate(20px, 20px); }
              100% { transform: translate(0, 0); }
            }

            .animate-bgMove {
              animation: bgMove 28s ease-in-out infinite;
            }

            .animate-bgMoveSlow {
              animation: bgMoveSlow 55s ease-in-out infinite;
            }
          `}
        </style>
      </Panel>
    </ScreenContainer>
  );
}
