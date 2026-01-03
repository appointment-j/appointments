import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hover?: boolean;
}

export const Card = ({
  children,
  className = '',
  hover = false,
  ...props
}: CardProps) => {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: '0 18px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(245,158,11,0.18)',
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`
        rounded-2xl
        bg-white
        border border-gray-200
        p-6
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        ${hover ? 'hover:border-orange-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};
