import { motion } from 'framer-motion';

export default function ThemedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        fixed inset-0
        w-screen h-screen
        overflow-hidden
        bg-white
        font-[Majalla]
        flex
        justify-center
        items-start
      "
    >
      {/* خلفية بيضاء 100% مع حركة “إحساس فقط” بدون رمادي */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* طبقة حركة خفيفة جدًا (white-only) */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-br
            from-white
            via-white/95
            to-white
            animate-softMove
          "
        />

        {/* طبقة إضافية أهدى (white-only) */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-tl
            from-white
            via-white/90
            to-white
            animate-softMoveSlow
          "
        />
      </div>

      {/* المحتوى */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full h-full"
      >
        {children}
      </motion.div>

      {/* Animations */}
      <style>
        {`
          @keyframes softMove {
            0% { transform: translate(0, 0); }
            50% { transform: translate(-12px, -12px); }
            100% { transform: translate(0, 0); }
          }

          @keyframes softMoveSlow {
            0% { transform: translate(0, 0); }
            50% { transform: translate(12px, 12px); }
            100% { transform: translate(0, 0); }
          }

          .animate-softMove {
            animation: softMove 70s ease-in-out infinite;
          }

          .animate-softMoveSlow {
            animation: softMoveSlow 110s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
